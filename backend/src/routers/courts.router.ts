import { router, publicProcedure, protectedProcedure, eventsOfficeProcedure } from "../trpc/trpc";
import { z } from "zod";
import { courtService } from "../services/court.service";
import { courtReservationService } from "../services/court-reservation.service";
import { CourtReservationCreateSchema, CourtReservationCancelSchema, CourtSport, CourtAvailabilityResponseSchema, CourtSummarySchema, CourtSummary, CourtCreateSchema, CourtUpdateSchema, CreateCourtBlackoutSchema, CourtBlackoutSchema } from "@event-manager/shared";
import { courtBlackoutRepository } from "../repositories/court-blackout.repository.js";

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

  // list my reservations (basic list for "My Reservations" panel)
  myReservations: protectedProcedure
    .input(z.object({ upcomingOnly: z.boolean().optional().default(true) }).optional())
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const filter: any = { user: (ctx.user!._id as any), isActive: { $ne: false } };
      if (input?.upcomingOnly) {
        filter.endDate = { $gt: now };
      }
      const rows = await courtReservationService.aggregate<any>([
        { $match: filter },
        { $lookup: { from: 'courts', localField: 'court', foreignField: '_id', as: 'court' } },
        { $unwind: { path: '$court', preserveNullAndEmptyArrays: true } },
        { $sort: { startDate: 1 } },
        { $project: {
            _id: 0,
            id: { $toString: '$_id' },
            courtId: { $toString: '$court._id' },
            courtName: '$court.name',
            sport: '$court.sport',
            startDate: 1,
            endDate: 1,
            duration: 1,
            status: 1,
        }},
      ]);
      return rows;
    }),

  // ================== ADMIN / EVENT OFFICE ==================
  // get full court details
  getCourt: eventsOfficeProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const doc: any = await courtService.findById(input.id);
      return {
        id: (doc._id as any).toString(),
        name: doc.name,
        sport: doc.sport,
        location: doc.location,
        tz: (doc as any).tz,
        slotMinutes: (doc as any).slotMinutes,
        maxConcurrent: (doc as any).maxConcurrent,
        openHours: (doc as any).openHours,
      } as any;
    }),
  // create court
  createCourt: eventsOfficeProcedure
    .input(CourtCreateSchema)
    .mutation(async ({ input, ctx }) => {
      const created = await courtService.create(input as any, { userId: (ctx.user!._id as any).toString() });
      return { id: (created._id as any).toString() };
    }),

  // update court
  updateCourt: eventsOfficeProcedure
    .input(CourtUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input as any;
      const updated = await courtService.update(id, data, { userId: (ctx.user!._id as any).toString() });
      return { id: (updated._id as any).toString() };
    }),

  // create blackout
  createBlackout: eventsOfficeProcedure
    .input(CreateCourtBlackoutSchema)
    .output(CourtBlackoutSchema)
    .mutation(async ({ input, ctx }) => {
      const doc = await courtBlackoutRepository.create({
        court: (input.courtId as any),
        startDate: input.start,
        endDate: input.end,
        reason: input.reason,
        createdBy: (ctx.user!._id as any),
      } as any);
      return {
        id: (doc._id as any).toString(),
        courtId: (doc.court as any).toString(),
        start: doc.startDate,
        end: doc.endDate,
        reason: doc.reason,
      };
    }),

  // delete blackout
  deleteBlackout: eventsOfficeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const existing = await courtBlackoutRepository.findById(input.id);
      if (!existing) return { deleted: false };
      await courtBlackoutRepository.permanentlyDelete(input.id);
      return { deleted: true };
    }),

  // list blackouts for a court and range (admin preview)
  listBlackouts: eventsOfficeProcedure
    .input(z.object({ courtId: z.string(), from: z.coerce.date(), to: z.coerce.date() }))
    .query(async ({ input }) => {
      const rows = await courtBlackoutRepository.findForCourtOnDay(input.courtId, input.from, input.to);
      return rows.map((b: any) => ({
        id: (b._id as any).toString(),
        courtId: (b.court as any).toString(),
        start: b.startDate,
        end: b.endDate,
        reason: b.reason,
      }));
    }),

    
});
