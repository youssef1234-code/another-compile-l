/**
 * Registration Service
 * 
 * Business logic for event registrations
 * @module services/registration.service
 */

import { registrationRepository } from '../repositories/registration.repository';
import { eventService } from './event.service';
import { TRPCError } from '@trpc/server';
import type { IEventRegistration } from '../models/registration.model';
import mongoose from 'mongoose';

export class RegistrationService {
  /**
   * Get all registrations for a user with pagination
   */
  async getMyRegistrations(userId: string, options?: { page?: number; limit?: number; status?: 'upcoming' | 'past' | 'all' }) {
    const status = options?.status || 'all';

    if (status === 'upcoming') {
      return registrationRepository.getUpcomingRegistrations(userId, options);
    } else if (status === 'past') {
      return registrationRepository.getPastRegistrations(userId, options);
    } else {
      return registrationRepository.getByUserId(userId, options);
    }
  }

  /**
   * Register a user for an event
   */
  async registerForEvent(userId: string, eventId: string): Promise<IEventRegistration> {
    // Validate event exists and is not archived
    const event = await eventService.getEventById(eventId);
    
    if (!event) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Event not found',
      });
    }

    if (event.isDeleted) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot register for archived event',
      });
    }

    // Check if event has started
    if (new Date(event.startDate) < new Date()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot register for past events',
      });
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Registration deadline has passed',
      });
    }

    // Check if user is already registered
    const existingRegistration = await registrationRepository.getByUserAndEvent(userId, eventId);
    if (existingRegistration) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You are already registered for this event',
      });
    }

    // Check capacity if event has capacity limits
    if (event.capacity) {
      const currentRegistrations = await registrationRepository.countByEvent(eventId);
      if (currentRegistrations >= event.capacity) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Event is at full capacity',
        });
      }
    }

    // Create registration
    const registration = await registrationRepository.create({
      user: new mongoose.Types.ObjectId(userId),
      event: new mongoose.Types.ObjectId(eventId),
      paymentStatus: event.price && event.price > 0 ? 'PENDING' : 'COMPLETED',
      paymentAmount: event.price || 0,
      certificateIssued: false,
      attended: false,
    } as any);

    return registration;
  }

  /**
   * Cancel a registration
   * - Must be at least 2 weeks before event start date
   * - Refunds to wallet if payment was completed
   */
  async cancelRegistration(userId: string, registrationId: string): Promise<{ success: boolean; message: string; refundAmount?: number }> {
    // Get registration with populated event
    const registration = await registrationRepository.findById(registrationId);
    
    if (!registration) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Registration not found',
      });
    }

    // Verify user owns this registration
    if (registration.user.toString() !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only cancel your own registrations',
      });
    }

    // Get event details
    const event = await eventService.getEventById(registration.event.toString());
    if (!event) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Event not found',
      });
    }

    // Check if event has already started
    if (new Date(event.startDate) < new Date()) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot cancel registration for past events',
      });
    }

    // Check 2-week cancellation policy
    const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;
    const timeUntilEvent = new Date(event.startDate).getTime() - new Date().getTime();
    
    if (timeUntilEvent < twoWeeksInMs) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cancellation must be done at least 2 weeks before the event',
      });
    }

    // Calculate refund amount
    let refundAmount = 0;
    if (registration.paymentStatus === 'COMPLETED' && registration.paymentAmount > 0) {
      refundAmount = registration.paymentAmount;
      
      // Update registration payment status to REFUNDED
      await registrationRepository.update(registrationId, {
        paymentStatus: 'REFUNDED',
      } as any);
    }

    // Soft delete the registration
    await registrationRepository.delete(registrationId);

    return {
      success: true,
      message: refundAmount > 0 
        ? `Registration cancelled. ${refundAmount} EGP has been refunded to your wallet.`
        : 'Registration cancelled successfully.',
      refundAmount,
    };
  }

  /**
   * Get registrations for a specific event (for event organizers)
   */
  async getEventRegistrations(eventId: string, options?: { page?: number; limit?: number }) {
    // Validate event exists
    const event = await eventService.getEventById(eventId);
    if (!event) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Event not found',
      });
    }

    return registrationRepository.getByEventId(eventId, options);
  }

  /**
   * Get registration count for an event
   */
  async getRegistrationCount(eventId: string): Promise<number> {
    return registrationRepository.countByEvent(eventId);
  }

  /**
   * Check if user is registered for an event
   */
  async isUserRegistered(userId: string, eventId: string): Promise<boolean> {
    return registrationRepository.isUserRegistered(userId, eventId);
  }

  /**
   * Get a specific registration
   */
  async getRegistrationById(registrationId: string) {
    return registrationRepository.findById(registrationId);
  }

  /**
   * Update registration payment status (for payment processing)
   */
  async updatePaymentStatus(
    registrationId: string,
    status: 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'FAILED',
    paymentMethod?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'WALLET',
    stripePaymentIntentId?: string
  ) {
    return registrationRepository.update(registrationId, {
      paymentStatus: status,
      paymentMethod,
      stripePaymentIntentId,
    } as any);
  }

  /**
   * Mark registration as attended
   */
  async markAttended(registrationId: string) {
    return registrationRepository.update(registrationId, {
      attended: true,
    } as any);
  }

  /**
   * Issue certificate for registration
   */
  async issueCertificate(registrationId: string) {
    return registrationRepository.update(registrationId, {
      certificateIssued: true,
    } as any);
  }
}

export const registrationService = new RegistrationService();
