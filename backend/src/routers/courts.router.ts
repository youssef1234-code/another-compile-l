import { router, publicProcedure, protectedProcedure, adminOrEventOfficeProcedure } from "../trpc/trpc";
import { z } from "zod";
import { courtService } from "../services/court.service";
import { courtReservationService } from "../services/court-reservation.service";
import { courtReservationRepository } from "../repositories/court-reservation.repository";
import type { CourtSummary } from "../shared/index.js";
import { 
  CourtReservationCreateSchema, 
  CourtReservationCancelSchema, 
  CourtSport, 
  CourtAvailabilityResponseSchema, 
  CourtSummarySchema,
  CreateCourtSchema,
  UpdateCourtSchema
} from "../shared/index.js";

export const courtsRouter = router({
   
  // Admin: Create court
  create: adminOrEventOfficeProcedure
    .input(CreateCourtSchema)
    .mutation(async ({ input }: { input: z.infer<typeof CreateCourtSchema> }) => {
      const court = await courtService.create(input);
      return { 
        id: (court._id as any).toString(), 
        name: court.name,
        sport: court.sport,
        location: court.location 
      };
    }),

  // Admin: Update court
  update: adminOrEventOfficeProcedure
    .input(UpdateCourtSchema)
    .mutation(async ({ input }: { input: z.infer<typeof UpdateCourtSchema> }) => {
      const { id, ...updateData } = input;
      const court = await courtService.update(id, updateData);
      if (!court) throw new Error("Court not found");
      return { 
        id: (court._id as any).toString(), 
        name: court.name,
        sport: court.sport,
        location: court.location 
      };
    }),

  // Admin: Delete court
  delete: adminOrEventOfficeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }: { input: { id: string } }) => {
      await courtService.delete(input.id);
      return { success: true };
    }),

  // Admin/Event Office: Get all courts (including details) with pagination and filters
  getAll: adminOrEventOfficeProcedure
    .input(
      z.object({
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(50),
        search: z.string().optional(),
        // Simple filters
        filters: z.record(z.array(z.string())).optional(),
        // Advanced filters
        extendedFilters: z.array(z.object({
          id: z.string(),
          value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
          operator: z.enum([
            "iLike",
            "notILike",
            "eq",
            "ne",
            "isEmpty",
            "isNotEmpty",
            "lt",
            "lte",
            "gt",
            "gte",
            "inArray",
            "notInArray",
          ]),
          variant: z.enum([
            "text",
            "number",
            "range",
            "date",
            "dateRange",
            "boolean",
            "select",
            "multiSelect",
          ]),
          filterId: z.string(),
        })).optional(),
        // Sorting
        sorting: z.array(z.object({
          id: z.string(),
          desc: z.boolean(),
        })).optional(),
      })
    )
    .query(async ({ input }) => {
      const page = input.page || 1;
      const limit = input.limit || 50;
      const skip = (page - 1) * limit;

      // Build MongoDB query
      const query: any = {};

      // Global search (name or location)
      if (input.search) {
        query.$or = [
          { name: { $regex: input.search, $options: 'i' } },
          { location: { $regex: input.search, $options: 'i' } },
          { description: { $regex: input.search, $options: 'i' } },
        ];
      }

      // Simple faceted filters (e.g., sport: ['BASKETBALL', 'TENNIS'])
      if (input.filters) {
        Object.entries(input.filters).forEach(([key, values]) => {
          if (values && values.length > 0) {
            query[key] = { $in: values };
          }
        });
      }

      // Advanced filters with operators
      if (input.extendedFilters && input.extendedFilters.length > 0) {
        input.extendedFilters.forEach((filter) => {
          const { id, value, operator } = filter;
          
          // Skip empty values for non-empty-check operators
          if (operator !== "isEmpty" && operator !== "isNotEmpty") {
            if (Array.isArray(value) && value.length === 0) return;
            if (typeof value === "string" && !value.trim()) return;
          }
          
          switch (operator) {
            case 'iLike':
              query[id] = { $regex: value, $options: 'i' };
              break;
            case 'notILike':
              query[id] = { $not: { $regex: value, $options: 'i' } };
              break;
            case 'eq':
              query[id] = value;
              break;
            case 'ne':
              query[id] = { $ne: value };
              break;
            case 'isEmpty':
              query[id] = { $in: [null, "", []] };
              break;
            case 'isNotEmpty':
              query[id] = { $nin: [null, "", []] };
              break;
            case 'inArray':
              query[id] = { $in: Array.isArray(value) ? value : [value] };
              break;
            case 'notInArray':
              query[id] = { $nin: Array.isArray(value) ? value : [value] };
              break;
            case 'lt':
              query[id] = { $lt: value };
              break;
            case 'lte':
              query[id] = { $lte: value };
              break;
            case 'gt':
              query[id] = { $gt: value };
              break;
            case 'gte':
              query[id] = { $gte: value };
              break;
            default:
              query[id] = value;
          }
        });
      }

      // Build sort object
      const sort: any = {};
      if (input.sorting && input.sorting.length > 0) {
        input.sorting.forEach((s) => {
          sort[s.id] = s.desc ? -1 : 1;
        });
      } else {
        sort.name = 1; // Default sort by name
      }

      // Execute query
      const [courts, total] = await Promise.all([
        courtService.findAll(query, { skip, limit, sort }),
        courtService.count(query),
      ]);

      return {
        data: courts.map(court => ({
          id: (court._id as any).toString(),
          name: court.name,
          sport: court.sport,
          location: court.location,
          description: court.description,
          specs: court.specs,
          customInstructions: court.customInstructions,
          images: court.images || [],
          coordinates: court.coordinates,
        })),
        pageCount: Math.ceil(total / limit),
        total,
      };
    }),

  // Public: Get court details by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const court = await courtService.findById(input.id);
      if (!court) throw new Error("Court not found");
      return {
        id: (court._id as any).toString(),
        name: court.name,
        sport: court.sport,
        location: court.location,
        description: court.description,
        specs: court.specs,
        customInstructions: court.customInstructions,
        images: court.images || [],
        coordinates: court.coordinates,
      };
    }),
  
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

  // Admin/Event Office: Get all registrations with filters
  getAllRegistrations: adminOrEventOfficeProcedure
    .input(z.object({
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      sport: z.nativeEnum(CourtSport).optional(),
      courtId: z.string().optional(),
      status: z.string().optional(),
      search: z.string().optional(),
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(500).optional().default(100),
      sorting: z.array(z.object({
        id: z.string(),
        desc: z.boolean(),
      })).optional(),
    }))
    .query(async ({ input }) => {
      const result = await courtReservationRepository.getAllRegistrations({
        startDate: input.startDate,
        endDate: input.endDate,
        sport: input.sport,
        courtId: input.courtId,
        status: input.status,
        search: input.search,
        skip: (input.page - 1) * input.limit,
        limit: input.limit,
        sorting: input.sorting,
      });
      
      return {
        registrations: result.registrations,
        total: result.total,
        pageCount: Math.ceil(result.total / input.limit),
      };
    }),
    
});
