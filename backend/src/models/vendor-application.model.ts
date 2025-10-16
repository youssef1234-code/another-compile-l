/**
 * Vendor Application Model
 *
 * Mongoose schema for Vendor Application entity
 *
 * @module models/vendor-application.model
 */

import mongoose, { Schema } from "mongoose";
import {
  BoothSize,
  ApplicationType,
  VendorApprovalStatus,
} from "@event-manager/shared";
import { type IBaseDocument, createBaseSchema } from "./base.model";

export interface IVendorApplication extends IBaseDocument {
  companyName: string;
  names: string[];
  emails: string[];

  type: keyof typeof ApplicationType;
  boothSize: keyof typeof BoothSize;
  bazaarId?: mongoose.Types.ObjectId;
  bazaarName?: string;
  location?: number;
  duration?: number;
  startDate?: Date;

  status: keyof typeof VendorApprovalStatus;
}

const applicationSchema = createBaseSchema<IVendorApplication>(
  {
    companyName: { type: String, required: true },
    names: {
      type: [String],
      validate: {
        validator: function (v) {
          return v && v.length >= 1 && v.length <= 5;
        },
        message: "Must be between 1 and 5 people",
      },
      required: true,
    },
    emails: {
      type: [String],
      validate: {
        validator: function (v) {
          return v && v.length >= 1 && v.length <= 5;
        },
        message: "Must be between 1 and 5 emails",
      },
      required: true,
    },
    type: {
      type: String,
      enum: ["BAZAAR", "PLATFORM"],
      default: "PLATFORM",
      required: true,
    },
    boothSize: {
      type: String,
      enum: ["TWO_BY_TWO", "FOUR_BY_FOUR"],
      default: "TWO_BY_TWO",
      required: true,
    },
    bazaarId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
    bazaarName: String,
    location: Number,
    duration: {
      type: Number,
      min: 1,
      max: 4,
    },
    startDate: Date,
    status: {
      type: String,
      enum: ["APPROVED", "PENDING", "REJECTED"],
      default: "PENDING",
      required: true,
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
  },
);

export const VendorApplication = mongoose.model<IVendorApplication>(
  "VendorApplication",
  applicationSchema,
);
