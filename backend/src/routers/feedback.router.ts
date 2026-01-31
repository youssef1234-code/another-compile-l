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
} from '../shared/index.js';
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
   * Delete feedback comment (Story #18)
   * Admin can delete any inappropriate comments
   * If feedback has a rating, the rating is preserved and only the comment is hidden
   */
  delete: adminProcedure
    .input(z.object({ 
      id: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await feedbackService.deleteFeedback(input.id, input.reason);
      return { success: true };
    }),

  /**
   * Get flagged comments for moderation (Admin only)
   * Returns comments that need review based on AI moderation
   */
  getFlagged: adminProcedure
    .input(z.object({
      status: z.enum(['pending', 'flagged', 'approved', 'removed', 'all']).optional().default('flagged'),
      severity: z.enum(['low', 'medium', 'high', 'critical', 'all']).optional().default('all'),
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(20),
    }))
    .query(async ({ input }) => {
      return feedbackService.getFlaggedComments(input);
    }),

  /**
   * Approve a flagged comment (Admin only)
   * Marks the comment as approved after manual review
   */
  approveComment: adminProcedure
    .input(z.object({
      feedbackId: z.string(),
      note: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const adminId = (ctx.user!._id as any).toString();
      return feedbackService.moderateComment(input.feedbackId, 'approved', adminId, input.note);
    }),

  /**
   * Remove a flagged comment (Admin only)
   * Marks the comment as removed and hides it
   */
  removeComment: adminProcedure
    .input(z.object({
      feedbackId: z.string(),
      note: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const adminId = (ctx.user!._id as any).toString();
      return feedbackService.moderateComment(input.feedbackId, 'removed', adminId, input.note);
    }),

  /**
   * Get moderation statistics (Admin only)
   */
  getModerationStats: adminProcedure
    .query(async () => {
      return feedbackService.getModerationStats();
    }),

  /**
   * Get unmoderated comments with data table support (Admin only)
   * Returns comments that need moderation with full filtering/sorting/pagination
   */
  getUnmoderated: adminProcedure
    .input(z.object({
      // Pagination
      page: z.number().optional().default(1),
      perPage: z.number().optional().default(10),
      
      // Global search
      search: z.string().optional(),
      
      // Multi-field sorting
      sort: z.array(z.object({
        id: z.string(),
        desc: z.boolean(),
      })).optional(),
      
      // Simple faceted filters
      filters: z.record(z.array(z.string())).optional(),
      
      // Extended filters with operators (for command mode)
      extendedFilters: z.array(z.object({
        id: z.string(),
        value: z.union([z.string(), z.array(z.string())]),
        operator: z.string(),
        variant: z.string(),
        filterId: z.string(),
      })).optional(),
      
      // Join operator for extended filters
      joinOperator: z.enum(['and', 'or']).optional().default('and'),
    }))
    .query(async ({ input }) => {
      return feedbackService.getUnmoderatedCommentsWithFilters(input);
    }),

  /**
   * Batch update moderation results from AI service
   * Updates multiple comments with their moderation results
   */
  batchUpdateModeration: protectedProcedure
    .input(z.object({
      results: z.array(z.object({
        feedbackId: z.string(),
        isAppropriate: z.boolean(),
        flags: z.array(z.string()),
        severity: z.enum(['none', 'low', 'medium', 'high', 'critical']),
        confidence: z.number(),
        aiSuggestion: z.enum(['approve', 'remove']).optional(),
        aiReasoning: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      return feedbackService.batchUpdateModeration(input.results);
    }),
};

export const feedbackRouter = router(feedbackRoutes);
