/**
 * Registration Service
 *
 * Business logic for event registrations
 * @module services/registration.service
 */

import { registrationRepository } from "../repositories/registration.repository";
import { eventService } from "./event.service";
import { userRepository } from "../repositories/user.repository";
import { TRPCError } from "@trpc/server";
import type { IEventRegistration } from "../models/registration.model";
import mongoose from 'mongoose';
import { PaymentStatus, RegistrationStatus } from '@event-manager/shared';
import type { RegistrationForEventResponse } from '@event-manager/shared';
import { paymentRepository } from '../repositories/payment.repository';
import { paymentService } from './payment.service';

const HOLD_MINUTES = process.env.HOLD_MINUTES ? parseInt(process.env.HOLD_MINUTES) : 15;
export class RegistrationService {

  /**
   * Get all registrations for a user with pagination
   */
  async getMyRegistrations(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: "upcoming" | "past" | "all";
      search?: string;
      types?: string[];
      location?: "ON_CAMPUS" | "OFF_CAMPUS";
    }
  ) {
    const status = options?.status || "all";

    if (status === "upcoming") {
      return registrationRepository.getUpcomingRegistrations(userId, options);
    } else if (status === "past") {
      return registrationRepository.getPastRegistrations(userId, options);
    } else {
      return registrationRepository.getByUserId(userId, options);
    }
  }

  /**
   * Cancel a registration
   * - Must be at least 2 weeks before event start date
   * - Refunds to wallet if payment was completed
   */
  async cancelRegistration(
    userId: string,
    registrationId: string
  ): Promise<{ success: boolean; message: string; refundAmount?: number }> {
    // Get registration
    const registration = await registrationRepository.findById(registrationId);

    if (!registration || !registration.isActive) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Registration not found",
      });
    }

    // Verify user owns this registration
    const registrationUserId = registration.user.toString();
    if (registrationUserId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only cancel your own registrations",
      });
    }

    // Check if already cancelled
    if (registration.status === "CANCELLED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This registration has already been cancelled",
      });
    }

    // Get event details
    const eventId = registration.event.toString();
    const event = await eventService.getEventById(eventId);

    if (!event) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Event not found",
      });
    }

    // Check if event has already started
    const now = new Date();
    const eventStartDate = new Date(event.startDate);

    if (eventStartDate < now) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot cancel registration for past events",
      });
    }

    // Check 2-week cancellation policy
    const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000;
    const timeUntilEvent = eventStartDate.getTime() - now.getTime();

    if (timeUntilEvent < twoWeeksInMs) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cancellation must be done at least 2 weeks before the event",
      });
    }

    // Calculate refund amount
    let refundAmount = 0;
    const updateData: Partial<IEventRegistration> = {
      status: "CANCELLED",
    };

    if (registration.paymentStatus === 'SUCCEEDED' && registration.paymentAmount > 0) {
      refundAmount = registration.paymentAmount;
      updateData.paymentStatus = PaymentStatus.REFUNDED;
    }

    // Update registration status to CANCELLED
    await registrationRepository.update(registrationId, updateData as any);

    return {
      success: true,
      message:
        refundAmount > 0
          ? `Registration cancelled. ${refundAmount} EGP has been refunded to your wallet.`
          : "Registration cancelled successfully.",
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

  // If there was a payment, refundToWallet handles both the refund AND marks the registration
  if (amountMinor > 0) {
    await paymentService.refundToWallet(userId, {
      paymentId: (pay?._id as any)?.toString(),
      registrationId,
      amountMinor,
      currency: 'EGP'
    });
    // refundToWallet already sets status=CANCELLED and paymentStatus=REFUNDED
    // Just need to set isActive=false and cancelledAt
    await registrationRepository.update(registrationId, {
      isActive: false,
      cancelledAt: new Date(),
    });
  } else {
    // No payment to refund, just cancel the registration
    await registrationRepository.update(registrationId, {
      status: 'CANCELLED',
      isActive: false,
      cancelledAt: new Date(),
    });
  }

  return { ok: true, refunded: amountMinor > 0, amountMinor, currency: pay?.currency ?? 'EGP' };
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

  // Whitelist validation: Check if user is allowed to register for this event
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
  }
  
  const whitelistCheck = await eventService.isUserAllowedForEvent({
    eventId,
    userId,
    userRole: user.role,
  });
  
  if (!whitelistCheck.allowed) {
    throw new TRPCError({ 
      code: 'FORBIDDEN', 
      message: whitelistCheck.reason || 'You are not allowed to register for this event' 
    });
  }

  // Check if event is free
  const isFreeEvent = !event.price || event.price === 0;

  // Latest registration for audit continuity
  const existing = await registrationRepository.findLatestByUserAndEvent(userId, eventId);

  // If already confirmed and active, do not allow duplicates
  if (existing?.isActive && existing.status === 'CONFIRMED') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'You are already registered for this event' });
  }

  // If a live hold exists, do not create/renew (only for paid events)
  if (!isFreeEvent && existing?.isActive &&
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

  // For free events, immediately confirm registration
  if (isFreeEvent) {
    // Prefer reviving a previous doc for continuity (if any)
    if (existing && existing.status !== 'CONFIRMED') {
      const confirmed = await registrationRepository.update(existing._id as any, {
        status: RegistrationStatus.CONFIRMED,
        paymentStatus: PaymentStatus.SUCCEEDED, // No payment needed
        paymentAmount: 0,
        holdUntil: null,
        isActive: true,
        registeredAt: now,
      });
      return confirmed!;
    }

    // Create a new confirmed registration
    const created = await registrationRepository.create({
      user: new mongoose.Types.ObjectId(userId),
      event: new mongoose.Types.ObjectId(eventId),
      status: RegistrationStatus.CONFIRMED,
      paymentStatus: PaymentStatus.SUCCEEDED, // No payment needed
      paymentAmount: 0,
      holdUntil: undefined,
      registeredAt: now,
      certificateIssued: false,
      attended: false,
      isActive: true,
    });

    return created;
  }

  // For paid events, create a pending registration with hold
  const holdUntil = new Date(Date.now() + HOLD_MINUTES * 60_000);

  // Prefer reviving a previous doc for continuity (if any)
  if (existing) {
    // Guard: do not revive if it ever had a successful payment
    if (existing.paymentStatus === 'SUCCEEDED' && existing.status !== 'CONFIRMED') {
      // This would be weird; safest is to create a new doc instead or force manual support
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Inconsistent previous payment state' });
    }

    const revived = await registrationRepository.update(existing._id as any, {
      status: RegistrationStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
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
  async getEventRegistrations(
    eventId: string,
    options?: { page?: number; limit?: number }
  ) {
    // Validate event exists
    const event = await eventService.getEventById(eventId);
    if (!event) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Event not found",
      });
    }

    return registrationRepository.getByEventId(eventId, options);
  }

  /**
   * Get registration count for an event
   */
  async getRegistrationCount(eventId: string): Promise<number> {
    return registrationRepository.countActiveForCapacity(eventId);
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
  async markAttended(
    registrationId: string
  ): Promise<IEventRegistration | null> {
    const registration = await registrationRepository.findById(registrationId);

    if (!registration || !registration.isActive) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Registration not found",
      });
    }

    if (registration.status !== "CONFIRMED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Only confirmed registrations can be marked as attended",
      });
    }

    return registrationRepository.update(registrationId, {
      attended: true,
    } as any);
  }

  /**
   * Issue certificate for registration (after event completion)
   * This is called automatically when a certificate is generated
   * For Student/Staff/TA/Professor: confirmed registration = attendance
   */
  async issueCertificate(
    registrationId: string
  ): Promise<IEventRegistration | null> {
    const registration = await registrationRepository.findById(registrationId);

    if (!registration || !registration.isActive) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Registration not found",
      });
    }

    if (registration.status !== "CONFIRMED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Only confirmed registrations can receive certificates",
      });
    }

    // Mark certificate as issued (registration implies attendance for Student/Staff/TA/Professor)
    return registrationRepository.update(registrationId, {
      certificateIssued: true,
      certificateIssuedAt: new Date(),
      attended: true, // Set attended flag when certificate is issued
    } as any);
  }

   async getMineForEvent(userId: string, eventId: string): Promise<RegistrationForEventResponse | null> {
    const doc = await registrationRepository.findMineForEvent(userId, eventId);
    if (!doc) return null;

    // Find the latest successful payment for this registration (needed for refunds)
    const latestPayment = await paymentRepository.findLatestForRegistration(String((doc as any)._id));
    const paymentId = latestPayment && (latestPayment as any).status === 'SUCCEEDED' 
      ? String((latestPayment as any)._id) 
      : null;

    // ensure hold expiry semantics only affect frontend label; we still return the stored status/holdUntil
    // frontend can decide to show "EXPIRED" if status=PENDING && holdUntil < now
    const payload: RegistrationForEventResponse = {
      id: String((doc as any)._id),
      eventId: String((doc as any).event),
      userId: String((doc as any).user),
      status: (doc as any).status, // "PENDING" | "CONFIRMED" | "WAITLISTED" | "CANCELLED"
      paymentAmount: (doc as any).paymentAmount ?? 0,
      currency: (doc as any).currency ?? null,
      holdUntil: (doc as any).holdUntil ?? null,
      paymentId,
      createdAt: (doc as any).createdAt,
      updatedAt: (doc as any).updatedAt,
    };

    return payload;
  }


}

export const registrationService = new RegistrationService();
