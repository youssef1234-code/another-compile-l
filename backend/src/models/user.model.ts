/**
 * User Model
 * 
 * Mongoose schema for User entity
 * 
 * @module models/user.model
 */

import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, UserStatus } from '@event-manager/shared';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: keyof typeof UserRole;
  status: keyof typeof UserStatus;
  isVerified: boolean;
  isBlocked: boolean;
  roleVerifiedByAdmin: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  refreshToken?: string;
  
  // Academic users
  studentId?: string;
  staffId?: string;
  walletBalance?: number;
  
  // Vendor users
  companyName?: string;
  taxCardUrl?: string;
  logoUrl?: string;
  taxCardVerified?: boolean;
  
  // Favorites
  favoriteEvents?: mongoose.Types.ObjectId[];
  
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't include password in queries by default
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['STUDENT', 'STAFF', 'TA', 'PROFESSOR', 'ADMIN', 'EVENT_OFFICE', 'VENDOR'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'BLOCKED', 'PENDING_VERIFICATION'],
      default: 'PENDING_VERIFICATION',
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    roleVerifiedByAdmin: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    refreshToken: {
      type: String,
      select: false,
    },
    
    // Academic users
    studentId: {
      type: String,
      sparse: true,
      index: true,
    },
    staffId: {
      type: String,
      sparse: true,
      index: true,
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Vendor users
    companyName: String,
    taxCardUrl: String,
    logoUrl: String,
    taxCardVerified: {
      type: Boolean,
      default: false,
    },
    
    // Favorites
    favoriteEvents: [{
      type: Schema.Types.ObjectId,
      ref: 'Event',
    }],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// Indexes are defined inline in schema fields

export const User = mongoose.model<IUser>('User', userSchema);
