import { BaseRepository } from "`./base.repository.js";
import { Court, type ICourt } from "`../models/court.model.js";

export class CourtRepository extends BaseRepository<ICourt> {
  constructor() { super(Court); }
  findBySport(sport: ICourt["sport"]) {
    return this.model.find({ sport, isActive: true }).lean();
  }
}
export const courtRepository = new CourtRepository();
