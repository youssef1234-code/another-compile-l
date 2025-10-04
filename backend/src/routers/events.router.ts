/**
 * Events Router
 * 
 * tRPC router for event management operations
 * 
 * @module routers/events.router
 */

import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc/trpc.js';
import {
  CreateEventSchema,
  UpdateEventSchema,
  EventFilterSchema,
} from '@event-manager/shared';
import { Event } from '../models/event.model.js';
import { z } from 'zod';

export const eventsRouter = router({
  /**
   * Get all events with filters and pagination
   */
  getEvents: publicProcedure
    .input(EventFilterSchema)
    .query(async ({ input }) => {
      const filter: any = {};

      // Text search in title and description
      if (input.search) {
        filter.$or = [
          { title: { $regex: input.search, $options: 'i' } },
          { description: { $regex: input.search, $options: 'i' } },
        ];
      }

      // Filter by type
      if (input.type) {
        filter.type = input.type;
      }

      // Filter by location
      if (input.location) {
        filter.location = input.location;
      }

      // Filter by date range
      if (input.startDate || input.endDate) {
        filter.date = {};
        if (input.startDate) filter.date.$gte = input.startDate;
        if (input.endDate) filter.date.$lte = input.endDate;
      }

      // Filter by price range
      if (input.minPrice !== undefined || input.maxPrice !== undefined) {
        filter.price = {};
        if (input.minPrice !== undefined) filter.price.$gte = input.minPrice;
        if (input.maxPrice !== undefined) filter.price.$lte = input.maxPrice;
      }

      // Filter upcoming events only
      if (input.onlyUpcoming) {
        filter.date = { ...filter.date, $gte: new Date() };
      }

      // Filter archived
      if (input.isArchived !== undefined) {
        filter.isArchived = input.isArchived;
      } else {
        // By default, don't show archived events
        filter.isArchived = false;
      }

      const skip = (input.page - 1) * input.limit;

      const [events, total] = await Promise.all([
        Event.find(filter)
          .skip(skip)
          .limit(input.limit)
          .sort({ date: 1 }) // Sort by date ascending (upcoming first)
          .populate('createdBy', 'firstName lastName email'),
        Event.countDocuments(filter),
      ]);

      return {
        events,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  /**
   * Get single event by ID
   */
  getEventById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const event = await Event.findById(input.id).populate('createdBy', 'firstName lastName email companyName');

      if (!event) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Event not found',
        });
      }

      return event;
    }),

  /**
   * Get upcoming events (next 10)
   */
  getUpcomingEvents: publicProcedure
    .query(async () => {
      const events = await Event.find({
        date: { $gte: new Date() },
        isArchived: false,
      })
        .sort({ date: 1 })
        .limit(10)
        .populate('createdBy', 'firstName lastName email');

      return events;
    }),

  /**
   * Search events (advanced)
   */
  searchEvents: publicProcedure
    .input(z.object({
      query: z.string(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const events = await Event.find({
        $or: [
          { title: { $regex: input.query, $options: 'i' } },
          { description: { $regex: input.query, $options: 'i' } },
          { tags: { $in: [new RegExp(input.query, 'i')] } },
        ],
        isArchived: false,
      })
        .sort({ date: 1 })
        .limit(input.limit)
        .populate('createdBy', 'firstName lastName email');

      return events;
    }),

  /**
   * Get event statistics
   */
  getEventStats: publicProcedure
    .query(async () => {
      const [total, upcoming, archived, byType] = await Promise.all([
        Event.countDocuments({ isArchived: false }),
        Event.countDocuments({ date: { $gte: new Date() }, isArchived: false }),
        Event.countDocuments({ isArchived: true }),
        Event.aggregate([
          { $match: { isArchived: false } },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
      ]);

      return {
        total,
        upcoming,
        archived,
        byType: byType.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      };
    }),

  /**
   * Create event (Vendor or Event Office only)
   */
  createEvent: protectedProcedure
    .input(CreateEventSchema)
    .mutation(async ({ input, ctx }) => {
      // Check if user is vendor or event office
      if (ctx.user?.role !== 'VENDOR' && ctx.user?.role !== 'EVENT_OFFICE') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only vendors and event office can create events',
        });
      }

      const event = await Event.create({
        ...input,
        createdBy: ctx.user._id,
        registeredCount: 0,
        isArchived: false,
      });

      return {
        message: 'Event created successfully',
        event,
      };
    }),

  /**
   * Update event (Creator or Admin only)
   */
  updateEvent: protectedProcedure
    .input(UpdateEventSchema)
    .mutation(async ({ input, ctx }) => {
      const event = await Event.findById(input.id);

      if (!event) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Event not found',
        });
      }

      // Check permissions
      const isCreator = event.createdBy.toString() === ctx.user?._id?.toString();
      const isAdmin = ctx.user?.role === 'ADMIN' || ctx.user?.role === 'EVENT_OFFICE';

      if (!isCreator && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this event',
        });
      }

      // Update fields
      const { id, ...updateData } = input;
      Object.assign(event, updateData);
      await event.save();

      return {
        message: 'Event updated successfully',
        event,
      };
    }),

  /**
   * Delete event (Creator or Admin only)
   */
  deleteEvent: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const event = await Event.findById(input.id);

      if (!event) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Event not found',
        });
      }

      // Check permissions
      const isCreator = event.createdBy.toString() === ctx.user?._id?.toString();
      const isAdmin = ctx.user?.role === 'ADMIN' || ctx.user?.role === 'EVENT_OFFICE';

      if (!isCreator && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this event',
        });
      }

      // Soft delete by archiving
      event.isArchived = true;
      await event.save();

      return {
        message: 'Event deleted successfully',
        eventId: input.id,
      };
    }),

  /**
   * Get my events (for vendors)
   */
  getMyEvents: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(12),
    }))
    .query(async ({ input, ctx }) => {
      const skip = (input.page - 1) * input.limit;

      const [events, total] = await Promise.all([
        Event.find({ createdBy: ctx.user?._id })
          .skip(skip)
          .limit(input.limit)
          .sort({ createdAt: -1 }),
        Event.countDocuments({ createdBy: ctx.user?._id }),
      ]);

      return {
        events,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),
});
