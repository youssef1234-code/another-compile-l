import { Event, type IEvent } from "../models/event.model";
import { BaseRepository } from "./base.repository";
import type { FilterQuery } from "mongoose";
import { Types } from "mongoose";
/**
 * Repository Pattern for Event entity
 * Extends BaseRepository for common CRUD operations
 * Handles all database operations for events
 */
export class EventRepository extends BaseRepository<IEvent> {
  constructor() {
    super(Event);
  }

  /**
   * Find event by ID with population
   */
  async findById(id: string): Promise<IEvent | null> {
    return super.findById(id, ["createdBy", "vendors"]);
  }

  /**
   * Find all events with population
   */
  async findAllWithPopulate(
    filter: FilterQuery<IEvent> = {},
    options: {
      skip?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
    } = {}
  ): Promise<IEvent[]> {
    return this.findAll(filter, {
      ...options,
      populate: ["createdBy", "vendors"],
    });
  }

  /**
   * Find upcoming events (not archived, not past)
   */
  async findUpcoming(
    options: {
      skip?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
    } = {}
  ): Promise<IEvent[]> {
    return this.findAllWithPopulate(
      {
        isArchived: false,
        startDate: { $gte: new Date() },
      } as FilterQuery<IEvent>,
      options
    );
  }

  /**
   * Search events by name or description
   */
  async search(
    query: string,
    options: {
      skip?: number;
      limit?: number;
    } = {}
  ): Promise<IEvent[]> {
    const searchRegex = new RegExp(query, "i");
    return this.findAllWithPopulate(
      {
        isArchived: false,
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { professorName: searchRegex },
        ],
      } as FilterQuery<IEvent>,
      { ...options, sort: { startDate: 1 } }
    );
  }

  /**
   * Filter events by type
   */
  async findByType(
    type: string,
    options: {
      skip?: number;
      limit?: number;
    } = {}
  ): Promise<IEvent[]> {
    return this.findAllWithPopulate(
      {
        type,
        isArchived: false,
      } as FilterQuery<IEvent>,
      { ...options, sort: { startDate: 1 } }
    );
  }

  /**
   * Filter events by location
   */
  async findByLocation(
    location: string,
    options: {
      skip?: number;
      limit?: number;
    } = {}
  ): Promise<IEvent[]> {
    return this.findAllWithPopulate(
      {
        location,
        isArchived: false,
      } as FilterQuery<IEvent>,
      { ...options, sort: { startDate: 1 } }
    );
  }

  /**
   * Filter events by date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options: {
      skip?: number;
      limit?: number;
    } = {}
  ): Promise<IEvent[]> {
    return this.findAllWithPopulate(
      {
        isArchived: false,
        startDate: { $gte: startDate, $lte: endDate },
      } as FilterQuery<IEvent>,
      { ...options, sort: { startDate: 1 } }
    );
  }

  /**
   * Find events created by a specific user
   */
  async findByCreator(
    userId: string,
    options: {
      skip?: number;
      limit?: number;
    } = {}
  ): Promise<IEvent[]> {
    return this.findAllWithPopulate(
      { createdBy: userId } as FilterQuery<IEvent>,
      { ...options, sort: { createdAt: -1 } }
    );
  }

  /**
   * Find events by status (pending, approved, rejected)
   */
  async findByStatus(
    status: string,
    options: {
      skip?: number;
      limit?: number;
    } = {}
  ): Promise<IEvent[]> {
    return this.findAllWithPopulate({ status } as FilterQuery<IEvent>, {
      ...options,
      sort: { createdAt: -1 },
    });
  }

  /**
   * Archive event
   */
  async archive(id: string): Promise<IEvent | null> {
    return this.update(id, { isArchived: true } as any);
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
    maxPrice?: number;
    skip?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{ events: IEvent[]; total: number }> {
    const filter: FilterQuery<IEvent> = {
      isArchived: false,
      status: "PUBLISHED", // Only show published events to frontend
    } as FilterQuery<IEvent>;

    // Text search
    if (params.query) {
      const searchRegex = new RegExp(params.query, "i");
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { professorName: searchRegex },
      ] as any;
    }

    // Type filter
    if (params.type) {
      filter.type = params.type as any;
    }

    // Location filter
    if (params.location) {
      filter.location = params.location as any;
    }

    // Date range filter
    if (params.startDate || params.endDate) {
      filter.startDate = {} as any;
      if (params.startDate) {
        (filter.startDate as any).$gte = params.startDate;
      }
      if (params.endDate) {
        (filter.startDate as any).$lte = params.endDate;
      }
    }

    // Price filter
    if (params.maxPrice !== undefined) {
      filter.price = { $lte: params.maxPrice } as any;
    }

    // Status filter
    if (params.status) {
      filter.status = params.status as any;
    }

    // Sorting
    const sort: Record<string, 1 | -1> = {};
    if (params.sortBy) {
      sort[params.sortBy] = params.sortOrder === "desc" ? -1 : 1;
    } else {
      sort.startDate = 1; // Default sort by start date ascending
    }

    // Execute query with pagination
    const [events, total] = await Promise.all([
      this.findAllWithPopulate(filter, {
        skip: params.skip || 0,
        limit: params.limit || 10,
        sort,
      }),
      this.count(filter),
    ]);

    return { events, total };
  }

  /**
   * Get event statistics
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
    const now = new Date();

    // Base filter - exclude archived events and optionally filter by creator
    const baseFilter: FilterQuery<IEvent> = { isArchived: false };
    if (createdBy) {
      baseFilter.createdBy = createdBy;
    }
    if (options?.excludeTypes && options.excludeTypes.length > 0) {
      (baseFilter as any).type = { $nin: options.excludeTypes };
    }

    const [total, upcoming, past, byType] = await Promise.all([
      this.count(baseFilter),
      this.count({
        ...baseFilter,
        startDate: { $gte: now },
      } as FilterQuery<IEvent>),
      this.count({
        ...baseFilter,
        startDate: { $lt: now },
      } as FilterQuery<IEvent>),
      this.aggregate([
        { $match: baseFilter },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
    ]);

    const byTypeMap: Record<string, number> = {};
    byType.forEach((item: any) => {
      byTypeMap[item._id] = item.count;
    });

    return { total, upcoming, past, byType: byTypeMap };
  }

  /**
   * Returns true if ANY other GYM_SESSION overlaps [start,end).
   * Excludes CANCELLED / deleted / archived, and can exclude a specific _id.
   */
  async hasGymOverlap(start: Date, end: Date, excludeId?: string) {
    const q: any = {
      type: "GYM_SESSION",
      isActive: true,
      isArchived: { $ne: true },
      status: { $ne: "CANCELLED" },
      // proper interval overlap: [a,b) overlaps [c,d) if a < d && b > c
      startDate: { $lt: end },
      endDate: { $gt: start },
    };
    if (excludeId) {
      q._id = { $ne: new Types.ObjectId(excludeId) };
    }
    // exists() is cheap & returns null / doc
    const hit = await this.model.exists(q);
    return !!hit;
  }

  async whitelistUser(userId: string, eventId: string): Promise<void> {
    const event = await this.model.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Initialize array if it doesn't exist
    if (!event.whitelistedUsers) {
      event.whitelistedUsers = [];
    }

    // Check if user is already whitelisted
    const userObjectId = new Types.ObjectId(userId);
    const isAlreadyWhitelisted = event.whitelistedUsers.some(
      (id) => id.toString() === userId
    );

    if (!isAlreadyWhitelisted) {
      event.whitelistedUsers.push(userObjectId);
      await event.save();
    }
  }

  async removeWhitelistedUser(userId: string, eventId: string): Promise<void> {
    const event = await this.model.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.whitelistedUsers === undefined) {
      return;
    }

    const userObjectId = new Types.ObjectId(userId);
    event.whitelistedUsers = event.whitelistedUsers.filter(
      (id) => id.toString() !== userId
    );
    await event.save();
  }
}

// Singleton instance
export const eventRepository = new EventRepository();
