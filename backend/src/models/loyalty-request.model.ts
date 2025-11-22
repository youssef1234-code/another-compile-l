/**
 * Loyalty Request Model
 * 
 * Mongoose schema for vendor applications to the GUC loyalty program
 * Each vendor can have multiple requests over time, but only one active (pending/accepted) request at a time
 * 
 * @module models/loyalty-request.model
 */

import mongoose, { Schema } from 'mongoose';
import type { IBaseDocument } from './base.model';
import { createBaseSchema } from './base.model';

export interface ILoyaltyRequest extends IBaseDocument {
  vendor: mongoose.Types.ObjectId;
  discountRate: number; // Percentage (e.g., 10 for 10%)
  promoCode: string;
  terms: string; // Terms and conditions
  status: 'active' | 'cancelled';
}

const loyaltyRequestSchema = createBaseSchema<ILoyaltyRequest>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    discountRate: {
      type: Number,
      required: true,
      min: [0, 'Discount rate cannot be negative'],
      max: [100, 'Discount rate cannot exceed 100%'],
    },
    promoCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    terms: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'cancelled'],
      default: 'active',
      required: true,
      index: true,
    },
  },
  {
    toJSON: {
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        ret.vendorId = ret.vendor?.toString?.() || ret.vendor;
        delete ret._id;
        delete ret.__v;
        delete ret.vendor;
        return ret;
      },
    },
    toObject: {
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        ret.vendorId = ret.vendor?.toString?.() || ret.vendor;
        delete ret._id;
        delete ret.__v;
        delete ret.vendor;
        return ret;
      },
    },
  }
);

// Compound index to prevent duplicate active requests from the same vendor
loyaltyRequestSchema.index(
  { vendor: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'accepted'] },
    },
    name: 'unique_active_request_per_vendor',
  }
);

export const LoyaltyRequest = mongoose.model<ILoyaltyRequest>(
  'LoyaltyRequest',
  loyaltyRequestSchema
);
