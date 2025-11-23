/**
 * Notification Repository
 * 
 * Data access layer for notifications
 * 
 * @module repositories/notification.repository
 */

import { BaseRepository } from './base.repository.js';
import type { INotification } from '../models/notification.model.js';
import { Notification } from '../models/notification.model.js';
import type { UserRole } from '@event-manager/shared';
import mongoose from 'mongoose';

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(Notification);
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadForUser(userId: string, limit: number = 50): Promise<any[]> {
    return this.model
      .find({ user: userId, isRead: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec() as any;
  }

  /**
   * Get all notifications for a user with pagination
   */
  async getForUser(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: any[]; total: number; hasMore: boolean }> {
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await Promise.all([
      this.model
        .find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec() as any,
      this.model.countDocuments({ user: userId }),
    ]);

    return {
      notifications,
      total,
      hasMore: skip + notifications.length < total,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await this.model
      .updateOne(
        { _id: notificationId, user: userId },
        { $set: { isRead: true } }
      )
      .exec();
    
    return result.modifiedCount > 0;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.model
      .updateMany(
        { user: userId, isRead: false },
        { $set: { isRead: true } }
      )
      .exec();
    
    return result.modifiedCount;
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.model.countDocuments({ user: userId, isRead: false }).exec();
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await this.model
      .deleteOne({ _id: notificationId, user: userId })
      .exec();
    
    return result.deletedCount > 0;
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllForUser(userId: string): Promise<number> {
    const result = await this.model.deleteMany({ user: userId }).exec();
    return result.deletedCount;
  }

  /**
   * Create notification for a single user
   */
  async createForUser(
    userId: string,
    type: INotification['type'],
    title: string,
    message: string,
    relatedEntityId?: string
  ): Promise<INotification> {
    const notification = await this.model.create({
      user: userId,
      type,
      title,
      message,
      isRead: false,
      relatedEntityId,
    });

    return notification.toObject();
  }

  /**
   * Create notifications for multiple users
   */
  async createForUsers(
    userIds: string[],
    type: INotification['type'],
    title: string,
    message: string,
    relatedEntityId?: string
  ): Promise<number> {
    const notifications = userIds.map((userId) => ({
      user: new mongoose.Types.ObjectId(userId),
      type,
      title,
      message,
      isRead: false,
      relatedEntityId,
    }));

    const result = await this.model.insertMany(notifications);
    return result.length;
  }

  /**
   * Create notifications for users by role
   */
  async createForUsersByRole(
    userRole: UserRole | UserRole[],
    type: INotification['type'],
    title: string,
    message: string,
    relatedEntityId?: string
  ): Promise<number> {
    // Import User model dynamically to avoid circular dependency
    const { User } = await import('../models/user.model.js');
    
    const roles = Array.isArray(userRole) ? userRole : [userRole];
    
    // Find all users with the specified role(s)
    const users = await User.find({ 
      role: { $in: roles },
      isActive: true,
      isEmailVerified: true,
    }).select('_id').lean().exec();

    const userIds = users.map((u) => u._id.toString());
    return this.createForUsers(userIds, type, title, message, relatedEntityId);
  }

  /**
   * Create notifications for all users
   */
  async createForAllUsers(
    type: INotification['type'],
    title: string,
    message: string,
    relatedEntityId?: string
  ): Promise<number> {
    // Import User model dynamically to avoid circular dependency
    const { User } = await import('../models/user.model.js');
    
    const users = await User.find({ 
      isActive: true,
      isEmailVerified: true,
    }).select('_id').lean().exec();

    const userIds = users.map((u) => u._id.toString());
    return this.createForUsers(userIds, type, title, message, relatedEntityId);
  }
}

// Singleton instance
export const notificationRepository = new NotificationRepository();
