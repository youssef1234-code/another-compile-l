/**
 * File Model
 * 
 * Mongoose schema for File storage with security
 * Stores files in MongoDB with GridFS-like approach
 * 
 * @module models/file.model
 */

import mongoose, { Schema } from 'mongoose';
import { type IBaseDocument, createBaseSchema } from './base.model.js';

export interface IFile extends IBaseDocument {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number; // in bytes
  data: Buffer; // Binary data
  uploadedBy: mongoose.Types.ObjectId; // User reference
  entityType?: string; // e.g., 'user', 'event', 'vendor'
  entityId?: mongoose.Types.ObjectId; // Reference to related entity
  isPublic: boolean;
  isScanned: boolean; // Virus scan status
  isCompressed: boolean;
  compressionRatio?: number;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    [key: string]: any;
  };
}

const fileSchema = createBaseSchema<IFile>(
  {
    filename: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      index: true,
    },
    size: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => v <= 10 * 1024 * 1024, // 10MB max
        message: 'File size cannot exceed 10MB',
      },
    },
    data: {
      type: Buffer,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['user', 'event', 'vendor', 'feedback', 'registration', 'other'],
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    isScanned: {
      type: Boolean,
      default: false,
    },
    isCompressed: {
      type: Boolean,
      default: false,
    },
    compressionRatio: Number,
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { collection: 'files' }
);

// Indexes for efficient querying
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ entityType: 1, entityId: 1 });
fileSchema.index({ mimeType: 1, isPublic: 1 });

export const File = mongoose.model<IFile>('File', fileSchema);
