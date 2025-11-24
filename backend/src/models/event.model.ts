/**
 * Event Model
 *
 * Mongoose schema for Event entity
 *
 * @module models/event.model
 */

import mongoose, { Schema } from "mongoose";
import {
  EventType,
  EventStatus,
  FundingSource,
  Faculty,
  GymSessionType,
} from "@event-manager/shared";
import { type IBaseDocument, createBaseSchema } from "./base.model";

export interface IEvent extends IBaseDocument {
  name: string;
  type: keyof typeof EventType;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  locationDetails?: string;
  status: keyof typeof EventStatus;
  rejectionReason?: string;
  isArchived: boolean;
  capacity?: number;
  registeredCount: number;
  registrationDeadline?: Date;
  restrictedTo?: string[];
  whitelistedUsers?: mongoose.Types.ObjectId[];
  whitelistedRoles?: string[];

  // Workshop specific
  fullAgenda?: string;
  faculty?: keyof typeof Faculty;
  professors?: string[]; // Professor names (not user refs) - Requirement #35
  professorName?: string; // Deprecated: kept for backwards compatibility
  requiredBudget?: number;
  fundingSource?: keyof typeof FundingSource;
  extraResources?: string;
  requirements?: string; // Prerequisites or requirements for attendees
  price?: number;

  // Media
  images?: string[]; // Array of file IDs or URLs

  // Conference specific
  websiteUrl?: string;

  // Bazaar specific
  vendors?: mongoose.Types.ObjectId[];

  // Gym session specific
  sessionType?: keyof typeof GymSessionType;
  duration?: number;

  // Ratings
  averageRating?: number;
  totalRatings?: number;
}

const eventSchema = createBaseSchema<IEvent>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "WORKSHOP",
        "TRIP",
        "BAZAAR",
        "BOOTH",
        "CONFERENCE",
        "GYM_SESSION",
      ],
      required: true,
    },
    description: {
      type: String,
      required: function (this: IEvent) {
        // Description is optional for GYM_SESSION
        return this.type !== "GYM_SESSION";
      },
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    locationDetails: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_APPROVAL",
        "APPROVED",
        "NEEDS_EDITS",
        "REJECTED",
        "PUBLISHED",
        "CANCELLED",
        "COMPLETED",
        "ARCHIVED",
      ],
      default: "DRAFT",
    },
    isArchived: {
      type: Boolean,
      default: false,
      // Note: isActive already has an index from base schema
    },
    capacity: Number,
    registeredCount: {
      type: Number,
      default: 0,
    },
    registrationDeadline: Date,
    restrictedTo: [
      {
        type: String,
        enum: ["STUDENT", "STAFF", "TA", "PROFESSOR"],
      },
    ],
    whitelistedRoles: [
      {
        type: String,
        enum: [
          "STUDENT",
          "STAFF",
          "TA",
          "PROFESSOR",
          "VENDOR",
          "ADMIN",
          "EVENT_OFFICE",
        ],
      },
    ],

    // Workshop specific
    fullAgenda: String,
    faculty: {
      type: String,
      enum: [
        "MET",
        "IET",
        "ARTS",
        "LAW",
        "PHARMACY",
        "BUSINESS",
        "BIOTECHNOLOGY",
      ],
    },
    professors: [
      {
        type: String, // Professor names as strings - Requirement #35
      },
    ],
    professorName: String, // Deprecated: kept for backwards compatibility
    requiredBudget: Number,
    fundingSource: {
      type: String,
      enum: ["EXTERNAL", "GUC"],
    },
    extraResources: String,
    requirements: String, // Prerequisites or requirements for attendees
    price: {
      type: Number,
      default: 0,
    },
    rejectionReason: {
      type: String,
      required: false,
    },

    // Media
    images: [
      {
        type: String, // File IDs or URLs
      },
    ],

    // Conference specific
    websiteUrl: String,

    // Bazaar specific
    vendors: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Gym session specific
    sessionType: {
      type: String,
      enum: GymSessionType,
    },
    duration: Number,

    // Ratings
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    whitelistedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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

// Indexes
eventSchema.index({ type: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ startDate: 1 });
// Note: createdBy and isActive already have indexes from base schema
eventSchema.index({ name: "text", description: "text" });

eventSchema.pre("validate", function (next) {
  if (this.isNew) {
    if (this.type === "WORKSHOP") {
      this.status = "PENDING_APPROVAL";
    }
  }
  next();
});

export const Event = mongoose.model<IEvent>("Event", eventSchema);
