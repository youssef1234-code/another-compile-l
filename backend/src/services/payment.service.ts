import Stripe from "stripe";
import { startSession } from "mongoose";
import {
  PaymentMethod, PaymentStatus, WalletTxnType,
  CardPaymentInitInput, WalletPaymentInput, WalletTopUpInitInput, RefundToWalletInput,
  PaymentSummary,
  WalletTxn
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

  /** 2) Pay via Wallet: atomically check balance, debit wallet, write Payment=SUCCEEDED */async payWithWallet(userId: string, input: WalletPaymentInput) {
  const { amountMinor, currency, eventId, registrationId } = input;

  // 0) Load & validate entities
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
  // optional: ensure not already paid, ensure event price matches amountMinor/currency, etc.

  // 1) Check balance first (non-atomic read)
  const bal = await walletRepository.balance(userId);
  if (bal.currency !== currency || bal.balanceMinor < amountMinor) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient wallet balance" });
  }

  // 2) Do the debit and payment write in ONE transaction
  const session = await startSession();
  try {
    session.startTransaction();

    const payDoc = await paymentRepository.createWithSession({
      user: userId,
      registration: registrationId,
      event: eventId,
      method: PaymentMethod.WALLET,
      status: PaymentStatus.SUCCEEDED,
      amountMinor,
      currency,
      purpose: "EVENT_PAYMENT",
    }, session);

    await walletRepository.createWithSession({
      user: userId,
      type: WalletTxnType.DEBIT_PAYMENT,
      amountMinor,
      currency,
      reference: {
        registrationId,
        eventId,
        paymentId: payDoc._id as any,
      },
    }, session);

    await session.commitTransaction();
    session.endSession();

    // 3) Email after commit
    await mailService.sendPaymentReceiptEmail(user.email, {
      name: `${user.firstName} ${user.lastName}`.trim() || user.email,
      eventName: event.name,
      amount: amountMinor,   // convert to major
      currency,
      receiptId: (payDoc._id as any).toString(),
      paymentDate: new Date(),
    });

    return { paymentId: (payDoc._id as any).toString(), status: payDoc.status };
  } catch (e) {
    try { await session.abortTransaction(); } finally { session.endSession(); }
    throw e;
  }
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
      await paymentRepository.update(paymentId, { status: PaymentStatus.CANCELLED });
      

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

  /** 5) Stripe webhooks: finalize PI -> mark SUCCEEDED + (if WALLET_TOPUP) credit ledger */// inside payment.service.ts
async handleStripeWebhook(evt: Stripe.Event) {
  try {
    if (evt.type !== "payment_intent.succeeded") return { ignored: true };

    const pi = evt.data.object as Stripe.PaymentIntent;
    const meta = (pi.metadata || {}) as Record<string, string | undefined>;
    const purpose = meta.purpose as ("EVENT_PAYMENT" | "WALLET_TOPUP" | undefined);
    const userId = meta.userId;
    const eventId = meta.eventId;
    const registrationId = meta.registrationId;

    if (!userId) {
      console.warn("PI missing userId metadata:", pi.id);
      return { ignored: true }; // don’t 500 Stripe
    }

    const session = await startSession();
    try {
      session.startTransaction();

      // 1) Find the payment created during init
      const payment = await paymentRepository.findByStripePI(pi.id, { session });
      if (!payment) {
        console.warn("No local payment row for PI:", pi.id);
        await session.abortTransaction(); session.endSession();
        return { ignored: true };
      }

      // 2) Idempotency: if already succeeded, bail out
      if (payment.status === PaymentStatus.SUCCEEDED) {
        await session.commitTransaction(); session.endSession();
        return { ok: true, idempotent: true };
      }

      // 3) If event-payment, sanity checks (optional: skip for topup)
      if (purpose === "EVENT_PAYMENT") {
        if (!eventId || !registrationId) {
          console.warn("EVENT_PAYMENT missing eventId/registrationId for PI:", pi.id);
          // choose: mark FAILED or ignore; but don’t 500
        }
      }

      // 4) Mark payment succeeded
      await paymentRepository.update((payment._id as any).toString(), { status: PaymentStatus.SUCCEEDED }, session);

      // 5) Credit wallet if top-up
      if (purpose === "WALLET_TOPUP") {
        await walletRepository.createWithSession({
          user: userId,
          type: WalletTxnType.CREDIT_TOPUP,
          amountMinor: pi.amount_received ?? pi.amount ?? 0,
          currency: (pi.currency?.toUpperCase() as any) ?? DEFAULT_CURRENCY,
          reference: { paymentId: payment._id as any, note: "Stripe top-up" },
        }, session);
      }

      await session.commitTransaction();
      session.endSession();

      // 6) Send email outside the tx
      const user = await userRepository.findById(userId);
      const event = payment.event ? await eventRepository.findById((payment.event as any).toString()) : null;

      await mailService.sendPaymentReceiptEmail(user!.email, {
        name: `${user!.firstName} ${user!.lastName}`.trim() || user!.email,
        eventName: event?.name ?? (purpose === "WALLET_TOPUP" ? "Wallet Top-up" : "Event"),
        amount: payment.amountMinor ,        // convert to major
        currency: payment.currency,
        receiptId: (payment._id as any).toString(),
        paymentDate: new Date(),
      });

      return { ok: true };
    } catch (e) {
      try { await session.abortTransaction(); } finally { session.endSession(); }
      console.error("Webhook tx failed", e);
      // still return 200 to Stripe to avoid infinite retries if this is non-recoverable
      return { ok: false };
    }
  } catch (e) {
    console.error("Webhook outer error", e);
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
