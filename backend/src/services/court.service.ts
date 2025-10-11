import { BaseService } from "./base.service";
import { CourtRepository, courtRepository } from "../repositories/court.repository";
import type { ICourt } from "../models/court.model";
import { courtReservationRepository } from "../repositories/court-reservation.repository";

export class CourtService extends BaseService<ICourt, CourtRepository> {
  constructor(repo: CourtRepository){ super(repo); }
  protected getEntityName(): string { return "Court"; }

  /**
   * Compute free time slots for a day for each court (or filtered by sport/court)
   * openingHours: 08:00-22:00 (example), slotMinutes controls granularity
   */
  async getAvailability(params: {
    date: Date;
    sport?: ICourt["sport"];
    courtId?: string;
    slotMinutes: number;
    openHour?: number;  // default 8
    closeHour?: number; // default 22
  }) {
    const openHour = params.openHour ?? 8;
    const closeHour = params.closeHour ?? 22;

    const dayStart = new Date(Date.UTC(
      params.date.getUTCFullYear(), params.date.getUTCMonth(), params.date.getUTCDate(), 0, 0, 0, 0
    ));
    const dayEnd = new Date(Date.UTC(
      params.date.getUTCFullYear(), params.date.getUTCMonth(), params.date.getUTCDate()+1, 0, 0, 0, 0
    ));

    // get candidate courts
    let courts: ICourt[];
    if (params.courtId) {
      const one = await this.repository.findById(params.courtId);
      courts = one ? [one] : [];
    } else if (params.sport) {
      courts = await this.repository.findAll({ sport: params.sport, isDeleted: false });
    } else {
      courts = await this.repository.findAll({ isDeleted: false });
    }

    // for each court, get booked intervals, compute free slots
    const results: any[] = [];
    for (const c of courts) {
      const booked = await courtReservationRepository.findForCourtOnDay((c._id as any).toString(), dayStart, dayEnd);

      // Build a timeline of occupied intervals (UTC)
      const occ = booked.map(b => [new Date(b.startDate), new Date(b.endDate)] as const);

      const slots: { start: Date; end: Date }[] = [];
      // window from openHour to closeHour (UTC by campus time; keep UTC consistent end-to-end)
      let cursor = new Date(Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), dayStart.getUTCDate(), openHour, 0, 0));
      const hardClose = new Date(Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), dayStart.getUTCDate(), closeHour, 0, 0));

      while (new Date(cursor.getTime() + params.slotMinutes*60000) <= hardClose) {
        const slotEnd = new Date(cursor.getTime() + params.slotMinutes*60000);
        const overlaps = occ.some(([s,e]) => s < slotEnd && e > cursor);
        if (!overlaps) {
          slots.push({ start: new Date(cursor), end: slotEnd });
        }
        cursor = new Date(cursor.getTime() + params.slotMinutes*60000); // step one slot; could step smaller if you want
      }

      results.push({
        court: { id: (c._id as any).toString(), name: c.name, sport: c.sport, location: c.location },
        availableSlots: slots,
        booked, // optional: return existing reservations if you want
      });
    }

    return results;
  }
}
export const courtService = new CourtService(courtRepository);
