/**
 * Event Model
 * 
 * Mongoose schema for Event entity
 * 
 * @module models/event.model
 */

import mongoose, { Schema, Document } from 'mongoose';
import { EventType, EventStatus, FundingSource, Faculty, GymSessionType } from '@event-manager/shared';

export interface IEvent extends Document {
  name: string;
  type: keyof typeof EventType;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  status: keyof typeof EventStatus;
  isArchived: boolean;
  capacity?: number;
  registeredCount: number;
  registrationDeadline?: Date;
  createdBy: mongoose.Types.ObjectId;
  restrictedTo?: string[];
  
  // Workshop specific
  fullAgenda?: string;
  faculty?: keyof typeof Faculty;
  professors?: mongoose.Types.ObjectId[];
  professorName?: string; // For search/display
  requiredBudget?: number;
  fundingSource?: keyof typeof FundingSource;
  extraResources?: string;
  price?: number;
  
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
  
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['WORKSHOP', 'TRIP', 'BAZAAR', 'BOOTH', 'CONFERENCE', 'GYM_SESSION'],
      required: true,
    },
    description: {
      type: String,
      required: true,
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
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PUBLISHED', 'CANCELLED', 'COMPLETED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    capacity: Number,
    registeredCount: {
      type: Number,
      default: 0,
    },
    registrationDeadline: Date,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restrictedTo: [{
      type: String,
      enum: ['STUDENT', 'STAFF', 'TA', 'PROFESSOR'],
    }],
    
    // Workshop specific
    fullAgenda: String,
    faculty: {
      type: String,
      enum: ['MET', 'IET', 'PHARMACY', 'BIOTECHNOLOGY', 'MANAGEMENT', 'LAW', 'DESIGN'],
    },
    professors: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    professorName: String, // For easier search and display
    requiredBudget: Number,
    fundingSource: {
      type: String,
      enum: ['EXTERNAL', 'GUC'],
    },
    extraResources: String,
    price: {
      type: Number,
      default: 0,
    },
    
    // Conference specific
    websiteUrl: String,
    
    // Bazaar specific
    vendors: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    
    // Gym session specific
    sessionType: {
      type: String,
      enum: ['YOGA', 'PILATES', 'AEROBICS', 'ZUMBA', 'CROSS_CIRCUIT', 'KICK_BOXING'],
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
  },
  {
    timestamps: true,
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
eventSchema.index({ createdBy: 1 });
eventSchema.index({ name: 'text', description: 'text' });

export const Event = mongoose.model<IEvent>('Event', eventSchema);
