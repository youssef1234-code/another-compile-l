/**
 * Registration Repository
 * 
 * Data access layer for event registrations
 * @module repositories/registration.repository
 */

import { EventRegistration } from '../models/registration.model';
import type { IEventRegistration } from '../models/registration.model';
import { BaseRepository } from './base.repository';
import mongoose from 'mongoose';

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
      isDeleted: false 
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
      registrations,
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
      isDeleted: false 
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
      registrations,
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
      isDeleted: false,
    });
    return count > 0;
  }

  /**
   * Get a specific registration by user and event
   */
  async getByUserAndEvent(userId: string, eventId: string) {
    return this.model
      .findOne({
        user: new mongoose.Types.ObjectId(userId),
        event: new mongoose.Types.ObjectId(eventId),
        isDeleted: false,
      })
      .populate('event')
      .lean();
  }

  /**
   * Count registrations for an event
   */
  async countByEvent(eventId: string): Promise<number> {
    return this.model.countDocuments({
      event: new mongoose.Types.ObjectId(eventId),
      isDeleted: false,
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
        isDeleted: false,
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
      registrations: paginatedRegistrations,
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
        isDeleted: false,
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
      registrations: paginatedRegistrations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const registrationRepository = new RegistrationRepository();
