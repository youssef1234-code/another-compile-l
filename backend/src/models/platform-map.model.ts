/**
 * Platform Map Model
 *
 * Mongoose schema for Platform Map configuration
 * Stores the grid layout for platform booth placements
 *
 * @module models/platform-map.model
 */

import mongoose, { Schema } from "mongoose";
import { type IBaseDocument, createBaseSchema } from "./base.model";

// Individual booth placement on the platform
export interface IBoothPlacement {
  id: string;
  x: number; // Grid X position
  y: number; // Grid Y position
  width: number; // 2 or 4 (for 2x2 or 4x4)
  height: number; // 2 or 4 (for 2x2 or 4x4)
  isOccupied: boolean;
  applicationId?: mongoose.Types.ObjectId; // Reference to VendorApplication
  label?: string; // Optional label like "Booth A1"
}

export interface IPlatformMap extends IBaseDocument {
  name: string; // e.g., "Main Platform Layout"
  gridWidth: number; // Number of grid columns (e.g., 20)
  gridHeight: number; // Number of grid rows (e.g., 15)
  cellSize: number; // Size of each grid cell in pixels (for rendering)
  booths: IBoothPlacement[]; // Array of booth placements
  isActive: boolean; // Whether this is the active platform layout
}

const boothPlacementSchema = new Schema<IBoothPlacement>(
  {
    id: { type: String, required: true },
    x: { type: Number, required: true, min: 0 },
    y: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, enum: [2, 4] },
    height: { type: Number, required: true, enum: [2, 4] },
    isOccupied: { type: Boolean, default: false },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "VendorApplication",
      required: false,
    },
    label: { type: String, required: false },
  },
  { _id: false }
);

const platformMapSchema = createBaseSchema<IPlatformMap>(
  {
    name: { type: String, required: true },
    gridWidth: {
      type: Number,
      required: true,
      min: 10,
      max: 100,
      default: 20,
    },
    gridHeight: {
      type: Number,
      required: true,
      min: 10,
      max: 100,
      default: 15,
    },
    cellSize: {
      type: Number,
      required: true,
      default: 40, // 40px per cell
    },
    booths: {
      type: [boothPlacementSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: {
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for quick lookup of active platform
platformMapSchema.index({ isActive: 1 });

export const PlatformMap = mongoose.model<IPlatformMap>(
  "PlatformMap",
  platformMapSchema
);
