import { BaseRepository } from './base.repository';
import { CourtBlackout, type ICourtBlackout } from '../models/court-blackout.model';
import { Types } from 'mongoose';

export class CourtBlackoutRepository extends BaseRepository<ICourtBlackout> {
  constructor() { super(CourtBlackout); }

  findForCourtOnDay(courtId: string, dayStartUtc: Date, dayEndUtc: Date) {
    return this.model
      .find({
        court: new Types.ObjectId(courtId),
        startDate: { $lt: dayEndUtc },
        endDate: { $gt: dayStartUtc },
      })
      .select({ startDate: 1, endDate: 1, reason: 1 })
      .sort({ startDate: 1 })
      .lean();
  }
}

export const courtBlackoutRepository = new CourtBlackoutRepository();
