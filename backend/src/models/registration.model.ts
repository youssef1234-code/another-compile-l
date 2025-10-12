/**
 * Event Registration Model
 * 
 * @module models/registration.model
 */

import mongoose, { Schema } from 'mongoose';
import type { IBaseDocument } from './base.model';
import { createBaseSchema } from './base.model';

export interface IEventRegistration extends IBaseDocument {
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'FAILED';
  paymentAmount: number;
  paymentMethod?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'WALLET';
  stripePaymentIntentId?: string;
  certificateIssued: boolean;
  attended: boolean;
}

const registrationSchema = createBaseSchema<IEventRegistration>(
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
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'REFUNDED', 'FAILED'],
      default: 'PENDING',
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['CREDIT_CARD', 'DEBIT_CARD', 'WALLET'],
    },
    stripePaymentIntentId: String,
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    attended: {
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

// Unique constraint: user can only register once per event
registrationSchema.index({ event: 1, user: 1 }, { unique: true });

export const EventRegistration = mongoose.model<IEventRegistration>('EventRegistration', registrationSchema);

// Also export as Registration for backward compatibility
export const Registration = EventRegistration;

