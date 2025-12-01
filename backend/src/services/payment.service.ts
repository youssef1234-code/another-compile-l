import Stripe from "stripe";
import { startSession } from "mongoose";
import {
  PaymentMethod, PaymentStatus, WalletTxnType,
  CardPaymentInitInput, WalletPaymentInput, WalletTopUpInitInput, RefundToWalletInput,
  RegistrationStatus
} from "@event-manager/shared";
import type { PaymentSummary, WalletTxn } from "@event-manager/shared";
import { PaymentRepository, paymentRepository } from "../repositories/payment.repository";
import { walletRepository } from "../repositories/wallet.repository";
import { TRPCError } from "@trpc/server";
import { BaseService } from "./base.service";
import type { IPayment } from "../models/payment.model";
import type { PaginatedResponse } from "@event-manager/shared";
import { userRepository } from "../repositories/user.repository";
import { mailService } from "./mail.service";
import { eventRepository } from "../repositories/event.repository";
import { registrationRepository } from "../repositories/registration.repository";
import { assertVendorAppPayable } from "../services/vendor-application.service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
const DEFAULT_CURRENCY = (process.env.CURRENCY ?? "EGP") as "EGP" | "USD";
export class PaymentService extends BaseService<IPayment, typeof paymentRepository> {

  constructor(repository: PaymentRepository) {
    super(repository);
  }

  protected getEntityName(): string {
    return 'Payment';
  }

