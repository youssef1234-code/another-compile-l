/**
 * Feedback Service
 * 
 * Business logic for feedback (ratings & comments) management
 * 
 * Core User Stories:
 * - #15: Student/Staff/TA/Professor can rate an event they attended
 * - #16: Student/Staff/TA/Professor can comment on an event they attended
 * - #17: Student/Staff/Events Office/TA/Professor/Admin can view all ratings and comments on any event
 * - #18: Admin can delete any inappropriate comments
 * 
 * @module services/feedback.service
 */

import { FeedbackRepository, feedbackRepository } from '../repositories/feedback.repository';
import { eventRepository } from '../repositories/event.repository';
import { registrationRepository } from '../repositories/registration.repository';
import { BaseService } from './base.service';
import { TRPCError } from '@trpc/server';
import type { IFeedback } from '../models/feedback.model';
import type { CreateFeedbackInput, UpdateFeedbackInput } from '@event-manager/shared';
import { Types } from 'mongoose';
import { mailService } from './mail.service';

export class FeedbackService extends BaseService<IFeedback, FeedbackRepository> {
  constructor(repository: FeedbackRepository) {
    super(repository);
  }

  /**
   * Get entity name for error messages
   */
  protected getEntityName(): string {
    return 'Feedback';
  }

  /**
   * Create feedback (Story #15 & #16)
   * - Student/Staff/TA/Professor can rate and/or comment on events they attended
   * - Only allowed after event has started
   * - User cannot create duplicate feedback for the same event
   * - Automatically determines type based on provided fields
   */
  async createFeedback(
    userId: string,
    input: CreateFeedbackInput
  ): Promise<IFeedback> {
    // Disallow ADMIN and EVENT_OFFICE from creating feedback (view only roles)
    // ctx.user.role isn't directly here; we enforce higher layer, but double-guard via repository fetch of user not needed.
    // Caller (router) sends userId; we will trust router to have user in context and add a runtime check by requiring role param if needed later.
    // Validate event exists
    const event = await eventRepository.findById(input.eventId);
    if (!event) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Event not found',
      });
    }

    // Check if event has ended (feedback only starting from the day after event ends)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Today at 00:00:00
    const eventEndDate = event.endDate || event.startDate; // Fallback to startDate if no endDate
    const eventEndDay = new Date(eventEndDate.getFullYear(), eventEndDate.getMonth(), eventEndDate.getDate()); // Event end day at 00:00:00
    
    // Only allow feedback starting from the day after the event ends
    if (today <= eventEndDay) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot add feedback until the day after the event ends. Please wait until tomorrow.',
      });
    }

    // Requirement #15 & #16: Verify user attended the event
    // User must have a CONFIRMED registration with attended=true to leave feedback
    const registration = await registrationRepository.getByUserAndEvent(userId, input.eventId);
    if (!registration) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You must be registered for this event to leave feedback.',
      });
    }
    
    if (registration.status !== 'CONFIRMED') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Your registration must be confirmed to leave feedback.',
      });
    }
    
    if (!registration.attended) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You must have attended this event to leave feedback. Only attendees can rate or comment.',
      });
    }

    // Check if user already has feedback for this event
    const existingFeedback = await this.repository.findByEventAndUser(
      input.eventId,
      userId
    );

    if (existingFeedback) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You have already submitted feedback for this event.',
      });
    }

    // Automatically determine type based on provided fields
    let feedbackType: 'rating' | 'comment' | 'both';
    if (input.rating != null && input.comment) {
      feedbackType = 'both';
    } else if (input.rating != null) {
      feedbackType = 'rating';
    } else if (input.comment) {
      feedbackType = 'comment';
    } else {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Please provide either a rating, a comment, or both.',
      });
    }

    // Create new feedback
    const feedback = await this.repository.create({
      event: new Types.ObjectId(input.eventId),
      user: new Types.ObjectId(userId),
      type: feedbackType,
      rating: input.rating,
      comment: input.comment,
    });

    return feedback;
  }

  /**
   * Update existing feedback (OPTIONAL - not in core user stories)
   * Allows users to edit their feedback after participation
   * - Omitted fields: keep existing value
   * - null value: remove the field
   * - Provided value: update to new value
   * - If both fields removed: delete the feedback entirely
   * Automatically determines type based on final fields
   * Sets isEdited flag:
   *   - true: if modifying an existing field
   *   - false: if adding a NEW field that didn't exist before
   */
  async updateFeedback(
    userId: string,
    eventId: string,
    input: UpdateFeedbackInput
  ): Promise<IFeedback | null> {
    // Find existing feedback
    const existingFeedback = await this.repository.findByEventAndUser(eventId, userId);
    if (!existingFeedback) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No existing feedback found. Please create feedback first.',
      });
    }

    // Track if fields exist in original feedback
    const hadComment = !!existingFeedback.comment;

    // Determine final values:
    // - If field is in input: use input value (could be null to remove)
    // - If field not in input: keep existing value
    const newRating = 'rating' in input 
      ? (input.rating === null ? undefined : input.rating)
      : existingFeedback.rating;
    
    const newComment = 'comment' in input
      ? (input.comment === null || input.comment === '' ? undefined : input.comment)
      : existingFeedback.comment;

    // If both fields are removed, delete the feedback entirely
    if (newRating == null && !newComment) {
      // Use id if available (transformed), otherwise fall back to _id (untransformed edge case)
      const feedbackId = existingFeedback.id || (existingFeedback as any)._id?.toString();
      if (!feedbackId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Could not determine feedback ID for deletion',
        });
      }
      await this.repository.permanentlyDelete(feedbackId);
      return null; // Indicate feedback was deleted
    }

    // Automatically determine type based on final values
    let feedbackType: 'rating' | 'comment' | 'both';
    if (newRating != null && newComment) {
      feedbackType = 'both';
    } else if (newRating != null) {
      feedbackType = 'rating';
    } else {
      feedbackType = 'comment';
    }

    // Determine isEdited flag:
    // - isEdited is ONLY for tracking comment edits (not rating changes)
    // - If comment exists now AND existed before AND value changed → set isEdited = true
    // - Otherwise → set isEdited = false
    const nowHasComment = !!newComment;
    
    // Check if comment actually changed
    const isEditingComment = nowHasComment && hadComment && 'comment' in input && newComment !== existingFeedback.comment;
    
    // Only set isEdited true if comment was actually edited (value changed)
    const shouldMarkEdited = isEditingComment;

    // Build update object with proper field removal using $unset
    const $set: any = {
      type: feedbackType,
      isEdited: shouldMarkEdited,
    };
    const $unset: any = {};

    // Handle rating: set or unset
    if (newRating != null) {
      $set.rating = newRating;
    } else if ('rating' in input && input.rating === null) {
      // Remove rating field from database
      $unset.rating = '';
    }

    // Handle comment: set or unset
    if (newComment) {
      $set.comment = newComment;
    } else if ('comment' in input && (input.comment === null || input.comment === '')) {
      // Remove comment field from database
      $unset.comment = '';
    }

    // Build the update query with $set and $unset operators
    const updateQuery: any = { $set };
    if (Object.keys($unset).length > 0) {
      updateQuery.$unset = $unset;
    }

    // Update feedback using repository (use id instead of _id since it's been transformed)
    const feedbackId = existingFeedback.id || (existingFeedback as any)._id?.toString();
    if (!feedbackId) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Could not determine feedback ID for update',
      });
    }
    
    const updated = await this.repository.update(feedbackId, updateQuery);

    if (!updated) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update feedback',
      });
    }

    return updated;
  }

  /**
   * Get all feedback for a specific event (Story #17)
   * Anyone can view all ratings and comments on any event
   * Includes pagination
   */
  async getFeedbackByEvent(
    eventId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    feedback: IFeedback[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const [feedback, total] = await Promise.all([
      this.repository.findByEvent(eventId, { skip, limit }),
      this.repository.countByEvent(eventId),
    ]);

    return {
      feedback,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get rating statistics for an event (OPTIONAL - helper method for frontend)
   * Calculates average rating and distribution
   */
  async getEventRatingStats(eventId: string): Promise<{
    averageRating: number | null;
    totalRatings: number;
    ratingDistribution: { rating: number; count: number }[];
  }> {
    return this.repository.getEventRatingStats(eventId);
  }

  /**
   * Get user's own feedback for an event (OPTIONAL - helper method for frontend)
   */
  async getUserFeedbackForEvent(
    userId: string,
    eventId: string
  ): Promise<IFeedback | null> {
    return this.repository.findByEventAndUser(eventId, userId);
  }

  /**
   * Get all feedback by user (OPTIONAL - helper method for frontend)
   */
  async getUserFeedbackHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    feedback: IFeedback[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const feedback = await this.repository.findByUser(userId, { skip, limit });
    const total = await this.repository.count({ user: new Types.ObjectId(userId) });

    return {
      feedback,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get overall feedback stats (OPTIONAL - helper method for admin analytics)
   */
  async getAllFeedbackStats(): Promise<{
    totalFeedback: number;
    totalRatings: number;
    totalComments: number;
    averageRating: number;
  }> {
    return this.repository.getAllFeedbackStats();
  }

  /**
   * Delete feedback comment (Story #18 & #21)
   * Admin can delete any inappropriate comments
   * If feedback has a rating, the rating is preserved and only the comment is hidden
   * If feedback has only a comment, the entire feedback is deleted
   * Sends warning email to the user who posted the comment
   */
  async deleteFeedback(feedbackId: string, reason?: string): Promise<void> {
    // Fetch the feedback with populated user and event data before processing
    const feedback = await this.repository.findById(feedbackId);
    
    if (!feedback) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Feedback not found',
      });
    }

    // Check if feedback has a comment to delete
    if (!feedback.comment) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This feedback has no comment to delete',
      });
    }

    // Populate user and event details
    await feedback.populate('user');
    await feedback.populate('event');

    const user = feedback.user as any;
    const event = feedback.event as any;

    // Send warning email to the user (Story #21)
    if (user && user.email && feedback.comment) {
      try {
        await mailService.sendCommentDeletedWarningEmail(user.email, {
          name: user.firstName || 'User',
          comment: feedback.comment,
          eventName: event?.name || 'an event',
          deletedAt: new Date().toLocaleString(),
        });
        console.log(`📧 Sent comment deletion warning email to: ${user.email}`);
      } catch (emailError: any) {
        // Log the error but don't fail the deletion
        console.error('⚠️  Failed to send comment deletion warning email:', emailError.message);
      }
      
      // Requirement #21: Send in-app notification about comment deletion
      const { notificationService } = await import('./notification.service.js');
      await notificationService.notifyCommentDeleted(
        String(user._id),
        event?.name || 'an event',
        reason || 'Inappropriate content'
      );
    }

    // Determine whether to hide comment or delete entire feedback
    // If feedback has a rating, preserve the rating and only hide the comment
    // If feedback has only a comment (type='comment'), delete the entire feedback
    if (feedback.rating != null && feedback.type === 'both') {
      // Hide the comment but preserve the rating
      const feedbackIdStr = feedback.id || (feedback as any)._id?.toString();
      await this.repository.update(feedbackIdStr, {
        isCommentHidden: true,
        commentHiddenAt: new Date(),
        commentHiddenReason: reason || 'Inappropriate content',
        type: 'rating', // Update type since comment is now hidden
      } as any);
      console.log(`✓ Comment hidden for feedback ${feedbackIdStr}, rating preserved`);
    } else {
      // Feedback has only a comment, delete the entire feedback
      const deleted = await this.repository.permanentlyDelete(feedbackId);
      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Feedback not found',
        });
      }
      console.log(`✓ Feedback ${feedbackId} permanently deleted (comment-only)`);
    }
  }
}

export const feedbackService = new FeedbackService(feedbackRepository);
