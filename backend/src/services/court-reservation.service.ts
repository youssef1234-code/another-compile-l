import { BaseService } from "./base.service";
import { TRPCError } from "@trpc/server";
import { courtReservationRepository, CourtReservationRepository } from "../repositories/court-reservation.repository";
import type { ICourtReservation } from "../models/court-reservation.model";
import mongoose from "mongoose";

export class CourtReservationService extends BaseService<ICourtReservation, CourtReservationRepository> {
  constructor(repo: CourtReservationRepository){ super(repo); }
  protected getEntityName(): string { return "CourtReservation"; }

  async createReservation(params: {
    courtId: string;
    userId: string;
    studentName: string;
    studentGucId: string;
    startDate: Date;
    duration: number;
  }): Promise<ICourtReservation> {
    const { courtId, userId, studentName, studentGucId, startDate, duration } = params;

    const endDate = new Date(startDate.getTime() + duration*60000);
    // prevent past
    if (startDate < new Date()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot reserve in the past" });
    }
    // overlap guard
    const overlap = await courtReservationRepository.hasOverlap(courtId, startDate, endDate);
    if (overlap) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Time slot already booked" });
    }

    return this.repository.create({
      court: new mongoose.Types.ObjectId(courtId),
      user: new mongoose.Types.ObjectId(userId),
      studentName,
      studentGucId,
      startDate, endDate, duration,
      status: "BOOKED",
    } as any);
  }

  async cancelReservation(id: string, userId: string): Promise<ICourtReservation> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Reservation not found" });
    // allow owner or admin; here we enforce owner-only (simple)
    if ((existing.user as any).toString() !== userId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You can only cancel your own reservation" });
    }
    if (existing.status === "CANCELLED") return existing;

    // could add time-window rules (e.g., can cancel until 1h before start)
    const updated = await this.repository.update(id, { status: "CANCELLED" });
    return updated!;
  }
}
export const courtReservationService = new CourtReservationService(courtReservationRepository);
