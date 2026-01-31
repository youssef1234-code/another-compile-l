/**
 * Vendor Poll Router
 *
 * tRPC router for vendor poll management
 * Requirement #82: Events Office can create polls for conflicting vendor booth requests
 *
 * @module routers/vendor-poll.router
 */

import {
  eventsOfficeProcedure,
  router,
  protectedProcedure,
} from '../trpc/trpc';
import { vendorPollService } from '../services/vendor-poll.service';
import {
  CreateVendorPollSchema,
  VoteOnPollSchema,
  ResolvePollSchema,
  PollFilterSchema,
} from '../shared/index.js';
import { z } from 'zod';

const pollRoutes = {
  /**
   * Create a poll for conflicting vendor applications
   * Only Events Office can create polls
   */
  createPoll: eventsOfficeProcedure
    .input(CreateVendorPollSchema)
    .mutation(async ({ input, ctx }) => {
      const createdBy = (ctx.user!._id as any).toString();
      return vendorPollService.createPoll(
        input.boothLocationId,
        input.boothLabel,
        input.startDate,
        input.duration,
        input.applicationIds,
        createdBy,
        input.description
      );
    }),

  /**
   * Add an application to an existing poll
   * Only Events Office can add applications
   */
  addApplicationToPoll: eventsOfficeProcedure
    .input(
      z.object({
        pollId: z.string(),
        applicationId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return vendorPollService.addApplicationToPoll(
        input.pollId,
        input.applicationId
      );
    }),

  /**
   * Vote on a poll
   * All authenticated users can vote (students, TAs, professors, staff, Events Office)
   */
  vote: protectedProcedure
    .input(VoteOnPollSchema)
    .mutation(async ({ input, ctx }) => {
      const voterId = (ctx.user!._id as any).toString();
      return vendorPollService.vote(input.pollId, voterId, input.applicationId);
    }),

  /**
   * Resolve poll and approve winning application
   * Only Events Office can resolve polls
   */
  resolvePoll: eventsOfficeProcedure
    .input(ResolvePollSchema)
    .mutation(async ({ input, ctx }) => {
      const resolvedBy = (ctx.user!._id as any).toString();
      return vendorPollService.resolvePoll(
        input.pollId,
        input.winningApplicationId,
        resolvedBy
      );
    }),

  /**
   * Cancel a poll
   * Only Events Office can cancel polls
   */
  cancelPoll: eventsOfficeProcedure
    .input(z.object({ pollId: z.string() }))
    .mutation(async ({ input }) => {
      return vendorPollService.cancelPoll(input.pollId);
    }),

  /**
   * Get active polls
   * All authenticated users can view active polls
   */
  getActivePolls: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1).optional(),
        limit: z.number().int().positive().max(100).default(20).optional(),
      })
    )
    .query(async ({ input }) => {
      return vendorPollService.getActivePolls(input.page, input.limit);
    }),

  /**
   * Get all polls with optional status filter
   * All authenticated users can view all polls
   */
  getAllPolls: protectedProcedure
    .input(PollFilterSchema)
    .query(async ({ input }) => {
      return vendorPollService.getAllPolls(
        input.page,
        input.limit,
        input.status
      );
    }),

  /**
   * Get poll by ID with full details
   * Events Office and related vendors can view
   */
  getPollById: protectedProcedure
    .input(z.object({ pollId: z.string() }))
    .query(async ({ input }) => {
      return vendorPollService.getPollById(input.pollId);
    }),

  /**
   * Get poll with vote counts
   * Only Events Office can view vote counts
   */
  getPollWithVoteCounts: eventsOfficeProcedure
    .input(z.object({ pollId: z.string() }))
    .query(async ({ input }) => {
      return vendorPollService.getPollWithVoteCounts(input.pollId);
    }),
};

export const vendorPollRouter = router(pollRoutes);
