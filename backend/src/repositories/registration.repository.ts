/**
 * Registration Repository
 * 
 * Data access layer for event registrations
 * @module repositories/registration.repository
 */

import type { IEvent } from '../models/event.model.js';
import { EventRegistration } from '../models/registration.model.js';
import type { IEventRegistration } from '../models/registration.model.js';
import { BaseRepository } from './base.repository.js';
import mongoose, { Types } from 'mongoose';

/**
 * Transform registration and nested event to include 'id' field
 */
function transformRegistration(reg: any): any {
  if (!reg) return reg;

  const transformed: any = {
    ...reg,
    id: reg._id?.toString() || reg.id,
  };

  // Transform nested event if populated
  if (reg.event && typeof reg.event === 'object') {
    transformed.event = {
      ...reg.event,
      id: reg.event._id?.toString() || reg.event.id,
    };
  }

  // Transform nested user if populated
  if (reg.user && typeof reg.user === 'object') {
    transformed.user = {
      ...reg.user,
      id: reg.user._id?.toString() || reg.user.id,
    };
  }

  return transformed;
}

export class RegistrationRepository extends BaseRepository<IEventRegistration> {
  constructor() {
    super(EventRegistration);
  }

  /**
   * Get all registrations for a specific user with optional event filters
   */
  async getByUserId(userId: string, options?: { 
    page?: number; 
    limit?: number;
    search?: string;
    types?: string[];
    location?: "ON_CAMPUS" | "OFF_CAMPUS";
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 100;
    const skip = (page - 1) * limit;

    // Build aggregation pipeline for filtering by event properties
    const pipeline: any[] = [
      // Match user's registrations
      { 
        $match: { 
          user: new mongoose.Types.ObjectId(userId),
          isActive: true
        }
      },
      // Lookup event details
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventData'
        }
      },
      // Unwind event (should be single)
      { $unwind: '$eventData' },
    ];

    // Add event filters
    const eventMatch: any = {};
    
    if (options?.search) {
      eventMatch.$or = [
        { 'eventData.name': { $regex: options.search, $options: 'i' } },
        { 'eventData.description': { $regex: options.search, $options: 'i' } }
      ];
    }
    
    if (options?.types && options.types.length > 0) {
      eventMatch['eventData.type'] = { $in: options.types };
    }
    
    if (options?.location) {
      eventMatch['eventData.location'] = options.location;
    }

    if (Object.keys(eventMatch).length > 0) {
      pipeline.push({ $match: eventMatch });
    }

    // Sort by creation date
    pipeline.push({ $sort: { createdAt: -1 } });

    // Get total count before pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.model.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Project to reshape the document
    pipeline.push({
      $project: {
        _id: 1,
        user: 1,
        event: '$eventData',
        status: 1,
        paymentStatus: 1,
        paymentMethod: 1,
        amount: 1,
        loyaltyPointsUsed: 1,
        holdExpiresAt: 1,
        qrCode: 1,
        scannedAt: 1,
        isActive: 1,
        createdAt: 1,
        updatedAt: 1
      }
    });

    const registrations = await this.model.aggregate(pipeline);

