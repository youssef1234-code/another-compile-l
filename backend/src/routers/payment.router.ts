import { eventsOfficeProcedure, protectedProcedure, router } from "../trpc/trpc";

import {
  CardPaymentInitInput,
  PaginationSchema,
  PaymentStatus,
  RefundToWalletInput,
  vendorInitCardInput,
  WalletPaymentInput, WalletTopUpInitInput
} from "../shared/index.js";
import { TRPCError } from "@trpc/server";
import { DateTime } from "luxon";
import { z } from "zod";
import { eventRepository } from "../repositories/event.repository";
import { paymentRepository } from "../repositories/payment.repository";
import { paymentService } from "../services/payment.service";

// Policy: refunds allowed only if >= 14 days before event start
async function assertRefundWindow(eventId: string) {
  const ev = await eventRepository.findById(eventId);
  if (!ev) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
  const diff = DateTime.fromJSDate(ev.startDate).diffNow("days").days;
  console.log("Refund window check, days until event:", diff);
  console.log("Event start date:", ev.startDate);
  console.log("Current date:", new Date());
  if (diff < 14) throw new TRPCError({ code: "BAD_REQUEST", message: "Cancellation/refund window closed" });
}

export const paymentRouter = router({
  // 1) Begin card payment for a registration
  initCard: protectedProcedure
    .input(CardPaymentInitInput)
    .mutation(async ({ input, ctx }) => {
      return paymentService.initCardPayment((ctx.user!._id as any).toString(), input);
    }),

  initVendorCard: protectedProcedure
    .input(vendorInitCardInput)
    .mutation(async ({ input, ctx }) => {
      return paymentService.initVendorCard(String(ctx.user!._id), { applicationId: input.applicationId });
    }),

  // 2) Pay using wallet
  payWithWallet: protectedProcedure
    .input(WalletPaymentInput)
    .mutation(async ({ input, ctx }) => {
      return paymentService.payWithWallet((ctx.user!._id as any).toString(), input);
    }),

  // 3) Top-up wallet (init)
  topUpInit: protectedProcedure
    .input(WalletTopUpInitInput)
    .mutation(async ({ input, ctx }) => {
      return paymentService.initWalletTopUp((ctx.user!._id as any).toString(), input);
    }),

  // 4) Refund to wallet (policy enforced)
  refundToWallet: protectedProcedure
    .input(RefundToWalletInput)
    .mutation(async ({ input, ctx }) => {
      // Look up payment for amount & currency + event to enforce window
      const payment = await paymentRepository.findById(input.paymentId);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found" });
      if (payment.status === PaymentStatus.REFUNDED) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Payment already refunded" });
      }
      if ((payment.user as any)?.toString?.() !== (ctx.user!._id as any).toString()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your payment" });
      }
      await assertRefundWindow((payment.event as any)?.toString?.() ?? input.registrationId);
      return paymentService.refundToWallet(
        (ctx.user!._id as any).toString(),
        {
          ...input,
          amountMinor: payment.amountMinor,
          currency: payment.currency as any,
        }
      );
    }),

  // 5) My payments
  myPayments: protectedProcedure
    .input(PaginationSchema.partial().default({}))
    .query(async ({ input, ctx }) => {
      const page = input.page ?? 1;
      const limit = input.limit ?? 20;
      return paymentService.getMyPayments((ctx.user!._id as any).toString(), page, limit);
    }),

  // 6) My wallet (balance + transactions)
  myWallet: protectedProcedure
    .input(PaginationSchema.partial().default({}))
    .query(async ({ input, ctx }) => {
      const page = input.page ?? 1;
      const limit = input.limit ?? 50;
      return paymentService.getWallet((ctx.user!._id as any).toString(), page, limit);
    }),

  // 7) Get all payments (Admin/Event Office)
  getAllPayments: eventsOfficeProcedure
    .input(
      z.object({
        page: z.number().min(1).optional().default(1),
        perPage: z.number().min(1).max(1000).optional().default(100),
        sort: z
          .array(
            z.object({
              id: z.string(),
              desc: z.boolean(),
            })
          )
          .optional(),
        search: z.string().optional(),
        filters: z.record(z.array(z.string())).optional(),
      })
    )
    .query(async ({ input }) => {
      return paymentService.getAllPayments(input);
    }),
});
