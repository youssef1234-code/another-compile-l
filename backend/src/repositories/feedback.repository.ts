/**
 * Feedback Repository
 * 
 * Repository Pattern for Feedback entity
 * Handles all database operations for feedback (ratings & comments)
 * 
 * @module repositories/feedback.repository
 */

import { Feedback, type IFeedback } from '../models/feedback.model';
import { BaseRepository } from './base.repository';
import { Types } from 'mongoose';

export class FeedbackRepository extends BaseRepository<IFeedback> {
  constructor() {
    super(Feedback);
  }

  /**
   * Find feedback by event and user
   * Used to check if user already submitted feedback for an event
   */
  async findByEventAndUser(eventId: string, userId: string): Promise<IFeedback | null> {
    return this.model.findOne({
      event: new Types.ObjectId(eventId),
      user: new Types.ObjectId(userId),
    });
  }

  /**
   * Find all feedback for a specific event
   * With pagination and user population
   */
  async findByEvent(
    eventId: string,
    options: {
      skip?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
    } = {}
  ): Promise<IFeedback[]> {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options;

    return this.model
      .find({ event: new Types.ObjectId(eventId) })
      .populate('user', 'firstName lastName avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec() as any;
  }

  /**
   * Count feedback for a specific event
   */
  async countByEvent(eventId: string): Promise<number> {
    return this.model.countDocuments({
      event: new Types.ObjectId(eventId),
    });
  }

  /**
   * Get aggregate rating statistics for an event
   */
  async getEventRatingStats(eventId: string): Promise<{
    averageRating: number;
    totalRatings: number;
    ratingDistribution: { rating: number; count: number }[];
  }> {
    const result = await this.model.aggregate([
      {
        $match: {
          event: new Types.ObjectId(eventId),
          type: { $in: ['rating', 'both'] }, // Only consider feedback with ratings
        },
      },
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalRatings: { $sum: 1 },
              },
            },
          ],
          distribution: [
            {
              $group: {
                _id: '$rating',
                count: { $sum: 1 },
              },
            },
            {
              $sort: { _id: 1 },
            },
            {
              $project: {
                _id: 0,
                rating: '$_id',
                count: 1,
              },
            },
          ],
        },
      },
    ]);

    const stats = result[0]?.stats[0] || { averageRating: 0, totalRatings: 0 };
    const distribution = result[0]?.distribution || [];

    return {
      averageRating: stats.averageRating || 0,
      totalRatings: stats.totalRatings || 0,
      ratingDistribution: distribution,
    };
  }

  /**
   * Get all feedback (ratings and comments) with stats
   * For admin/events office analytics
   */
  async getAllFeedbackStats(): Promise<{
    totalFeedback: number;
    totalRatings: number;
    totalComments: number;
    averageRating: number;
  }> {
    const result = await this.model.aggregate([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                ratings: {
                  $sum: {
                    $cond: [{ $in: ['$type', ['rating', 'both']] }, 1, 0],
                  },
                },
                comments: {
                  $sum: {
                    $cond: [{ $in: ['$type', ['comment', 'both']] }, 1, 0],
                  },
                },
              },
            },
          ],
          avgRating: [
            {
              $match: {
                type: { $in: ['rating', 'both'] },
              },
            },
            {
              $group: {
                _id: null,
                average: { $avg: '$rating' },
              },
            },
          ],
        },
      },
    ]);

    const totals = result[0]?.totals[0] || { total: 0, ratings: 0, comments: 0 };
    const avgRating = result[0]?.avgRating[0]?.average || 0;

    return {
      totalFeedback: totals.total || 0,
      totalRatings: totals.ratings || 0,
      totalComments: totals.comments || 0,
      averageRating: avgRating || 0,
    };
  }

  /**
   * Get feedback by user (for user's own feedback history)
   */
  async findByUser(
    userId: string,
    options: {
      skip?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
    } = {}
  ): Promise<IFeedback[]> {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options;

    return this.model
      .find({ user: new Types.ObjectId(userId) })
      .populate('event', 'name type startDate')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec() as any;
  }
}

export const feedbackRepository = new FeedbackRepository();
