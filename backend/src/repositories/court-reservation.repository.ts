import { BaseRepository } from "./base.repository";
import { CourtReservation, type ICourtReservation } from "../models/court-reservation.model";
import { Types } from "mongoose";
import { Court } from "../models/court.model";

export class CourtReservationRepository extends BaseRepository<ICourtReservation> {
  constructor() { super(CourtReservation); }

async findForCourtOnDay(courtId: string, dayStartUtc: Date, dayEndUtc: Date) {
  return this.model
    .find({
      court: new Types.ObjectId(courtId),
      status: { $ne: "CANCELLED" },        // don't require "BOOKED" exactly
      startDate: { $lt: dayEndUtc },       // overlap: start < dayEnd
      endDate:   { $gt: dayStartUtc },     // and end > dayStart
    })
    .select({ startDate: 1, endDate: 1, status: 1, user: 1, studentName: 1, studentGucId: 1 })
    .sort({ startDate: 1 })
    .lean();
}

async hasOverlap(courtId: string, start: Date, end: Date) {
  const count = await this.model.countDocuments({
    court: new Types.ObjectId(courtId),
    status: { $ne: "CANCELLED" },
    startDate: { $lt: end },
    endDate:   { $gt: start },
  });
  return count > 0;
}

/**
 * Get all registrations with filters for admin/event office view
 */
async getAllRegistrations({
  startDate,
  endDate,
  sport,
  courtId,
  status,
  search,
  skip = 0,
  limit = 100,
  sorting,
}: {
  startDate: Date;
  endDate: Date;
  sport?: string;
  courtId?: string;
  status?: string;
  search?: string;
  skip?: number;
  limit?: number;
  sorting?: Array<{ id: string; desc: boolean }>;
}) {
  // Build query
  const query: any = {
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  };

  if (courtId) {
    query.court = new Types.ObjectId(courtId);
  }

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { studentName: { $regex: search, $options: 'i' } },
      { studentGucId: { $regex: search, $options: 'i' } },
    ];
  }

  // If sport filter is provided, we need to filter by court's sport
  let courtIds: Types.ObjectId[] | undefined;
  if (sport) {
    const courts = await Court.find({ sport, isActive: true }).select('_id').lean();
    courtIds = courts.map(c => c._id as Types.ObjectId);
    query.court = courtId 
      ? new Types.ObjectId(courtId) 
      : { $in: courtIds };
  }

  // Build sort object from sorting array
  const sortObj: Record<string, 1 | -1> = {};
  if (sorting && sorting.length > 0) {
    for (const sort of sorting) {
      // Map frontend column ids to database fields
      const fieldMap: Record<string, string> = {
        startDate: 'startDate',
        endDate: 'endDate',
        studentName: 'studentName',
        studentGucId: 'studentGucId',
        status: 'status',
      };
      const field = fieldMap[sort.id] || sort.id;
      sortObj[field] = sort.desc ? -1 : 1;
    }
  } else {
    // Default sort
    sortObj.startDate = -1;
  }

  // Get total count for pagination
  const total = await this.model.countDocuments(query);

  // Execute query with population
  const reservations = await this.model
    .find(query)
    .populate({
      path: 'court',
      select: 'name sport location',
    })
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .lean();

  // Transform results
  const registrations = reservations.map(r => ({
    id: (r._id as any).toString(),
    courtId: (r.court as any)?._id?.toString() || (r.court as any)?.toString(),
    courtName: (r.court as any)?.name || 'Unknown Court',
    sport: (r.court as any)?.sport || 'BASKETBALL',
    location: (r.court as any)?.location || 'ON_CAMPUS',
    studentName: r.studentName,
    studentGucId: r.studentGucId,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    status: r.status,
  }));

  return { registrations, total };
}

}
export const courtReservationRepository = new CourtReservationRepository();
