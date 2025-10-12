import { router, publicProcedure, protectedProcedure, eventsOfficeProcedure } from "../trpc/trpc";
import { z } from "zod";
import { courtService } from "../services/court.service";
import { courtReservationService } from "../services/court-reservation.service";
import { AvailabilityQuerySchema, CourtReservationCreateSchema, CourtReservationCancelSchema } from "@event-manager/shared";
import { DateTime } from "luxon";
import { courtReservationRepository } from "../repositories/court-reservation.repository";

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
availability: protectedProcedure
  .input(AvailabilityQuerySchema.extend({ slotMinutes: z.number().default(60) }))
  .query(async ({ input, ctx }) => {
    const rows = await courtService.getAvailability(input);
    const me = (ctx.user!._id as any).toString();
    return rows.map(r => ({
      ...r,
      booked: r.booked.map((b: any) => ({
  id: b.id, startUtc: b.startUtc, endUtc: b.endUtc, hour: b.hour, status: b.status, byMe: b.userId === me
})),

    }));
  }),


  debugListReservations: eventsOfficeProcedure
  .input(z.object({
    courtId: z.string(),
    date: z.coerce.date(),
  }))
  .query(async ({ input }) => {
    const dayLocal = DateTime.fromJSDate(input.date, { zone: "Africa/Cairo" }).startOf("day");
    const nextLocal = dayLocal.plus({ days: 1 });
    const docs = await courtReservationRepository.findForCourtOnDay(
      input.courtId, dayLocal.toUTC().toJSDate(), nextLocal.toUTC().toJSDate()
    );
    return docs.map(d => ({
      id: d._id?.toString?.() ?? String(d._id),
      startUtc: d.startDate.toISOString(),
      endUtc: d.endDate.toISOString(),
      status: d.status,
      user: (d.user as any)?.toString?.() ?? String(d.user),
    }));
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
