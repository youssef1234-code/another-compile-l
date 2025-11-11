/**
 * Feedback Router
 * 
 * tRPC router for feedback (ratings & comments) operations
 * 
 * Role-based access control:
 * - Authenticated users: Rate/comment on events they attended
 * - All users: View ratings and comments on any event
 * - Admin: Delete inappropriate comments
 * 
 * User Stories:
 * - #15: Student/Staff/TA/Professor can rate an event they attended
 * - #16: Student/Staff/TA/Professor can comment on an event they attended
 * - #17: Student/Staff/Events Office/TA/Professor/Admin can view all ratings and comments on any event
 * - #18: Admin can delete any inappropriate comments
 * 
 * @module routers/feedback.router
 */

import {
  protectedProcedure,
  adminProcedure,
  router,
} from '../trpc/trpc';
import { feedbackService } from '../services/feedback.service';
import {
  CreateFeedbackSchema,
  UpdateFeedbackSchema,
  GetFeedbackByEventSchema,
} from '@event-manager/shared';
import { z } from 'zod';

const feedbackRoutes = {
  /**
   * Create feedback (Story #15 & #16)
   * Student/Staff/TA/Professor can rate and/or comment on events they attended
   * Only allowed after event has started
   */
  create: protectedProcedure
    .input(CreateFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user!; // protectedProcedure guarantees auth
      if (user.role === 'ADMIN' || user.role === 'EVENT_OFFICE') {
        throw new (await import('@trpc/server')).TRPCError({
          code: 'FORBIDDEN',
          message: 'This role cannot submit feedback',
        });
      }
      return feedbackService.createFeedback(ctx.user!.id, input);
    }),

  /**
   * Update existing feedback
   * Allows users to edit their feedback after event participation
   */
  update: protectedProcedure
    .input(UpdateFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user!;
      if (user.role === 'ADMIN' || user.role === 'EVENT_OFFICE') {
        throw new (await import('@trpc/server')).TRPCError({
          code: 'FORBIDDEN',
          message: 'This role cannot edit feedback',
        });
      }
      return feedbackService.updateFeedback(ctx.user!.id, input.eventId, input);
    }),

  /**
   * Get all feedback for a specific event (Story #17)
   * Anyone can view all ratings and comments on any event
   */
  getByEvent: protectedProcedure
    .input(GetFeedbackByEventSchema)
    .query(async ({ input }) => {
      return feedbackService.getFeedbackByEvent(
        input.eventId,
        input.page,
        input.limit
      );
    }),

  /**
   * Get user's own feedback for a specific event
   * Used by frontend to check if user has already submitted feedback and allow editing
   */
  getMyFeedback: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      return feedbackService.getUserFeedbackForEvent(ctx.user!.id, input.eventId);
    }),

  /**
   * Get rating statistics for an event
   */
  getRatingStats: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return feedbackService.getEventRatingStats(input.eventId);
    }),

  /**
   * Delete feedback (Story #18)
   * Admin can delete any inappropriate comments
   */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await feedbackService.deleteFeedback(input.id);
      return { success: true };
    }),
};

export const feedbackRouter = router(feedbackRoutes);
