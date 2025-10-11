import { router, publicProcedure, protectedProcedure } from "../trpc/trpc";
import { z } from "zod";
import { courtService } from "../services/court.service";
import { courtReservationService } from "../services/court-reservation.service";
import { AvailabilityQuerySchema, CourtReservationCreateSchema, CourtReservationCancelSchema } from "@event-manager/shared";

export const courtsRouter = router({
  // list courts (optionally by sport)
  list: publicProcedure
    .input(z.object({ sport: z.enum(["BASKETBALL","TENNIS","FOOTBALL"]).optional() }).optional())
    .query(async ({ input }) => {
      if (input?.sport) {
        const courts = await courtService.findAll({ sport: input.sport, isDeleted: false });
        return courts.map(c => ({ id: (c._id as any).toString(), name: c.name, sport: c.sport, location: c.location }));
      }
      const courts = await courtService.findAll({ isDeleted: false });
      return courts.map(c => ({ id: (c._id as any).toString(), name: c.name, sport: c.sport, location: c.location }));
    }),

  // availability for a day
  availability: publicProcedure
    .input(AvailabilityQuerySchema)
    .query(async ({ input }) => {
      const res = await courtService.getAvailability({
        date: input.date,
        sport: input.sport as any,
        courtId: input.courtId,
        slotMinutes: input.slotMinutes,
      });
      return res;
    }),

  // create reservation (student)
  reserve: protectedProcedure
    .input(CourtReservationCreateSchema)
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user!;
      // auto-attach student name + GUC ID from user profile
      const studentName = `${(user as any).firstName ?? ""} ${(user as any).lastName ?? ""}`.trim() || "Student";
      const studentGucId = (user as any).gucId ?? (user as any).studentId ?? "UNKNOWN";
      const created = await courtReservationService.createReservation({
        courtId: input.courtId,
        userId: (user._id as any).toString(),
        studentName,
        studentGucId,
        startDate: input.startDate,
        duration: input.duration,
      });
      return { id: (created._id as any).toString(), status: created.status };
    }),

  // cancel reservation (student can cancel own)
  cancel: protectedProcedure
    .input(CourtReservationCancelSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      const updated = await courtReservationService.cancelReservation(input.id, userId);
      return { id: (updated._id as any).toString(), status: updated.status };
    }),
});
