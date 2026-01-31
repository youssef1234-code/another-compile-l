import { CourtSport } from "../shared/index.js";
import mongoose from "mongoose";
import { createBaseSchema, type IBaseDocument } from "./base.model.js";


export interface ICourt extends IBaseDocument {
  name: string;
  sport: CourtSport;
  location: string;
  description?: string;
  specs?: string; // Court specifications (size, floor type, etc.)
  customInstructions?: string; // Booking instructions
  images?: string[]; // Array of image URLs or file IDs
  coordinates?: { lat: number; lng: number }; // Map coordinates
  createdAt: Date; 
  updatedAt: Date;
}

const courtSchema = createBaseSchema<ICourt>({
  name: { type: String, required: true, index: true },
  sport: { type: String, enum: Object.values(CourtSport), required: true, index: true },
  location: { type: String, required: true },
  description: { type: String },
  specs: { type: String },
  customInstructions: { type: String },
  images: { type: [String], default: [] },
  coordinates: {
    type: {
      lat: { type: Number },
      lng: { type: Number },
    },
    required: false,
  },
});

courtSchema.index({ sport: 1, name: 1 }, { unique: true });

export const Court = mongoose.model<ICourt>("Court", courtSchema);
