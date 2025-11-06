import { protectedProcedure, router } from "../trpc/trpc";
import {
  CardPaymentInitInput, WalletPaymentInput, WalletTopUpInitInput,
  RefundToWalletInput, PaginationSchema
} from "@event-manager/shared";
import { paymentService } from "../services/payment.service";
import { TRPCError } from "@trpc/server";
import { DateTime } from "luxon";
import { eventRepository } from "../repositories/event.repository"; 
import { paymentRepository } from "../repositories/payment.repository";

// Policy: refunds allowed only if >= 14 days before event start
async function assertRefundWindow(eventId: string) {
  const ev = await eventRepository.findById(eventId);
  if (!ev) throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
  const diff = DateTime.fromJSDate(ev.startDate).diffNow("days").days;
  if (diff < 14) throw new TRPCError({ code: "BAD_REQUEST", message: "Cancellation/refund window closed" });
}

export const paymentRouter = router({
  // 1) Begin card payment for a registration
  initCard: protectedProcedure
    .input(CardPaymentInitInput)
    .mutation(async ({ input, ctx }) => {
      return paymentService.initCardPayment((ctx.user!._id as any).toString(), input);
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
});
