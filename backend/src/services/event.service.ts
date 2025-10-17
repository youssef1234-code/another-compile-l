import { EventRepository, eventRepository } from '../repositories/event.repository';
import { registrationRepository } from '../repositories/registration.repository';
import { BaseService, type ServiceOptions } from './base.service';
import { TRPCError } from '@trpc/server';
import type { IEvent } from '../models/event.model';
import type { FilterQuery } from 'mongoose';
import { EventStatus, GymSessionType, UpdateWorkshopSchema, type UpdateWorkshopInput } from '@event-manager/shared';
import { ServiceError } from '../errors/errors';

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
    return 'Event';
  }

  /**
   * Override findById to ensure non-null return
   */
  async findById(id: string, populate?: string | string[]): Promise<IEvent> {
    const event = await super.findById(id, populate);
    if (!event) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Event not found'
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
      if (data.type === 'WORKSHOP' && options?.role === 'PROFESSOR') {
        data.status = 'DRAFT';
      } else {
        // All other events (TRIP, BAZAAR, CONFERENCE, GYM_SESSION) default to PUBLISHED
        data.status = 'PUBLISHED';
      }
    }
    
    return super.create(data, options);
  }

  /**
   * Validate before create
   * Business Rule: Check event date validations
   */
  protected async validateCreate(data: Partial<IEvent>, options?: ServiceOptions): Promise<void> {
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Start date must be before end date'
      });
    }

    if (data.registrationDeadline && data.startDate && data.registrationDeadline > data.startDate) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Registration deadline must be before start date'
      });
    }

    if (data.capacity && data.capacity < 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Capacity must be a positive number'
      });
    }

    if ( options?.role !== 'PROFESSOR' && data.type === 'WORKSHOP') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only professors can create workshops'
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
    const registrationDeadline = updateData.registrationDeadline || existing.registrationDeadline;

    if (startDate && endDate && startDate > endDate) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Start date must be before end date'
      });
    }

    if (registrationDeadline && startDate && registrationDeadline > startDate) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Registration deadline must be before start date'
      });
    }
  }

  /**
   * Validate before delete
   */
  protected async validateDelete(_id: string, existing: IEvent): Promise<void> {
    // Check if event has started
    if (existing.startDate < new Date()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot delete an event that has already started'
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
    joinOperator?: 'and' | 'or';
  }): Promise<{
    events: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = data.page || 1;
    const limit = data.limit || 10;
    const skip = (page - 1) * limit;

    // Build base filter - exclude archived or soft-deleted events by default
    const filter: any = {
      isArchived: false,
      status: { $ne: 'ARCHIVED' },
    };

    // Handle simple faceted filters from tablecn (advanced mode)
    if (data.filters) {
      // Type filter
      if (data.filters.type && data.filters.type.length > 0) {
        filter.type = { $in: data.filters.type };
      }

      // Status filter (exclude ARCHIVED even if requested)
      if (data.filters.status && data.filters.status.length > 0) {
        const allowedStatuses = data.filters.status.filter((status) => status !== 'ARCHIVED');
        if (allowedStatuses.length > 0) {
          filter.status = { $in: allowedStatuses };
        }
      }

      // Location filter
      if (data.filters.location && data.filters.location.length > 0) {
        filter.location = { $in: data.filters.location };
      }
    }

    // Handle extended filters with operators (command mode)
    if (data.extendedFilters && data.extendedFilters.length > 0) {
      const extendedConditions: any[] = [];

      for (const extFilter of data.extendedFilters) {
        const field = extFilter.id;
        const operator = extFilter.operator;
        let value = extFilter.value;

        // Prevent consumers from reintroducing archived or soft-deleted records via filters
        if (field === 'isArchived') {
          continue;
        }

        if (field === 'status') {
          if (operator === 'eq' && value === 'ARCHIVED') {
            continue;
          }

          if ((operator === 'inArray' || operator === 'notInArray') && Array.isArray(value)) {
            value = value.filter((status) => status !== 'ARCHIVED');
            if (value.length === 0) {
              continue;
            }
          }
        }

        // Skip empty/invalid values
        if (operator !== 'isEmpty' && operator !== 'isNotEmpty') {
          if (Array.isArray(value) && value.length === 0) continue;
          if (typeof value === 'string' && !value.trim()) continue;
        }

        const condition: any = {};

        switch (operator) {
          case 'iLike':
            condition[field] = { $regex: value, $options: 'i' };
            break;
          case 'notILike':
            condition[field] = { $not: { $regex: value, $options: 'i' } };
            break;
          case 'eq':
            condition[field] = value;
            break;
          case 'ne':
            condition[field] = { $ne: value };
            break;
          case 'isEmpty':
            condition[field] = { $in: [null, '', undefined] };
            break;
          case 'isNotEmpty':
            condition[field] = { $nin: [null, '', undefined], $exists: true };
            break;
          case 'inArray':
            if (Array.isArray(value)) {
              condition[field] = { $in: value };
            }
            break;
          case 'notInArray':
            if (Array.isArray(value)) {
              condition[field] = { $nin: value };
            }
            break;
          case 'lt':
            condition[field] = { $lt: new Date(value as string) };
            break;
          case 'lte':
            condition[field] = { $lte: new Date(value as string) };
            break;
          case 'gt':
            condition[field] = { $gt: new Date(value as string) };
            break;
          case 'gte':
            condition[field] = { $gte: new Date(value as string) };
            break;
          case 'isBetween':
            if (Array.isArray(value) && value.length === 2) {
              condition[field] = { $gte: new Date(value[0]), $lte: new Date(value[1]) };
            }
            break;
        }

        if (Object.keys(condition).length > 0) {
          extendedConditions.push(condition);
        }
      }

      // Combine extended filters with AND or OR logic
      if (extendedConditions.length > 0) {
        const joinOp = data.joinOperator === 'or' ? '$or' : '$and';
        
        if (filter[joinOp]) {
          filter[joinOp].push(...extendedConditions);
        } else {
          filter[joinOp] = extendedConditions;
        }
      }
    }

    // Handle global search - search across name, description, professorName
    if (data.search && data.search.trim()) {
      const searchRegex = { $regex: data.search.trim(), $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { professorName: searchRegex },
      ];
    }

    // Build multi-field sort
    const sort: any = {};
    if (data.sort && data.sort.length > 0) {
      data.sort.forEach(sortField => {
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
      populate: ['createdBy']
    });

    const total = await this.repository.count(filter);

    // Populate registeredCount for each event
    const formattedEvents = await Promise.all(
      events.map(async (event) => {
        const registeredCount = await registrationRepository.countByEvent((event._id as any).toString());
        return {
          ...this.formatEvent(event),
          registeredCount,
        };
      })
    );

    return {
      events: formattedEvents,
      total,
      page,
      totalPages: Math.ceil(total / limit)
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
    sortOrder?: 'asc' | 'desc';
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
      limit
    });

    // Populate registeredCount for each event
    const formattedEvents = await Promise.all(
      events.map(async (event) => {
        const registeredCount = await registrationRepository.countByEvent((event._id as any).toString());
        return {
          ...this.formatEvent(event),
          registeredCount,
        };
      })
    );

    return {
      events: formattedEvents,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Search events by name or description
   * Business Rule: Case-insensitive search
   */
  async searchEvents(query: string, options: {
    page?: number;
    limit?: number;
  } = {}): Promise<{
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
        const registeredCount = await registrationRepository.countByEvent((event._id as any).toString());
        return {
          ...this.formatEvent(event),
          registeredCount,
        };
      })
    );

    return {
      events: formattedEvents,
      total
    };
  }

  /**
   * Get event by ID
   */
  async getEventById(id: string): Promise<any> {
    const event = await this.findById(id);
    const registeredCount = await registrationRepository.countByEvent(id);
    return {
      ...this.formatEvent(event),
      registeredCount,
    };
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(options: {
    page?: number;
    limit?: number;
  } = {}): Promise<{
    events: any[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const events = await this.repository.findUpcoming({ skip, limit });
    const total = await this.repository.count({
      isArchived: false,
      startDate: { $gte: new Date() }
    } as FilterQuery<IEvent>);

    // Populate registeredCount for each event
    const formattedEvents = await Promise.all(
      events.map(async (event) => {
        const registeredCount = await registrationRepository.countByEvent((event._id as any).toString());
        return {
          ...this.formatEvent(event),
          registeredCount,
        };
      })
    );

    return {
      events: formattedEvents,
      total
    };
  }

  /**
   * Archive event (soft delete alternative)
   */
  async archiveEvent(id: string): Promise<IEvent> {
    const event = await this.repository.archive(id);
    if (!event) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Event not found'
      });
    }
    return event;
  }

  /**
   * Get event statistics (for admin dashboard)
   */
  async getStatistics(): Promise<{
    total: number;
    upcoming: number;
    past: number;
    byType: Record<string, number>;
  }> {
    return this.repository.getStatistics();
  }

  /**
   * Get events by type
   */
  async getEventsByType(type: string, options: {
    page?: number;
    limit?: number;
  } = {}): Promise<{ events: any[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const events = await this.repository.findByType(type, { skip, limit });
    const total = await this.repository.count({ type, isArchived: false } as FilterQuery<IEvent>);

    // Populate registeredCount for each event
    const formattedEvents = await Promise.all(
      events.map(async (event) => {
        const registeredCount = await registrationRepository.countByEvent((event._id as any).toString());
        return {
          ...this.formatEvent(event),
          registeredCount,
        };
      })
    );

    return {
      events: formattedEvents,
      total
    };
  }

  /**
   * Get events by location
   */
  async getEventsByLocation(location: string, options: {
    page?: number;
    limit?: number;
  } = {}): Promise<{ events: any[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const events = await this.repository.findByLocation(location, { skip, limit });
    const total = await this.repository.count({ location, isArchived: false } as FilterQuery<IEvent>);

    // Populate registeredCount for each event
    const formattedEvents = await Promise.all(
      events.map(async (event) => {
        const registeredCount = await registrationRepository.countByEvent((event._id as any).toString());
        return {
          ...this.formatEvent(event),
          registeredCount,
        };
      })
    );

    return {
      events: formattedEvents,
      total
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
      isArchived: event.isArchived,
      professorName: event.professorName,
      faculty: event.faculty,
      fundingSource: event.fundingSource,
      images: event.images || [], // Include images array
      createdBy: event.createdBy ? {
        id: (event.createdBy as any)._id?.toString() || (event.createdBy as any).toString(),
        firstName: (event.createdBy as any).firstName,
        lastName: (event.createdBy as any).lastName,
        email: (event.createdBy as any).email,
        role: (event.createdBy as any).role
      } : null,
      vendors: event.vendors ? (event.vendors as any[]).map((vendor: any) => ({
        id: vendor._id?.toString() || vendor.toString(),
        companyName: vendor.companyName,
        email: vendor.email
      })) : [],
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    };
  }

  /**
   * APPROVAL WORKSHOP METHOD
   */
  async approveWorkshop(workshopId: string) {
      // Logic to approve the workshop
      const workshop = await eventRepository.findById(workshopId);
      if (!workshop) {
        throw new ServiceError("NOT_FOUND", "Workshop not found", 404);
      }
      if (workshop.type !== "WORKSHOP") {
        throw new ServiceError("BAD_REQUEST", "Event is not a workshop", 400);
      }
      if (workshop.status !== "PENDING_APPROVAL") {
        throw new ServiceError("BAD_REQUEST", "Workshop is not pending approval", 400);
      }
      const newWorkshop = await eventRepository.update(workshopId, { status: "APPROVED" });
      return newWorkshop;
    }

    async rejectWorkshop(workshopId: string) {
      // Logic to reject the workshop
      const workshop = await eventRepository.findById(workshopId);
      if (!workshop) {
        throw new ServiceError("NOT_FOUND", "Workshop not found", 404);
      }
      if (workshop.type !== "WORKSHOP") {
        throw new ServiceError("BAD_REQUEST", "Event is not a workshop", 400);
      }
      if (workshop.status !== "PENDING_APPROVAL") {
        throw new ServiceError("BAD_REQUEST", "Workshop is not pending approval", 400);
      }
      const newWorkshop = await eventRepository.update(workshopId, { status: "REJECTED" });
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
        throw new ServiceError("BAD_REQUEST", "Workshop is not pending approval", 400);
      }
      const newWorkshop = await eventRepository.update(workshopId, { status: "NEEDS_EDITS" });
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
        throw new ServiceError("BAD_REQUEST", "Workshop must be approved before publishing", 400);
      }
      const newWorkshop = await eventRepository.update(workshopId, { status: "PUBLISHED" });
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
        throw new ServiceError("BAD_REQUEST", "Workshop must be approved before publishing", 400);
      }
      
      // Update status to published
      const updatedEvent = await eventRepository.update(eventId, { status: "PUBLISHED" });
      return updatedEvent;
    }



  /**
   * Create a new gym session with overlap validation
   */
  
