/**
 * Event Registration Model
 * 
 * @module models/registration.model
 */

import mongoose, { Schema } from 'mongoose';
import type { IBaseDocument } from './base.model';
import { createBaseSchema } from './base.model';
import { PaymentStatus, RegistrationStatus } from '../shared/index.js';

export interface IEventRegistration extends IBaseDocument {
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  paymentAmount: number;
  paymentMethod?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'WALLET';
  holdUntil?: Date;
  stripePaymentIntentId?: string;
  registeredAt: Date;
  certificateIssued: boolean;
  certificateSentAt?: Date; // Track when certificate email was sent (Requirement #30)
  attended: boolean;
  // QR Code for event entry (Requirement #51)
  qrCode?: string; // Stored QR code data URL
  qrCodeGeneratedAt?: Date;
  qrCodeSentAt?: Date; // Track when QR code email was sent
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
    status: {
      type: String,
      enum: Object.values(RegistrationStatus),
      default: 'PENDING',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
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
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    holdUntil: {
      type: Date,
      default: () => new Date(Date.now() + 15 * 60 * 1000),
    },
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificateSentAt: {
      type: Date,
    },
    attended: {
      type: Boolean,
      default: false,
    },
    qrCode: {
      type: String,
    },
    qrCodeGeneratedAt: {
      type: Date,
    },
    qrCodeSentAt: {
      type: Date,
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

