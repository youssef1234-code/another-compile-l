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
import mongoose, { startSession } from 'mongoose';
import { PaymentStatus } from '@event-manager/shared';
import { paymentRepository } from '../repositories/payment.repository';
import { paymentService } from './payment.service';

const HOLD_MINUTES = 15;

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

  // /**
  //  * Register a user for an event
  //  */
  // async registerForEvent(userId: string, eventId: string): Promise<IEventRegistration> {
  //   // Validate event exists and is not archived
  //   const event = await eventService.getEventById(eventId);
    
  //   if (!event) {
  //     throw new TRPCError({
  //       code: 'NOT_FOUND',
  //       message: 'Event not found',
  //     });
  //   }

  //   if (!event.isActive) {
  //     throw new TRPCError({
  //       code: 'BAD_REQUEST',
  //       message: 'Cannot register for archived event',
  //     });
  //   }

  //   // Check if event has started
  //   const now = new Date();
  //   const eventStartDate = new Date(event.startDate);
    
  //   if (eventStartDate < now) {
  //     throw new TRPCError({
  //       code: 'BAD_REQUEST',
  //       message: 'Cannot register for past events',
  //     });
  //   }

  //   // Check registration deadline
  //   if (event.registrationDeadline) {
  //     const deadline = new Date(event.registrationDeadline);
  //     if (deadline < now) {
  //       throw new TRPCError({
  //         code: 'BAD_REQUEST',
  //         message: 'Registration deadline has passed',
  //       });
  //     }
  //   }

  //   // Check if user is already registered
  //   const existingRegistration = await registrationRepository.getByUserAndEvent(userId, eventId);
    
  //   if (existingRegistration && existingRegistration.isActive) {
  //     // Check the registration status
  //     if (existingRegistration.status === 'CONFIRMED') {
  //       throw new TRPCError({
  //         code: 'BAD_REQUEST',
  //         message: 'You are already registered for this event',
  //       });
  //     }
      
  //     // if (existingRegistration.status === 'WAITLISTED') {
  //     //   throw new TRPCError({
  //     //     code: 'BAD_REQUEST',
  //     //     message: 'You are currently on the waitlist for this event',
  //     //   });
  //     // }
  //   }

  //   // Check capacity if event has capacity limits
  //   if (event.capacity) {
  //     const currentRegistrations = await registrationRepository.countByEvent(eventId);
      
  //     if (currentRegistrations >= event.capacity) {
  //       throw new TRPCError({
  //         code: 'BAD_REQUEST',
  //         message: 'Event is at full capacity',
  //       });
  //     }
  //   }

  //   try {
  //     // Create registration - simplified, no payment flow for now
  //     const registration = await registrationRepository.create({
  //       user: new mongoose.Types.ObjectId(userId),
  //       event: new mongoose.Types.ObjectId(eventId),
  //       status: 'CONFIRMED',
  //       paymentStatus: 'PENDING', 
  //       paymentAmount: event.price || 0,
  //       registeredAt: new Date(),
  //       certificateIssued: false,
  //       attended: false,
  //       isActive: true,
  //     } as Partial<IEventRegistration>);

  //     return registration;
  //   } catch (error: any) {
  //     // Handle duplicate key error from unique index
  //     if (error.code === 11000) {
  //       throw new TRPCError({
  //         code: 'BAD_REQUEST',
  //         message: 'You are already registered for this event',
  //       });
  //     }
      
  //     // Re-throw other errors
  //     throw new TRPCError({
  //       code: 'INTERNAL_SERVER_ERROR',
  //       message: error.message || 'Failed to create registration',
  //     });
  //   }
  // }

  /**
   * Cancel a registration
   * - Must be at least 2 weeks before event start date
   * - Refunds to wallet if payment was completed
   */
  async cancelRegistration(userId: string, registrationId: string): Promise<{ success: boolean; message: string; refundAmount?: number }> {
    // Get registration
    const registration = await registrationRepository.findById(registrationId);
    
    if (!registration || !registration.isActive) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Registration not found',
      });
    }

    // Verify user owns this registration
    const registrationUserId = registration.user.toString();
    if (registrationUserId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only cancel your own registrations',
      });
    }

    // Check if already cancelled
    if (registration.status === 'CANCELLED') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This registration has already been cancelled',
      });
    }

    // Get event details
    const eventId = registration.event.toString();
    const event = await eventService.getEventById(eventId);
    
    if (!event) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Event not found',
      });
    }

    // Check if event has already started
    const now = new Date();
    const eventStartDate = new Date(event.startDate);
    
    if (eventStartDate < now) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot cancel registration for past events',
      });
    }

    // Check 2-week cancellation policy
    const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;
    const timeUntilEvent = eventStartDate.getTime() - now.getTime();
    
    if (timeUntilEvent < twoWeeksInMs) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cancellation must be done at least 2 weeks before the event',
      });
    }

    // Calculate refund amount
    let refundAmount = 0;
    const updateData: Partial<IEventRegistration> = {
      status: 'CANCELLED',
    };

    if (registration.paymentStatus === 'SUCCEEDED' && registration.paymentAmount > 0) {
      refundAmount = registration.paymentAmount;
      updateData.paymentStatus = PaymentStatus.REFUNDED;
    }

    // Update registration status to CANCELLED
    await registrationRepository.update(registrationId, updateData as any);

    return {
      success: true,
      message: refundAmount > 0 
        ? `Registration cancelled. ${refundAmount} EGP has been refunded to your wallet.`
        : 'Registration cancelled successfully.',
      refundAmount,
    };
  }


