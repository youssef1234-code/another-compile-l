/**
 * Notification Model
 * 
 * @module models/notification.model
 */

import mongoose, { Schema, Document } from 'mongoose';
import { NotificationTypeType } from '../shared/types.js';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationTypeType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'NEW_EVENT',
        'EVENT_REMINDER',
        'WORKSHOP_STATUS_UPDATE',
        'VENDOR_REQUEST_UPDATE',
        'COMMENT_DELETED_WARNING',
        'GYM_SESSION_UPDATE',
        'NEW_LOYALTY_PARTNER',
        'GENERAL',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedEntityId: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
