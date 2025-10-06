/**
 * Events Router
 * 
 * tRPC router for event management operations
 * Role-based access control:
 * - Public: View events (getEvents, getEventById, getUpcoming, search, etc.)
 * - Authenticated: Register for events, view registrations, cancel registrations
 * - EVENT_OFFICE/ADMIN: Create, update, delete, archive events
 * - ADMIN: View statistics
 * 
 * @module routers/events.router
 */

import { publicProcedure, protectedProcedure, eventsOfficeProcedure, adminProcedure, router } from '../trpc/trpc';
import { createSearchSchema } from './base.router';
import { eventService } from '../services/event.service';
import { registrationService } from '../services/registration.service';
import {
  CreateEventSchema,
  UpdateEventSchema,
  EventFilterSchema,
  GymSessionType,
} from '@event-manager/shared';
import { z } from 'zod';

// Define all routes with proper role-based access control
const eventRoutes = {
  /**
   * Get all events with advanced filters and pagination (PUBLIC)
   */
  getEvents: publicProcedure
    .input(EventFilterSchema)
    .query(async ({ input }) => {
      return eventService.getEvents({
        page: input.page,
        limit: input.limit,
        search: input.search,
        type: input.type,
        location: input.location,
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }),

  /**
   * Get single event by ID with full details (PUBLIC)
   */
  getEventById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return eventService.getEventById(input.id);
    }),

  /**
   * Get upcoming events (PUBLIC)
   */
  getUpcoming: publicProcedure
    .input(z.object({
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(10),
    }))
    .query(async ({ input }) => {
      return eventService.getUpcomingEvents({
        page: input.page,
        limit: input.limit,
      });
    }),

  /**
   * Search events by name or description (PUBLIC)
   */
  search: publicProcedure
    .input(createSearchSchema())
    .query(async ({ input }) => {
      return eventService.searchEvents(input.query, {
        page: input.page,
        limit: input.limit,
      });
    }),

  /**
   * Get events by type (PUBLIC)
   */
  getByType: publicProcedure
    .input(z.object({
      type: z.string(),
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(10),
    }))
    .query(async ({ input }) => {
      return eventService.getEventsByType(input.type, {
        page: input.page,
        limit: input.limit,
      });
    }),

  /**
   * Get events by location (PUBLIC)
   */
  getByLocation: publicProcedure
    .input(z.object({
      location: z.string(),
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(10),
    }))
    .query(async ({ input }) => {
      return eventService.getEventsByLocation(input.location, {
        page: input.page,
        limit: input.limit,
      });
    }),

  /**
   * Create event - EVENT_OFFICE and ADMIN only
   */
  create: eventsOfficeProcedure
    .input(CreateEventSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      return eventService.create(input, { userId });
    }),

  /**
   * Update event - EVENT_OFFICE and ADMIN only
   */
  update: eventsOfficeProcedure
    .input(z.object({
      id: z.string(),
      data: UpdateEventSchema.partial(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      return eventService.update(input.id, input.data, { userId });
    }),

  /**
   * Delete event (soft delete) - EVENT_OFFICE and ADMIN only
   */
  delete: eventsOfficeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      return eventService.delete(input.id, { userId });
    }),

  /**
   * Archive an event - EVENT_OFFICE and ADMIN only
   */
  archive: eventsOfficeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return eventService.archiveEvent(input.id);
    }),

  /**
   * Get event statistics (for admin dashboard) - ADMIN only
   */
  getStatistics: adminProcedure
    .query(async () => {
      return eventService.getStatistics();
    }),

  /**
   * Get my registrations - AUTHENTICATED users only
   */
  getMyRegistrations: protectedProcedure
    .input(z.object({
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(100),
      status: z.enum(['upcoming', 'past', 'all']).optional().default('all'),
    }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      return registrationService.getMyRegistrations(userId, {
        page: input.page,
        limit: input.limit,
        status: input.status,
      });
    }),

  /**
   * Register for an event - AUTHENTICATED users only
   */
  registerForEvent: protectedProcedure
    .input(z.object({
      eventId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      const registration = await registrationService.registerForEvent(userId, input.eventId);
      return {
        success: true,
        message: 'Successfully registered for event',
        registration,
      };
    }),

  /**
   * Cancel registration - AUTHENTICATED users only
   */
  cancelRegistration: protectedProcedure
    .input(z.object({
      registrationId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      return registrationService.cancelRegistration(userId, input.registrationId);
    }),

  /**
   * Check if user is registered for an event - AUTHENTICATED users only
   */
  isRegistered: protectedProcedure
    .input(z.object({
      eventId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      const isRegistered = await registrationService.isUserRegistered(userId, input.eventId);
      return { isRegistered };
    }),

  /**
   * Get event registrations - EVENT_OFFICE and ADMIN only
   */
  getEventRegistrations: eventsOfficeProcedure
    .input(z.object({
      eventId: z.string(),
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(100),
    }))
    .query(async ({ input }) => {
      return registrationService.getEventRegistrations(input.eventId, {
        page: input.page,
        limit: input.limit,
      });
    }),

    /**
     * Create a gym session - EVENT_OFFICE and ADMIN only
     */
    createGymSession: eventsOfficeProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      sessionType: z.nativeEnum(GymSessionType),
      startDate: z.coerce.date(),
      capacity: z.number().int().positive(),
      duration: z.number().int().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      return eventService.createGymSession(
        {
          ...input,
          type: 'GYM_SESSION',
          endDate: new Date(input.startDate.getTime() + input.duration * 60000),
          location: 'Gym',
        },
        { userId }
      );
    }),
};

// Export events router with all routes
export const eventsRouter = router(eventRoutes);
