/**
 * QR Codes Router
 * 
 * tRPC router for QR code management operations
 * - QR code generation for event visitors (Requirement #51)
 * - Vendor visitor QR codes
 * 
 * @module routers/qr-codes.router
 */

import { z } from "zod";
import { eventsOfficeProcedure, router } from "../trpc/trpc.js";
import { qrBadgeService } from "../services/qr-badge.service.js";
import { EventRegistration } from "../models/registration.model.js";
import { VendorApplication } from "../models/vendor-application.model.js";

export const qrCodesRouter = router({
  // ============================================
  // QR CODE MANAGEMENT FOR EVENT VISITORS
  // ============================================

  /**
   * Generate and save QR code for a single registration
   */
  generateVisitorQR: eventsOfficeProcedure
    .input(
      z.object({
        registrationId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const qrCode = await qrBadgeService.generateAndSaveVisitorQR(input.registrationId);
      return {
        success: true,
        qrCode,
        message: 'QR code generated and saved',
      };
    }),

  /**
   * Generate QR codes for all registrations of an event
   */
  generateAllVisitorQRs: eventsOfficeProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await qrBadgeService.generateAllVisitorQRsForEvent(input.eventId);
      return {
        success: true,
        generated: result.generated,
        skipped: result.skipped,
        message: `Generated ${result.generated} QR codes, skipped ${result.skipped} existing`,
      };
    }),

  /**
   * Send QR code email to a visitor (and vendor if applicable)
   */
  sendVisitorQREmail: eventsOfficeProcedure
    .input(
      z.object({
        registrationId: z.string(),
        vendorEmail: z.string().email().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await qrBadgeService.sendVisitorQREmail(input.registrationId, input.vendorEmail);
      return {
        success: true,
        message: 'QR code email sent successfully',
      };
    }),

  /**
   * Get QR code status for event registrations
   * Shows which registrations have QR codes generated/sent
   */
  getEventQRStatus: eventsOfficeProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const registrations = await EventRegistration.find({
        event: input.eventId,
        status: { $in: ['CONFIRMED', 'PENDING'] },
      })
        .populate('user', 'firstName lastName email studentId gucId')
        .lean();

      const stats = {
        total: registrations.length,
        generated: 0,
        sent: 0,
        pending: 0,
      };

      const participants = registrations.map((reg: any) => {
        const hasQR = !!reg.qrCode;
        const wasSent = !!reg.qrCodeSentAt;

        if (hasQR) stats.generated++;
        if (wasSent) stats.sent++;
        if (!hasQR) stats.pending++;

        return {
          registrationId: String(reg._id),
          userId: String(reg.user?._id),
          name: reg.user ? `${reg.user.firstName} ${reg.user.lastName}` : 'Unknown',
          email: reg.user?.email || 'N/A',
          studentId: reg.user?.studentId || reg.user?.gucId || 'N/A',
          status: reg.status,
          hasQRCode: hasQR,
          qrCodeGeneratedAt: reg.qrCodeGeneratedAt || null,
          qrCodeSentAt: reg.qrCodeSentAt || null,
          qrCode: reg.qrCode || null,
        };
      });

      return {
        eventId: input.eventId,
        stats,
        participants,
      };
    }),

  // ============================================
  // QR CODE MANAGEMENT FOR VENDOR VISITORS
  // ============================================

  /**
   * Generate QR codes for all visitors of a vendor application
   */
  generateVendorVisitorQRs: eventsOfficeProcedure
    .input(
      z.object({
        applicationId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const qrCodes = await qrBadgeService.generateAndSaveVendorVisitorQRs(input.applicationId);
      return {
        success: true,
        count: qrCodes.length,
        qrCodes,
        message: `Generated ${qrCodes.length} QR codes for vendor visitors`,
      };
    }),

  /**
   * Send QR code email to a specific vendor visitor
   */
  sendVendorVisitorQREmail: eventsOfficeProcedure
    .input(
      z.object({
        applicationId: z.string(),
        visitorIndex: z.number().min(0),
      })
    )
    .mutation(async ({ input }) => {
      await qrBadgeService.sendVendorVisitorQREmail(input.applicationId, input.visitorIndex);
      return {
        success: true,
        message: 'QR code email sent to visitor and vendor',
      };
    }),

  /**
   * Get QR code status for vendor application visitors
   */
  getVendorVisitorQRStatus: eventsOfficeProcedure
    .input(
      z.object({
        applicationId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const application = await VendorApplication.findById(input.applicationId)
        .populate('bazaarId', 'name startDate location')
        .populate('createdBy', 'firstName lastName email companyName')
        .lean() as any;

      if (!application) {
        return null;
      }

      const names = application.names || [];
      const emails = application.emails || [];
      const qrCodes = application.qrCodes || [];
      const qrCodesSentAt = application.qrCodesSentAt || [];

      const visitors = names.map((name: string, index: number) => ({
        index,
        name,
        email: emails[index] || 'N/A',
        hasQRCode: !!qrCodes[index],
        qrCode: qrCodes[index] || null,
        qrCodeSentAt: qrCodesSentAt[index] || null,
      }));

      return {
        applicationId: input.applicationId,
        companyName: application.companyName,
        vendorName: application.createdBy
          ? `${application.createdBy.firstName} ${application.createdBy.lastName}`
          : 'Unknown',
        vendorEmail: application.createdBy?.email || 'N/A',
        eventName: application.bazaarId?.name || application.bazaarName || 'Unknown',
        eventDate: application.bazaarId?.startDate || null,
        qrCodesGeneratedAt: application.qrCodesGeneratedAt || null,
        stats: {
          total: names.length,
          generated: qrCodes.filter(Boolean).length,
          sent: qrCodesSentAt.filter(Boolean).length,
        },
        visitors,
      };
    }),
});