async createGymSession(
  data: Partial<IEvent>,
  options?: { userId?: string }
): Promise<IEvent> {
  if (data.type !== 'GYM_SESSION') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Event type must be GYM_SESSION' });
  }
  if (!data.sessionType || !data.startDate || !data.capacity || !data.duration) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'sessionType, startDate, capacity, and duration are required',
    });
  }

  const start = new Date(data.startDate);
  const duration = data.duration!;
  if (duration <= 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Duration must be positive' });
  }
  const end = new Date(start.getTime() + duration * 60_000);

  // overlap guard (no excludeId on create)
  const clash = await this.repository.hasGymOverlap(start, end);
  if (clash) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Session overlaps an existing one' });
  }

  return this.create(
    {
      ...data,
      type: 'GYM_SESSION',
      startDate: start,
      endDate: end,
      location: data.location ?? 'Gym',
    } as any,
    options
  );
}


  
/**
 * Update a gym session (allowed fields: startDate, duration)
 */
// backend/src/services/event.service.ts
async updateGymSession(
  id: string,
  patch: {
    startDate?: Date;
    duration?: number;
    capacity?: number;
    status?: EventStatus;
    sessionType?: GymSessionType;
  },
  options?: { userId?: string }
): Promise<IEvent> {

  if (!patch.capacity && !patch.sessionType && !patch.startDate && !patch.duration && !patch.status) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'You need to update something' });
  }

  const existing = await this.repository.findById(id);
  if (!existing) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
  }
  if (existing.type !== 'GYM_SESSION') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not a gym session' });
  }

  // Compute next schedule
  const nextStart = patch.startDate ?? existing.startDate;
  const nextDuration = patch.duration ?? (existing as any).duration ?? 60;
  if (nextDuration <= 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Duration must be positive' });
  }
  const nextEnd = new Date(nextStart.getTime() + nextDuration * 60_000);

  // Only run overlap check if time window changes OR status becomes published (your rule)
  const timeWindowChanged =
    (patch.startDate && +patch.startDate !== +existing.startDate) ||
    (patch.duration && patch.duration !== (existing as any).duration);

  const willBePublished =
    (patch.status ?? existing.status) === 'PUBLISHED';

  if (timeWindowChanged || willBePublished) {
    // exclude current _id to avoid "overlaps with itself"
    const clash = await this.repository.hasGymOverlap(nextStart, nextEnd, id);
    if (clash) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Session overlaps an existing one' });
    }
  }

  const updated = await this.repository.update(
    id,
    {
      startDate: nextStart,
      endDate: nextEnd,
      ...(patch.duration !== undefined ? { duration: nextDuration } : {}),
      ...(patch.capacity !== undefined ? { capacity: patch.capacity } : {}),
      ...(patch.status   !== undefined ? { status: patch.status } : {}),
      ...(patch.sessionType !== undefined ? { sessionType: patch.sessionType } : {}),
    },
    options
  );

  return updated as IEvent;
}
/**
 * Update a workshop event
 */
async updateWorkshop(input: UpdateWorkshopInput): Promise<IEvent> {
  // Validate input
  const validation = UpdateWorkshopSchema.safeParse(input);
  if (!validation.success) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid workshop update data',
      cause: validation.error
    });
  }
  const { id, ...updateData } = validation.data;

  // Find existing event
  const existing = await this.repository.findById(id);
  if (!existing) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Workshop not found' });
  }
  if (existing.type !== 'WORKSHOP') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Event is not a workshop' });
  }

  // Update workshop
  const updated = await this.repository.update(id, updateData);
  return updated as IEvent;
}


}



// Singleton instance
export const eventService = new EventService(eventRepository);
