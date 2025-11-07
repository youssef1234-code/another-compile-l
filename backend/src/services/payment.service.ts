import Stripe from "stripe";
import { startSession } from "mongoose";
import {
  PaymentMethod, PaymentStatus, WalletTxnType,
  CardPaymentInitInput, WalletPaymentInput, WalletTopUpInitInput, RefundToWalletInput,
  PaymentSummary,
  WalletTxn,
  RegistrationStatus
} from "@event-manager/shared";
import { PaymentRepository, paymentRepository } from "../repositories/payment.repository";
import { walletRepository } from "../repositories/wallet.repository";
import { TRPCError } from "@trpc/server";
import { BaseService } from "./base.service";
import { IPayment, Payment } from "../models/payment.model";
import { PaginatedResponse } from "@event-manager/shared";
import { userRepository } from "../repositories/user.repository";
import { mailService } from "./mail.service";
import { eventRepository } from "../repositories/event.repository";
import { registrationRepository } from "../repositories/registration.repository";

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
    const { amountMinor, currency, eventId, registrationId } = input;

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

  // Load & validate (non-mutating reads can be outside)
  const [user, event, reg] = await Promise.all([
    userRepository.findById(userId),
    eventRepository.findById(eventId),
    registrationRepository.findById(registrationId),
  ]);
  if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
  if (!reg) throw new TRPCError({ code: "NOT_FOUND", message: "Registration not found" });
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
    amount: amountMinor/100,
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


  async handleStripeWebhook(evt: Stripe.Event) {

  try {
    console.log("Stripe webhook received:", evt.type);
    if (evt.type !== "payment_intent.succeeded") return { ignored: true };

    const pi = evt.data.object as Stripe.PaymentIntent;
    const meta = (pi.metadata || {}) as Record<string, string | undefined>;
    const purpose = meta.purpose as ("EVENT_PAYMENT" | "WALLET_TOPUP" | undefined);
    const userId = meta.userId;
    const eventId = meta.eventId;
    const registrationId = meta.registrationId;

    if (!userId) {
      console.warn("PI missing userId metadata:", pi.id);
      return { ignored: true };
    }
    console.log(`Processing succeeded PI ${pi.id} for user ${userId}, purpose=${purpose}`);

    const session = await startSession();
    let paymentDoc: any = null;
    let user: any = null;
    let event: any = null;

    try {
      await session.withTransaction(async () => {
        // Load user (and event/reg if needed) inside tx if you mutate them
        user = await userRepository.findById(userId);
        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

        // Find the payment row created at init
        const p = await paymentRepository.findByStripePI(pi.id, { session });
        if (!p) {
          console.warn("No local payment row for PI:", pi.id);
          // Nothing to mutate → just return; withTransaction will commit nothing
          return;
        }
        // Idempotency
        if (p.status === PaymentStatus.SUCCEEDED) {
          paymentDoc = p;
          return;
        }
        console.log(`Found local payment ${p._id} with status ${p.status}`);

        // If EVENT_PAYMENT, sanity load event+registration now (we are going to confirm reg below)
        if (purpose === "EVENT_PAYMENT") {
          if (!eventId || !registrationId) {
            console.log("EVENT_PAYMENT missing eventId/registrationId for PI:", pi.id);
            // Choose: mark FAILED or just return. We'll just return to avoid bad state.
            await paymentRepository.update(
            (p._id as any).toString(),
            { status: PaymentStatus.FAILED },
            session
          );
            return;
          }
        }
        console.log(`Processing payment for purpose=${purpose}`);

        // Wallet top-up credit
        if (purpose === "WALLET_TOPUP") {
          await walletRepository.createWithSession({
            user: userId,
            type: WalletTxnType.CREDIT_TOPUP,
            amountMinor: pi.amount_received ?? pi.amount ?? 0,
            currency: (pi.currency?.toUpperCase() as any) ?? DEFAULT_CURRENCY,
            reference: { paymentId: p._id as any, note: "Stripe top-up" },
          }, session);
        }
        console.log("Wallet top-up txn created or skipped");

        // Confirm registration for EVENT_PAYMENT (inside tx to avoid races)
        if (purpose === "EVENT_PAYMENT" && eventId && registrationId) {
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
          console.log("Event capacity and registration hold checks passed");
           // Mark payment SUCCEEDED
          const updated = await paymentRepository.update(
            String(p._id),
            { status: PaymentStatus.SUCCEEDED },
            session
          );
          paymentDoc = updated?.toObject ? updated.toObject() : updated;


          await registrationRepository.update(registrationId, {
            status: RegistrationStatus.CONFIRMED,
            paymentStatus: PaymentStatus.SUCCEEDED,
            paymentAmount: pi.amount_received ?? pi.amount ?? 0,
            holdUntil: null,
          }, session);
        }
      }); // end withTransaction
    } finally {
      await session.endSession();
    }

    console.log("Stripe webhook processing completed inside transaction");

    if (paymentDoc && user) {
      // Resolve event for email subject if not loaded
      if (!event && paymentDoc.event) {
        event = await eventRepository.findById((paymentDoc.event as any).toString());
      }
      console.log("Pre-email checks:", { 
        hasUser: !!user, 
        hasPaymentDoc: !!paymentDoc, 
        userEmail: user?.email,
        docAmount: paymentDoc?.amountMinor
      });


    if (!user || !paymentDoc) {
      console.warn("Missing user or payment doc for email, skipping");
      return { ok: true };
    }

    await mailService.sendPaymentReceiptEmail(user.email, {
      name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
      eventName: purpose === "WALLET_TOPUP" ? "Wallet Top-up" : (event?.name ?? "Event"),
      amount: paymentDoc.amountMinor/100,
      currency: paymentDoc.currency,
      receiptId: (paymentDoc._id as any)?.toString() ?? 'unknown',
      paymentDate: new Date(),
    });
    }

    return { ok: true };
  } catch (e) {
    console.error("Webhook outer error", e);
    // Return ok so Stripe doesn't retry forever if this is non-recoverable
    return { ok: false };
  }
}


  // Queries
async getMyPayments(userId: string, page: number, limit: number) {
  const safePage  = Math.max(1, Number(page) || 1);
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
  const safePage  = Math.max(1, Number(page) || 1);
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


}

export const paymentService = new PaymentService(paymentRepository);
