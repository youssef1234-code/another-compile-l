/**
 * Loyalty Router
 * 
 * tRPC router for GUC loyalty program operations
 * 
 * Role-based access control:
 * - Vendors: Apply to loyalty program, cancel participation
 * - All authenticated users: View current loyalty partners
 * 
 * User Stories:
 * - #70: Vendor can apply to participate in the GUC loyalty program
 * - #71: Vendor can cancel participation in the GUC loyalty program
 * - #72: All users can view list of current loyalty partners
 * 
 * @module routers/loyalty.router
 */

import {
  protectedProcedure,
  router,
} from '../trpc/trpc.js';
import { loyaltyService } from '../services/loyalty.service.js';
import {
  ApplyToLoyaltySchema,
  CancelLoyaltySchema,
} from '../shared/index.js';
import { TRPCError } from '@trpc/server';

/**
 * Ensure user is a vendor
 */
const vendorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== 'VENDOR') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only vendors can perform this action',
    });
  }
  return next({ ctx });
});

export const loyaltyRouter = router({
  /**
   * Apply to loyalty program (Story #70)
   * 
   * Allows vendors to submit an application to join the GUC loyalty program
   * Requires: discount_rate, promo_code, terms_and_conditions
   * 
   * Validation:
   * - All fields required
   * - Prevent multiple active applications
   * - Discount rate: 0-100%
   * - Promo code: auto-converted to uppercase
   */
  applyToProgram: vendorProcedure
    .input(ApplyToLoyaltySchema)
    .mutation(async ({ ctx, input }) => {
      return loyaltyService.applyToLoyaltyProgram(ctx.user!.id, input);
    }),

  /**
   * Cancel loyalty participation (Story #71)
   * 
   * Allows vendors to cancel their participation in the loyalty program
   * - If accepted: removes from partners list and marks request as cancelled
   * - If pending: marks request as cancelled
   */
  cancelParticipation: vendorProcedure
    .input(CancelLoyaltySchema)
    .mutation(async ({ ctx }) => {
      return loyaltyService.cancelLoyaltyParticipation(ctx.user!.id);
    }),

  /**
   * Get all loyalty partners (Story #72)
   * 
   * Returns list of all vendors currently in the loyalty program
   * Available to all authenticated users
   * Returns: vendor info, discount_rate, promo_code, terms
   */
  getAllPartners: protectedProcedure
    .query(async () => {
      return loyaltyService.getAllLoyaltyPartners();
    }),

  /**
   * Get vendor's loyalty requests (Vendor-only)
   * 
   * Returns all loyalty requests created by the vendor
   * Sorted by newest first, includes all statuses (pending, accepted, rejected, cancelled)
   */
  getVendorRequests: vendorProcedure
    .query(async ({ ctx }) => {
      return loyaltyService.getMyLoyaltyStatus(ctx.user!.id);
    }),
});
