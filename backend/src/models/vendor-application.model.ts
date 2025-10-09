/**
 * Vendor Application Model
 *
 * Mongoose schema for Vendor Application entity
 *
 * @module models/vendor-application.model
 */

import mongoose, { Schema } from "mongoose";
import { BoothSize, ApplicationType } from "@event-manager/shared";
import { type IBaseDocument, createBaseSchema } from "./base.model";

export interface IVendorApplication extends IBaseDocument {
  vendor: mongoose.Types.ObjectId;
  names: string[];

  emails: string[];
  boothSize: keyof typeof BoothSize;
  type: keyof typeof ApplicationType;
}

const applicationSchema = createBaseSchema<IVendorApplication>({
  vendor: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
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
  boothSize: {
    type: String,
    enum: ["2x2", "4x4"],
  },
  type: {
    type: String,
    enum: ["BAZAAR", "PLATFORM"],
  },
});

export const VendorApplication = mongoose.model<IVendorApplication>(
  "Vendor Application",
  applicationSchema,
);