    return {
      registrations: registrations.map(transformRegistration),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all registrations for a specific event
   */
  async getByEventId(eventId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 100;
    const skip = (page - 1) * limit;

    const query = {
      event: new mongoose.Types.ObjectId(eventId),
      isActive: true
    };

    const [registrations, total] = await Promise.all([
      this.model
        .find(query)
        .populate('user', 'firstName lastName email studentId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments(query),
    ]);

    return {
      registrations: registrations.map(transformRegistration),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Check if user is already registered for an event
   */
  async isUserRegistered(userId: string, eventId: string): Promise<boolean> {
    const count = await this.model.countDocuments({
      user: new mongoose.Types.ObjectId(userId),
      event: new mongoose.Types.ObjectId(eventId),
      status: 'CONFIRMED', // Only count confirmed registrations
      isActive: true,
    });
    return count > 0;
  }

  /**
   * Get a specific registration by user and event
   */
  async getByUserAndEvent(userId: string, eventId: string) {
    const reg = await this.model
      .findOne({
        user: new mongoose.Types.ObjectId(userId),
        event: new mongoose.Types.ObjectId(eventId),
        isActive: true,
      })
      .populate('event')
      .lean();
    return transformRegistration(reg);
  }

  /**
   * Count registrations for an event
   */
  async countByEvent(eventId: string): Promise<number> {
    return this.model.countDocuments({
      event: new mongoose.Types.ObjectId(eventId),
      isActive: true,
    });
  }

  /**
   * Get upcoming registrations for a user
   */
  async getUpcomingRegistrations(userId: string, options?: { 
    page?: number; 
    limit?: number;
    search?: string;
    types?: string[];
    location?: "ON_CAMPUS" | "OFF_CAMPUS";
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 100;
    const skip = (page - 1) * limit;

    const now = new Date();

    // Build aggregation pipeline
    const pipeline: any[] = [
      { 
        $match: { 
          user: new mongoose.Types.ObjectId(userId),
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventData'
        }
      },
      { $unwind: '$eventData' },
      // Filter upcoming events
      { $match: { 'eventData.startDate': { $gt: now } } }
    ];

    // Add event filters
    const eventMatch: any = {};
    
    if (options?.search) {
      eventMatch.$or = [
        { 'eventData.name': { $regex: options.search, $options: 'i' } },
        { 'eventData.description': { $regex: options.search, $options: 'i' } }
      ];
    }
    
    if (options?.types && options.types.length > 0) {
      eventMatch['eventData.type'] = { $in: options.types };
    }
    
    if (options?.location) {
      eventMatch['eventData.location'] = options.location;
    }

    if (Object.keys(eventMatch).length > 0) {
      pipeline.push({ $match: eventMatch });
    }

    pipeline.push({ $sort: { 'eventData.startDate': 1 } });

    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.model.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    pipeline.push({
      $project: {
        _id: 1,
        user: 1,
        event: '$eventData',
        status: 1,
        paymentStatus: 1,
        paymentMethod: 1,
        amount: 1,
        loyaltyPointsUsed: 1,
        holdExpiresAt: 1,
        qrCode: 1,
        scannedAt: 1,
        isActive: 1,
        createdAt: 1,
        updatedAt: 1
      }
    });

    const registrations = await this.model.aggregate(pipeline);

    return {
      registrations: registrations.map(transformRegistration),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get past registrations for a user
   */
  async getPastRegistrations(userId: string, options?: { 
    page?: number; 
    limit?: number;
    search?: string;
    types?: string[];
    location?: "ON_CAMPUS" | "OFF_CAMPUS";
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 100;
    const skip = (page - 1) * limit;

    const now = new Date();

    // Build aggregation pipeline
    const pipeline: any[] = [
      { 
        $match: { 
          user: new mongoose.Types.ObjectId(userId),
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventData'
        }
      },
      { $unwind: '$eventData' },
      // Filter past events
      { $match: { 'eventData.startDate': { $lte: now } } }
    ];

    // Add event filters
    const eventMatch: any = {};
    
    if (options?.search) {
      eventMatch.$or = [
        { 'eventData.name': { $regex: options.search, $options: 'i' } },
        { 'eventData.description': { $regex: options.search, $options: 'i' } }
      ];
    }
    
    if (options?.types && options.types.length > 0) {
      eventMatch['eventData.type'] = { $in: options.types };
    }
    
    if (options?.location) {
      eventMatch['eventData.location'] = options.location;
    }

    if (Object.keys(eventMatch).length > 0) {
      pipeline.push({ $match: eventMatch });
    }

    pipeline.push({ $sort: { 'eventData.startDate': -1 } });

    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.model.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    pipeline.push({
      $project: {
        _id: 1,
        user: 1,
        event: '$eventData',
        status: 1,
        paymentStatus: 1,
        paymentMethod: 1,
        amount: 1,
        loyaltyPointsUsed: 1,
        holdExpiresAt: 1,
        qrCode: 1,
        scannedAt: 1,
        isActive: 1,
        createdAt: 1,
        updatedAt: 1
      }
    });

    const registrations = await this.model.aggregate(pipeline);

    return {
      registrations: registrations.map(transformRegistration),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }


  // Get most recent registration for (user,event)
  async findLatestByUserAndEvent(userId: string, eventId: string) {
    return this.model
      .findOne({ user: userId, event: eventId })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();
  }

  // Capacity = confirmed + pending with valid hold
  async countActiveForCapacity(eventId: string, _now = new Date()) {
    return this.model.countDocuments({
      event: eventId,
      isActive: true,
      $and: [
        { status: 'CONFIRMED' },
        { paymentStatus: 'SUCCEEDED' },
      ],
    });
  }


  /**
   * Find a registration by id and populate its event.
   * Returns a lean object so service code can safely read fields
   * like reg.event.startDate, reg.event.price, etc.
   */
  async findByIdPopulated(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;

    const doc = await this.model
      .findById(id)
      .populate({
        path: "event",
        select: "_id name startDate endDate price capacity isActive status type location", // adjust as needed
      })
      .lean<(Omit<IEventRegistration, "event"> & {
        event: (Pick<IEvent,
          "_id" | "name" | "startDate" | "endDate" | "price" | "capacity" | "isActive" | "status" | "type" | "location">) | null
      }) | null>();

    if (!doc) return null;

    // Normalize _id/ObjectId to string (handy for consistent usage upstream)
    const normalizeId = (v: any) =>
      (v?._id as any)?.toString?.() ?? (typeof v === "string" ? v : undefined);

    const event = doc.event
      ? {
        ...doc.event,
        _id: normalizeId(doc.event),
      }
      : null;

    return {
      ...doc,
      _id: normalizeId(doc),
      user: normalizeId(doc.user),
      event,
    };
  }

  async findMineForEvent(userId: string, eventId: string) {
    return this.model
      .findOne({
        user: new Types.ObjectId(userId),
        event: new Types.ObjectId(eventId),
        isActive: true,
      })
      .select({
        _id: 1,
        user: 1,
        event: 1,
        status: 1,
        paymentAmount: 1,     // if your model uses paymentAmount not amountMinor
        paymentAmountMinor: 1, // prefer minor units if present
        currency: 1,
        holdUntil: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean<IEventRegistration & { _id: Types.ObjectId }>()
      .exec();
  }


}



export const registrationRepository = new RegistrationRepository();
