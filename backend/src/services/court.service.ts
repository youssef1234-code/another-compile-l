import { BaseService } from "./base.service";
import { CourtRepository, courtRepository } from "../repositories/court.repository";
import type { ICourt } from "../models/court.model";
import { courtReservationRepository } from "../repositories/court-reservation.repository";
import { DateTime } from "luxon";
const CAMPUS_TZ = "Africa/Cairo";

export class CourtService extends BaseService<ICourt, CourtRepository> {
  constructor(repo: CourtRepository){ super(repo); }
  protected getEntityName(): string { return "Court"; }

  
async getAvailability({ date, sport, courtId, slotMinutes, openHour = 8, closeHour = 22 }:{
  date: Date; sport?: ICourt["sport"]; courtId?: string; slotMinutes: number; openHour?: number; closeHour?: number;
}) {
  const dayLocal = DateTime.fromJSDate(date, { zone: CAMPUS_TZ }).startOf("day");
  const nextLocal = dayLocal.plus({ days: 1 });

  const dayStartUtc = dayLocal.toUTC().toJSDate();
const dayEndUtc   = nextLocal.toUTC().toJSDate();

  const courts = courtId
    ? [await this.repository.findById(courtId)].filter(Boolean) as ICourt[]
    : await this.repository.findAll({ ...(sport ? { sport } : {}), isDeleted: false });

  const results: any[] = [];
  for (const c of courts) {
    const bookedDocs = await courtReservationRepository.findForCourtOnDay(
      (c._id as any).toString(), dayStartUtc, dayEndUtc
    );
    console.log("[AVAILABILITY] court", (c._id as any).toString(),
      "dayLocal:", dayLocal.toISO(),
      "dayStartUtc:", dayLocal.toUTC().toISO(),
      "dayEndUtc:", nextLocal.toUTC().toISO()
    );
    const booked = bookedDocs.map(b => {
    const userId =
    (b.user as any)?._id?.toString?.() ??
    (b.user as any)?.toString?.() ??
    String(b.user);

      return {
        id: (b._id as any).toString(),
        userId,
        startUtc: DateTime.fromJSDate(b.startDate).toUTC().toISO(),
        endUtc:   DateTime.fromJSDate(b.endDate).toUTC().toISO(),
        hour:     DateTime.fromJSDate(b.startDate, { zone: CAMPUS_TZ }).hour,
        status: b.status,
      };
    });

    const freeSlots: { hour: number; startUtc: string }[] = [];
    for (let h = openHour; h < closeHour; h++) {
      const slotLocal = dayLocal.set({ hour: h, minute: 0, second: 0, millisecond: 0 });
      const slotEnd   = slotLocal.plus({ minutes: slotMinutes });
      const overlaps = bookedDocs.some(b => {
        const s = DateTime.fromJSDate(b.startDate, { zone: CAMPUS_TZ });
        const e = DateTime.fromJSDate(b.endDate,   { zone: CAMPUS_TZ });
        return s < slotEnd && e > slotLocal;
      });
      if (!overlaps) freeSlots.push({ hour: h, startUtc: slotLocal.toUTC().toISO()! });
    }

    results.push({
      court: { id: (c._id as any).toString(), name: c.name, sport: c.sport, location: c.location },
      freeSlots, booked,
    });
    console.log("[AVAILABILITY] bookedDocs count:", bookedDocs.length);

  }
  
  return results;
}
}
export const courtService = new CourtService(courtRepository);
