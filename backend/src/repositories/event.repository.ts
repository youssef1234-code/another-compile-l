import { Event, type IEvent } from '../models/event.model';
import type { FilterQuery, UpdateQuery } from 'mongoose';

/**
 * Repository Pattern for Event entity
 * Handles all database operations for events
 */
export class EventRepository {
  /**
   * Find event by ID
   */
  async findById(id: string): Promise<IEvent | null> {
    return Event.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('vendors', 'companyName email')
      .exec();
  }

  /**
   * Create a new event
   */
  async create(eventData: Partial<IEvent>): Promise<IEvent> {
    const event = new Event(eventData);
    return event.save();
  }

  /**
   * Update event by ID
   */
  async update(id: string, updateData: UpdateQuery<IEvent>): Promise<IEvent | null> {
    return Event.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  /**
   * Delete event by ID
   */
  async delete(id: string): Promise<IEvent | null> {
    return Event.findByIdAndDelete(id).exec();
  }

  /**
   * Find all events with filtering, sorting, and pagination
   */
  async findAll(
    filter: FilterQuery<IEvent> = {},
    options: {
      skip?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
      populate?: boolean;
    } = {}
  ): Promise<IEvent[]> {
    let query = Event.find(filter);

    if (options.populate) {
      query = query
        .populate('createdBy', 'firstName lastName email role')
        .populate('vendors', 'companyName email');
    }

    if (options.sort) {
      query = query.sort(options.sort);
    }

    if (options.skip) {
      query = query.skip(options.skip);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    return query.exec();
  }

  /**
   * Count events with optional filter
   */
  async count(filter: FilterQuery<IEvent> = {}): Promise<number> {
    return Event.countDocuments(filter).exec();
  }

  /**
   * Find upcoming events (not archived, not past)
   */
  async findUpcoming(options: {
    skip?: number;
    limit?: number;
    sort?: Record<string, 1 | -1>;
  } = {}): Promise<IEvent[]> {
    return this.findAll(
      {
        isArchived: false,
        startDate: { $gte: new Date() }
      },
      { ...options, populate: true }
    );
  }

  /**
   * Search events by name or description
   */
  async search(query: string, options: {
    skip?: number;
    limit?: number;
  } = {}): Promise<IEvent[]> {
    const searchRegex = new RegExp(query, 'i');
    return this.findAll(
      {
        isArchived: false,
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { professorName: searchRegex }
        ]
      },
      { ...options, populate: true, sort: { startDate: 1 } }
    );
  }

  /**
   * Filter events by type
   */
  async findByType(type: string, options: {
    skip?: number;
    limit?: number;
  } = {}): Promise<IEvent[]> {
    return this.findAll(
      {
        type,
        isArchived: false
      },
      { ...options, populate: true, sort: { startDate: 1 } }
    );
  }

  /**
   * Filter events by location
   */
  async findByLocation(location: string, options: {
    skip?: number;
    limit?: number;
  } = {}): Promise<IEvent[]> {
    return this.findAll(
      {
        location,
        isArchived: false
      },
      { ...options, populate: true, sort: { startDate: 1 } }
    );
  }

  /**
   * Filter events by date range
   */
  async findByDateRange(startDate: Date, endDate: Date, options: {
    skip?: number;
    limit?: number;
  } = {}): Promise<IEvent[]> {
    return this.findAll(
      {
        isArchived: false,
        startDate: { $gte: startDate, $lte: endDate }
      },
      { ...options, populate: true, sort: { startDate: 1 } }
    );
  }

  /**
   * Find events created by a specific user
   */
  async findByCreator(userId: string, options: {
    skip?: number;
    limit?: number;
  } = {}): Promise<IEvent[]> {
    return this.findAll(
      { createdBy: userId },
      { ...options, populate: true, sort: { createdAt: -1 } }
    );
  }

  /**
   * Find events by status (pending, approved, rejected)
   */
  async findByStatus(status: string, options: {
    skip?: number;
    limit?: number;
  } = {}): Promise<IEvent[]> {
    return this.findAll(
      { status },
      { ...options, populate: true, sort: { createdAt: -1 } }
    );
  }

  /**
   * Archive event
   */
  async archive(id: string): Promise<IEvent | null> {
    return this.update(id, { isArchived: true });
  }

  /**
   * Complex search with multiple filters
   */
  async advancedSearch(params: {
    query?: string;
    type?: string;
    location?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    skip?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ events: IEvent[]; total: number }> {
    const filter: FilterQuery<IEvent> = { isArchived: false };

    // Text search
    if (params.query) {
      const searchRegex = new RegExp(params.query, 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { professorName: searchRegex }
      ];
    }

    // Type filter
    if (params.type) {
      filter.type = params.type;
    }

    // Location filter
    if (params.location) {
      filter.location = params.location;
    }

    // Date range filter
    if (params.startDate || params.endDate) {
      filter.startDate = {};
      if (params.startDate) {
        filter.startDate.$gte = params.startDate;
      }
      if (params.endDate) {
        filter.startDate.$lte = params.endDate;
      }
    }

    // Status filter
    if (params.status) {
      filter.status = params.status;
    }

    // Sorting
    const sort: Record<string, 1 | -1> = {};
    if (params.sortBy) {
      sort[params.sortBy] = params.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.startDate = 1; // Default sort by start date ascending
    }

    // Execute query with pagination
    const [events, total] = await Promise.all([
      this.findAll(filter, {
        skip: params.skip || 0,
        limit: params.limit || 10,
        sort,
        populate: true
      }),
      this.count(filter)
    ]);

    return { events, total };
  }

  /**
   * Get event statistics
   */
  async getStatistics(): Promise<{
    total: number;
    upcoming: number;
    past: number;
    byType: Record<string, number>;
  }> {
    const now = new Date();
    
    const [total, upcoming, past, byType] = await Promise.all([
      this.count({ isArchived: false }),
      this.count({ isArchived: false, startDate: { $gte: now } }),
      this.count({ isArchived: false, startDate: { $lt: now } }),
      Event.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);

    const byTypeMap: Record<string, number> = {};
    byType.forEach((item: any) => {
      byTypeMap[item._id] = item.count;
    });

    return { total, upcoming, past, byType: byTypeMap };
  }
}

// Singleton instance
export const eventRepository = new EventRepository();
