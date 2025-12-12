/**
 * Feedback Model (Unified Comments & Ratings)
 * 
 * Mongoose schema for event feedback - supports ratings, comments, or both
 * Each user can have ONE feedback entry per event
 * 
 * @module models/feedback.model
 */

import mongoose, { Schema } from 'mongoose';
import type { IBaseDocument } from './base.model';
import { createBaseSchema } from './base.model';

export interface IFeedback extends IBaseDocument {
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  type: 'rating' | 'comment' | 'both';
  rating?: number; // 1-5, required if type is 'rating' or 'both'
  comment?: string; // required if type is 'comment' or 'both'
  isEdited?: boolean; // Flag to show if feedback was edited after creation
  isCommentHidden?: boolean; // Flag for admin-deleted comments (rating preserved)
  commentHiddenAt?: Date; // When the comment was hidden
  commentHiddenReason?: string; // Reason for hiding (optional)
  // AI Moderation fields
  moderationStatus?: 'pending' | 'approved' | 'flagged' | 'removed';
  moderationFlags?: string[]; // e.g., ['profanity', 'harassment', 'toxicity']
  moderationSeverity?: 'none' | 'low' | 'medium' | 'high' | 'critical';
  moderationConfidence?: number; // AI confidence score 0-1
  moderationAiSuggestion?: 'approve' | 'remove';
  moderationAiReasoning?: string;
  moderatedAt?: Date;
  moderatedBy?: mongoose.Types.ObjectId;
  moderationNote?: string;
}

const feedbackSchema = createBaseSchema<IFeedback>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['rating', 'comment', 'both'],
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: false,
    },
    comment: {
      type: String,
      required: false,
      trim: true,
      maxlength: 2000,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isCommentHidden: {
      type: Boolean,
      default: false,
    },
    commentHiddenAt: {
      type: Date,
    },
    commentHiddenReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // AI Moderation fields
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'flagged', 'removed'],
      default: 'pending',
    },
    moderationFlags: [{
      type: String,
    }],
    moderationSeverity: {
      type: String,
      enum: ['none', 'low', 'medium', 'high', 'critical'],
      default: 'none',
    },
    moderationConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    moderationAiSuggestion: {
      type: String,
      enum: ['approve', 'remove'],
    },
    moderationAiReasoning: {
      type: String,
      maxlength: 500,
    },
    moderatedAt: {
      type: Date,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    moderationNote: {
      type: String,
      maxlength: 500,
    },
  },
  {
    toJSON: {
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        ret.eventId = ret.event?.toString() || ret.event;
        ret.userId = ret.user?._id?.toString() || ret.user?.toString() || ret.user;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound unique index: one feedback per user per event
feedbackSchema.index({ event: 1, user: 1 }, { unique: true });

// Index for querying feedback by event (with sort by date)
feedbackSchema.index({ event: 1, createdAt: -1 });

export const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema);

