/**
 * Registration Repository
 * 
 * Data access layer for event registrations
 * @module repositories/registration.repository
 */

import type { IEvent } from '../models/event.model';
import { EventRegistration } from '../models/registration.model';
import type { IEventRegistration } from '../models/registration.model';
import { BaseRepository } from './base.repository';
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
   * Get all registrations for a specific user
   */
  async getByUserId(userId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 100;
    const skip = (page - 1) * limit;

    const query = {
      user: new mongoose.Types.ObjectId(userId),
      isActive: true
    };

    const [registrations, total] = await Promise.all([
      this.model
        .find(query)
        .populate('event')
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
  async getUpcomingRegistrations(userId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 100;
    const skip = (page - 1) * limit;

    const now = new Date();

    // First get all registrations with populated events
    const allRegistrations = await this.model
      .find({
        user: new mongoose.Types.ObjectId(userId),
        isActive: true,
      })
      .populate('event')
      .lean();

    // Filter in memory for upcoming events
    const upcomingRegistrations = allRegistrations.filter((reg: any) => {
      return reg.event && new Date(reg.event.startDate) > now;
    });

    const total = upcomingRegistrations.length;
    const paginatedRegistrations = upcomingRegistrations.slice(skip, skip + limit);

    return {
      registrations: paginatedRegistrations.map(transformRegistration),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get past registrations for a user
   */
  async getPastRegistrations(userId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 100;
    const skip = (page - 1) * limit;

    const now = new Date();

    // First get all registrations with populated events
    const allRegistrations = await this.model
      .find({
        user: new mongoose.Types.ObjectId(userId),
        isActive: true,
      })
      .populate('event')
      .lean();

    // Filter in memory for past events
    const pastRegistrations = allRegistrations.filter((reg: any) => {
      return reg.event && new Date(reg.event.startDate) <= now;
    });

    const total = pastRegistrations.length;
    const paginatedRegistrations = pastRegistrations.slice(skip, skip + limit);

    return {
      registrations: paginatedRegistrations.map(transformRegistration),
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
  async countActiveForCapacity(eventId: string, now = new Date()) {
    return this.model.countDocuments({
      event: eventId,
      isActive: true,
      $and: [
        { status: 'CONFIRMED' },
        { paymentStatus: 'PAID' },
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
