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

/**
 * Transform feedback document to match frontend interface
 * Converts ObjectId fields to strings and renames fields
 * Properly typed to avoid 'as any' usage
 */
function transformFeedback<T = any>(doc: T | null | undefined): T | null {
  if (!doc) return null;
  
  const rawDoc = doc as any; // Only one controlled 'any' point
  
  const transformed: any = {
    ...rawDoc,
    id: rawDoc._id?.toString?.() || rawDoc.id,
    eventId: rawDoc.event?._id?.toString?.() || rawDoc.event?.toString?.() || rawDoc.eventId,
    userId: rawDoc.user?._id?.toString?.() || rawDoc.user?.toString?.() || rawDoc.userId,
  };
  
  // Clean up MongoDB internals
  delete transformed._id;
  delete transformed.__v;
  
  // Only delete event/user if they were ObjectIds (preserve undefined for removed fields)
  if (rawDoc.event && typeof rawDoc.event === 'object') {
    delete transformed.event;
  }
  if (rawDoc.user && typeof rawDoc.user === 'object') {
    // If user was populated with user data, preserve it
    if (rawDoc.user.firstName) {
      transformed.user = {
        id: rawDoc.user._id?.toString?.() || rawDoc.user.id,
        firstName: rawDoc.user.firstName,
        lastName: rawDoc.user.lastName,
        avatar: rawDoc.user.avatar,
      };
    } else {
      // User is just an ObjectId, delete it (we have userId now)
      delete transformed.user;
    }
  }
  
  return transformed as T;
}

export class FeedbackRepository extends BaseRepository<IFeedback> {
  constructor() {
    super(Feedback);
  }

  /**
   * Override update to apply transform
   */
  async update(
    id: string,
    updateData: any,
    options?: any
  ): Promise<IFeedback | null> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true, ...options }
    )
    .populate('user', 'firstName lastName avatar')
    .lean()
    .exec();

    return transformFeedback(doc) as IFeedback | null;
  }

  /**
   * Find feedback by event and user
   * Used to check if user already submitted feedback for an event
   */
  async findByEventAndUser(eventId: string, userId: string): Promise<IFeedback | null> {
    const doc = await this.model
      .findOne({
        event: new Types.ObjectId(eventId),
        user: new Types.ObjectId(userId),
      })
      .populate('user', 'firstName lastName avatar')
      .lean()
      .exec();
    
    return transformFeedback(doc) as IFeedback | null;
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

    const docs = await this.model
      .find({ event: new Types.ObjectId(eventId) })
      .populate('user', 'firstName lastName avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return docs.map(doc => transformFeedback(doc) as IFeedback | null).filter((doc): doc is IFeedback => doc !== null);
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
    averageRating: number | null;
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
    const stats = result[0]?.stats[0] || { averageRating: null, totalRatings: 0 };
    const distribution = result[0]?.distribution || [];

    // Ensure we return counts for all ratings 1..5 (even if zero)
    const fullDistribution: { rating: number; count: number }[] = [];
    const map = new Map<number, number>(distribution.map((d: any) => [d.rating, d.count]));
    for (let r = 1; r <= 5; r++) {
      fullDistribution.push({ rating: r, count: map.get(r) || 0 });
    }

    return {
      averageRating: stats.totalRatings > 0 ? stats.averageRating : null,
      totalRatings: stats.totalRatings || 0,
      ratingDistribution: fullDistribution,
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

    const docs = await this.model
      .find({ user: new Types.ObjectId(userId) })
      .populate('event', 'name type startDate')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return docs.map(doc => transformFeedback(doc) as IFeedback | null).filter((doc): doc is IFeedback => doc !== null);
  }
}

export const feedbackRepository = new FeedbackRepository();
