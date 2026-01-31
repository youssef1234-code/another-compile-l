import { BaseService } from "`./base.service.js";
import { TRPCError } from "@trpc/server";
import { courtReservationRepository, CourtReservationRepository } from "`../repositories/court-reservation.repository.js";
import type { ICourtReservation } from "`../models/court-reservation.model.js";
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

  const overlap = await courtReservationRepository.hasOverlap(courtId, startDate, endDate);
  if (overlap) throw new TRPCError({ code: "BAD_REQUEST", message: "Time slot already booked" });

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
