/**
 * Vendor Application Model
 * @module models/vendor-application.model
 */

import mongoose, { Schema, Types } from 'mongoose';
import type { IBaseDocument } from './base.model';
import { createBaseSchema } from './base.model';

export const BoothSize = {
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',
} as const;
export type BoothSize = (typeof BoothSize)[keyof typeof BoothSize];

export const VendorApplicationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;
export type VendorApplicationStatus = (typeof VendorApplicationStatus)[keyof typeof VendorApplicationStatus];

export interface IVendorApplication extends IBaseDocument {
  vendor: Types.ObjectId;              // ref: Vendor
  event: Types.ObjectId;               // ref: Event (type=BAZAAR)
  attendees: string[];                 // simple names list
  boothSize: BoothSize;
  status: VendorApplicationStatus;
}

const vendorApplicationSchema = createBaseSchema<IVendorApplication>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    event:  { type: Schema.Types.ObjectId, ref: 'Event',  required: true },
    attendees: [{ type: String, trim: true }],
    boothSize: { type: String, enum: Object.values(BoothSize), required: true },
    status:    { type: String, enum: Object.values(VendorApplicationStatus), default: 'PENDING' },
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


vendorApplicationSchema.index(
  { vendor: 1, event: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const VendorApplication = mongoose.model<IVendorApplication>(
  'VendorApplication',
  vendorApplicationSchema
);
