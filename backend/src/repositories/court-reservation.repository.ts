import { BaseRepository } from "./base.repository";
import { CourtReservation, type ICourtReservation } from "../models/court-reservation.model";
import { Types } from "mongoose";

export class CourtReservationRepository extends BaseRepository<ICourtReservation> {
  constructor() { super(CourtReservation); }

async findForCourtOnDay(courtId: string, dayStartUtc: Date, dayEndUtc: Date) {
  return this.model
    .find({
      court: new Types.ObjectId(courtId),
      status: { $ne: "CANCELLED" },        // don’t require "BOOKED" exactly
      startDate: { $lt: dayEndUtc },       // overlap: start < dayEnd
      endDate:   { $gt: dayStartUtc },     // and end > dayStart
    })
    .select({ startDate: 1, endDate: 1, status: 1, user: 1 })
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

async countOverlaps(courtId: string, start: Date, end: Date) {
  return this.model.countDocuments({
    court: new Types.ObjectId(courtId),
    status: { $ne: "CANCELLED" },
    startDate: { $lt: end },
    endDate:   { $gt: start },
  });
}

}
export const courtReservationRepository = new CourtReservationRepository();
