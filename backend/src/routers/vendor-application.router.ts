import { eventsOfficeProcedure, vendorProcedure, router } from "../trpc/trpc";
import { createSearchSchema } from "./base.router";
import { vendorApplicationService } from "../services/vendor-application.service";
import { CreateApplicationSchema } from "@event-manager/shared";
import { z } from "zod";

const applicationRoutes = {
  getApplications: eventsOfficeProcedure
    .input(
      z.object({
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(10),
      }),
    )
    .query(async ({ input }) => {
      return vendorApplicationService.getAllApplications({
        page: input.page,
        limit: input.limit,
      });
    }),

  getPending: eventsOfficeProcedure
    .input(
      z.object({
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(10),
      }),
    )
    .query(async ({ input }) => {
      return vendorApplicationService.getPendingApplications({
        page: input.page,
        limit: input.limit,
      });
    }),

  getUpcoming: vendorProcedure
    .input(
      z.object({
        id: z.string(),
        isAccepted: z.boolean(),
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(10),
      }),
    )
    .query(async ({ input }) => {
      return vendorApplicationService.getUpcoming(input.id, input.isAccepted, {
        page: input.page,
        limit: input.limit,
      });
    }),

  create: vendorProcedure
    .input(CreateApplicationSchema)
    .mutation(async ({ input, ctx }) => {
      const vendorId = (ctx.user!._id as any).toString();
      return vendorApplicationService.create(input, vendorId);
    }),
};

export const vendorApplicationRouter = router(applicationRoutes);
