import {
  eventsOfficeProcedure,
  vendorProcedure,
  router,
  protectedProcedure,
} from "../trpc/trpc";
import { vendorApplicationService } from "../services/vendor-application.service";
import { qrBadgeService } from "../services/qr-badge.service";
import {
  ApplicationFilterSchema,
  CreateApplicationSchema,
  UpdateApplicationSchema,
} from "@event-manager/shared";
import { z } from "zod";

const applicationRoutes = {
  getApplications: protectedProcedure
    .input(ApplicationFilterSchema)
    .query(async ({ input, ctx }) => {
      const vendorId = (ctx.user!._id as any).toString();
      return vendorApplicationService.getApplications(input, vendorId);
    }),

  /**
   * Get application statistics
   * Requirements #75: View vendor participation requests with aggregated stats
   */
  getApplicationStats: protectedProcedure.query(async ({ ctx }) => {
    const vendorId = (ctx.user!._id as any).toString();
    return vendorApplicationService.getApplicationStats(vendorId);
  }),

  /**
   * Check if vendor has applied to specific bazaars
   * Returns bazaar IDs that vendor has already applied to
   */
  checkExistingApplications: protectedProcedure
    .input(z.object({ bazaarIds: z.array(z.string()) }))
    .query(async ({ input, ctx }) => {
      const vendorId = (ctx.user!._id as any).toString();
      return vendorApplicationService.checkExistingApplications(
        vendorId,
        input.bazaarIds
      );
    }),

  // getPending: eventsOfficeProcedure
  //   .input(
  //     z.object({
  //       page: z.number().min(1).optional().default(1),
  //       limit: z.number().min(1).max(100).optional().default(10),
  //     }),
  //   )
  //   .query(async ({ input }) => {
  //     return vendorApplicationService.getPendingApplications({
  //       page: input.page,
  //       limit: input.limit,
  //     });
  //   }),
  //
  // getUpcoming: vendorProcedure
  //   .input(
  //     z.object({
  //       id: z.string(),
  //       isAccepted: z.boolean(),
  //       page: z.number().min(1).optional().default(1),
  //       limit: z.number().min(1).max(100).optional().default(10),
  //     }),
  //   )
  //   .query(async ({ input }) => {
  //     return vendorApplicationService.getUpcoming(input.id, input.isAccepted, {
  //       page: input.page,
  //       limit: input.limit,
  //     });
  //   }),

  create: vendorProcedure
    .input(CreateApplicationSchema)
    .mutation(async ({ input, ctx }) => {
      const vendorId = (ctx.user!._id as any).toString();
      return vendorApplicationService.createApplication(input, vendorId);
    }),

  /**
   * Approve a vendor application
   * Requirements #77: Events Office/Admin accept vendor participation requests
   */
  approveApplication: eventsOfficeProcedure
    .input(
      z.object({
        applicationId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return vendorApplicationService.approveApplication(input.applicationId);
    }),

  /**
   * Reject a vendor application with reason
   * Requirements #77: Events Office/Admin reject vendor participation requests
   */
  rejectApplication: eventsOfficeProcedure
    .input(
      z.object({
        applicationId: z.string(),
        reason: z.string().min(1, "Rejection reason is required"),
      })
    )
    .mutation(async ({ input }) => {
      return vendorApplicationService.rejectApplication(
        input.applicationId,
        input.reason
      );
    }),

  /**
   * Cancel vendor application (Requirement #67)
   * Vendor can only cancel if payment has not been made
   */
  cancelApplication: vendorProcedure
    .input(z.object({ applicationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const vendorId = (ctx.user!._id as any).toString();
      return vendorApplicationService.cancelApplication(
        input.applicationId,
        vendorId
      );
    }),

  /**
   * Generate visitor badges (Requirement #66)
   * Download QR code badges for all registered visitors
   */
  generateVisitorBadges: vendorProcedure
    .input(z.object({ applicationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const vendorId = (ctx.user!._id as any).toString();
      const pdfBuffer = await qrBadgeService.generateAllBadgesForVendor(
        input.applicationId,
        vendorId
      );

      // Convert to base64 for transmission
      const base64 = pdfBuffer.toString("base64");

      return {
        data: base64,
        filename: `visitor-badges-${input.applicationId}-${Date.now()}.pdf`,
        mimeType: "application/pdf",
      };
    }),

  /**
   * Send visitor badges via email (Requirement #66)
   */
  sendVisitorBadges: vendorProcedure
    .input(z.object({ applicationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const vendorId = (ctx.user!._id as any).toString();
      await qrBadgeService.sendBadgesToVendor(input.applicationId, vendorId);
      return {
        success: true,
        message: "Badges sent to your email successfully",
      };
    }),

  update: eventsOfficeProcedure
    .input(
      z.object({
        id: z.string(),
        status: UpdateApplicationSchema.partial(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      return vendorApplicationService.update(input.id, input.status, {
        userId,
      });
    }),
};

export const vendorApplicationRouter = router(applicationRoutes);
