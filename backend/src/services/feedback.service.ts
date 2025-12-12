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
// import { registrationRepository } from '../repositories/registration.repository';
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
    // TODO -> UNCOMMENT THIS WHEN DONE !
    // Requirement #15 & #16: Verify user is registered for the event
    // User must have a CONFIRMED registration to leave feedback
    // For Student/Staff/TA/Professor: registration = attendance
    // const registration = await registrationRepository.getByUserAndEvent(userId, input.eventId);
    // if (!registration) {
    //   throw new TRPCError({
    //     code: 'FORBIDDEN',
    //     message: 'You must be registered for this event to leave feedback.',
    //   });
    // }
    
    // if (registration.status !== 'CONFIRMED') {
    //   throw new TRPCError({
    //     code: 'FORBIDDEN',
    //     message: 'Your registration must be confirmed to leave feedback.',
    //   });
    // }

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

    // Call AI moderation service if there's a comment
    let moderationResult = null;
    if (input.comment) {
      try {
        const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        const response = await fetch(`${AI_SERVICE_URL}/api/ai/moderate/comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comment: input.comment,
            comment_id: null,
            event_id: input.eventId,
            user_id: userId,
            context: event.name,
          }),
        });
        
        if (response.ok) {
          const data = await response.json() as { result?: any };
          moderationResult = data.result;
        }
      } catch (error) {
        console.error('AI moderation service error:', error);
        // Continue without moderation if service is unavailable
      }
    }

    // Determine moderation status based on AI analysis
    let moderationStatus: 'approved' | 'flagged' | 'pending' = 'approved';
    if (moderationResult && !moderationResult.is_appropriate) {
      // Flag for admin review if severity is medium or higher
      if (['medium', 'high', 'critical'].includes(moderationResult.severity)) {
        moderationStatus = 'flagged';
      }
    }

    // Create new feedback with moderation data
    const feedback = await this.repository.create({
      event: new Types.ObjectId(input.eventId),
      user: new Types.ObjectId(userId),
      type: feedbackType,
      rating: input.rating,
      comment: input.comment,
      // AI Moderation fields
      moderationStatus,
      moderationFlags: moderationResult?.flags || [],
      moderationSeverity: moderationResult?.severity || 'none',
      moderationConfidence: moderationResult?.confidence,
      moderationAiSuggestion: moderationResult?.suggestion === 'Remove comment' ? 'remove' : 'approve',
      moderationAiReasoning: moderationResult?.detected_issues 
        ? Object.entries(moderationResult.detected_issues)
            .map(([key, val]: [string, any]) => `${key}: ${val.score ? (val.score * 100).toFixed(0) + '%' : 'detected'}`)
            .join(', ')
        : undefined,
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
    // If feedback has a rating, preserve the rating and only remove the comment
    // If feedback has only a comment (no rating), delete the entire feedback
    if (feedback.type != 'comment') {
      // Remove the comment but preserve the rating (same behavior as user deleting their own comment)
      const feedbackIdStr = feedback.id || (feedback as any)._id?.toString();
      
      // Build update to remove comment (using $unset like in updateFeedback)
      const updateQuery: any = {
        $set: {
          type: 'rating', // Update type since comment is removed
        },
        $unset: {
          comment: '',
        }
      };
      
      await this.repository.update(feedbackIdStr, updateQuery);
      console.log(`✓ Comment removed for feedback ${feedbackIdStr}, rating preserved`);
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

  /**
   * Get flagged comments for admin moderation
   * Filters by moderation status and severity
   */
  async getFlaggedComments(options: {
    status?: 'pending' | 'flagged' | 'approved' | 'removed' | 'all';
    severity?: 'low' | 'medium' | 'high' | 'critical' | 'all';
    page?: number;
    limit?: number;
  }): Promise<{
    comments: any[];
    total: number;
    stats: {
      pending: number;
      flagged: number;
      approved: number;
      removed: number;
    };
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    // Build query filter
    const query: any = {
      comment: { $exists: true, $ne: null },
      isCommentHidden: { $ne: true },
    };

    if (options.status && options.status !== 'all') {
      query.moderationStatus = options.status;
    } else {
      // For 'all', exclude approved to focus on items needing attention
      query.moderationStatus = { $in: ['pending', 'flagged', 'removed'] };
    }

    if (options.severity && options.severity !== 'all') {
      query.moderationSeverity = options.severity;
    }

    // Get comments with populated user and event data
    const Feedback = (this.repository as any).model;
    const comments = await Feedback
      .find(query)
      .populate('user', 'firstName lastName email avatar')
      .populate('event', 'name type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Feedback.countDocuments(query);

    // Get stats
    const baseStatsQuery = { comment: { $exists: true, $ne: null } };
    const [pendingCount, flaggedCount, approvedCount, removedCount] = await Promise.all([
      Feedback.countDocuments({ 
        ...baseStatsQuery,
        moderationStatus: 'pending' 
      }),
      Feedback.countDocuments({ 
        ...baseStatsQuery,
        moderationStatus: 'flagged' 
      }),
      Feedback.countDocuments({ 
        ...baseStatsQuery,
        moderationStatus: 'approved' 
      }),
      Feedback.countDocuments({ 
        ...baseStatsQuery,
        moderationStatus: 'removed' 
      }),
    ]);

    // Format comments for frontend
    const formattedComments = comments.map((c: any) => ({
      id: c._id.toString(),
      content: c.comment,
      userId: c.user?._id?.toString() || c.user?.toString(),
      userName: c.user ? `${c.user.firstName} ${c.user.lastName}` : 'Unknown User',
      userEmail: c.user?.email || '',
      userAvatar: c.user?.avatar,
      eventId: c.event?._id?.toString() || c.event?.toString(),
      eventName: c.event?.name || 'Unknown Event',
      eventType: c.event?.type,
      createdAt: c.createdAt,
      flags: c.moderationFlags || [],
      severity: c.moderationSeverity || 'none',
      confidence: c.moderationConfidence || 0,
      status: c.moderationStatus || 'pending',
      moderatedAt: c.moderatedAt,
      moderatedBy: c.moderatedBy?.toString(),
      moderationNote: c.moderationNote,
      aiSuggestion: c.moderationAiSuggestion,
      aiReasoning: c.moderationAiReasoning,
    }));

    return {
      comments: formattedComments,
      total,
      stats: {
        pending: pendingCount,
        flagged: flaggedCount,
        approved: approvedCount,
        removed: removedCount,
      },
    };
  }

  /**
   * Moderate a comment (approve or remove)
   */
  async moderateComment(
    feedbackId: string,
    action: 'approved' | 'removed',
    adminId: string,
    note?: string
  ): Promise<{ success: boolean }> {
    const feedback = await this.repository.findById(feedbackId);
    
    if (!feedback) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Feedback not found',
      });
    }

    const updateData: any = {
      moderationStatus: action,
      moderatedAt: new Date(),
      moderatedBy: new Types.ObjectId(adminId),
    };

    if (note) {
      updateData.moderationNote = note;
    }

    if (action === 'removed') {
      updateData.isCommentHidden = true;
      updateData.commentHiddenAt = new Date();
      updateData.commentHiddenReason = note || 'Inappropriate content';
      
      // Send notification to user
      await feedback.populate('user');
      await feedback.populate('event');
      const user = feedback.user as any;
      const event = feedback.event as any;
      
      if (user && user.email) {
        try {
          await mailService.sendCommentDeletedWarningEmail(user.email, {
            name: user.firstName || 'User',
            comment: feedback.comment || '',
            eventName: event?.name || 'an event',
            deletedAt: new Date().toLocaleString(),
          });
        } catch (emailError: any) {
          console.error('Failed to send moderation email:', emailError.message);
        }
        
        // Send in-app notification
        const { notificationService } = await import('./notification.service.js');
        await notificationService.notifyCommentDeleted(
          String(user._id),
          event?.name || 'an event',
          note || 'Inappropriate content'
        );
      }
    }

    await this.repository.update(feedbackId, { $set: updateData });
    
    return { success: true };
  }

  /**
   * Get moderation statistics for dashboard
   */
  async getModerationStats(): Promise<{
    pending: number;
    flagged: number;
    approved: number;
    removed: number;
    total: number;
    highPriority: number;
    avgConfidence: number;
    byDay: { date: string; count: number }[];
  }> {
    const baseQuery = { 
      comment: { $exists: true, $ne: null }
    };
    const Feedback = (this.repository as any).model;
    const [pending, flagged, approved, removed, total, highPriority] = await Promise.all([
      Feedback.countDocuments({ ...baseQuery, moderationStatus: 'pending' }),
      Feedback.countDocuments({ ...baseQuery, moderationStatus: 'flagged' }),
      Feedback.countDocuments({ ...baseQuery, moderationStatus: 'approved' }),
      Feedback.countDocuments({ ...baseQuery, moderationStatus: 'removed' }),
      Feedback.countDocuments(baseQuery),
      Feedback.countDocuments({ 
        ...baseQuery, 
        moderationStatus: { $in: ['pending', 'flagged'] },
        moderationSeverity: { $in: ['high', 'critical'] }
      }),
    ]);

    // Calculate average confidence
    const confidenceAgg = await Feedback.aggregate([
      { $match: { ...baseQuery, moderationConfidence: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgConfidence: { $avg: '$moderationConfidence' } } }
    ]);
    const avgConfidence = confidenceAgg.length > 0 ? Math.round(confidenceAgg[0].avgConfidence * 100) : 0;

    // Get counts by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const byDayAgg = await Feedback.aggregate([
      { 
        $match: { 
          ...baseQuery, 
          moderationStatus: 'flagged',
          createdAt: { $gte: sevenDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const byDay = byDayAgg.map((d: any) => ({ date: d._id, count: d.count }));

    return {
      pending,
      flagged,
      approved,
      removed,
      total,
      highPriority,
      avgConfidence,
      byDay,
    };
  }

  /**
   * Get unmoderated comments for AI polling
   * Returns comments that haven't been through AI moderation yet
   */
  async getUnmoderatedComments(limit: number = 50): Promise<{
    comments: {
      id: string;
      content: string;
      eventId: string;
      eventName: string;
      userId: string;
      userName: string;
      createdAt: Date;
    }[];
    total: number;
  }> {
    // Find comments that haven't been moderated (no flags, no severity set)
    const query = {
      comment: { $exists: true, $ne: null },
      $or: [
        { moderationFlags: { $exists: false } },
        { moderationFlags: { $size: 0 } },
        { moderationStatus: { $exists: false } },
        { moderationStatus: null },
      ],
    };

    const Feedback = (this.repository as any).model;
    const total = await Feedback.countDocuments(query);
    
    const feedbacks = await Feedback
      .find(query)
      .populate('event', 'name type')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const comments = feedbacks.map((f: any) => ({
      id: f._id.toString(),
      content: f.comment,
      eventId: f.event?._id?.toString() || f.event?.toString(),
      eventName: f.event?.name || 'Unknown Event',
      eventType: f.event?.type,
      userId: f.user?._id?.toString() || f.user?.toString(),
      userName: f.user ? `${f.user.firstName} ${f.user.lastName}` : 'Unknown User',
      userEmail: f.user?.email || '',
      createdAt: f.createdAt,
      moderationStatus: f.moderationStatus,
      moderationFlags: f.moderationFlags || [],
      moderationSeverity: f.moderationSeverity,
      moderationConfidence: f.moderationConfidence,
      moderationAiSuggestion: f.moderationAiSuggestion,
    }));

    return { comments, total };
  }

  /**
   * Batch update moderation results from AI service
   */
  async batchUpdateModeration(results: {
    feedbackId: string;
    isAppropriate: boolean;
    flags: string[];
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    aiSuggestion?: 'approve' | 'remove';
    aiReasoning?: string;
  }[]): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    for (const result of results) {
      try {
        // Determine status based on flags
        let status: 'pending' | 'flagged' | 'approved' = 'approved';
        if (result.flags.length > 0) {
          status = result.severity === 'critical' || result.severity === 'high' 
            ? 'flagged' 
            : 'pending';
        }

        await this.repository.update(result.feedbackId, {
          $set: {
            moderationStatus: status,
            moderationFlags: result.flags,
            moderationSeverity: result.severity,
            moderationConfidence: result.confidence,
            aiSuggestion: result.aiSuggestion || (result.isAppropriate ? 'approve' : 'remove'),
            aiReasoning: result.aiReasoning,
            moderatedAt: new Date(),
          },
        });
        updated++;
      } catch (error) {
        console.error(`Failed to update moderation for ${result.feedbackId}:`, error);
        failed++;
      }
    }

    return { updated, failed };
  }

  /**
   * Get unmoderated comments with full data table support
   * Supports pagination, sorting, filtering like the users table
   */
  async getUnmoderatedCommentsWithFilters(data: {
    page?: number;
    perPage?: number;
    search?: string;
    sort?: Array<{ id: string; desc: boolean }>;
    filters?: Record<string, string[]>;
    extendedFilters?: Array<{
      id: string;
      value: string | string[];
      operator: string;
      variant: string;
      filterId: string;
    }>;
    joinOperator?: 'and' | 'or';
  }): Promise<{
    comments: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = data.page || 1;
    const limit = data.perPage || 10;
    const skip = (page - 1) * limit;

    // Build query - get comments that need moderation
    const query: any = {
      comment: { $exists: true, $ne: null },
      $or: [
        { moderationStatus: 'flagged' },
        { moderationStatus: 'pending' },
        { moderationStatus: null },
      ],
    };

    // Global search using regex across comment content
    if (data.search) {
      const searchRegex = { $regex: data.search, $options: 'i' };
      query.comment = searchRegex;
    }

    // Simple filters (faceted filters from DataTableFacetedFilter)
    if (data.filters && Object.keys(data.filters).length > 0) {
      for (const [key, values] of Object.entries(data.filters)) {
        if (values.length > 0) {
          // Special handling for moderationFlags - check if array contains any of the selected values
          if (key === 'moderationFlags') {
            query[key] = { $in: values };
          } else {
            query[key] = { $in: values };
          }
        }
      }
    }

    // Extended filters with operators (command mode from DataTableFilterMenu)
    if (data.extendedFilters && data.extendedFilters.length > 0) {
      const filterConditions = data.extendedFilters.map(filter => {
        const field = filter.id;
        const value = filter.value;
        const operator = filter.operator;

        switch (operator) {
          case 'iLike':
            return { [field]: { $regex: value, $options: 'i' } };
          case 'eq':
            return { [field]: value };
          case 'ne':
            return { [field]: { $ne: value } };
          case 'inArray':
            return { [field]: { $in: Array.isArray(value) ? value : [value] } };
          case 'notInArray':
            return { [field]: { $nin: Array.isArray(value) ? value : [value] } };
          case 'lt':
            return { [field]: { $lt: Number(value) } };
          case 'lte':
            return { [field]: { $lte: Number(value) } };
          case 'gt':
            return { [field]: { $gt: Number(value) } };
          case 'gte':
            return { [field]: { $gte: Number(value) } };
          default:
            return { [field]: value };
        }
      });

      if (data.joinOperator === 'or') {
        query.$or = [...(query.$or || []), ...filterConditions];
      } else {
        query.$and = filterConditions;
      }
    }
    // Build sort
    const sortObj: any = {};
    if (data.sort && data.sort.length > 0) {
      for (const s of data.sort) {
        // Special handling for severity sorting - map to numeric values
        if (s.id === 'moderationSeverity') {
          // MongoDB can't sort enums properly, so we'll sort in memory after fetch
          // For now, use createdAt as secondary sort
          sortObj.createdAt = s.desc ? -1 : 1;
        } else {
          sortObj[s.id] = s.desc ? -1 : 1;
        }
      }
    } else {
      sortObj.createdAt = -1; // Default sort
    }

    const Feedback = (this.repository as any).model;
    const total = await Feedback.countDocuments(query);
    
    const feedbacks = await Feedback
      .find(query)
      .populate('event', 'name type')
      .populate('user', 'firstName lastName email')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    let comments = feedbacks.map((f: any) => ({
      id: f._id.toString(),
      content: f.comment,
      eventId: f.event?._id?.toString() || f.event?.toString(),
      eventName: f.event?.name || 'Unknown Event',
      eventType: f.event?.type,
      userId: f.user?._id?.toString() || f.user?.toString(),
      userName: f.user ? `${f.user.firstName} ${f.user.lastName}` : 'Unknown User',
      userEmail: f.user?.email || '',
      createdAt: f.createdAt,
      moderationStatus: f.moderationStatus,
      moderationFlags: f.moderationFlags || [],
      moderationSeverity: f.moderationSeverity || 'none',
      moderationConfidence: f.moderationConfidence || 0,
      moderationAiSuggestion: f.moderationAiSuggestion,
    }));

    // Post-sort by severity if needed (since MongoDB can't sort enums properly)
    if (data.sort && data.sort.some(s => s.id === 'moderationSeverity')) {
      const severitySort = data.sort.find(s => s.id === 'moderationSeverity');
      if (severitySort) {
        const severityOrder: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
        comments.sort((a: any, b: any) => {
          const aVal = severityOrder[a.moderationSeverity] || 0;
          const bVal = severityOrder[b.moderationSeverity] || 0;
          return severitySort.desc ? bVal - aVal : aVal - bVal;
        });
      }
    }

    return {
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const feedbackService = new FeedbackService(feedbackRepository);
