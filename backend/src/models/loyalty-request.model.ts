/**
 * Loyalty Request Model
 * 
 * Mongoose schema for vendor applications to the GUC loyalty program
 * Each vendor can have multiple requests over time, but only one active (pending/accepted) request at a time
 * 
 * @module models/loyalty-request.model
 */

import mongoose, { Schema } from 'mongoose';
import { IBaseDocument, createBaseSchema } from './base.model';

export interface ILoyaltyRequest extends IBaseDocument {
  vendor: mongoose.Types.ObjectId;
  discountRate: number; // Percentage (e.g., 10 for 10%)
  promoCode: string;
  terms: string; // Terms and conditions
  status: 'pending' | 'cancelled' | 'accepted' | 'rejected';
  rejectionReason?: string; // Admin can provide reason for rejection
  reviewedBy?: mongoose.Types.ObjectId; // Admin who reviewed the request
  reviewedAt?: Date; // When the request was reviewed
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
      enum: ['pending', 'cancelled', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      required: false,
      trim: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    reviewedAt: {
      type: Date,
      required: false,
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
