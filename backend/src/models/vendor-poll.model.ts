/**
 * Vendor Poll Model
 *
 * Mongoose schema for Vendor Poll entity
 * Used when multiple vendors request the same booth during overlapping durations
 *
 * @module models/vendor-poll.model
 */

import mongoose, { Schema } from 'mongoose';
import { type IBaseDocument, createBaseSchema } from './base.model';

export interface IVote {
  voterId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  votedAt: Date;
}

export interface IVendorPoll extends IBaseDocument {
  boothLocationId: string;
  boothLabel?: string;
  startDate: Date;
  endDate: Date;
  duration: number; // in weeks
  conflictingApplications: mongoose.Types.ObjectId[]; // Vendor application IDs
  votes: IVote[];
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED';
  resolvedApplicationId?: mongoose.Types.ObjectId; // Winner of the poll
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId; // Admin/Events Office who resolved
  description?: string;
}

const voteSchema = new Schema<IVote>(
  {
    voterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'VendorApplication',
      required: true,
    },
    votedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const vendorPollSchema = createBaseSchema<IVendorPoll>(
  {
    boothLocationId: {
      type: String,
      required: true,
      index: true,
    },
    boothLabel: String,
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },
    conflictingApplications: [
      {
        type: Schema.Types.ObjectId,
        ref: 'VendorApplication',
      },
    ],
    votes: [voteSchema],
    status: {
      type: String,
      enum: ['ACTIVE', 'RESOLVED', 'CANCELLED'],
      default: 'ACTIVE',
      required: true,
      index: true,
    },
    resolvedApplicationId: {
      type: Schema.Types.ObjectId,
      ref: 'VendorApplication',
    },
    resolvedAt: Date,
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    description: String,
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

// Index for finding active polls
vendorPollSchema.index({ status: 1, createdAt: -1 });

// Index for finding polls by booth and date range
vendorPollSchema.index({ boothLocationId: 1, startDate: 1, endDate: 1 });

export const VendorPoll = mongoose.model<IVendorPoll>(
  'VendorPoll',
  vendorPollSchema
);
