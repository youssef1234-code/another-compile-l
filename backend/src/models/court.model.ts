import { CourtSport } from "@event-manager/shared";
import mongoose, { Schema } from "mongoose";
import { createBaseSchema, type IBaseDocument } from "./base.model";


export interface ICourt extends IBaseDocument {
  name: string;
  sport: CourtSport;
  location: string;            
  tz?: string;                 
  openHours?: {
    mon?: Array<{ start: string; end: string }>;
    tue?: Array<{ start: string; end: string }>;
    wed?: Array<{ start: string; end: string }>;
    thu?: Array<{ start: string; end: string }>;
    fri?: Array<{ start: string; end: string }>;
    sat?: Array<{ start: string; end: string }>;
    sun?: Array<{ start: string; end: string }>;
  };
  slotMinutes?: number;        
  maxConcurrent?: number;      
  createdAt: Date; updatedAt: Date;
}

const courtSchema = createBaseSchema<ICourt>({
  name: { type: String, required: true, index: true },
  sport: { type: String, enum: CourtSport, required: true, index: true },
  location: { type: String, required: true },
  tz: { type: String, default: "Africa/Cairo" },
  openHours: {
    type: new Schema({
      mon: [{ start: String, end: String }],
      tue: [{ start: String, end: String }],
      wed: [{ start: String, end: String }],
      thu: [{ start: String, end: String }],
      fri: [{ start: String, end: String }],
      sat: [{ start: String, end: String }],
      sun: [{ start: String, end: String }],
    }, { _id: false }),
    default: undefined,
  },
  slotMinutes: { type: Number, default: 60 },
  maxConcurrent: { type: Number, default: 1 },
});

courtSchema.index({ sport: 1, name: 1 }, { unique: true });

export const Court = mongoose.model<ICourt>("Court", courtSchema);
