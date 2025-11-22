import { router, publicProcedure, protectedProcedure } from "../trpc/trpc";
import { z } from "zod";
import { courtService } from "../services/court.service";
import { courtReservationService } from "../services/court-reservation.service";
import type { CourtSummary } from "@event-manager/shared";
import { CourtReservationCreateSchema, CourtReservationCancelSchema, CourtSport, CourtAvailabilityResponseSchema, CourtSummarySchema } from "@event-manager/shared";

export const courtsRouter = router({
   
  
 list: publicProcedure
  .input(z.object({ sport: z.nativeEnum(CourtSport).optional() }).optional())
  .output(z.array(CourtSummarySchema))
  .query(async ({ input }) => {
    const match: any = { isActive: true };

    if (input?.sport) match.sport = input.sport;
      const rows = await courtService.aggregate<CourtSummary>([
      { $match: match },
      {
        $project: {
          _id: 0,                       
          id: { $convert: { input: '$_id', to: 'string' } },
          name: 1,
          sport: 1,
          location: 1,                  
        },
      },
      { $sort: { name: 1 } },
    ]);
    return rows;
  }),


availability: publicProcedure
  .input(
    z.object({
      date: z.coerce.date(),
      courtId: z.string().optional(),
      sport: z.nativeEnum(CourtSport).optional(),   
      slotMinutes: z.number().default(60),
    })
  )
  .output(CourtAvailabilityResponseSchema) 
  .query(async ({ input, ctx }) => {
    const me = (ctx.user?._id as any)?.toString?.();
    return courtService.getAvailability({
      date: input.date as Date,
      courtId: typeof input.courtId === "string" ? input.courtId : undefined,
      sport: input.sport,
      slotMinutes: Number(input.slotMinutes ?? 60),
      me,
    });
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
