/**
 * Loyalty Partner Model
 * 
 * Mongoose schema for accepted vendors in the GUC loyalty program
 * Stores current active partners for public display
 * 
 * @module models/loyalty-partner.model
 */

import mongoose, { Schema } from 'mongoose';
import type { IBaseDocument } from './base.model';
import { createBaseSchema } from './base.model';

export interface ILoyaltyPartner extends IBaseDocument {
  vendor: mongoose.Types.ObjectId;
  discountRate: number; // Percentage (e.g., 10 for 10%)
  promoCode: string;
  terms: string; // Terms and conditions
  joinedAt: Date;
}

const loyaltyPartnerSchema = createBaseSchema<ILoyaltyPartner>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Each vendor can only be a partner once
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
    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
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

export const LoyaltyPartner = mongoose.model<ILoyaltyPartner>(
  'LoyaltyPartner',
  loyaltyPartnerSchema
);
