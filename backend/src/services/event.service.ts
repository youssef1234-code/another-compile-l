import { eventRepository } from '../repositories/event.repository';
import { TRPCError } from '@trpc/server';
import type { IEvent } from '../models/event.model';

/**
 * Service Layer for Events
 * Implements business logic for event management
 * Design Pattern: Service Layer + Repository Pattern
 */
export class EventService {
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
    const { events, total } = await eventRepository.advancedSearch({
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

    const events = await eventRepository.search(query, { skip, limit });
    const total = (await eventRepository.search(query)).length;

    return {
      events: events.map(event => this.formatEvent(event)),
      total
    };
  }

  /**
   * Get event by ID
   */
  async getEventById(id: string): Promise<any> {
    const event = await eventRepository.findById(id);
    if (!event) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Event not found'
      });
    }

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

    const events = await eventRepository.findUpcoming({ skip, limit });
    const total = await eventRepository.count({
      isArchived: false,
      startDate: { $gte: new Date() }
    });

    return {
      events: events.map(event => this.formatEvent(event)),
      total
    };
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
    return eventRepository.getStatistics();
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
export const eventService = new EventService();
