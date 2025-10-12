import { EventRepository, eventRepository } from '../repositories/event.repository';
import { BaseService, type ServiceOptions } from './base.service';
import { TRPCError } from '@trpc/server';
import type { IEvent } from '../models/event.model';
import type { FilterQuery } from 'mongoose';
import { EventStatus, GymSessionType } from '@event-manager/shared';
import { ServiceError } from '../errors/errors';
import { exitCode } from 'process';

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
    // Set status to PUBLISHED for bazaars created by EVENT_OFFICE users
    if (data.type === 'BAZAAR' && !data.status) {
      data.status = 'PUBLISHED';
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
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      skip,
      limit
    });

    // Format events for API response
    const formattedEvents = events.map(event => this.formatEvent(event));

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

    return {
      events: events.map(event => this.formatEvent(event)),
      total
    };
  }

  /**
   * Get event by ID
   */
  async getEventById(id: string): Promise<any> {
    const event = await this.findById(id);
    return this.formatEvent(event);
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

    return {
      events: events.map(event => this.formatEvent(event)),
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

    return {
      events: events.map(event => this.formatEvent(event)),
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

    return {
      events: events.map(event => this.formatEvent(event)),
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


}



// Singleton instance
export const eventService = new EventService(eventRepository);
