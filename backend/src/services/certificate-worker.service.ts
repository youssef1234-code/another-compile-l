/**
 * Certificate Worker Service
 * 
 * Automated certificate distribution for completed workshops
 * Requirement #30: Students receive certificates upon workshop completion
 * 
 * Features:
 * - Automatic certificate sending after workshop ends
 * - Tracks which certificates have been sent (prevents duplicates)
 * - Manual trigger option for Events Office
 * - Worker can be scheduled via cron job
 * 
 * @module services/certificate-worker.service
 */

import { Event } from '../models/event.model';
import { EventRegistration } from '../models/registration.model';
import { certificateService } from './certificate.service';
import { mailService } from './mail.service';
import { ServiceError } from '../errors/errors';

export interface CertificateJobResult {
  eventId: string;
  eventName: string;
  total: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: string[];
}

class CertificateWorkerService {
  /**
   * Process certificates for a single event
   * Only sends to attendees who haven't received certificates yet
   */
  async processEventCertificates(eventId: string): Promise<CertificateJobResult> {
    const event = await Event.findById(eventId).lean();
    
    if (!event) {
      throw new ServiceError('NOT_FOUND', 'Event not found', 404);
    }

    // Only workshops get certificates
    if (event.type !== 'WORKSHOP') {
      throw new ServiceError(
        'BAD_REQUEST',
        'Certificates are only available for workshops',
        400
      );
    }

    // Verify event has ended
    const now = new Date();
    const eventEndDate = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
    if (eventEndDate > now) {
      throw new ServiceError(
        'BAD_REQUEST',
        'Certificates can only be sent after the workshop has ended',
        400
      );
    }

    const result: CertificateJobResult = {
      eventId,
      eventName: event.name,
      total: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    // Find all confirmed registrations who attended but haven't received certificate email
    const registrations = await EventRegistration.find({
      event: eventId,
      status: 'CONFIRMED',
      attended: true,
      certificateSentAt: { $exists: false }, // Only those who haven't received email
    }).populate('user');

    result.total = registrations.length;

    for (const registration of registrations) {
      try {
        const user = registration.user as any;
        if (!user || !user.email) {
          result.skipped++;
          continue;
        }

        // Generate certificate PDF
        const pdfBuffer = await certificateService.generateCertificate(
          String(registration._id),
          String(user._id)
        );

        // Send email with certificate
        await mailService.sendCertificateEmail(user.email, {
          attendeeName: `${user.firstName} ${user.lastName}`,
          workshopTitle: event.name,
          pdfBuffer,
        });

        // Mark certificate as sent
        await EventRegistration.findByIdAndUpdate(registration._id, {
          certificateSentAt: new Date(),
        });

        result.sent++;
        console.log(`📜 Certificate sent to ${user.email} for ${event.name}`);
      } catch (error: any) {
        result.failed++;
        result.errors.push(`User ${(registration.user as any)?._id}: ${error.message}`);
        console.error(`❌ Failed to send certificate:`, error.message);
      }
    }

    console.log(`📜 Certificate job for "${event.name}": ${result.sent} sent, ${result.skipped} skipped, ${result.failed} failed`);
    return result;
  }

  /**
   * Manual trigger: Send certificates NOW for a workshop
   * Called by Events Office via API
   * Only sends to those who haven't received yet
   */
  async triggerCertificatesNow(eventId: string): Promise<CertificateJobResult> {
    console.log(`📜 Manual certificate trigger for event ${eventId}`);
    return this.processEventCertificates(eventId);
  }

  /**
   * Worker job: Process all completed workshops
   * Called by scheduled cron job
   * Finds workshops that ended and have unsent certificates
   */
  async runCertificateWorker(): Promise<CertificateJobResult[]> {
    console.log(`📜 Starting certificate worker job...`);
    const now = new Date();
    const results: CertificateJobResult[] = [];

    // Find all completed workshops (ended within last 7 days to avoid processing old events)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const workshops = await Event.find({
      type: 'WORKSHOP',
      status: { $in: ['PUBLISHED', 'COMPLETED'] },
      endDate: { $lte: now, $gte: sevenDaysAgo },
    }).lean();

    console.log(`📜 Found ${workshops.length} recently completed workshops to process`);

    for (const workshop of workshops) {
      // Check if there are any unsent certificates for this workshop
      const unsentCount = await EventRegistration.countDocuments({
        event: workshop._id,
        status: 'CONFIRMED',
        attended: true,
        certificateSentAt: { $exists: false },
      });

      if (unsentCount > 0) {
        try {
          const result = await this.processEventCertificates(String(workshop._id));
          results.push(result);
        } catch (error: any) {
          console.error(`❌ Failed to process certificates for ${workshop.name}:`, error.message);
          results.push({
            eventId: String(workshop._id),
            eventName: workshop.name,
            total: unsentCount,
            sent: 0,
            skipped: 0,
            failed: unsentCount,
            errors: [error.message],
          });
        }
      }
    }

    console.log(`📜 Certificate worker completed. Processed ${results.length} workshops.`);
    return results;
  }

  /**
   * Get certificate status for an event
   * Shows how many certificates have been sent vs pending
   */
  async getCertificateStatus(eventId: string): Promise<{
    eventId: string;
    eventName: string;
    totalAttendees: number;
    certificatesSent: number;
    certificatesPending: number;
    canSendNow: boolean;
    reason?: string;
  }> {
    const event = await Event.findById(eventId).lean();
    
    if (!event) {
      throw new ServiceError('NOT_FOUND', 'Event not found', 404);
    }

    const now = new Date();
    const eventEndDate = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
    const hasEnded = eventEndDate <= now;

    // Count attendees
    const totalAttendees = await EventRegistration.countDocuments({
      event: eventId,
      status: 'CONFIRMED',
      attended: true,
    });

    const certificatesSent = await EventRegistration.countDocuments({
      event: eventId,
      status: 'CONFIRMED',
      attended: true,
      certificateSentAt: { $exists: true },
    });

    const certificatesPending = totalAttendees - certificatesSent;

    let canSendNow = false;
    let reason: string | undefined;

    if (event.type !== 'WORKSHOP') {
      reason = 'Certificates are only available for workshops';
    } else if (!hasEnded) {
      reason = 'Workshop has not ended yet';
    } else if (certificatesPending === 0) {
      reason = 'All certificates have already been sent';
    } else {
      canSendNow = true;
    }

    return {
      eventId,
      eventName: event.name,
      totalAttendees,
      certificatesSent,
      certificatesPending,
      canSendNow,
      reason,
    };
  }
}

export const certificateWorkerService = new CertificateWorkerService();
