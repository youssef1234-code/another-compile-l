/**
 * Notification Service
 *
 * Business logic for notification management
 *
 * @module services/notification.service
 */

import { BaseService } from './base.service.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import type { INotification } from '../models/notification.model.js';
import type { UserRole } from '@event-manager/shared';
import { TRPCError } from '@trpc/server';

export class NotificationService extends BaseService<
  INotification,
  typeof notificationRepository
> {
  constructor() {
    super(notificationRepository);
  }

  protected getEntityName(): string {
    return 'Notification';
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string, limit: number = 50) {
    return this.repository.getUnreadForUser(userId, limit);
  }

  /**
   * Get all notifications for a user with pagination
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    return this.repository.getForUser(userId, page, limit);
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.repository.getUnreadCount(userId);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const success = await this.repository.markAsRead(notificationId, userId);
    if (!success) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Notification not found or does not belong to user',
      });
    }
    return true;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    return this.repository.markAllAsRead(userId);
  }

  /**
   * Delete notification
   */
  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<boolean> {
    const success = await this.repository.deleteNotification(
      notificationId,
      userId
    );
    if (!success) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Notification not found or does not belong to user',
      });
    }
    return true;
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<number> {
    return this.repository.deleteAllForUser(userId);
  }

  /**
   * Create notification for a single user
   */
  async notifyUser(
    userId: string,
    type: INotification['type'],
    title: string,
    message: string,
    relatedEntityId?: string
  ): Promise<INotification> {
    return this.repository.createForUser(
      userId,
      type,
      title,
      message,
      relatedEntityId
    );
  }

  /**
   * Create notifications for multiple users
   */
  async notifyUsers(
    userIds: string[],
    type: INotification['type'],
    title: string,
    message: string,
    relatedEntityId?: string
  ): Promise<number> {
    if (userIds.length === 0) return 0;
    return this.repository.createForUsers(
      userIds,
      type,
      title,
      message,
      relatedEntityId
    );
  }

  /**
   * Create notifications for users by role
   */
  async notifyUsersByRole(
    userRole: UserRole | UserRole[],
    type: INotification['type'],
    title: string,
    message: string,
    relatedEntityId?: string
  ): Promise<number> {
    return this.repository.createForUsersByRole(
      userRole,
      type,
      title,
      message,
      relatedEntityId
    );
  }

  /**
   * Create notifications for all users
   */
  async notifyAllUsers(
    type: INotification['type'],
    title: string,
    message: string,
    relatedEntityId?: string
  ): Promise<number> {
    return this.repository.createForAllUsers(
      type,
      title,
      message,
      relatedEntityId
    );
  }

  /**
   * Notify about new event
   * Requirement #57: Student/Staff/Events Office/TA/Professor receive notifications for any new added events
   */
  async notifyNewEvent(eventId: string, eventTitle: string, eventType: string) {
    const roles: UserRole[] = [
      'STUDENT',
      'STAFF',
      'TA',
      'PROFESSOR',
      'EVENT_OFFICE',
    ];
    return this.notifyUsersByRole(
      roles,
      'NEW_EVENT',
      'New Event Added! 🎉',
      `A new ${eventType.toLowerCase()} has been added: '${eventTitle}'. Check it out now!`,
      eventId
    );
  }

  /**
   * Notify about event reminder
   * Requirement #58: Receive reminders 1 day and 1 hour prior to events
   */
  async notifyEventReminder(
    userIds: string[],
    eventId: string,
    eventTitle: string,
    timeframe: '1_DAY' | '1_HOUR'
  ) {
    const message =
      timeframe === '1_DAY'
        ? `Reminder: '${eventTitle}' is happening tomorrow! Don't forget to attend.`
        : `Reminder: '${eventTitle}' is starting in 1 hour! Get ready!`;

    return this.notifyUsers(
      userIds,
      'EVENT_REMINDER',
      `Event Reminder ⏰`,
      message,
      eventId
    );
  }

  /**
   * Notify professor about workshop status
   * Requirement #44: Professor receives notification if workshop accepted/rejected
   */
  async notifyWorkshopStatus(
    professorId: string,
    workshopId: string,
    workshopTitle: string,
    status: 'ACCEPTED' | 'REJECTED',
    rejectionReason?: string
  ) {
    const title =
      status === 'ACCEPTED' ? '✅ Workshop Accepted!' : '❌ Workshop Rejected';

    const message =
      status === 'ACCEPTED'
        ? `Your workshop '${workshopTitle}' has been accepted and is now live!`
        : `Your workshop '${workshopTitle}' has been rejected. ${
            rejectionReason || 'Please review and resubmit.'
          }`;

    return this.notifyUser(
      professorId,
      'WORKSHOP_STATUS_UPDATE',
      title,
      message,
      workshopId
    );
  }

  /**
   * Notify Events Office about pending workshop
   * Requirement #39: Events Office receives notifications when doctors submit workshop requests
   */
  async notifyPendingWorkshop(
    workshopId: string,
    workshopTitle: string,
    professorName: string
  ) {
    return this.notifyUsersByRole(
      'EVENT_OFFICE',
      'WORKSHOP_PENDING',
      '📝 New Workshop Submission',
      `Professor ${professorName} has submitted a new workshop: '${workshopTitle}'. Please review it.`,
      workshopId
    );
  }

  /**
   * Notify vendor about request status
   * Requirement #63: Vendor receives email notification if request accepted/rejected
   */
  async notifyVendorRequestStatus(
    vendorId: string,
    requestId: string,
    requestType: string,
    status: 'ACCEPTED' | 'REJECTED'
  ) {
    const title =
      status === 'ACCEPTED' ? '✅ Request Accepted!' : '❌ Request Rejected';

    const message =
      status === 'ACCEPTED'
        ? `Your ${requestType} request has been accepted! Please proceed with payment.`
        : `Your ${requestType} request has been rejected. Please contact us for more information.`;

    return this.notifyUser(
      vendorId,
      'VENDOR_REQUEST_UPDATE',
      title,
      message,
      requestId
    );
  }

  /**
   * Notify about comment deletion warning
   * Requirement #21: Receive warning email if comments deleted for being inappropriate
   */
  async notifyCommentDeleted(
    userId: string,
    eventTitle: string,
    reason: string
  ) {
    return this.notifyUser(
      userId,
      'COMMENT_DELETED_WARNING',
      '⚠️ Comment Removed',
      `Your comment on '${eventTitle}' has been removed for being inappropriate. Reason: ${reason}. Please follow community guidelines.`,
      undefined
    );
  }

  /**
   * Notify about gym session update
   * Requirement #87: Receive email if gym session cancelled or edited
   */
  async notifyGymSessionUpdate(
    userIds: string[],
    sessionId: string,
    sessionTitle: string,
    updateType: 'CANCELLED' | 'EDITED',
    details?: string
  ) {
    const title =
      updateType === 'CANCELLED'
        ? '❌ Gym Session Cancelled'
        : '📝 Gym Session Updated';

    const message =
      updateType === 'CANCELLED'
        ? `The gym session '${sessionTitle}' has been cancelled. We apologize for the inconvenience.`
        : `The gym session '${sessionTitle}' has been updated. ${
            details || 'Please check the new details.'
          }`;

    return this.notifyUsers(
      userIds,
      'GYM_SESSION_UPDATE',
      title,
      message,
      sessionId
    );
  }

  /**
   * Notify about new loyalty partner
   * Requirement #73: Receive notifications for newly added partners in GUC loyalty program
   */
  async notifyNewLoyaltyPartner(
    vendorName: string,
    discountRate: number,
    promoCode?: string
  ) {
    const roles: UserRole[] = ['STUDENT', 'STAFF', 'TA', 'PROFESSOR'];
    const message = `New partner '${vendorName}' joined the GUC Loyalty Program! Enjoy ${discountRate}% discount${
      promoCode ? ` with code: ${promoCode}` : ''
    }.`;

    return this.notifyUsersByRole(
      roles,
      'NEW_LOYALTY_PARTNER',
      '🎁 New Loyalty Partner!',
      message,
      undefined
    );
  }

  /**
   * Notify Events Office/Admin about pending vendor requests
   * Requirement #74: Receive notifications for pending vendor requests
   */
  async notifyPendingVendorRequest(
    requestId: string,
    vendorName: string,
    requestType: string
  ) {
    const roles: UserRole[] = ['EVENT_OFFICE', 'ADMIN'];
    return this.notifyUsersByRole(
      roles,
      'VENDOR_PENDING',
      '📋 Pending Vendor Request',
      `Vendor '${vendorName}' has submitted a ${requestType} request. Please review it.`,
      requestId
    );
  }

  /**
   * Notify Events Office about new vendor poll creation
   * Requirement #82: Notify when poll is created for conflicting booth requests
   */
  async notifyVendorPollCreated(
    pollId: string,
    boothLabel: string,
    vendorCount: number
  ) {
    const roles: UserRole[] = ['EVENT_OFFICE'];
    return this.notifyUsersByRole(
      roles,
      'VENDOR_POLL_CREATED',
      '🗳️ Vendor Poll Created',
      `A poll has been created for booth ${boothLabel} with ${vendorCount} conflicting vendor applications. Please cast your vote.`,
      pollId
    );
  }
}

// Singleton instance
export const notificationService = new NotificationService();
