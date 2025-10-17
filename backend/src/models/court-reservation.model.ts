import mongoose, { Schema } from "mongoose";
import { createBaseSchema, type IBaseDocument } from "./base.model";

export interface ICourtReservation extends IBaseDocument {
  court: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;           // reference to User
  studentName: string;                     // denormalized for convenience
  studentGucId: string;                    // denormalized per requirement
  startDate: Date;                         // UTC
  endDate: Date;                           // UTC
  duration: number;                        // minutes
  status: "BOOKED" | "CANCELLED";
  createdAt: Date; updatedAt: Date;
}

const reservationSchema = createBaseSchema<ICourtReservation>({
  court: { type: Schema.Types.ObjectId, ref: "Court", required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  studentName: { type: String, required: true },
  studentGucId: { type: String, required: true },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true, index: true },
  duration: { type: Number, required: true },
  status: { type: String, enum: ["BOOKED", "CANCELLED"], default: "BOOKED", index: true },
});

// prevent overlaps on the same court (we'll also validate in service)
reservationSchema.index({ court: 1, startDate: 1, endDate: 1 });
reservationSchema.index({ user: 1, startDate: 1 });

export const CourtReservation = mongoose.model<ICourtReservation>("CourtReservation", reservationSchema);
