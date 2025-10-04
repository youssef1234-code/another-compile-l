/**
 * Rating and Comment Models
 * 
 * @module models/feedback.model
 */

import mongoose, { Schema } from 'mongoose';
import { IBaseDocument, createBaseSchema } from './base.model';

export interface IRating extends IBaseDocument {
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
}

export interface IComment extends IBaseDocument {
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  content: string;
  isDeleted: boolean;
}

const ratingSchema = createBaseSchema<IRating>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
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
  }
);

const commentSchema = createBaseSchema<IComment>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    isDeleted: {
      type: Boolean,
      default: false,
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
  }
);

// Unique constraint: user can only rate once per event
ratingSchema.index({ event: 1, user: 1 }, { unique: true });
commentSchema.index({ event: 1 });

export const Rating = mongoose.model<IRating>('Rating', ratingSchema);
export const Comment = mongoose.model<IComment>('Comment', commentSchema);

