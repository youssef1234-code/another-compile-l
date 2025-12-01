import {
  EventRepository,
  eventRepository,
} from "../repositories/event.repository";
import { registrationRepository } from "../repositories/registration.repository";
import { vendorApplicationRepository } from "../repositories/vendor-application.repository";
import { userRepository } from "../repositories/user.repository";
import { notificationService } from "./notification.service.js";
import { BaseService, type ServiceOptions } from "./base.service";
import { TRPCError } from "@trpc/server";
import type { IEvent } from "../models/event.model";
import type { FilterQuery } from "mongoose";
import {
  EventStatus,
  GymSessionType,
  UpdateWorkshopSchema,
  UserRole,
  type UpdateWorkshopInput,
} from "@event-manager/shared";
import { ServiceError } from "../errors/errors";
import type { IUser } from "../models/user.model";

/**
 * Service Layer for Events
 * Extends BaseService for common business logic
 * Implements business logic for event management
 * Design Pattern: Service Layer + Repository Pattern
 */
export class EventService extends BaseService<IEvent, EventRepository> {
  constructor(repository: EventRepository) {
    super(repository);
  }

  /**
   * Get entity name for error messages
   */
  protected getEntityName(): string {
    return "Event";
  }

  /**
   * Override findById to ensure non-null return
   */
  async findById(id: string, populate?: string | string[]): Promise<IEvent> {
    const event = await super.findById(id, populate);
    if (!event) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Event not found",
      });
    }
    return event;
  }

  /**
   * Override create to set appropriate status for events
   */
  async create(data: Partial<IEvent>, options?: any): Promise<IEvent> {
    // Set default status based on event type
    if (!data.status) {
      // Workshops need approval, start as DRAFT (unless created by EVENT_OFFICE)
      if (data.type === "WORKSHOP" && options?.role === "PROFESSOR") {
        data.status = "DRAFT";
      } else {
        // All other events (TRIP, BAZAAR, CONFERENCE, GYM_SESSION) default to PUBLISHED
        data.status = "PUBLISHED";
      }
    }

    return super.create(data, options);
  }

  /**
   * Validate before create
   * Business Rule: Check event date validations
   */
  protected async validateCreate(
    data: Partial<IEvent>,
    options?: ServiceOptions
  ): Promise<void> {
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Start date must be before end date",
      });
    }

    if (
      data.registrationDeadline &&
      data.startDate &&
      data.registrationDeadline > data.startDate
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Registration deadline must be before start date",
      });
    }

    if (data.capacity && data.capacity < 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Capacity must be a positive number",
      });
    }

    if (options?.role !== "PROFESSOR" && data.type === "WORKSHOP") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only professors can create workshops",
      });
    }
  }

  /**
   * Validate before update
   */
  protected async validateUpdate(
    _id: string,
    updateData: Partial<IEvent>,
    existing: IEvent
  ): Promise<void> {
    const startDate = updateData.startDate || existing.startDate;
    const endDate = updateData.endDate || existing.endDate;
    const registrationDeadline =
      updateData.registrationDeadline || existing.registrationDeadline;

    if (startDate && endDate && startDate > endDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Start date must be before end date",
      });
    }

    if (registrationDeadline && startDate && registrationDeadline > startDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Registration deadline must be before start date",
      });
    }

    // Capacity cannot be set below current number of participants
    if (updateData.capacity !== undefined) {
      const currentRegistrations = await registrationRepository.countActiveForCapacity(_id);
      if (updateData.capacity < currentRegistrations) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Capacity cannot be less than current registrations (${currentRegistrations}).`,
        });
      }
    }
  }

  /**
   * Validate before delete
   */
  protected async validateDelete(_id: string, existing: IEvent): Promise<void> {
    // Check if event has started
    if (existing.startDate < new Date()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot delete an event that has already started",
      });
    }

    // Check if there are any active registrations
    const registrationCount = await registrationRepository.countActiveForCapacity(_id);
    if (registrationCount > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cannot delete event with active registrations. There are ${registrationCount} registered participant(s).`,
      });
    }
  }

  /**
   * Get all events with advanced filters and pagination (Admin/EventsOffice)
   * Supports tablecn data table pattern with:
   * - Global search across title, description, professorName
   * - Multi-field sorting
   * - Simple faceted filters (advanced mode)
   * - Extended filters with operators (command mode)
   */
  async getAllEvents(data: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: Array<{ id: string; desc: boolean }>;
    filters?: Record<string, string[]>;
    extendedFilters?: Array<{
      id: string;
      value: string | string[];
      operator: string;
      variant: string;
      filterId: string;
    }>;
    joinOperator?: "and" | "or";
    includeArchived?: boolean;
  }): Promise<{
    events: any[];
    allEvents: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = data.page || 1;
    const limit = data.limit || 10;
    const skip = (page - 1) * limit;
    const includeArchived = data.includeArchived ?? false;

    // Build base filter - exclude archived or soft-deleted events by default unless requested
    let filter: any = {};

    if (!includeArchived) {
      filter.isArchived = false;
      filter.status = { $ne: "ARCHIVED" };
    }

    // Handle simple faceted filters from tablecn (advanced mode)
    if (data.filters) {
      // Type filter
      if (data.filters.type && data.filters.type.length > 0) {
        filter.type = { $in: data.filters.type };
      }

      // Status filter (allow ARCHIVED only when includeArchived is true)
      if (data.filters.status && data.filters.status.length > 0) {
        const allowedStatuses = includeArchived
          ? data.filters.status
          : data.filters.status.filter((status) => status !== "ARCHIVED");
        if (allowedStatuses.length > 0) {
          filter.status = { $in: allowedStatuses };
        }
      }

      // Location filter
      if (data.filters.location && data.filters.location.length > 0) {
        filter.location = { $in: data.filters.location };
      }

      // Faculty filter (for workshops)
      if (data.filters.faculty && data.filters.faculty.length > 0) {
        filter.faculty = { $in: data.filters.faculty };
      }

      // Start date filter (events starting from this date)
      if (data.filters.startDateFrom && data.filters.startDateFrom.length > 0) {
        filter.startDate = filter.startDate || {};
        filter.startDate.$gte = new Date(data.filters.startDateFrom[0]);
      }

      // Start date filter (events starting up to this date)
      if (data.filters.startDateTo && data.filters.startDateTo.length > 0) {
        filter.startDate = filter.startDate || {};
        filter.startDate.$lte = new Date(data.filters.startDateTo[0]);
      }

      // End date filter (events ending from this date)
      if (data.filters.endDateFrom && data.filters.endDateFrom.length > 0) {
        filter.endDate = filter.endDate || {};
        filter.endDate.$gte = new Date(data.filters.endDateFrom[0]);
      }

      // End date filter (events ending up to this date)
      if (data.filters.endDateTo && data.filters.endDateTo.length > 0) {
        filter.endDate = filter.endDate || {};
        filter.endDate.$lte = new Date(data.filters.endDateTo[0]);
      }
    }

    // Handle extended filters with operators (command mode)
    if (data.extendedFilters && data.extendedFilters.length > 0) {
      const extendedConditions: any[] = [];

      for (const extFilter of data.extendedFilters) {
        const field = extFilter.id;
        const operator = extFilter.operator;
        let value = extFilter.value;

        // Prevent consumers from reintroducing archived or soft-deleted records via filters (unless allowed)
        if (field === "isArchived" && !includeArchived) {
          continue;
        }

        if (field === "status" && !includeArchived) {
          if (operator === "eq" && value === "ARCHIVED") {
            continue;
          }

          if (
            (operator === "inArray" || operator === "notInArray") &&
            Array.isArray(value)
          ) {
            value = value.filter((status) => status !== "ARCHIVED");
            if (value.length === 0) {
              continue;
            }
          }
        }

        // Skip empty/invalid values
        if (operator !== "isEmpty" && operator !== "isNotEmpty") {
          if (Array.isArray(value) && value.length === 0) continue;
          if (typeof value === "string" && !value.trim()) continue;
        }

        const condition: any = {};

        switch (operator) {
          case "iLike":
            condition[field] = { $regex: value, $options: "i" };
            break;
          case "notILike":
            condition[field] = { $not: { $regex: value, $options: "i" } };
            break;
          case "eq":
            // Handle numbers for fields like price
            if (field === "price" || field === "capacity") {
              condition[field] = Number(value);
            } else {
              condition[field] = value;
            }
            break;
          case "ne":
            // Handle numbers for fields like price
            if (field === "price" || field === "capacity") {
              condition[field] = { $ne: Number(value) };
            } else {
              condition[field] = { $ne: value };
            }
            break;
          case "isEmpty":
            condition[field] = { $in: [null, "", undefined] };
            break;
          case "isNotEmpty":
            condition[field] = { $nin: [null, "", undefined], $exists: true };
            break;
          case "inArray":
            if (Array.isArray(value)) {
              condition[field] = { $in: value };
            }
            break;
          case "notInArray":
            if (Array.isArray(value)) {
              condition[field] = { $nin: value };
            }
            break;
          case "lt":
            // Check if it's a date field or numeric field
            if (field.includes("Date") || field.includes("date")) {
              condition[field] = { $lt: new Date(value as string) };
            } else {
              condition[field] = { $lt: Number(value) };
            }
            break;
          case "lte":
            // Check if it's a date field or numeric field
            if (field.includes("Date") || field.includes("date")) {
              condition[field] = { $lte: new Date(value as string) };
            } else {
              condition[field] = { $lte: Number(value) };
            }
            break;
          case "gt":
            // Check if it's a date field or numeric field
            if (field.includes("Date") || field.includes("date")) {
              condition[field] = { $gt: new Date(value as string) };
            } else {
              condition[field] = { $gt: Number(value) };
            }
            break;
          case "gte":
            // Check if it's a date field or numeric field
            if (field.includes("Date") || field.includes("date")) {
              condition[field] = { $gte: new Date(value as string) };
            } else {
              condition[field] = { $gte: Number(value) };
            }
            break;
          case "isBetween":
            if (Array.isArray(value) && value.length === 2) {
              condition[field] = {
                $gte: new Date(value[0]),
                $lte: new Date(value[1]),
              };
            }
            break;
        }

        if (Object.keys(condition).length > 0) {
          extendedConditions.push(condition);
        }
      }

      // Combine extended filters with AND or OR logic
      if (extendedConditions.length > 0) {
        const joinOp = data.joinOperator === "or" ? "$or" : "$and";

        if (filter[joinOp]) {
          filter[joinOp].push(...extendedConditions);
        } else {
          filter[joinOp] = extendedConditions;
        }
      }
    }

    // Handle global search - search across name, description, professorName
    // Also search in createdBy user's firstName/lastName for workshops
    if (data.search && data.search.trim()) {
      const searchRegex = { $regex: data.search.trim(), $options: "i" };

      // Find users whose first or last names match the search term
      const matchingUsers = await userRepository.findAll(
        {
          $or: [{ firstName: searchRegex }, { lastName: searchRegex }],
        } as any,
        {}
      );

      const matchingUserIds = matchingUsers.map((u: any) => u._id);

      const searchConditions: any[] = [
        { name: searchRegex },
        { description: searchRegex },
        { professorName: searchRegex },
      ];

      // Add condition for events created by users with matching names
      if (matchingUserIds.length > 0) {
        searchConditions.push({ createdBy: { $in: matchingUserIds } });
      }

      filter.$or = searchConditions;
    }

    // NOTE: Registration deadline filter removed to allow back office users
    // (Admin, Event Office, Professors) to see all events including:
    // - Pending workshops awaiting approval
    // - Events with past registration deadlines
    // - Draft events

    // Build multi-field sort
    const sort: any = {};
    if (data.sort && data.sort.length > 0) {
      data.sort.forEach((sortField) => {
        sort[sortField.id] = sortField.desc ? -1 : 1;
      });
    } else {
      // Default sort by start date descending
      sort.startDate = -1;
    }

    // Execute query
    const events = await this.repository.findAll(filter, {
      skip,
      limit,
      sort,
      populate: ["createdBy"],
    });

    const allEvents = await this.repository.findAll(filter, {
      sort,
      populate: ["createdBy"],
    });

    const total = await this.repository.count(filter);

    // Populate registeredCount for each event
    const formattedEvents = await Promise.all(
      events.map(async (event) => {
        const registeredCount = await registrationRepository.countActiveForCapacity((event._id as any).toString());

        // For BAZAAR events, populate vendors with their application details
        let vendorDetails = null;
        if (event.type === "BAZAAR") {
          // Get approved vendor applications for this event (regardless of vendors array)
          const vendorApplications = await vendorApplicationRepository.findAll(
            {
              bazaarId: (event._id as any).toString(),
              status: "APPROVED",
            } as any,
            {}
          );

          // Populate with user details
          if (vendorApplications.length > 0) {
            vendorDetails = await Promise.all(
              vendorApplications.map(async (app: any) => {
                const user = await userRepository.findById(
                  app.createdBy.toString()
                );
                return {
                  id: app._id.toString(),
                  companyName: app.companyName,
                  email: app.email,
                  boothSize: app.boothSize,
                  names: app.names || [],
                  emails: app.emails || [],
                  type: app.type,
                  userId: (user?._id as any)?.toString(),
                };
              })
            );
          }
        }



        // Calculate total sales
        const totalSales = registeredCount * (event.price || 0);

        return {
          ...this.formatEvent(event),
          registeredCount,
          totalSales,
          vendors: vendorDetails,
        };
      })
    );

    const formattedAllEvents = await Promise.all(
      allEvents.map(async (event) => {
        const registeredCount = await registrationRepository.countActiveForCapacity((event._id as any).toString());

        // For BAZAAR events, populate vendors with their application details
        let vendorDetails = null;
        if (event.type === "BAZAAR") {
          // Get approved vendor applications for this event (regardless of vendors array)
          const vendorApplications = await vendorApplicationRepository.findAll(
            {
              bazaarId: (event._id as any).toString(),
              status: "APPROVED",
            } as any,
            {}
          );

          // Populate with user details
          if (vendorApplications.length > 0) {
            vendorDetails = await Promise.all(
              vendorApplications.map(async (app: any) => {
                const user = await userRepository.findById(
                  app.createdBy.toString()
                );
                return {
                  id: app._id.toString(),
                  companyName: app.companyName,
                  email: app.email,
                  boothSize: app.boothSize,
                  names: app.names || [],
                  emails: app.emails || [],
                  type: app.type,
                  userId: (user?._id as any)?.toString(),
                };
              })
            );
          }
        }



        // Calculate total sales
        const totalSales = registeredCount * (event.price || 0);

        return {
          ...this.formatEvent(event),
          registeredCount,
          totalSales,
          vendors: vendorDetails,
        };
      })
    );

    if (data.sort?.[0]?.id === "totalSales" && data.sort?.[0]?.desc)
      formattedEvents.sort((a, b) => b.totalSales - a.totalSales)
    else if (data.sort?.[0]?.id === "totalSales" && !data.sort?.[0]?.desc)
      formattedEvents.sort((a, b) => a.totalSales - b.totalSales)
    else if (data.sort?.[0]?.id === "registeredCount" && data.sort?.[0]?.desc)
      formattedEvents.sort((a, b) => b.registeredCount - a.registeredCount)
    else if (data.sort?.[0]?.id === "registeredCount" && !data.sort?.[0]?.desc)
      formattedEvents.sort((a, b) => a.registeredCount - b.registeredCount)

    return {
      events: formattedEvents,
      allEvents: formattedAllEvents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all upcoming events with search and filters
   * Business Rule: Only show non-archived events by default
   */
  async getEvents(params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    location?: string;
    startDate?: Date;
    endDate?: Date;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{
    events: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    // Use advanced search from repository
    const { events, total } = await this.repository.advancedSearch({
      query: params.search,
      type: params.type,
      location: params.location,
      startDate: params.startDate,
      endDate: params.endDate,
      maxPrice: params.maxPrice,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      skip,
      limit,
    });

    // Populate registeredCount and vendors (for bazaars) for each event
    const formattedEvents = await Promise.all(
      events.map(async (event) => {
        const registeredCount = await registrationRepository.countActiveForCapacity((event._id as any).toString());
        // For BAZAAR events, include approved vendor applications
        let vendors = [];
        if (event.type === "BAZAAR") {
          const applications = await vendorApplicationRepository.findAll({
            bazaarId: (event._id as any).toString(),
            status: "APPROVED",
          } as any);

          // Populate vendor details for each application
          if (applications && applications.length > 0) {
            for (const app of applications) {
              const vendor: any = await userRepository.findById(
                (app.createdBy as any).toString()
              );
              if (vendor) {
                vendors.push({
                  id: vendor._id.toString(),
                  companyName: vendor.companyName || "N/A",
                  email: vendor.email,
                  boothSize: app.boothSize,
                });
              }
            }
          }
        }

        return {
          ...this.formatEvent(event),
          registeredCount,
          vendors,
        };
      })
    );

    return {
      events: formattedEvents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Search events by name or description
   * Business Rule: Case-insensitive search
   */
  async searchEvents(
    query: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    events: any[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const events = await this.repository.search(query, { skip, limit });
    const total = (await this.repository.search(query)).length;

    // Populate registeredCount for each event
    const formattedEvents = await Promise.all(
      events.map(async (event) => {
        const registeredCount = await registrationRepository.countActiveForCapacity((event._id as any).toString());
        return {
          ...this.formatEvent(event),
          registeredCount,
        };
      })
    );

    return {
      events: formattedEvents,
      total,
    };
  }

  /**
   * Get event by ID
   */
  async getEventById(id: string): Promise<any> {
    const event = await this.findById(id);
    const registeredCount = await registrationRepository.countActiveForCapacity(id);

    // For BAZAAR events, populate vendors with their application details
    let vendorDetails = null;
    if (event.type === "BAZAAR") {
      // Get approved vendor applications for this event (regardless of vendors array)
      const vendorApplications = await vendorApplicationRepository.findAll(
        {
          bazaarId: id,
          status: "APPROVED",
        } as any,
        {}
      );

      // Populate with user details
      if (vendorApplications.length > 0) {
        vendorDetails = await Promise.all(
          vendorApplications.map(async (app: any) => {
            const user = await userRepository.findById(
              app.createdBy.toString()
            );
            return {
              id: app._id.toString(),
              companyName: app.companyName,
              email: app.email,
              boothSize: app.boothSize,
              names: app.names || [],
              emails: app.emails || [],
              type: app.type,
              userId: (user?._id as any)?.toString(),
            };
          })
        );
      }
    }

    return {
      ...this.formatEvent(event),
      registeredCount,
      vendors: vendorDetails,
    };
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(
    options: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    events: any[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const events = await this.repository.findUpcoming({ skip, limit });
    const total = await this.repository.count({
      isArchived: false,
      startDate: { $gte: new Date() },
    } as FilterQuery<IEvent>);

    // Populate registeredCount for each event
    const formattedEvents = await Promise.all(
      events.map(async (event) => {
        const registeredCount = await registrationRepository.countActiveForCapacity((event._id as any).toString());
        return {
          ...this.formatEvent(event),
          registeredCount,
        };
      })
    );

    return {
      events: formattedEvents,
      total,
    };
  }

  /**
   * Archive event (soft delete alternative)
   */
  async archiveEvent(id: string): Promise<IEvent> {
    const event = await this.repository.archive(id);
    if (!event) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Event not found",
      });
    }
    return event;
  }

  /**
   * Get event statistics (for admin dashboard)
   * @param createdBy - Optional user ID to filter by creator (for professors)
   */
  async getStatistics(
    createdBy?: string,
    options?: { excludeTypes?: string[] }
  ): Promise<{
    total: number;
    upcoming: number;
    past: number;
    byType: Record<string, number>;
  }> {
    return this.repository.getStatistics(createdBy, options);
  }

  /**
   * Get events by type
   */
  async getEventsByType(
    type: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ events: any[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const events = await this.repository.findByType(type, { skip, limit });
    const total = await this.repository.count({
      type,
      isArchived: false,
    } as FilterQuery<IEvent>);

    // Populate registeredCount for each event
    const formattedEvents = await Promise.all(
      events.map(async (event) => {
        const registeredCount = await registrationRepository.countActiveForCapacity((event._id as any).toString());
        return {
          ...this.formatEvent(event),
          registeredCount,
        };
      })
    );

    return {
      events: formattedEvents,
      total,
    };
  }

  /**
   * Get events by location
   */
  async getEventsByLocation(
    location: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ events: any[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const events = await this.repository.findByLocation(location, {
      skip,
      limit,
    });
    const total = await this.repository.count({
      location,
      isArchived: false,
    } as FilterQuery<IEvent>);

    // Populate registeredCount for each event
    const formattedEvents = await Promise.all(
      events.map(async (event) => {
        const registeredCount = await registrationRepository.countActiveForCapacity((event._id as any).toString());
        return {
          ...this.formatEvent(event),
          registeredCount,
        };
      })
    );

    return {
      events: formattedEvents,
      total,
    };
  }

  /**
   * Format event for API response
   * Design Pattern: Presenter Pattern
   */
  private formatEvent(event: IEvent): any {
    return {
      id: (event._id as any).toString(),
      name: event.name,
      description: event.description,
      type: event.type,
      location: event.location,
      locationDetails: event.locationDetails,
      startDate: event.startDate,
      endDate: event.endDate,
      registrationDeadline: event.registrationDeadline,
      capacity: event.capacity,
      registeredCount: event.registeredCount,
      price: event.price,
      status: event.status,
      rejectionReason: event.rejectionReason,
      isActive: event.isActive,
      isArchived: event.isArchived,
      images: event.images || [], // Include images array
      // Workshop-specific fields
      professorName: event.professorName,
      professors: event.professors, // Array of professor names
      faculty: event.faculty,
      fundingSource: event.fundingSource,
      fullAgenda: event.fullAgenda,
      requiredBudget: event.requiredBudget,
      extraResources: event.extraResources,
      requirements: event.requirements,
      // Conference-specific fields
      websiteUrl: event.websiteUrl,
      // Gym session specific fields
      sessionType: event.sessionType,
      duration: event.duration,
      createdBy: event.createdBy
        ? {
          id:
            (event.createdBy as any)._id?.toString() ||
            (event.createdBy as any).toString(),
          firstName: (event.createdBy as any).firstName,
          lastName: (event.createdBy as any).lastName,
          email: (event.createdBy as any).email,
          role: (event.createdBy as any).role,
        }
        : null,
      vendors: event.vendors
        ? (event.vendors as any[]).map((vendor: any) => ({
          id: vendor._id?.toString() || vendor.toString(),
          companyName: vendor.companyName,
          email: vendor.email,
        }))
        : [],
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  /**
   * APPROVAL WORKSHOP METHOD
   */
  async approveWorkshop(workshopId: string) {
    // Logic to approve the workshop - sets status to PUBLISHED
    const workshop = await eventRepository.findById(workshopId);
    if (!workshop) {
      throw new ServiceError("NOT_FOUND", "Workshop not found", 404);
    }
    if (workshop.type !== "WORKSHOP") {
      throw new ServiceError("BAD_REQUEST", "Event is not a workshop", 400);
    }
    if (
      workshop.status !== "PENDING_APPROVAL" &&
      workshop.status !== "NEEDS_EDITS"
    ) {
      throw new ServiceError(
        "BAD_REQUEST",
        "Workshop is not pending approval or needs edits",
        400
      );
    }
    // Approve = Publish the workshop so it's visible to students
    const newWorkshop = await eventRepository.update(workshopId, {
      status: "PUBLISHED",
    });

    // Requirement #44: Notify professor about workshop acceptance
    if (workshop.createdBy) {
      await notificationService.notifyWorkshopStatus(
        String(workshop.createdBy),
        workshopId,
        workshop.name,
        'ACCEPTED'
      );
    }

    // Requirement #57: Notify all users about new event
    await notificationService.notifyNewEvent(
      workshopId,
      workshop.name,
      'Workshop'
    );

    return newWorkshop;
  }

  async rejectWorkshop(workshopId: string, reason: string) {
    // Logic to reject the workshop
    const workshop = await eventRepository.findById(workshopId);
    if (!workshop) {
      throw new ServiceError("NOT_FOUND", "Workshop not found", 404);
    }
    if (!reason || reason.trim() === "") {
      throw new ServiceError(
        "BAD_REQUEST",
        "Rejection reason must be provided",
        400
      );
    }
    if (workshop.type !== "WORKSHOP") {
      throw new ServiceError("BAD_REQUEST", "Event is not a workshop", 400);
    }
    if (
      workshop.status !== "PENDING_APPROVAL" &&
      workshop.status !== "NEEDS_EDITS"
    ) {
      throw new ServiceError(
        "BAD_REQUEST",
        "Workshop is not pending approval or needs edits",
        400
      );
    }
    const newWorkshop = await eventRepository.update(workshopId, {
      status: "REJECTED",
      rejectionReason: reason,
    });

    // Requirement #44: Notify professor about workshop rejection
    if (workshop.createdBy) {
      await notificationService.notifyWorkshopStatus(
        String(workshop.createdBy),
        workshopId,
        workshop.name,
        'REJECTED',
        reason
      );
    }

    return newWorkshop;
  }

  async editsNeededWorkshop(workshopId: string) {
    // Logic to request edits for the workshop
    const workshop = await eventRepository.findById(workshopId);
    if (!workshop) {
      throw new ServiceError("NOT_FOUND", "Workshop not found", 404);
    }
    if (workshop.type !== "WORKSHOP") {
      throw new ServiceError("BAD_REQUEST", "Event is not a workshop", 400);
    }
    if (workshop.status !== "PENDING_APPROVAL") {
      throw new ServiceError(
        "BAD_REQUEST",
        "Workshop is not pending approval",
        400
      );
    }
    const newWorkshop = await eventRepository.update(workshopId, {
      status: "NEEDS_EDITS",
    });
    return newWorkshop;
  }

  async publishWorkshop(workshopId: string) {
    // Logic to publish the workshop
    const workshop = await eventRepository.findById(workshopId);
    if (!workshop) {
      throw new ServiceError("NOT_FOUND", "Workshop not found", 404);
    }
    if (workshop.type !== "WORKSHOP") {
      throw new ServiceError("BAD_REQUEST", "Event is not a workshop", 400);
    }
    if (workshop.status !== "APPROVED") {
      throw new ServiceError(
        "BAD_REQUEST",
        "Workshop must be approved before publishing",
        400
      );
    }
    const newWorkshop = await eventRepository.update(workshopId, {
      status: "PUBLISHED",
    });
    return newWorkshop;
  }

  /**
   * Publish any event (generic method)
   */
  async publishEvent(eventId: string) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new ServiceError("NOT_FOUND", "Event not found", 404);
    }

    // Only workshops need approval before publishing
    if (event.type === "WORKSHOP" && event.status !== "APPROVED") {
      throw new ServiceError(
        "BAD_REQUEST",
        "Workshop must be approved before publishing",
        400
      );
    }

    // Update status to published
    const updatedEvent = await eventRepository.update(eventId, {
      status: "PUBLISHED",
    });

    // Requirement #57: Notify all users about new event
    await notificationService.notifyNewEvent(
      eventId,
      event.name,
      event.type
    );

    return updatedEvent;
  }

  /**
   * Create a new gym session with overlap validation
   */

  async createGymSession(
    data: Partial<IEvent>,
    options?: { userId?: string }
  ): Promise<IEvent> {
    if (data.type !== "GYM_SESSION") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Event type must be GYM_SESSION",
      });
    }
    if (
      !data.sessionType ||
      !data.startDate ||
      !data.capacity ||
      !data.duration
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "sessionType, startDate, capacity, and duration are required",
      });
    }

    const start = new Date(data.startDate);
    const duration = data.duration!;
    if (duration <= 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Duration must be positive",
      });
    }
    const end = new Date(start.getTime() + duration * 60_000);

    // overlap guard (no excludeId on create)
    const clash = await this.repository.hasGymOverlap(start, end);
    if (clash) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Session overlaps an existing one",
      });
    }

    return this.create(
      {
        ...data, // Includes: name, description, sessionType, capacity, duration, status
        type: "GYM_SESSION",
        startDate: start,
        status: data.status || "PUBLISHED",
        endDate: end,
        location: data.location ?? "ON_CAMPUS",
        locationDetails: data.locationDetails ?? "Gym",
      } as any,
      options
    );
  }

  /**
   * Update gym session
   */
  async updateGymSession(
    id: string,
    patch: {
      startDate?: Date;
      duration?: number;
      capacity?: number;
      status?: EventStatus;
      sessionType?: GymSessionType;
    },
    options?: ServiceOptions
  ): Promise<IEvent> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
    }
    if (existing.type !== "GYM_SESSION") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Not a gym session",
      });
    }

    // Enforce capacity lower bound for gym sessions
    if (patch.capacity !== undefined) {
      const currentRegistrations = await registrationRepository.countActiveForCapacity(id);
      if (patch.capacity < currentRegistrations) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Capacity cannot be less than current registrations (${currentRegistrations}).`,
        });
      }
    }

    // Compute next schedule
    const nextStart = patch.startDate ?? existing.startDate;
    const nextDuration = patch.duration ?? (existing as any).duration ?? 60;
    if (nextDuration <= 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Duration must be positive",
      });
    }
    const nextEnd = new Date(nextStart.getTime() + nextDuration * 60_000);

    // Only run overlap check if time window changes OR status becomes published
    const timeWindowChanged =
      (patch.startDate && +patch.startDate !== +existing.startDate) ||
      (patch.duration && patch.duration !== (existing as any).duration);

    const willBePublished = (patch.status ?? existing.status) === "PUBLISHED";

    if (timeWindowChanged || willBePublished) {
      // exclude current _id to avoid "overlaps with itself"
      const clash = await this.repository.hasGymOverlap(nextStart, nextEnd, id);
      if (clash) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Session overlaps an existing one",
        });
      }
    }

    // Track if this is a cancellation or modification for notification
    const isCancellation = patch.status === 'CANCELLED';
    const isModification = timeWindowChanged && !isCancellation;

    const updated = await this.repository.update(
      id,
      {
        startDate: nextStart,
        endDate: nextEnd,
        ...(patch.duration !== undefined ? { duration: nextDuration } : {}),
        ...(patch.capacity !== undefined ? { capacity: patch.capacity } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.sessionType !== undefined
          ? { sessionType: patch.sessionType }
          : {}),
      },
      options
    );

    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Update failed" });
    }

    // Requirement #87: Notify registered users about gym session changes
    if (isCancellation || isModification) {
      const registrations = await registrationRepository.findAll(
        { event: id, status: { $in: ['CONFIRMED', 'PENDING'] } } as any,
        {}
      );

      if (registrations.length > 0) {
        const userIds = registrations.map((r: any) => String(r.user));
        const updateType = isCancellation ? 'CANCELLED' : 'EDITED';
        const details = isModification
          ? `Time changed to ${nextStart.toLocaleString()}`
          : undefined;

        await notificationService.notifyGymSessionUpdate(
          userIds,
          id,
          existing.name,
          updateType,
          details
        );
      }
    }

    return updated;
  }

  /**
   * Update workshop
   */
  async updateWorkshop(data: UpdateWorkshopInput): Promise<IEvent> {
    const validation = UpdateWorkshopSchema.safeParse(data);
    if (!validation.success) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid workshop update data",
        cause: validation.error,
      });
    }
    const { id, ...updateData } = validation.data;

    // Find existing event
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Workshop not found" });
    }
    if (existing.type !== "WORKSHOP") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Event is not a workshop",
      });
    }

    // Capacity cannot be set below current number of participants
    if ((updateData as Partial<IEvent>).capacity !== undefined) {
      const currentRegistrations = await registrationRepository.countActiveForCapacity(id);
      if (
        ((updateData as Partial<IEvent>).capacity as number) <
        currentRegistrations
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Capacity cannot be less than current registrations (${currentRegistrations}).`,
        });
      }
    }

    // Update workshop
    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Update failed" });
    }
    return updated;
  }

  /**
   * Get favorite events for a user
   */
  async getFavoriteEvents(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
    }
  ) {
    return userRepository.getFavoriteEvents(userId, options);
  }


  async whitelistUser(input: {
    eventId: string;
    userId: string;
  }): Promise<void> {
    const { eventId, userId } = input;
    const event = await this.repository.findById(eventId);
    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
    }
    if (!event.whitelistedUsers) {
      event.whitelistedUsers = [];
    }

    await eventRepository.whitelistUser(userId, eventId);
  }

  async removeWhitelistedUser(input: {
    eventId: string;
    userId: string;
  }): Promise<void> {
    const { eventId, userId } = input;
    const event = await this.repository.findById(eventId);
    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
    }
    await eventRepository.removeWhitelistedUser(userId, eventId);
  }


  async whitelistRole(input: {
    eventId: string;
    role: UserRole;
  }): Promise<void> {
    const { eventId, role } = input;
    const event = await this.repository.findById(eventId);
    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
    }
    await eventRepository.whitelistRole(role, eventId);
  }


  async removeWhitelistedRole(input: {
    eventId: string;
    role: UserRole;
  }): Promise<void> {
    const { eventId, role } = input;
    const event = await this.repository.findById(eventId);
    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
    }
    await eventRepository.removeWhitelistedRole(role, eventId);
  }

  async checkRoleWhitelisted(data: {
    eventId: string;
    role: UserRole;
  }): Promise<boolean> {
    const event = await this.repository.findById(data.eventId);
    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
    }
    return event.whitelistedRoles?.includes(data.role) ?? false;
  }

  async getWhitelistedUsers(input: { eventId: string }): Promise<IUser[]> {
    const event = await this.repository.findById(input.eventId);
    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
    }
    if (!event.whitelistedUsers) {
      return [];
    }
    // turn event.whitelistedUsers to string array
    const userIds = event.whitelistedUsers.map((id) => id.toString());
    return userRepository.findByIds(userIds);
  }

  async checkEventWhitelisted(eventId: string): Promise<boolean> {
    const event = await this.repository.findById(eventId);
    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
    }
    return (event.whitelistedUsers?.length ?? 0) > 0;
  }

  async checkUserWhitelisted(data: {
    eventId: string;
    userId: string;
  }): Promise<boolean> {
    const event = await this.repository.findById(data.eventId);
    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
    }
    return (
      event.whitelistedUsers?.some((id) => id.toString() === data.userId) ??
      false
    );
  }

  async getWhitelistedRoles(input: { eventId: string }): Promise<UserRole[]> {
    const event = await this.repository.findById(input.eventId);
    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
    }
    return (event.whitelistedRoles ?? []) as UserRole[];
  }

  /**
   * Search users for whitelisting purposes
   * Excludes users that are already whitelisted for the event
   */
  async searchUsersForWhitelist(input: {
    eventId: string;
    query: string;
    page?: number;
    limit?: number;
  }): Promise<{
    users: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { eventId, query } = input;
    const page = input.page || 1;
    const limit = input.limit || 50;
    const skip = (page - 1) * limit;

    // Get the event to find whitelisted users
    const event = await this.repository.findById(eventId);
    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
    }

    // Get whitelisted user IDs
    const whitelistedIds = (event.whitelistedUsers || []).map((id) => id.toString());

    // Search users and exclude whitelisted ones
    const allUsers = await userRepository.search(query, { skip: 0, limit: 1000 });
    const filteredUsers = allUsers.filter(
      (user) => !whitelistedIds.includes((user._id as any).toString())
    );

    const total = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice(skip, skip + limit);

    const formattedUsers = paginatedUsers.map((user) => ({
      id: (user._id as any).toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyName: user.companyName,
    }));

    return {
      users: formattedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async isFavorite(userId: string, eventId: string) {
    return userRepository.isFavorite(userId, eventId);
  }
}


// Singleton instance
export const eventService = new EventService(eventRepository);
