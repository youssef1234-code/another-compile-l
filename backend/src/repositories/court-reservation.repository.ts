import { BaseRepository } from "./base.repository";
import { CourtReservation, type ICourtReservation } from "../models/court-reservation.model";

export class CourtReservationRepository extends BaseRepository<ICourtReservation> {
  constructor() { super(CourtReservation); }

  async findForCourtOnDay(courtId: string, dayStart: Date, dayEnd: Date) {
    return this.model.find({
      court: courtId,
      status: "BOOKED",
      isDeleted: false,
      $or: [
        { startDate: { $lt: dayEnd }, endDate: { $gt: dayStart } }, // any overlap with the day
      ]
    }).sort({ startDate: 1 }).lean();
  }

  async hasOverlap(courtId: string, start: Date, end: Date, excludeId?: string) {
    const q: any = {
      court: courtId,
      status: "BOOKED",
      isDeleted: false,
      startDate: { $lt: end },
      endDate: { $gt: start },
    };
    if (excludeId) q._id = { $ne: excludeId };
    const count = await this.model.countDocuments(q);
    return count > 0;
  }
}
export const courtReservationRepository = new CourtReservationRepository();
