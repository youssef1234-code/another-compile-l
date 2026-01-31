/**
 * Notifications Router
 * 
 * tRPC endpoints for notification management
 * Implements polling-based real-time notifications
 * 
 * @module routers/notifications.router
 */

import { protectedProcedure, router } from '../trpc/trpc.js';
import { notificationService } from '../services/notification.service.js';
import {
  GetNotificationsSchema,
  MarkNotificationReadSchema,
  DeleteNotificationSchema,
} from '../shared/index.js';

export const notificationsRouter = router({
  /**
   * Get unread notifications (for polling)
   * Frontend polls this endpoint every 30 seconds
   */
  getUnread: protectedProcedure.query(async ({ ctx }) => {
    const userId = String((ctx.user!._id as any));
    const notifications = await notificationService.getUnreadNotifications(userId, 50);
    
    return notifications.map((n: any) => ({
      id: String(n._id),
      user: String(n.user),
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      relatedEntityId: n.relatedEntityId,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));
  }),

  /**
   * Get unread count (for badge)
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = String((ctx.user!._id as any));
    return notificationService.getUnreadCount(userId);
  }),

  /**
   * Get all notifications with pagination
   */
  getAll: protectedProcedure
    .input(GetNotificationsSchema)
    .query(async ({ input, ctx }) => {
      const userId = String((ctx.user!._id as any));
      const result = await notificationService.getUserNotifications(
        userId,
        input.page,
        input.limit
      );

      return {
        notifications: result.notifications.map((n: any) => ({
          id: String(n._id),
          user: String(n.user),
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          relatedEntityId: n.relatedEntityId,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        })),
        total: result.total,
        hasMore: result.hasMore,
      };
    }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(MarkNotificationReadSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = String((ctx.user!._id as any));
      await notificationService.markAsRead(input.notificationId, userId);
      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = String((ctx.user!._id as any));
    const count = await notificationService.markAllAsRead(userId);
    return { success: true, count };
  }),

  /**
   * Delete notification
   */
  delete: protectedProcedure
    .input(DeleteNotificationSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = String((ctx.user!._id as any));
      await notificationService.deleteNotification(input.notificationId, userId);
      return { success: true };
    }),

  /**
   * Delete all notifications
   */
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = String((ctx.user!._id as any));
    const count = await notificationService.deleteAllNotifications(userId);
    return { success: true, count };
  }),
});
