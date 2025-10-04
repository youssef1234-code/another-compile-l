import { EventRepository, eventRepository } from '../repositories/event.repository';
import { BaseService } from './base.service';
import { TRPCError } from '@trpc/server';
import type { IEvent } from '../models/event.model';
import type { FilterQuery } from 'mongoose';

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
   * Validate before create
   * Business Rule: Check event date validations
   */
  protected async validateCreate(data: Partial<IEvent>): Promise<void> {
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
      startDate: event.startDate,
      endDate: event.endDate,
      registrationDeadline: event.registrationDeadline,
      capacity: event.capacity,
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
}

// Singleton instance
export const eventService = new EventService(eventRepository);
