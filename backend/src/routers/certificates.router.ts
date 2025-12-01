/**
 * Certificates Router
 * 
 * tRPC router for certificate management operations
 * - Certificate status tracking
 * - Manual certificate trigger (Requirement #30)
 * - Certificate worker management
 * 
 * @module routers/certificates.router
 */

import { z } from "zod";
import { eventsOfficeProcedure, router } from "../trpc/trpc.js";
import { certificateWorkerService, type CertificateJobResult } from "../services/certificate-worker.service.js";
import { EventRegistration } from "../models/registration.model.js";

// Re-export for type inference
export type { CertificateJobResult };

export const certificatesRouter = router({
  /**
   * Get certificate status for a workshop
   * Shows how many certificates sent/pending
   */
  getCertificateStatus: eventsOfficeProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return certificateWorkerService.getCertificateStatus(input.eventId);
    }),

  /**
   * Manual trigger: Send all pending certificates NOW
   * Only sends to those who haven't received yet (idempotent)
   */
  triggerCertificatesNow: eventsOfficeProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await certificateWorkerService.triggerCertificatesNow(input.eventId);
      return {
        success: true,
        ...result,
        message: `Sent ${result.sent} certificates, skipped ${result.skipped}, failed ${result.failed}`,
      };
    }),

  /**
   * Get attendees for a workshop with certificate status
   */
  getWorkshopAttendees: eventsOfficeProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const registrations = await EventRegistration.find({
        event: input.eventId,
        status: 'CONFIRMED',
        attended: true,
      })
        .populate('user', 'firstName lastName email studentId gucId')
        .lean();

      const attendees = registrations.map((reg: any) => ({
        registrationId: String(reg._id),
        userId: String(reg.user?._id),
        name: reg.user ? `${reg.user.firstName} ${reg.user.lastName}` : 'Unknown',
        email: reg.user?.email || 'N/A',
        studentId: reg.user?.studentId || reg.user?.gucId || 'N/A',
        attended: reg.attended,
        certificateSentAt: reg.certificateSentAt || null,
      }));

      return {
        eventId: input.eventId,
        total: attendees.length,
        certificatesSent: attendees.filter((a) => a.certificateSentAt).length,
        certificatesPending: attendees.filter((a) => !a.certificateSentAt).length,
        attendees,
      };
    }),

  /**
   * Run the certificate worker (Admin/Events Office cron trigger)
   * Processes all recent completed workshops
   */
  runCertificateWorker: eventsOfficeProcedure.mutation(async () => {
    const results = await certificateWorkerService.runCertificateWorker();
    return {
      success: true,
      workshopsProcessed: results.length,
      results,
    };
  }),
});
