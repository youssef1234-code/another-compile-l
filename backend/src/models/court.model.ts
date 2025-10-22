import { CourtSport } from "@event-manager/shared";
import mongoose from "mongoose";
import { createBaseSchema, type IBaseDocument } from "./base.model";


export interface ICourt extends IBaseDocument {
  name: string;
  sport: CourtSport;
  location: string;             
  createdAt: Date; updatedAt: Date;
}

const courtSchema = createBaseSchema<ICourt>({
  name: { type: String, required: true, index: true },
  sport: { type: String, enum: CourtSport, required: true, index: true },
  location: { type: String, required: true },
});

courtSchema.index({ sport: 1, name: 1 }, { unique: true });

export const Court = mongoose.model<ICourt>("Court", courtSchema);
