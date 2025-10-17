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

import { publicProcedure, protectedProcedure, eventsOfficeProcedure, adminProcedure, router, eventsOfficeProfessorProcedure, professorProcedure } from '../trpc/trpc';
import { createSearchSchema } from './base.router';
import { eventService } from '../services/event.service';
import { registrationService } from '../services/registration.service';
import {
  CreateEventSchema,
  UpdateEventSchema,
  EventFilterSchema,
  EventStatus,
  createGymSessionSchema,
  updateGymSessionSchema,
  CreateWorkshopSchema,
  UpdateWorkshopSchema,
} from '@event-manager/shared';
import { z } from 'zod';

function omitUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}
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
        maxPrice: input.maxPrice,
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
  create: eventsOfficeProfessorProcedure
    .input(CreateEventSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      return eventService.create(input, { userId, role: ctx.user!.role.toString() });
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
      console.log('📥 Backend received update:', { id: input.id, images: input.data.images, hasImages: !!input.data.images });
      const userId = (ctx.user!._id as any).toString();
      const result = await eventService.update(input.id, input.data, { userId });
      console.log('✅ Backend updated event:', { id: result.id, images: result.images });
      return result;
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
   * Get all events with advanced table features - EVENT_OFFICE and ADMIN only
   * Supports tablecn data table with:
   * - Global search across title, description, professorName
   * - Multi-field sorting
   * - Simple faceted filters (advanced mode): {type: ["WORKSHOP"], status: ["PUBLISHED"]}
   * - Extended filters with operators (command mode)
   * - Server-side pagination
   */
  getAllEvents: eventsOfficeProcedure
    .input(z.object({
      // Pagination
      page: z.number().optional().default(1),
      perPage: z.number().optional().default(20),
      
      // Global search
      search: z.string().optional(),
      
      // Multi-field sorting
      sort: z.array(z.object({
        id: z.string(),
        desc: z.boolean(),
      })).optional(),
      
      // Simple faceted filters: {type: ["WORKSHOP"], status: ["PUBLISHED"]}
      filters: z.record(z.array(z.string())).optional(),
      
      // Extended filters with operators (for command mode)
      extendedFilters: z.array(z.object({
        id: z.string(),
        value: z.union([z.string(), z.array(z.string())]),
        operator: z.enum([
          'iLike', 'notILike', 'eq', 'ne', 'isEmpty', 'isNotEmpty',
          'lt', 'lte', 'gt', 'gte', 'isBetween', 
          'inArray', 'notInArray', 'isRelativeToToday'
        ]),
        variant: z.enum(['text', 'number', 'range', 'date', 'dateRange', 'boolean', 'select', 'multiSelect']),
        filterId: z.string(),
      })).optional(),
      
      // Join operator for extended filters (AND/OR logic)
      joinOperator: z.enum(['and', 'or']).optional().default('and'),
    }))
    .query(async ({ input }) => {
      const result = await eventService.getAllEvents({
        page: input.page,
        limit: input.perPage,
        search: input.search,
        sort: input.sort,
        filters: input.filters,
        extendedFilters: input.extendedFilters,
        joinOperator: input.joinOperator,
      });

      return result;
    }),

  /**
   * Get event statistics (for admin dashboard) - ADMIN only
   */
  getStatistics: adminProcedure
    .query(async () => {
      return eventService.getStatistics();
    }),

  /**
   * Get event stats for header (total, published, draft, etc.)
   */
  getEventStats: eventsOfficeProcedure
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
    .input(createGymSessionSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      return eventService.createGymSession(
        {
          ...input,
          type: 'GYM_SESSION',
          endDate: new Date(input.startDate.getTime() + input.duration * 60000),
          location: 'Gym',
          status: EventStatus.DRAFT,
        },
        { userId }
      );
    }),
    

    // UPDATE (edit date/time/duration/status/capacity only)
  updateGymSession: eventsOfficeProcedure
    .input(updateGymSessionSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      const { id, ...rest } = input;

      const patch = omitUndefined({
        startDate: rest.startDate,
        duration: rest.duration,
        capacity: rest.capacity,
        status: rest.status,
        sessionType: rest.sessionType,
      });

    return eventService.updateGymSession(id, patch, { userId });
  }),

    // Approve workshop - EVENT_OFFICE ONLY
    approveWorkshop : eventsOfficeProcedure
    .input(z.object({
      eventId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return eventService.approveWorkshop(input.eventId);
    }),

    // Reject Workshop - EVENT_OFFICE ONLY
    rejectWorkshop : eventsOfficeProcedure
    .input(z.object({
      eventId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return eventService.rejectWorkshop(input.eventId);
    }),

    // Workshop needs edits - EVENT_OFFICE ONLY
    workshopNeedsEdits : eventsOfficeProcedure
    .input(z.object({
      eventId: z.string(),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return eventService.editsNeededWorkshop(input.eventId);
    }),

    publishWorkshop : eventsOfficeProcedure
    .input(z.object({
      eventId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return eventService.publishWorkshop(input.eventId);
    }),

    /**
     * Publish any event (generic)
     */
    publishEvent: eventsOfficeProcedure
    .input(z.object({
      eventId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return eventService.publishEvent(input.eventId);
    }),
    
      /**
   * Create workshop - PROFESSOR only
   */
  createWorkshop: professorProcedure
    .input(CreateWorkshopSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();

      // Ensure the user is a professor
      if (ctx.user!.role !== 'PROFESSOR') {
        throw new Error('Only professors can create workshops');
      }

      return eventService.create({ ...input, type: 'WORKSHOP'}, { userId });
    }),

  /**
   * Edit workshop - PROFESSOR only
   */
  editWorkshop: professorProcedure
    .input(UpdateWorkshopSchema)
    .mutation(async ({ input, ctx }) => {

      const {id} = input;
      // Ensure the user is a professor
      if (ctx.user!.role !== 'PROFESSOR') {
        throw new Error('Only professors can edit workshops');
      }



      return eventService.updateWorkshop(input);
    }),

  /**
   * Get workshops created by the logged-in professor
   */
  getMyWorkshops: professorProcedure
    .query(async ({ ctx }) => {      
      const workshops = await eventService.findAll({
        professorName: ctx.user!.firstName + ' ' + ctx.user!.lastName,
        type: 'WORKSHOP'
      });
      return workshops;
    }),
    

};

// Export events router with all routes
export const eventsRouter = router(eventRoutes);
