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
import {
  CreateEventSchema,
  UpdateEventSchema,
  EventFilterSchema,
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
    }))
    .query(async ({ input }) => {
      // Mock data for now - implement actual service method later
      return {
        registrations: [],
        total: 0,
        page: input.page,
        totalPages: 0,
      };
    }),

  /**
   * Register for an event - AUTHENTICATED users only
   */
  registerForEvent: protectedProcedure
    .input(z.object({
      eventId: z.string(),
    }))
    .mutation(async () => {
      // Mock implementation - implement actual service method later
      return {
        success: true,
        message: 'Registration successful',
      };
    }),

  /**
   * Cancel registration - AUTHENTICATED users only
   */
  cancelRegistration: protectedProcedure
    .input(z.object({
      registrationId: z.string(),
    }))
    .mutation(async () => {
      // Mock implementation - implement actual service method later
      return {
        success: true,
        message: 'Registration cancelled successfully',
      };
    }),
};

// Export events router with all routes
export const eventsRouter = router(eventRoutes);
