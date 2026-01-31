/**
 * User Model
 * 
 * Mongoose schema for User entity
 * 
 * @module models/user.model
 */

import mongoose, { Schema } from 'mongoose';
import { UserRole, UserStatus } from '../shared/index.js';
import { type IBaseDocument, createBaseSchema } from './base.model.js';

export interface IUser extends IBaseDocument {
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
  verificationEmailSentAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  // Note: Refresh tokens are NOT stored in database for security
  
  // Profile
  avatar?: string; // File ID or preset avatar identifier
  avatarType?: 'upload' | 'preset';
  
  // Academic users
  studentId?: string;
  staffId?: string;
  walletBalance?: number;
  
  // Vendor users
  companyName?: string;
  taxCardUrl?: string;
  logoUrl?: string;
  taxCardVerified?: boolean;
  vendorApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  vendorRejectionReason?: string;
  
  // Favorites
  favoriteEvents?: mongoose.Types.ObjectId[];
  
  // Interests for personalized recommendations
  interests?: string[];
}

const userSchema = createBaseSchema<IUser>(
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
      enum: ['ACTIVE', 'BLOCKED', 'PENDING_VERIFICATION', 'PENDING_APPROVAL'],
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
    verificationEmailSentAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    
    // Profile
    avatar: String,
    avatarType: {
      type: String,
      enum: ['upload', 'preset'],
      default: 'preset',
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
    vendorApprovalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    vendorRejectionReason: String,
    
    // Favorites
    favoriteEvents: [{
      type: Schema.Types.ObjectId,
      ref: 'Event',
    }],
    
    // Interests for personalized recommendations
    interests: [{
      type: String,
      trim: true,
    }],
  },
  {
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

