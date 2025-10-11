import mongoose, { Schema } from "mongoose";
import { createBaseSchema, IBaseDocument } from "./base.model";

export interface ICourt extends IBaseDocument {
  name: string;
  sport: "BASKETBALL" | "TENNIS" | "FOOTBALL";
  location: string;             // e.g. "Gym Zone A"
  isDeleted: boolean;
  createdAt: Date; updatedAt: Date;
}

const courtSchema = createBaseSchema<ICourt>({
  name: { type: String, required: true, index: true },
  sport: { type: String, enum: ["BASKETBALL", "TENNIS", "FOOTBALL"], required: true, index: true },
  location: { type: String, required: true },
});

courtSchema.index({ sport: 1, name: 1 }, { unique: true });

export const Court = mongoose.model<ICourt>("Court", courtSchema);
