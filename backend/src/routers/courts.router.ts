import { router, publicProcedure, protectedProcedure, eventsOfficeProcedure } from "../trpc/trpc";
import { z } from "zod";
import { courtService } from "../services/court.service";
import { courtReservationService } from "../services/court-reservation.service";
import { AvailabilityQuerySchema, CourtReservationCreateSchema, CourtReservationCancelSchema, CourtSport } from "@event-manager/shared";


const CourtListInput = z.object({
  // allow omitting sport => return all
  sport: z.nativeEnum(CourtSport).optional().or(z.literal("ALL").optional()),
});
export const courtsRouter = router({
  // list courts (optionally by sport)
  list: publicProcedure
    .input(CourtListInput.optional())
     .query(async ({ input }) => {
      const filter =
        input?.sport && input.sport !== "ALL" ? { sport: input.sport } : {};
      return courtService.findAll(filter, { sort: { name: 1 } });
    }),

 availability : protectedProcedure
  .input(
    z.object({
      date: z.coerce.date(),
      // if courtId is given, ignore sport; otherwise sport is optional (or "ALL")
      courtId: z.string().optional(),
      sport: z.nativeEnum(CourtSport).optional().or(z.literal("ALL").optional()),
      slotMinutes: z.number().default(60),
      openHour: z.number().min(0).max(23).optional(),   // optional, defaults in service
      closeHour: z.number().min(1).max(24).optional(),  // optional, defaults in service
    })
  )
  .query(async ({ input, ctx }) => {
    const sport =
      input.courtId
        ? undefined
        : input.sport && input.sport !== "ALL"
        ? input.sport
        : undefined;

    const me = (ctx.user!._id as any).toString();

    const rows = await courtService.getAvailability({
      date: input.date,
      courtId: input.courtId,
      sport,
      slotMinutes: input.slotMinutes,
      openHour: input.openHour,
      closeHour: input.closeHour,
      me, // pass current user id for byMe tagging
    });
    return rows;
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
