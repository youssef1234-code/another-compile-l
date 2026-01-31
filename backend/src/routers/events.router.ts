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

import {
  publicProcedure,
  protectedProcedure,
  eventsOfficeProcedure,
  adminProcedure,
  router,
  professorProcedure,
  eventsOfficeOnlyProcedure,
} from "../trpc/trpc";
import { TRPCError } from "@trpc/server";
import { createSearchSchema } from "./base.router";
import { eventService } from "../services/event.service";
import { registrationService } from "../services/registration.service";
import { exportService } from "../services/export.service";
import { notificationService } from "../services/notification.service";
import {
  CreateEventSchema,
  UpdateEventSchema,
  EventFilterSchema,
  EventStatus,
  createGymSessionSchema,
  updateGymSessionSchema,
  CreateWorkshopSchema,
  UpdateWorkshopSchema
} from "../shared/index.js";
import { z } from "zod";
import { userService } from "../services/user.service";

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
    .query(async ({ input, ctx }) => {
      // Pass user context for whitelist filtering (Requirement #50)
      const userId = ctx.user?._id ? String(ctx.user._id) : undefined;
      const userRole = ctx.user?.role;

      return eventService.getEvents({
        page: input.page,
        limit: input.limit,
        search: input.search,
        type: input.type,
        location: input.location,
        startDate: input.startDate,
        endDate: input.endDate,
        maxPrice: input.maxPrice,
        userId,
        userRole,
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
    .input(
      z.object({
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(1000).optional().default(10),
      })
    )
    .query(async ({ input }) => {
      return eventService.getUpcomingEvents({
        page: input.page,
        limit: input.limit,
      });
    }),

  /**
   * Get upcoming events accessible to the current user (filters out whitelisted events user can't access)
   * Used by AI Assistant to only recommend events the user can actually register for
   */
  getAccessibleUpcoming: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(15),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      const userRole = ctx.user!.role;
      return eventService.getAccessibleUpcomingEvents({
        userId,
        userRole,
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
    .input(
      z.object({
        type: z.string(),
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(10),
      })
    )
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
    .input(
      z.object({
        location: z.string(),
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(10),
      })
    )
    .query(async ({ input }) => {
      return eventService.getEventsByLocation(input.location, {
        page: input.page,
        limit: input.limit,
      });
    }),

  /**
   * Create event - EVENT_OFFICE and ADMIN only (Professors use createWorkshop)
   * Note: BAZAAR can only be created by Events Office (Admins excluded)
   */
  create: eventsOfficeProcedure
    .input(CreateEventSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      // Only Events Office can create Bazaars
      if (input.type === "BAZAAR" && ctx.user!.role !== "EVENT_OFFICE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Events Office can create bazaars",
        });
      }
      return eventService.create(input as any, {
        userId,
        role: ctx.user!.role.toString(),
      });
    }),

  /**
   * Update event - EVENT_OFFICE and ADMIN only (CANNOT edit workshops - professors only)
   */
  update: eventsOfficeProcedure
    .input(
      z.object({
        id: z.string(),
        data: UpdateEventSchema.partial(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();

      // Check if event is a workshop
      const event = await eventService.getEventById(input.id);
      if (event.type === "WORKSHOP") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Workshops can only be edited by the professor who created them. Use approval actions instead.",
        });
      }

      const result = await eventService.update(input.id, input.data as any, {
        userId,
      });
      return result;
    }),

  /**
   * Delete event (soft delete) - EVENT_OFFICE and ADMIN only (CANNOT delete workshops - professors only)
   */
  delete: eventsOfficeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();

      // Check if event is a workshop
      const event = await eventService.getEventById(input.id);
      if (event.type === "WORKSHOP") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Workshops can only be deleted by the professor who created them.",
        });
      }

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

  getEventReports: protectedProcedure
    .input(
      z.object({
        // Pagination
        page: z.number().optional().default(1),
        perPage: z.number().optional().default(20),

        // Global search
        search: z.string().optional(),

        // Multi-field sorting
        sort: z
          .array(
            z.object({
              id: z.string(),
              desc: z.boolean(),
            })
          )
          .optional(),

        // Simple faceted filters: {type: ["WORKSHOP"], status: ["PUBLISHED"]}
        filters: z.record(z.array(z.string())).optional(),

        // Extended filters with operators (for command mode)
        extendedFilters: z
          .array(
            z.object({
              id: z.string(),
              value: z.union([z.string(), z.array(z.string())]),
              operator: z.enum([
                "iLike",
                "notILike",
                "eq",
                "ne",
                "isEmpty",
                "isNotEmpty",
                "lt",
                "lte",
                "gt",
                "gte",
                "isBetween",
                "inArray",
                "notInArray",
                "isRelativeToToday",
              ]),
              variant: z.enum([
                "text",
                "number",
                "range",
                "date",
                "dateRange",
                "boolean",
                "select",
                "multiSelect",
              ]),
              filterId: z.string(),
            })
          )
          .optional(),

        // Join operator for extended filters (AND/OR logic)
        joinOperator: z.enum(["and", "or"]).optional().default("and"),
      })
    )
    .query(async ({ input, ctx }) => {
      // Allow admins and events office to see archived events
      const canSeeArchived = ctx.user?.role === "ADMIN" || ctx.user?.role === "EVENT_OFFICE";

      const result = await eventService.getEventsReports({
        page: input.page,
        limit: input.perPage,
        search: input.search,
        sort: input.sort,
        filters: input.filters,
        extendedFilters: input.extendedFilters,
        joinOperator: input.joinOperator,
        includeArchived: canSeeArchived,
      });

      return result;
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
  getAllEvents: protectedProcedure
    .input(
      z.object({
        // Pagination
        page: z.number().optional().default(1),
        perPage: z.number().optional().default(20),

        // Global search
        search: z.string().optional(),

        // Multi-field sorting
        sort: z
          .array(
            z.object({
              id: z.string(),
              desc: z.boolean(),
            })
          )
          .optional(),

        // Simple faceted filters: {type: ["WORKSHOP"], status: ["PUBLISHED"]}
        filters: z.record(z.array(z.string())).optional(),

        // Extended filters with operators (for command mode)
        extendedFilters: z
          .array(
            z.object({
              id: z.string(),
              value: z.union([z.string(), z.array(z.string())]),
              operator: z.enum([
                "iLike",
                "notILike",
                "eq",
                "ne",
                "isEmpty",
                "isNotEmpty",
                "lt",
                "lte",
                "gt",
                "gte",
                "isBetween",
                "inArray",
                "notInArray",
                "isRelativeToToday",
              ]),
              variant: z.enum([
                "text",
                "number",
                "range",
                "date",
                "dateRange",
                "boolean",
                "select",
                "multiSelect",
              ]),
              filterId: z.string(),
            })
          )
          .optional(),

        // Join operator for extended filters (AND/OR logic)
        joinOperator: z.enum(["and", "or"]).optional().default("and"),
      })
    )
    .query(async ({ input, ctx }) => {
      // Allow admins and events office to see archived events
      const canSeeArchived = ctx.user?.role === "ADMIN" || ctx.user?.role === "EVENT_OFFICE";
      const userId = ctx.user ? (ctx.user._id as any).toString() : undefined;
      const userRole = ctx.user?.role;

      const result = await eventService.getAllEvents({
        page: input.page,
        limit: input.perPage,
        search: input.search,
        sort: input.sort,
        filters: input.filters,
        extendedFilters: input.extendedFilters,
        joinOperator: input.joinOperator,
        includeArchived: canSeeArchived,
        userId,
        userRole,
      });

      return result;
    }),

  /**
   * Get event statistics (for admin dashboard) - ADMIN only
   */
  getStatistics: adminProcedure.query(async () => {
    return eventService.getStatistics();
  }),

  /**
   * Get event stats for header (total, published, draft, etc.)
   * Accessible to Event Office, Admin, and Professors
   * Professors see only their own workshop stats
   */
  getEventStats: protectedProcedure.query(async ({ ctx }) => {
    const role = ctx.user!.role;
    const userId =
      role === "PROFESSOR" ? (ctx.user!._id as any).toString() : undefined;
    // For Manage Events page (Admin/Event Office), exclude gym sessions from counts
    const excludeTypes =
      role === "ADMIN" || role === "EVENT_OFFICE" ? ["GYM_SESSION"] : undefined;
    return eventService.getStatistics(userId, { excludeTypes });
  }),

  /**
   * Get my registrations - AUTHENTICATED users only
   */
  getMyRegistrations: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(100),
        status: z.enum(["upcoming", "past", "all"]).optional().default("all"),
        // Filter options
        search: z.string().optional(),
        types: z.array(z.string()).optional(),
        location: z.enum(["ON_CAMPUS", "OFF_CAMPUS"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      return registrationService.getMyRegistrations(userId, {
        page: input.page,
        limit: input.limit,
        status: input.status,
        search: input.search,
        types: input.types,
        location: input.location,
      });
    }),

  /**
   * Register for an event - AUTHENTICATED users only
   */
  registerForEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log("Registering for event", { userId: ctx.user!._id, eventId: input.eventId });
      const userId = (ctx.user!._id as any).toString();
      const registration = await registrationService.registerForEvent(
        userId,
        input.eventId
      );
      return {
        success: true,
        message: "Successfully registered for event",
        registration,
      };
    }),

  /**
   * Cancel registration - AUTHENTICATED users only
   */
  cancelRegistration: protectedProcedure
    .input(
      z.object({
        registrationId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      return registrationService.cancelRegistration(
        userId,
        input.registrationId
      );
    }),

  /**
   * Check if user is registered for an event - AUTHENTICATED users only
   * Returns registration status and ID for certificate generation
   */
  isRegistered: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      const isRegistered = await registrationService.isUserRegistered(
        userId,
        input.eventId
      );

      // Get registration ID if registered (for certificate download)
      let registrationId: string | undefined;
      if (isRegistered) {
        const registration = await registrationService.getMineForEvent(userId, input.eventId);
        registrationId = registration?.id;
      }

      return { isRegistered, registrationId };
    }),

  /**
   * Get event registrations - EVENT_OFFICE, ADMIN, or PROFESSOR (for their own workshops) only
   */
  getEventRegistrations: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const userRole = ctx.user!.role;

      // Allow EVENT_OFFICE and ADMIN to see all registrations
      if (userRole === "EVENT_OFFICE" || userRole === "ADMIN") {
        return registrationService.getEventRegistrations(input.eventId, {
          page: input.page,
          limit: input.limit,
        });
      }

      // For professors, check if the event is their workshop
      if (userRole === "PROFESSOR") {
        const event = await eventService.findById(input.eventId);
        const userId = (ctx.user!._id as any).toString();

        // createdBy might be populated (object) or just an ID (string)
        const eventCreatorId =
          typeof event.createdBy === "object" && event.createdBy !== null
            ? (event.createdBy as any)._id?.toString() ||
            (event.createdBy as any).id?.toString()
            : (event.createdBy as any)?.toString();

        // Check if this professor created the workshop (compare user IDs)
        if (event.type === "WORKSHOP" && eventCreatorId === userId) {
          return registrationService.getEventRegistrations(input.eventId, {
            page: input.page,
            limit: input.limit,
          });
        }

        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view registrations for your own workshops",
        });
      }

      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Only Event Office staff and professors can access registrations",
      });
    }),

  /**
   * Create a gym session - EVENT_OFFICE and ADMIN only
   * Publishes by default (as per requirements)
   */
  // Only Events Office can create Gym Sessions (Admins excluded)
  createGymSession: eventsOfficeOnlyProcedure
    .input(createGymSessionSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      return eventService.createGymSession(
        {
          ...input, // name, description, sessionType, startDate, duration, capacity
          type: "GYM_SESSION",
          endDate: new Date(input.startDate.getTime() + input.duration * 60000),
          location: "ON_CAMPUS",
          locationDetails: "Gym",
          status: EventStatus.PUBLISHED, // Publish by default
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

  // Approve workshop - EVENT_OFFICE ONLY (Admins excluded)
  approveWorkshop: eventsOfficeOnlyProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return eventService.approveWorkshop(input.eventId);
    }),

  // Reject Workshop - EVENT_OFFICE ONLY (Admins excluded)
  rejectWorkshop: eventsOfficeOnlyProcedure
    .input(
      z.object({
        eventId: z.string(),
        rejectionReason: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return eventService.rejectWorkshop(input.eventId, input.rejectionReason);
    }),

  // Workshop needs edits - EVENT_OFFICE ONLY (Admins excluded)
  workshopNeedsEdits: eventsOfficeOnlyProcedure
    .input(
      z.object({
        eventId: z.string(),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return eventService.editsNeededWorkshop(input.eventId);
    }),

  publishWorkshop: eventsOfficeProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return eventService.publishWorkshop(input.eventId);
    }),

  /**
   * Publish any event (generic)
   */
  publishEvent: eventsOfficeProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
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
      if (ctx.user!.role !== "PROFESSOR") {
        throw new Error("Only professors can create workshops");
      }

      // Set the professor name from the authenticated user
      const professorName = `${ctx.user!.firstName} ${ctx.user!.lastName}`;

      const workshop = await eventService.create(
        {
          ...input,
          type: "WORKSHOP",
          professorName, // Set the professor who created this workshop
        },
        { userId, role: ctx.user!.role.toString() }
      );

      // Requirement #39: Notify Events Office about new workshop submission
      await notificationService.notifyPendingWorkshop(
        String(workshop._id),
        workshop.name,
        professorName
      );

      return workshop;
    }),

  /**
   * Edit workshop - PROFESSOR only
   */
  editWorkshop: professorProcedure
    .input(UpdateWorkshopSchema)
    .mutation(async ({ input, ctx }) => {
      // Ensure the user is a professor
      if (ctx.user!.role !== "PROFESSOR") {
        throw new Error("Only professors can edit workshops");
      }

      return eventService.updateWorkshop(input);
    }),

  /**
   * Delete workshop - PROFESSOR only (only their own)
   */
  deleteWorkshop: professorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();

      // Verify ownership
      const event = await eventService.getEventById(input.id);
      const createdById =
        typeof event.createdBy === "object"
          ? event.createdBy.id
          : event.createdBy;

      if (createdById !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own workshops",
        });
      }

      if (event.type !== "WORKSHOP") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This endpoint is only for workshops",
        });
      }

      return eventService.delete(input.id, { userId });
    }),

  /**
   * Archive workshop - PROFESSOR only (only their own)
   */
  archiveWorkshop: professorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();

      // Verify ownership
      const event = await eventService.getEventById(input.id);
      const createdById =
        typeof event.createdBy === "object"
          ? event.createdBy.id
          : event.createdBy;

      if (createdById !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only archive your own workshops",
        });
      }

      if (event.type !== "WORKSHOP") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This endpoint is only for workshops",
        });
      }

      return eventService.archiveEvent(input.id);
    }),

  /**
   * Get workshops created by the logged-in professor
   */
  getMyWorkshops: professorProcedure.query(async ({ ctx }) => {
    const workshops = await eventService.findAll({
      professorName: ctx.user!.firstName + " " + ctx.user!.lastName,
      type: "WORKSHOP",
    });
    return workshops;
  }),

  whiteListUser: eventsOfficeOnlyProcedure
    .input(
      z.object({
        eventId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return eventService.whitelistUser(input);
    }),

  removeWhiteListUser: eventsOfficeOnlyProcedure
    .input(
      z.object({
        eventId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return eventService.removeWhitelistedUser(input);
    }),

  whitelistRole: eventsOfficeOnlyProcedure
    .input(
      z.object({
        eventId: z.string(),
        role: z.enum([
          "STUDENT",
          "STAFF",
          "TA",
          "PROFESSOR",
          "VENDOR",
          "EVENT_OFFICE",
          "ADMIN",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      return eventService.whitelistRole(input);
    }),

  removeWhitelistRole: eventsOfficeOnlyProcedure
    .input(
      z.object({
        eventId: z.string(),
        role: z.enum([
          "STUDENT",
          "STAFF",
          "TA",
          "PROFESSOR",
          "VENDOR",
          "ADMIN",
          "EVENT_OFFICE",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      return eventService.removeWhitelistedRole(input);
    }),

  getWhitelistUsers: eventsOfficeOnlyProcedure
    .input(
      z.object({
        eventId: z.string(),
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(100),
      })
    )
    .query(async ({ input }) => {
      const eventId = input.eventId;
      return eventService.getWhitelistedUsers({ eventId });
    }),

  /**
   * Search users for whitelisting - excludes already whitelisted users
   */
  searchUsersForWhitelist: eventsOfficeOnlyProcedure
    .input(
      z.object({
        eventId: z.string(),
        query: z.string(),
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(50),
      })
    )
    .query(async ({ input }) => {
      return eventService.searchUsersForWhitelist(input);
    }),

  getWhitelistRoles: eventsOfficeOnlyProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return eventService.getWhitelistedRoles(input);
    }),

  checkEventWhitelisted: publicProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return eventService.checkEventWhitelisted(input.eventId);
    }),

  checkUserWhitelisted: publicProcedure
    .input(
      z.object({
        eventId: z.string(),
        userId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return eventService.checkUserWhitelisted(input);
    }),

  checkRoleWhitelisted: publicProcedure
    .input(
      z.object({
        eventId: z.string(),
        role: z.enum([
          "STUDENT",
          "STAFF",
          "TA",
          "PROFESSOR",
          "VENDOR",
          "EVENT_OFFICE",
          "ADMIN",
        ]),
      })
    )
    .query(async ({ input }) => {
      return eventService.checkRoleWhitelisted(input);
    }),

  /**
   * Check if current user is allowed to access/register for a whitelisted event
   * Returns { allowed: boolean, reason?: string }
   */
  checkUserAllowedForEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      const userRole = ctx.user!.role;
      return eventService.isUserAllowedForEvent({
        eventId: input.eventId,
        userId,
        userRole,
      });
    }),

  /**
   * Favorite an event
   */
  addToFavoriteEvents: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      const favorite = await userService.favoriteEvent({
        userId,
        eventId: input.eventId,
      });
      return {
        success: true,
        message: "Successfully favorited event",
        favorite,
      };
    }),

  removeFromFavoriteEvents: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      await userService.removeFavoriteEvent({
        userId,
        eventId: input.eventId,
      });
    }),

  getMyFavorites: protectedProcedure
    .input(
      z
        .object({
          page: z.number().min(1).optional().default(1),
          limit: z.number().min(1).max(100).optional().default(100),
        })
        .optional()
        .default({ page: 1, limit: 100 })
    )
    .query(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      return eventService.getFavoriteEvents(userId, {
        page: input.page,
        limit: input.limit,
      });
    }),

  isFavorite: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      const isFavorite = await eventService.isFavorite(userId, input.eventId);
      return { isFavorite };
    }),

  toggleFavorite: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      const isFavorite = await eventService.isFavorite(userId, input.eventId);
      if (isFavorite) {
        await userService.removeFavoriteEvent({
          userId,
          eventId: input.eventId,
        });
        return {
          success: true,
          message: "Event removed from favorites",
          isFavorite: false,
        };
      } else {
        await userService.favoriteEvent({
          userId,
          eventId: input.eventId,
        });
        return {
          success: true,
          message: "Event added to favorites",
          isFavorite: true,
        };
      }
    }),

  /**
   * Export event registrations to Excel (Requirement #49)
   * Events Office/Admin can export registrations (except conferences)
   * Supports bulk export with specific registration IDs
   */
  exportRegistrations: eventsOfficeProcedure
    .input(
      z.object({
        eventId: z.string(),
        registrationIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const buffer = await exportService.exportRegistrationsToExcel(
        input.eventId,
        input.registrationIds
      );

      // Convert buffer to base64 for transmission
      const base64 = Buffer.from(buffer).toString('base64');

      return {
        data: base64,
        filename: `registrations-${input.eventId}-${Date.now()}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }),
};

// Export events router with all routes
export const eventsRouter = router(eventRoutes);
