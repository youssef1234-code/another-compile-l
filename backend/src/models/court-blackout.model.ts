import mongoose, { Schema } from 'mongoose';
import { createBaseSchema, type IBaseDocument } from './base.model';

export interface ICourtBlackout extends IBaseDocument {
  court: mongoose.Types.ObjectId;
  startDate: Date; // UTC
  endDate: Date;   // UTC
  reason?: string;
  createdAt: Date; updatedAt: Date;
}

const blackoutSchema = createBaseSchema<ICourtBlackout>({
  court: { type: Schema.Types.ObjectId, ref: 'Court', required: true, index: true },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true, index: true },
  reason: { type: String },
});

// index to speed overlap checks
blackoutSchema.index({ court: 1, startDate: 1, endDate: 1 });

export const CourtBlackout = mongoose.model<ICourtBlackout>('CourtBlackout', blackoutSchema);