async cancelWithRefund(userId: string, registrationId: string) {
  const reg = await registrationRepository.findByIdPopulated(registrationId); 
  if (!reg) throw new TRPCError({ code: 'NOT_FOUND', message: 'Registration not found' });
  if ((reg.user as any).toString() !== userId) throw new TRPCError({ code: 'FORBIDDEN' });
  if (reg.status !== 'CONFIRMED') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only confirmed registrations can be cancelled' });

  // policy

    // Get event details
    const eventId = reg.event?.toString();

    const event = await eventService.getEventById(eventId ? eventId : '');

    if (!event) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Event not found',
      });
    }

    // Check if event has already started
    const now = new Date();
    const eventStartDate = new Date(event.startDate);
    
    if (eventStartDate < now) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot cancel registration for past events',
      });
    }

    // Check 2-week cancellation policy
    const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;
    const timeUntilEvent = eventStartDate.getTime() - now.getTime();
    
    if (timeUntilEvent < twoWeeksInMs) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cancellation must be done at least 2 weeks before the event',
      });
    }



  // find successful payment for this registration
  const pay = await paymentRepository.findSucceededByRegistration(registrationId);
  const amountMinor = pay?.amountMinor ?? 0;

  const session = await startSession();
  try {
    session.startTransaction();

    // refund (wallet credit) if paid
    if (amountMinor > 0) {
      await paymentService.refundToWallet(userId, {
        paymentId: (pay?._id as any)?.toString(),
        registrationId,
        amountMinor,
        currency: 'EGP'
      });
    }

    // cancel registration
    await registrationRepository.update(registrationId, {
      status: 'CANCELLED',
      isActive: false,
      cancelledAt: new Date(),
    }, { session });


    await session.commitTransaction();
    session.endSession();


    return { ok: true, refunded: amountMinor > 0, amountMinor, currency: pay?.currency ?? 'EGP' };
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
}


async registerForEvent(userId: string, eventId: string) {
  const event = await eventService.getEventById(eventId);
  if (!event || !event.isActive) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid/archived event' });
  }

  const now = new Date();
  if (new Date(event.startDate) <= now) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Event already started' });
  }
  if (event.registrationDeadline && new Date(event.registrationDeadline) < now) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Registration deadline passed' });
  }

  // Latest registration for audit continuity
  const existing = await registrationRepository.findLatestByUserAndEvent(userId, eventId);

  // If already confirmed and active, do not allow duplicates
  if (existing?.isActive && existing.status === 'CONFIRMED') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'You are already registered for this event' });
  }

  // If a live hold exists, do not create/renew
  if (existing?.isActive &&
      existing.status === 'PENDING' &&
      existing.holdUntil &&
      existing.holdUntil > now) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'You already have an active hold' });
  }

  // Capacity: confirmed + pending (unexpired)
  if (event.capacity) {
    const used = await registrationRepository.countActiveForCapacity(eventId, now);
    if (used >= event.capacity) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Event is at full capacity' });
    }
  }

  const holdUntil = new Date(Date.now() + HOLD_MINUTES * 60_000);

  // Prefer reviving a previous doc for continuity (if any)
  if (existing) {
    // Guard: do not revive if it ever had a successful payment
    if (existing.paymentStatus === 'SUCCEEDED' && existing.status !== 'CONFIRMED') {
      // This would be weird; safest is to create a new doc instead or force manual support
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Inconsistent previous payment state' });
    }

    const revived = await registrationRepository.update(existing._id as any, {
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      holdUntil,
      isActive: true,
      registeredAt: now,
    });

    return revived!;
  }
  

  console.log('Creating new registration document HERE');
  // Otherwise create a new PENDING row
  const created = await registrationRepository.create({
    user: new mongoose.Types.ObjectId(userId),
    event: new mongoose.Types.ObjectId(eventId),
    status: 'PENDING',
    paymentStatus: 'PENDING',
    paymentAmount: event.price ?? 0,
    holdUntil,
    registeredAt: now,
    certificateIssued: false,
    attended: false,
    isActive: true,
  });

  return created;
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
    paymentStatus: PaymentStatus,
    paymentMethod?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'WALLET',
    stripePaymentIntentId?: string
  ): Promise<IEventRegistration | null> {
    const updateData: Partial<IEventRegistration> = {
      paymentStatus,
    };

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    if (stripePaymentIntentId) {
      updateData.stripePaymentIntentId = stripePaymentIntentId;
    }

    return registrationRepository.update(registrationId, updateData as any);
  }

  /**
   * Mark registration as attended (for event check-in)
   */
  async markAttended(registrationId: string): Promise<IEventRegistration | null> {
    const registration = await registrationRepository.findById(registrationId);
    
    if (!registration || !registration.isActive) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Registration not found',
      });
    }

    if (registration.status !== 'CONFIRMED') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Only confirmed registrations can be marked as attended',
      });
    }

    return registrationRepository.update(registrationId, {
      attended: true,
    } as any);
  }

  /**
   * Issue certificate for registration (after event completion)
   */
  async issueCertificate(registrationId: string): Promise<IEventRegistration | null> {
    const registration = await registrationRepository.findById(registrationId);
    
    if (!registration || !registration.isActive) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Registration not found',
      });
    }

    if (registration.status !== 'CONFIRMED') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Only confirmed registrations can receive certificates',
      });
    }

    if (!registration.attended) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User must have attended the event to receive a certificate',
      });
    }

    return registrationRepository.update(registrationId, {
      certificateIssued: true,
    } as any);
  }
}

export const registrationService = new RegistrationService();
