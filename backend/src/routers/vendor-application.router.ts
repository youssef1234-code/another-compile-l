import {
  eventsOfficeProcedure,
  vendorProcedure,
  router,
  protectedProcedure,
} from "../trpc/trpc";
import { vendorApplicationService } from "../services/vendor-application.service";
import {
  ApplicationFilterSchema,
  CreateApplicationSchema,
  UpdateApplicationSchema,
} from "@event-manager/shared";
import { z } from "zod";

const applicationRoutes = {
  getApplications: protectedProcedure
    .input(ApplicationFilterSchema)
    .query(async ({ input }) => {
      return vendorApplicationService.getApplications(input);
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

  update: eventsOfficeProcedure
    .input(
      z.object({
        id: z.string(),
        status: UpdateApplicationSchema.partial(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      return vendorApplicationService.update(input.id, input.status, {
        userId,
      });
    }),
};

export const vendorApplicationRouter = router(applicationRoutes);
