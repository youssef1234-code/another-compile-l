import { BaseService } from "./base.service";
import { CourtRepository, courtRepository } from "../repositories/court.repository";
import type { ICourt } from "../models/court.model";
import { courtReservationRepository } from "../repositories/court-reservation.repository";
import { courtBlackoutRepository } from "../repositories/court-blackout.repository";
import { DateTime } from "luxon";
import { CourtAvailabilityRow } from "@event-manager/shared";


const DEFAULT_TZ = "Africa/Cairo";

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
  // Per-court time zone handling done inside loop
  // note: per-court UTC bounds computed in the loop

  // Fetch courts
const courts = courtId
  ? [await this.repository.findById(courtId)].filter(Boolean) as ICourt[]
  : await this.repository.findAll({ ...(sport ? { sport } : {}), isActive: true });

const results: CourtAvailabilityRow[] = [];

  for (const c of courts) {
    const tz = c.tz || DEFAULT_TZ;
    const courtDayLocal = DateTime.fromJSDate(date, { zone: tz }).startOf("day");
    const courtNextLocal = courtDayLocal.plus({ days: 1 });
    const courtDayStartUtc = courtDayLocal.toUTC().toJSDate();
    const courtDayEndUtc = courtNextLocal.toUTC().toJSDate();

    // Get reservations and blackouts overlapping this day (bounds in UTC)
    const courtIdStr = (c._id as any).toString();
    const [bookedDocs, blackoutDocs] = await Promise.all([
      courtReservationRepository.findForCourtOnDay(courtIdStr, courtDayStartUtc, courtDayEndUtc),
      courtBlackoutRepository.findForCourtOnDay(courtIdStr, courtDayStartUtc, courtDayEndUtc),
    ]);

    // Map booked items (ensure id & userId present)
    const booked = bookedDocs.map(b => {
      const userId =
        (b.user as any)?._id?.toString?.() ??
        (b.user as any)?.toString?.() ??
        String(b.user);

      const startLux = DateTime.fromJSDate(b.startDate, { zone: tz });
      return {
        id: (b._id as any).toString(),
        hour: startLux.hour,
        startUtc: DateTime.fromJSDate(b.startDate).toUTC().toISO()!,
        endUtc:   DateTime.fromJSDate(b.endDate).toUTC().toISO()!,
        status: b.status,
        byMe: userId === me,
        studentName: (b as any).studentName,
        studentGucId: (b as any).studentGucId,
      };
    });

    // Build free slots in court local time, aligned to slotMinutes, restricted by openHours
    const freeSlots: { hour: number; startUtc: string }[] = [];
    const step = slotMinutes;
    const maxConc = c.maxConcurrent ?? 1;

    // Determine open windows for the day
    const dow = courtDayLocal.weekday; // 1=Mon..7=Sun
    const key = ["mon","tue","wed","thu","fri","sat","sun"][dow - 1] as keyof NonNullable<ICourt["openHours"]>;
    const windows = (c.openHours && (c.openHours as any)[key]) || [];

    const considerWindows = windows.length > 0
      ? windows.map((w: any) => ({
          start: courtDayLocal.set({
            hour: Number(w.start.split(":")[0] || 0),
            minute: Number(w.start.split(":")[1] || 0),
            second: 0, millisecond: 0,
          }),
          end: courtDayLocal.set({
            hour: Number(w.end.split(":")[0] || 0),
            minute: Number(w.end.split(":")[1] || 0),
            second: 0, millisecond: 0,
          }),
        }))
      : [
          { start: courtDayLocal.set({ hour: (openHour ?? 8), minute: 0, second: 0, millisecond: 0 }),
            end:   courtDayLocal.set({ hour: (closeHour ?? 22), minute: 0, second: 0, millisecond: 0 }) },
        ];

    for (const win of considerWindows) {
      // Iterate in steps within this window
      for (let cur = win.start; cur < win.end; cur = cur.plus({ minutes: step })) {
        const slotLocal = cur;
        const slotEnd = slotLocal.plus({ minutes: step });
        if (slotEnd > win.end) break;

        // skip if overlapped by blackout
        const blackoutOverlap = blackoutDocs.some(b => {
          const s = DateTime.fromJSDate(b.startDate, { zone: tz });
          const e = DateTime.fromJSDate(b.endDate,   { zone: tz });
          return s < slotEnd && e > slotLocal;
        });
        if (blackoutOverlap) continue;

        // count overlapping reservations (concurrency)
        let overlapCount = 0;
        for (const b of bookedDocs) {
          const s = DateTime.fromJSDate(b.startDate, { zone: tz });
          const e = DateTime.fromJSDate(b.endDate,   { zone: tz });
          if (s < slotEnd && e > slotLocal) overlapCount += 1;
        }
        if (overlapCount >= maxConc) continue;

        freeSlots.push({ hour: slotLocal.hour, startUtc: slotLocal.toUTC().toISO()! });
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