  /** 1) Init a Stripe PaymentIntent for an event registration */
  async initCardPayment(userId: string, input: CardPaymentInitInput) {
    const { eventId, registrationId, amountMinor, currency } = input;

    // Prevent payment for free events
    if (amountMinor === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This is a free event. No payment required." });
    }

    // 0) Load & validate entities and ownership
    const [reg, event] = await Promise.all([
      registrationRepository.findById(registrationId),
      eventRepository.findById(eventId),
    ]);
    if (!reg) throw new TRPCError({ code: "NOT_FOUND", message: "Registration not found" });
    if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });

    // Double-check event is not free
    if (!event.price || event.price === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This is a free event. No payment required." });
    }

    if ((reg.user as any)?.toString?.() !== userId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Registration does not belong to you" });
    }

    const latest = await paymentRepository.findLatestForRegistration(registrationId);
    // 1) If already paid by wallet or card -> stop

    console.log(`Creating new Stripe PaymentIntent for user ${userId}, event ${eventId}, registration ${registrationId}`);

    if (latest) {
      if (latest.status === PaymentStatus.SUCCEEDED) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already paid for this registration" });
      }

      const reg = await registrationRepository.findById(input.registrationId);
      const holdValid = reg?.holdUntil && reg.holdUntil > new Date();

      if (latest.status === PaymentStatus.PENDING && holdValid) {
        // Reuse current clientSecret (same attempt still in progress).
        return {
          paymentId: (latest._id as any).toString(),
          clientSecret: latest.stripeClientSecret,
          stripePaymentIntentId: latest.stripePaymentIntentId,
          status: latest.status,
        };
      }

      // mark pending as CANCELLED if the hold expired
      if (latest.status === PaymentStatus.PENDING && !holdValid) {
        await paymentRepository.update((latest._id as any).toString(), { status: PaymentStatus.FAILED });
      }
    }
    console.log(`Creating new Stripe PaymentIntent for user ${userId}, event ${eventId}, registration ${registrationId}`);
    // Create PaymentIntent
    const pi = await stripe.paymentIntents.create({
      amount: amountMinor,
      currency: currency.toLowerCase(),
      metadata: {
        userId,
        eventId,
        registrationId,
        purpose: "EVENT_PAYMENT"
      },
      automatic_payment_methods: { enabled: true },
    });

    // Create Payment document (PENDING)
    const doc = await paymentRepository.create({
      user: userId,
      registration: registrationId,
      event: eventId,
      method: PaymentMethod.STRIPE_CARD,
      status: PaymentStatus.PENDING,
      amountMinor,
      currency,
      stripePaymentIntentId: pi.id,
      stripeClientSecret: pi.client_secret!,
      purpose: "EVENT_PAYMENT",
    });

    return {
      paymentId: (doc._id as any).toString(),
      clientSecret: pi.client_secret,
      status: doc.status,
    };
  }


  /** 2) Pay via Wallet: atomically check balance, debit wallet, write Payment=SUCCEEDED */
  async payWithWallet(userId: string, input: WalletPaymentInput) {
    const { amountMinor, currency, eventId, registrationId } = input;

    // Prevent payment for free events
    if (amountMinor === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This is a free event. No payment required." });
    }

    // Load & validate (non-mutating reads can be outside)
    const [user, event, reg] = await Promise.all([
      userRepository.findById(userId),
      eventRepository.findById(eventId),
      registrationRepository.findById(registrationId),
    ]);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
    if (!reg) throw new TRPCError({ code: "NOT_FOUND", message: "Registration not found" });

    // Double-check event is not free
    if (!event.price || event.price === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This is a free event. No payment required." });
    }

    if ((reg.user as any).toString() !== userId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Registration does not belong to you" });
    }

    // Balance check (read)
    const bal = await walletRepository.balance(userId);
    if (bal.currency !== currency || bal.balanceMinor < amountMinor) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient wallet balance" });
    }

    let payDoc: any = null;

    const session = await startSession();
    try {
      await session.withTransaction(async () => {
        const now = new Date();

        if (reg.paymentStatus === PaymentStatus.SUCCEEDED) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Already paid for this registration' });
        }
        // Re-read registration in tx if you want stricter correctness:
        if (reg.status !== 'PENDING' || (reg.holdUntil && reg.holdUntil <= now)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Hold expired' });
        }

        if (event.capacity) {
          const used = await registrationRepository.countActiveForCapacity(eventId, now);
          if (used >= event.capacity) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Event became full' });
          }
        }

        // Create payment row
        payDoc = await paymentRepository.createWithSession({
          user: userId,
          registration: registrationId,
          event: eventId,
          method: PaymentMethod.WALLET,
          status: PaymentStatus.SUCCEEDED,
          amountMinor,
          currency,
          purpose: "EVENT_PAYMENT",
        }, session);

        // Debit wallet
        await walletRepository.createWithSession({
          user: userId,
          type: WalletTxnType.DEBIT_PAYMENT,
          amountMinor,
          currency,
          reference: { registrationId, eventId, paymentId: payDoc._id as any },
        }, session);

        // Confirm registration
        await registrationRepository.update(registrationId, {
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: PaymentStatus.SUCCEEDED,
          paymentAmount: amountMinor,
          holdUntil: null,
        }, session);
      });
    } finally {
      await session.endSession();
    }

    // Email AFTER commit
    await mailService.sendPaymentReceiptEmail(user.email, {
      name: `${user.firstName} ${user.lastName}`.trim() || user.email,
      eventName: event.name,
      amount: amountMinor / 100,
      currency,
      receiptId: (payDoc._id as any).toString(),
      paymentDate: new Date(),
    });

    return { paymentId: (payDoc._id as any).toString(), status: payDoc.status };
  }



  /** 3) Top-up wallet by card (init PI) */
  async initWalletTopUp(userId: string, input: WalletTopUpInitInput) {
    const { amountMinor, currency } = input;

    const pi = await stripe.paymentIntents.create({
      amount: amountMinor,
      currency: currency.toLowerCase(),
      metadata: { userId, purpose: "WALLET_TOPUP" },
      automatic_payment_methods: { enabled: true },
    });

    const doc = await paymentRepository.create({
      user: userId,
      method: PaymentMethod.STRIPE_CARD,
      status: PaymentStatus.PENDING,
      amountMinor, currency,
      stripePaymentIntentId: pi.id,
      stripeClientSecret: pi.client_secret!,
      purpose: "WALLET_TOPUP",
    });

    return { paymentId: (doc._id as any).toString(), clientSecret: pi.client_secret, status: doc.status };
  }

  /** 4) Refund to wallet (policy-checked in router or here). */
  async refundToWallet(userId: string, payload: RefundToWalletInput & { amountMinor: number; currency: "EGP" | "USD" }) {
    const { paymentId, registrationId, amountMinor, currency } = payload;
    const session = await startSession();
    try {
      session.startTransaction();

      // Mark original payment as CANCELLED (optional; or create a separate refund record)
      await paymentRepository.update(paymentId, { status: PaymentStatus.REFUNDED });

      await registrationRepository.update(registrationId, { status: RegistrationStatus.CANCELLED, paymentStatus: PaymentStatus.REFUNDED });


      // Credit wallet
      await walletRepository.create({
        user: userId,
        type: WalletTxnType.CREDIT_REFUND,
        amountMinor,
        currency,
        reference: {
          paymentId: paymentId,
          registrationId: registrationId,
          note: "Registration refund",
        },
      });

      await session.commitTransaction();
      session.endSession();
      return { ok: true };
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  async initVendorCard(userId: string, input: { applicationId: string }) {
    // guard
    const app = await assertVendorAppPayable(input.applicationId, userId);

    // create local payment row (PENDING)
    const pay = await paymentRepository.create({
      user: userId,
      method: PaymentMethod.STRIPE_CARD,
      status: PaymentStatus.PENDING,
      purpose: "VENDOR_FEE",
      amountMinor: app.paymentAmount!,
      currency: app.paymentCurrency!,
      vendorApplication: (app._id as string),
    });

    // create Stripe PI
    const pi = await stripe.paymentIntents.create({
      amount: app.paymentAmount!,                                 // minor
      currency: app.paymentCurrency!.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        purpose: "VENDOR_FEE",
        userId,
        applicationId: String(app._id),
        paymentId: String(pay._id),
      },
    });

    await paymentRepository.update(String(pay._id), {
      stripePaymentIntentId: pi.id,
      stripeClientSecret: pi.client_secret,
    });

    return {
      paymentId: String(pay._id),
      clientSecret: pi.client_secret!,
      status: pay.status,
    };
  }

  // payment.service.ts (or wherever your webhook lives)
  async handleStripeWebhook(evt: Stripe.Event) {
    try {
      console.log("Stripe webhook received:", evt.type);

      // Always parse PI + metadata up-front (we need it for both failure/success)
      const piObj = evt.data.object as Stripe.PaymentIntent;
      const piId = piObj?.id;
      const meta = (piObj?.metadata || {}) as Record<string, string | undefined>;
      const purpose = meta.purpose as ("EVENT_PAYMENT" | "WALLET_TOPUP" | "VENDOR_FEE" | undefined);
      const userId = meta.userId;
      const eventId = meta.eventId;
      const registrationId = meta.registrationId;
      const applicationId = meta.applicationId; // for vendor flow
      const paymentIdMeta = meta.paymentId;     // optional shortcut

      // -----------------------------------------------------------------------
      // 1) Handle terminal failures (mark Payment=FAILED; optionally mark App=FAILED)
      // -----------------------------------------------------------------------
      const terminalFailureEvents = new Set([
        "payment_intent.payment_failed",
        "payment_intent.canceled",
        "payment_intent.processing_failed",
        "payment_intent.requires_payment_method", // treat as failure for our flow
      ]);

      if (terminalFailureEvents.has(evt.type)) {
        if (!piId) {
          console.warn("Terminal failure event without PI id", evt.type);
          return { ok: true };
        }
        const p = paymentIdMeta
          ? await paymentRepository.findById(paymentIdMeta)
          : await paymentRepository.findByStripePI(piId);

        if (p) {
          if (p.status !== PaymentStatus.SUCCEEDED) {
            await paymentRepository.update(
              (p._id as any).toString(),
              { status: PaymentStatus.FAILED },
            );
            console.log("Marked local payment as FAILED for PI:", piId, "event:", evt.type);
          }

          // Optional: if this was a vendor fee, also reflect failure on the application
          if (purpose === "VENDOR_FEE" && applicationId) {
            const { vendorApplicationRepository } = await import("../repositories/vendor-application.repository");
            await vendorApplicationRepository.failPayment(applicationId);
          }
        } else {
          console.warn("No local payment found to mark FAILED for PI:", piId);
        }
        return { ok: true };
      }

      // -----------------------------------------------------------------------
      // 2) Ignore non-terminal non-success events
      // -----------------------------------------------------------------------
      if (evt.type !== "payment_intent.succeeded") {
        console.log("Ignoring non-terminal stripe event:", evt.type);
        return { ok: true };
      }

      if (!userId) {
        console.warn("PI missing userId metadata:", piObj.id);
        return { ignored: true };
      }
      console.log(`Processing succeeded PI ${piObj.id} for user ${userId}, purpose=${purpose}`);

      // -----------------------------------------------------------------------
      // 3) Success path (single transaction)
      // -----------------------------------------------------------------------
      const session = await startSession();
      let paymentDoc: any = null;
      let user: any = null;
      let event: any = null;
      let app: any = null; // vendor application (for VENDOR_FEE)

      try {
        await session.withTransaction(async () => {
          // Load the user (mutations later may require existence)
          user = await userRepository.findById(userId);
          if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

          // Find the local payment row created at init
          const p = paymentIdMeta
            ? await paymentRepository.findByIdForTransaction(paymentIdMeta, { session })
            : await paymentRepository.findByStripePI(piObj.id, { session });

          if (!p) {
            console.warn("No local payment row for PI:", piObj.id);
            return; // nothing to mutate; commit nothing
          }

          // Idempotency
          if (p.status === PaymentStatus.SUCCEEDED) {
            paymentDoc = p.toObject?.() ?? p;
            return;
          }

          console.log(`Found local payment ${p._id} with status ${p.status}`);

          // Common: mark local Payment as SUCCEEDED
          const updated = await paymentRepository.update(
            String(p._id),
            { status: PaymentStatus.SUCCEEDED },
            session
          );
          paymentDoc = updated?.toObject ? updated.toObject() : updated;

          // Purpose-specific effects
          if (purpose === "WALLET_TOPUP") {
            await walletRepository.createWithSession({
              user: userId,
              type: WalletTxnType.CREDIT_TOPUP,
              amountMinor: piObj.amount_received ?? piObj.amount ?? 0,
              currency: (piObj.currency?.toUpperCase() as any) ?? DEFAULT_CURRENCY,
              reference: { paymentId: p._id as any, note: "Stripe top-up" },
            }, session);
          }

          if (purpose === "EVENT_PAYMENT") {
            if (!eventId || !registrationId) {
              console.log("EVENT_PAYMENT missing eventId/registrationId for PI:", piObj.id);
              // we've already marked payment SUCCEEDED; if you prefer, you could flip to FAILED here.
              return;
            }
            const reg = await registrationRepository.findById(registrationId);
            event = await eventRepository.findById(eventId);
            if (!reg || !reg.isActive) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Registration missing' });
            if (!event) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Event missing' });

            const now = new Date();
            if (reg.status !== 'PENDING' || (reg.holdUntil && reg.holdUntil <= now)) {
              throw new TRPCError({ code: 'BAD_REQUEST', message: 'Hold expired' });
            }
            if (event.capacity) {
              const used = await registrationRepository.countActiveForCapacity(eventId, now);
              if (used >= event.capacity) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Event became full' });
              }
            }

            await registrationRepository.update(registrationId, {
              status: RegistrationStatus.CONFIRMED,
              paymentStatus: PaymentStatus.SUCCEEDED,
              paymentAmount: piObj.amount_received ?? piObj.amount ?? 0,
              holdUntil: null,
            }, session);
          }

          if (purpose === "VENDOR_FEE") {
            if (!applicationId) {
              console.warn("VENDOR_FEE without applicationId in metadata for PI:", piObj.id);
              return;
            }
            const { vendorApplicationRepository } = await import("../repositories/vendor-application.repository");
            // mark vendor application as paid
            const updatedApp = await vendorApplicationRepository.markPaid(applicationId, new Date(), session);
            app = updatedApp?.toObject?.() ?? updatedApp;

            // (Optional) Load bazaar event for email context
            if (app?.bazaarId) {
              event = await eventRepository.findById(String(app.bazaarId));
            }
          }
        }); // end withTransaction
      } finally {
        await session.endSession();
      }

      console.log("Stripe webhook processing completed inside transaction");

      // -----------------------------------------------------------------------
      // 4) Send receipt email (after the tx commits)
      // -----------------------------------------------------------------------
      if (!user || !paymentDoc) {
        console.warn("Missing user or payment doc for email, skipping");
        return { ok: true };
      }

      // Resolve event for email if not already present
      if (!event && paymentDoc.event) {
        event = await eventRepository.findById((paymentDoc.event as any).toString());
      }

      const eventNameForEmail =
        purpose === "WALLET_TOPUP"
          ? "Wallet Top-up"
          : purpose === "VENDOR_FEE"
            ? (event?.name ? `${event.name} — Vendor Fee` : "Vendor Fee")
            : (event?.name ?? "Event");

      await mailService.sendPaymentReceiptEmail(user.email, {
        name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
        eventName: eventNameForEmail,
        amount: (paymentDoc.amountMinor ?? 0) / 100,            // major for email
        currency: paymentDoc.currency,
        receiptId: (paymentDoc._id as any)?.toString() ?? 'unknown',
        paymentDate: new Date(),
      });

      return { ok: true };
    } catch (e) {
      console.error("Webhook outer error", e);
      // Return ok so Stripe doesn't retry forever if this is non-recoverable
      return { ok: false };
    }
  }

  // Queries
  async getMyPayments(userId: string, page: number, limit: number) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(80, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const { rows, total } = await paymentRepository.findMinePaginated(userId, skip, safeLimit);

    return {
      data: rows.map(r => ({
        id: (r._id as any).toString(),
        userId: (r.user as any).toString(),
        registrationId: (r.registration as any)?.toString?.(),
        eventId: (r.event as any)?.toString?.(),
        method: r.method,
        status: r.status,
        amountMinor: r.amountMinor,
        currency: r.currency,
        stripePaymentIntentId: r.stripePaymentIntentId,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    } satisfies PaginatedResponse<PaymentSummary>;
  }


  async getWallet(userId: string, page: number, limit: number) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (safePage - 1) * safeLimit;

    const [bal, txns] = await Promise.all([
      walletRepository.balance(userId),
      walletRepository.listUser(userId, skip, safeLimit),
    ]);

    // For total, either store a cached count or do a countDocuments call:
    const total = await (await import("../models/wallet-transaction.model"))
      .WalletTxn.countDocuments({ user: userId });


    return {
      balance: { userId, balanceMinor: bal.balanceMinor, currency: bal.currency as any },
      transactions: {
        data: txns.map(t => ({
          id: (t._id as any).toString(),
          userId: (t.user as any).toString(),
          type: t.type,
          amountMinor: t.amountMinor,
          currency: t.currency,
          reference: {
            registrationId: (t.reference?.registrationId as any)?.toString?.(),
            eventId: (t.reference?.eventId as any)?.toString?.(),
            paymentId: (t.reference?.paymentId as any)?.toString?.(),
            note: t.reference?.note,
          },
          createdAt: t.createdAt,
        })),
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      } satisfies PaginatedResponse<WalletTxn>
    };
  }

  /**
   * Get all payments with filters (Admin/Event Office)
   */
  async getAllPayments(params: {
    page?: number;
    perPage?: number;
    search?: string;
    sort?: Array<{ id: string; desc: boolean }>;
    filters?: Record<string, string[]>;
  }): Promise<{
    payments: any[];
    allPayments: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const limit = params.perPage || 100;

    let filter: any = {};

    // Handle filters
    if (params.filters) {
      // Status filter
      if (params.filters.status && params.filters.status.length > 0) {
        filter.status = { $in: params.filters.status };
      }

      // Method filter
      if (params.filters.method && params.filters.method.length > 0) {
        filter.method = { $in: params.filters.method };
      }

      // Purpose filter
      if (params.filters.purpose && params.filters.purpose.length > 0) {
        filter.purpose = { $in: params.filters.purpose };
      }

      // Date filters
      if (params.filters.createdFrom && params.filters.createdFrom.length > 0) {
        filter.createdAt = filter.createdAt || {};
        filter.createdAt.$gte = new Date(params.filters.createdFrom[0]);
      }

      if (params.filters.createdTo && params.filters.createdTo.length > 0) {
        filter.createdAt = filter.createdAt || {};
        filter.createdAt.$lte = new Date(params.filters.createdTo[0]);
      }
    }

    const sort: any = {};
    if (params.sort && params.sort.length > 0) {
      params.sort.forEach((sortField) => {
        sort[sortField.id] = sortField.desc ? -1 : 1;
      });
    } else {
      sort.createdAt = -1;
    }

    // Fetch all payments with filters (no pagination yet)
    const allPayments = await paymentRepository.findAll(filter, {
      sort,
      populate: ['user', 'event'],
    });

    // Filter by event properties if specified (post-query filter since event is populated)
    let allFilteredPayments = allPayments;

    // Filter by event type
    if (params.filters?.type && params.filters.type.length > 0) {
      allFilteredPayments = allFilteredPayments.filter((payment: any) =>
        payment.event && params.filters!.type!.includes(payment.event.type)
      );
    }

    // Filter by event start date from
    if (params.filters?.startDateFrom && params.filters.startDateFrom.length > 0) {
      const startFrom = new Date(params.filters.startDateFrom[0]);
      allFilteredPayments = allFilteredPayments.filter((payment: any) =>
        payment.event && payment.event.startDate && new Date(payment.event.startDate) >= startFrom
      );
    }

    // Filter by event start date to
    if (params.filters?.startDateTo && params.filters.startDateTo.length > 0) {
      const startTo = new Date(params.filters.startDateTo[0]);
      allFilteredPayments = allFilteredPayments.filter((payment: any) =>
        payment.event && payment.event.startDate && new Date(payment.event.startDate) <= startTo
      );
    }

    // Apply pagination after filtering
    const skip = (page - 1) * limit;
    const paginatedPayments = allFilteredPayments.slice(skip, skip + limit);

    // Format payments for response
    const formattedPayments = paginatedPayments.map((payment: any) => ({
      id: payment._id.toString(),
      user: payment.user ? {
        id: payment.user._id?.toString(),
        firstName: payment.user.firstName,
        lastName: payment.user.lastName,
        email: payment.user.email,
        companyName: payment.user.companyName,
      } : null,
      event: payment.event ? {
        id: payment.event._id?.toString(),
        name: payment.event.name,
        type: payment.event.type,
      } : null,
      registration: payment.registration?.toString(),
      method: payment.method,
      status: payment.status,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      purpose: payment.purpose,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    // Format all payments for response
    const allFormattedPayments = allFilteredPayments.map((payment: any) => ({
      id: payment._id.toString(),
      user: payment.user ? {
        id: payment.user._id?.toString(),
        firstName: payment.user.firstName,
        lastName: payment.user.lastName,
        email: payment.user.email,
        companyName: payment.user.companyName,
      } : null,
      event: payment.event ? {
        id: payment.event._id?.toString(),
        name: payment.event.name,
        type: payment.event.type,
      } : null,
      registration: payment.registration?.toString(),
      method: payment.method,
      status: payment.status,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      purpose: payment.purpose,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    const total = allFormattedPayments.length;

    return {
      payments: formattedPayments,
      allPayments: allFormattedPayments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }


}

export const paymentService = new PaymentService(paymentRepository);
