import { BaseService } from "./base.service";
import { CourtRepository, courtRepository } from "../repositories/court.repository";
import type { ICourt } from "../models/court.model";
import { courtReservationRepository } from "../repositories/court-reservation.repository";
import { DateTime } from "luxon";
import { CourtAvailabilityRow } from "@event-manager/shared";


const CAMPUS_TZ = "Africa/Cairo";

export class CourtService extends BaseService<ICourt, CourtRepository> {
  constructor(repo: CourtRepository){ super(repo); }
  protected getEntityName(): string { return "Court"; }

async getAvailability({
  date,
  sport,
  courtId,
  slotMinutes,
  openHour = 8,
  closeHour = 22,
  me,
}: {
  date: Date;
  sport?: ICourt["sport"];
  courtId?: string;
  slotMinutes: number;
  openHour?: number;
  closeHour?: number;
  me: string; // current user id
}) {
  // Define the Cairo-local day, then convert bounds to UTC for querying
  const dayLocal = DateTime.fromJSDate(date, { zone: CAMPUS_TZ }).startOf("day");
  const nextLocal = dayLocal.plus({ days: 1 });

  const dayStartUtc = dayLocal.toUTC().toJSDate();
  const dayEndUtc   = nextLocal.toUTC().toJSDate();

  // Fetch courts
const courts = courtId
  ? [await this.repository.findById(courtId)].filter(Boolean) as ICourt[]
  : await this.repository.findAll({ ...(sport ? { sport } : {}), isActive: true });

const results: CourtAvailabilityRow[] = [];

  for (const c of courts) {
    // Get reservations overlapping this *Cairo* day (bounds in UTC)
    const bookedDocs = await courtReservationRepository.findForCourtOnDay(
      (c._id as any).toString(),
      dayStartUtc,
      dayEndUtc
    );

    // Map booked items (ensure id & userId present)
    const booked = bookedDocs.map(b => {
      const userId =
        (b.user as any)?._id?.toString?.() ??
        (b.user as any)?.toString?.() ??
        String(b.user);

      const startLux = DateTime.fromJSDate(b.startDate, { zone: CAMPUS_TZ });
      return {
        id: (b._id as any).toString(),
        hour: startLux.hour,
        startUtc: DateTime.fromJSDate(b.startDate).toUTC().toISO()!,
        endUtc:   DateTime.fromJSDate(b.endDate).toUTC().toISO()!,
        status: b.status,
        byMe: userId === me,
      };
    });

    // Build free slots timeline in Cairo local time, step = slotMinutes
    const freeSlots: { hour: number; startUtc: string }[] = [];
    for (let h = openHour; h < closeHour; h++) {
      const slotLocal = dayLocal.set({ hour: h, minute: 0, second: 0, millisecond: 0 });
      const slotEnd   = slotLocal.plus({ minutes: slotMinutes });

      // Overlap check in Cairo local for clarity
      const overlaps = bookedDocs.some(b => {
        const s = DateTime.fromJSDate(b.startDate, { zone: CAMPUS_TZ });
        const e = DateTime.fromJSDate(b.endDate,   { zone: CAMPUS_TZ });
        return s < slotEnd && e > slotLocal; // proper overlap
      });

      if (!overlaps) {
        freeSlots.push({ hour: h, startUtc: slotLocal.toUTC().toISO()! });
      }
    }

    results.push({
      court: { id: (c._id as any).toString(), name: c.name, sport: c.sport, location: c.location },
      freeSlots,
      booked,
    });
  }

  return results;
}


}
export const courtService = new CourtService(courtRepository);
