import { BaseService } from "./base.service";
import { TRPCError } from "@trpc/server";
import { courtReservationRepository, CourtReservationRepository } from "../repositories/court-reservation.repository";
import { courtRepository } from "../repositories/court.repository";
import { courtBlackoutRepository } from "../repositories/court-blackout.repository";
import type { ICourt } from "../models/court.model";
import type { ICourtReservation } from "../models/court-reservation.model";
import mongoose from "mongoose";
import { DateTime } from "luxon";
const CAMPUS_TZ = "Africa/Cairo";
export class CourtReservationService extends BaseService<ICourtReservation, CourtReservationRepository> {
  constructor(repo: CourtReservationRepository){ super(repo); }
  protected getEntityName(): string { return "CourtReservation"; }

async createReservation({ courtId, userId, studentName, studentGucId, startDate, duration }: {
  courtId: string; userId: string; studentName: string; studentGucId: string; startDate: Date; duration: number;
}) {
  const endDate = new Date(startDate.getTime() + duration * 60000);

  // compare in campus TZ; allow booking while end is still > now + 1m
  const nowLocal  = DateTime.now().setZone(CAMPUS_TZ);
  const endLocal  = DateTime.fromJSDate(endDate, { zone: CAMPUS_TZ });
  if (endLocal <= nowLocal.plus({ minutes: 1 })) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot reserve in the past" });
  }

  // court config
  const court = await courtRepository.findById(courtId);
  if (!court) throw new TRPCError({ code: "NOT_FOUND", message: "Court not found" });
  const tz = (court as any).tz || CAMPUS_TZ;
  const slotMinutes = Number((court as any).slotMinutes ?? 60);
  const maxConcurrent = Number((court as any).maxConcurrent ?? 1);

  // alignment: start must align to slotMinutes, seconds/millis zero, duration multiple of slot
  const startLocal = DateTime.fromJSDate(startDate, { zone: tz });
  if (startLocal.second !== 0 || startLocal.millisecond !== 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Start time must be aligned to minute" });
  }
  if (startLocal.minute % slotMinutes !== 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Start must align to ${slotMinutes}-minute slots` });
  }
  if (duration % slotMinutes !== 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Duration must be a multiple of ${slotMinutes} minutes` });
  }

  // within open hours windows
  const dow = startLocal.weekday; // 1..7 Mon..Sun
  const key = ["mon","tue","wed","thu","fri","sat","sun"][dow - 1] as keyof NonNullable<ICourt["openHours"]>;
  const windows = ((court as any).openHours && (court as any).openHours[key]) || [];
  const candidateStart = startLocal;
  const candidateEnd = startLocal.plus({ minutes: duration });

  let within = false;
  if (windows.length > 0) {
    for (const w of windows as Array<{ start: string; end: string }>) {
      const winStart = startLocal.set({ hour: Number(w.start.split(":")[0] || 0), minute: Number(w.start.split(":")[1] || 0), second: 0, millisecond: 0 });
      const winEnd   = startLocal.set({ hour: Number(w.end.split(":")[0] || 0),   minute: Number(w.end.split(":")[1] || 0),   second: 0, millisecond: 0 });
      if (candidateStart >= winStart && candidateEnd <= winEnd) { within = true; break; }
    }
  } else {
    const defStart = startLocal.set({ hour: 8, minute: 0, second: 0, millisecond: 0 });
    const defEnd   = startLocal.set({ hour: 22, minute: 0, second: 0, millisecond: 0 });
    within = candidateStart >= defStart && candidateEnd <= defEnd;
  }
  if (!within) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Selected time is outside open hours" });
  }

  // blackouts
  const dayStart = startLocal.startOf("day").toUTC().toJSDate();
  const dayEnd   = startLocal.endOf("day").toUTC().toJSDate();
  const blackouts = await courtBlackoutRepository.findForCourtOnDay(courtId, dayStart, dayEnd);
  const blackoutOverlap = blackouts.some(b => {
    const s = DateTime.fromJSDate(b.startDate, { zone: tz });
    const e = DateTime.fromJSDate(b.endDate,   { zone: tz });
    return s < candidateEnd && e > candidateStart;
  });
  if (blackoutOverlap) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Selected time is blocked" });
  }

  const overlap = await courtReservationRepository.hasOverlap(courtId, startDate, endDate);
  if (overlap) throw new TRPCError({ code: "BAD_REQUEST", message: "Time slot already booked" });

  // concurrency enforcement
  const overlappingCount = await courtReservationRepository.countOverlaps(courtId, startDate, endDate);
  if (overlappingCount >= maxConcurrent) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "No capacity for this time slot" });
  }

  return this.repository.create({
    court: new mongoose.Types.ObjectId(courtId),
    user: new mongoose.Types.ObjectId(userId),
    studentName, studentGucId, startDate, endDate, duration, status: "BOOKED",
  } as any);
}

  async cancelReservation(id: string, userId: string) {
  const existing = await this.repository.findById(id);
  if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Reservation not found" });
  if ((existing.user as any).toString() !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You can only cancel your own reservation" });
  }
  const nowLocal = DateTime.now().setZone(CAMPUS_TZ);
  const endLocal = DateTime.fromJSDate(existing.endDate, { zone: CAMPUS_TZ });
  if (endLocal <= nowLocal.plus({ minutes: 1 })) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This slot has ended" });
  }
  if (existing.status === "CANCELLED") return existing;
  const updated = await this.repository.update(id, { status: "CANCELLED" });
  return updated!;
}

}
export const courtReservationService = new CourtReservationService(courtReservationRepository);
