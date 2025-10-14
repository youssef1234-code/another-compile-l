/**
 * Vendor Applications Router
 * @module routers/vendor.router
 */

import { router, protectedProcedure, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { vendorApplicationService } from '../services/vendor-application.service';

// If you already export enums from @event-manager/shared, reuse them.
// Here we mirror the model's enums for validation:
const BoothSizeEnum = z.enum(['SMALL', 'MEDIUM', 'LARGE']);

export const vendorRouter = router({
  /**
   * Apply to a bazaar event
   */
  applyToBazaar: protectedProcedure
    .input(z.object({
      vendorId: z.string(), // could infer from ctx if you tie users to vendors
      eventId: z.string(),
      attendees: z.array(z.string().min(1)).max(20).optional().default([]),
      boothSize: BoothSizeEnum,
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      const app = await vendorApplicationService.applyToBazaar({
        vendorId: input.vendorId,
        eventId: input.eventId,
        attendees: input.attendees,
        boothSize: input.boothSize,
      }, { userId });

      return {
        success: true,
        message: 'Application submitted',
        application: app,
      };
    }),

  /**
   * Get my vendor applications (created by me)
   */
  getMyApplications: protectedProcedure
    .input(z.object({
      vendorId: z.string(),  
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      return vendorApplicationService.getMyApplications(userId, {
        page: input.page,
        limit: input.limit,
      });
    }),

  /**
   * Get upcoming bazaars to apply to
   */
  getUpcomingBazaars: publicProcedure
    .input(z.object({
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(20),
    }).optional())
    .query(async ({ input }) => {
      return vendorApplicationService.getUpcomingBazaars({
        page: input?.page,
        limit: input?.limit,
      });
    }),
});

export type VendorRouter = typeof vendorRouter;
