/**
 * Registrations Router
 * 
 * Handles registration queries for authenticated users
 * Includes certificate generation for completed workshops
 * 
 * @module routers/registrations.router
 */

import { z } from "zod";
import { protectedProcedure, router } from "../trpc/trpc.js";
import { registrationService } from "../services/registration.service.js";
import { certificateService } from "../services/certificate.service.js";

export const registrationsRouter = router({
  /**
   * Get the current user's registration for a specific event
   * Returns registration details including status, payment amount, and hold expiry
   */
  getMyRegistrationForEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = String((ctx.user!._id as any));
      return registrationService.getMineForEvent(userId, input.eventId);
    }),

  /**
   * Generate certificate of attendance for a workshop
   * Requirement #30: Students receive certificates upon workshop completion
   * 
   * Returns base64-encoded PDF certificate
   */
  generateCertificate: protectedProcedure
    .input(
      z.object({
        registrationId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = String((ctx.user!._id as any));
      
      const pdfBuffer = await certificateService.generateCertificate(
        input.registrationId,
        userId
      );

      // Convert to base64 for transmission
      const base64 = Buffer.from(pdfBuffer).toString('base64');

      return {
        data: base64,
        filename: `certificate-${input.registrationId}.pdf`,
        mimeType: 'application/pdf',
      };
    }),

  /**
   * Send certificate via email
   * Requirement #30: Certificates sent via email
   */
  sendCertificateEmail: protectedProcedure
    .input(
      z.object({
        registrationId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = String((ctx.user!._id as any));
      
      await certificateService.sendCertificateEmail(userId, input.registrationId);

      return { success: true, message: 'Certificate email sent successfully' };
    }),
});
