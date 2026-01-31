/**
 * Notification Model
 *
 * @module models/notification.model
 */

import mongoose, { Schema } from 'mongoose';
import { NotificationType } from '../shared/index.js';
import type { IBaseDocument } from './base.model.js';
import { createBaseSchema } from './base.model.js';

export interface INotification extends IBaseDocument {
  user: mongoose.Types.ObjectId;
  type: keyof typeof NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: string;
}

const notificationSchema = createBaseSchema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'INFO',
        'SUCCESS',
        'WARNING',
        'ERROR',
        'EVENT_REMINDER',
        'REGISTRATION_CONFIRMED',
        'ROLE_VERIFIED',
        'NEW_EVENT',
        'WORKSHOP_STATUS_UPDATE',
        'WORKSHOP_PENDING',
        'VENDOR_REQUEST_UPDATE',
        'VENDOR_PENDING',
        'VENDOR_POLL_CREATED',
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

export const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);
