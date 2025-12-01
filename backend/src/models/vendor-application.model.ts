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
  idPictures: string[];
  paymentMethod?: string;
  paymentStatus?: "PENDING" | "PAID" | "FAILED";

  type: keyof typeof ApplicationType;
  boothSize: keyof typeof BoothSize;
  bazaarId?: mongoose.Types.ObjectId;
  bazaarName?: string;
  location?: number;
  duration?: number;
  startDate?: Date;
  boothLocationId?: string; // Reference to booth placement ID on platform map
  boothLabel?: string; // Human-readable booth number (e.g., "A1", "B2")

  paymentAmount?: number;                   // minor 
  paymentCurrency?: "EGP" | "USD";         // NEW
  acceptedAt?: Date;                       // NEW
  paymentDueAt?: Date;                     // NEW (acceptedAt + 3 days)
  paidAt?: Date;        

  status: keyof typeof VendorApprovalStatus;
  rejectionReason?: string;
  
  // QR Code tracking for each visitor (Requirement #51)
  // Index matches names/emails arrays
  qrCodes?: string[]; // Stored QR code data URLs for each visitor
  qrCodesGeneratedAt?: Date;
  qrCodesSentAt?: Date[]; // Track when QR email was sent to each visitor
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
    idPictures: {
      type: [String],
      validate: {
        validator: function (v) {
          return v && v.length >= 1 && v.length <= 5;
        },
        message: "Must be between 1 and 5 ID pictures",
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
    boothLocationId: {
      type: String,
      required: false,
    },
    boothLabel: {
      type: String,
      required: false,
    },
    paymentMethod: {
      type: String,
      required: false,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
      required: false,
    },
    paymentAmount: {
      type: Number,
      required: false,
    },
    status: {
      type: String,
      enum: ["APPROVED", "PENDING", "REJECTED", "CANCELLED"],
      default: "PENDING",
      required: true,
    },
    rejectionReason: {
      type: String,
      required: false,
    },
    paymentCurrency: { type: String, enum: ["EGP", "USD"] }, 
    acceptedAt: { type: Date },              
    paymentDueAt: { type: Date },            
    paidAt: { type: Date },
    // QR Code tracking (Requirement #51)
    qrCodes: {
      type: [String],
      default: [],
    },
    qrCodesGeneratedAt: { type: Date },
    qrCodesSentAt: {
      type: [Date],
      default: [],
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

// Compound index to prevent duplicate applications for same vendor+bazaar
// Only for BAZAAR applications (where bazaarId exists)
applicationSchema.index(
  { createdBy: 1, bazaarId: 1 },
  { 
    unique: true,
    name: "vendor_bazaar_unique_v2",
    partialFilterExpression: { 
      type: "BAZAAR",
      bazaarId: { $exists: true }
    }
  }
);

// Compound index to prevent duplicate platform booth reservations
// Same vendor cannot reserve same booth location on same start date
applicationSchema.index(
  { boothLocationId: 1, createdBy: 1, startDate: 1 },
  { 
    unique: true,
    name: "platform_booth_unique",
    partialFilterExpression: { 
      type: "PLATFORM",
      boothLocationId: { $exists: true },
      startDate: { $exists: true }
    }
  }
);

// Index for efficient booth availability queries
applicationSchema.index({ boothLocationId: 1, startDate: 1, duration: 1 });

export const VendorApplication = mongoose.model<IVendorApplication>(
  "VendorApplication",
  applicationSchema,
);
