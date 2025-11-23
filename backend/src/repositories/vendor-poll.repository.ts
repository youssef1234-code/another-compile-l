/**
 * Vendor Poll Repository
 *
 * Data access layer for vendor polls
 *
 * @module repositories/vendor-poll.repository
 */

import { BaseRepository } from "./base.repository.js";
import type { IVendorPoll, IVote } from "../models/vendor-poll.model.js";
import { VendorPoll } from "../models/vendor-poll.model.js";
import mongoose from "mongoose";

export class VendorPollRepository extends BaseRepository<IVendorPoll> {
  constructor() {
    super(VendorPoll);
  }

  /**
   * Find active polls
   */
  async findActivePolls(
    page: number = 1,
    limit: number = 20
  ): Promise<{ polls: IVendorPoll[]; total: number }> {
    const skip = (page - 1) * limit;

    const [polls, total] = await Promise.all([
      this.model
        .find({ status: "ACTIVE" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("conflictingApplications")
        .populate("votes.voterId", "firstName lastName email role")
        .lean()
        .exec() as any,
      this.model.countDocuments({ status: "ACTIVE" }),
    ]);

    return { polls, total };
  }

  /**
   * Find poll by booth and date range
   */
  async findPollByBoothAndDateRange(
    boothLocationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IVendorPoll | null> {
    return this.model
      .findOne({
        boothLocationId,
        startDate,
        endDate,
        status: "ACTIVE",
      })
      .populate("conflictingApplications")
      .lean()
      .exec() as any;
  }

  /**
   * Add application to poll
   */
  async addApplicationToPoll(
    pollId: string,
    applicationId: string
  ): Promise<IVendorPoll | null> {
    return this.model
      .findByIdAndUpdate(
        pollId,
        {
          $addToSet: {
            conflictingApplications: new mongoose.Types.ObjectId(applicationId),
          },
        },
        { new: true }
      )
      .lean()
      .exec() as any;
  }

  /**
   * Add vote to poll
   */
  async addVote(
    pollId: string,
    voterId: string,
    applicationId: string
  ): Promise<IVendorPoll | null> {
    // First check if user already voted
    const poll = await this.model.findById(pollId).lean().exec();
    if (!poll) return null;

    const existingVote = poll.votes?.find(
      (v) => v.voterId.toString() === voterId
    );

    if (existingVote) {
      // Update existing vote
      return this.model
        .findOneAndUpdate(
          {
            _id: pollId,
            "votes.voterId": new mongoose.Types.ObjectId(voterId),
          },
          {
            $set: {
              "votes.$.applicationId": new mongoose.Types.ObjectId(
                applicationId
              ),
              "votes.$.votedAt": new Date(),
            },
          },
          { new: true }
        )
        .populate("conflictingApplications")
        .populate("votes.voterId", "firstName lastName email role")
        .lean()
        .exec() as any;
    } else {
      // Add new vote
      const vote: IVote = {
        voterId: new mongoose.Types.ObjectId(voterId),
        applicationId: new mongoose.Types.ObjectId(applicationId),
        votedAt: new Date(),
      };

      return this.model
        .findByIdAndUpdate(pollId, { $push: { votes: vote } }, { new: true })
        .populate("conflictingApplications")
        .populate("votes.voterId", "firstName lastName email role")
        .lean()
        .exec() as any;
    }
  }

  /**
   * Resolve poll with winner
   */
  async resolvePoll(
    pollId: string,
    resolvedApplicationId: string,
    resolvedBy: string
  ): Promise<IVendorPoll | null> {
    return this.model
      .findByIdAndUpdate(
        pollId,
        {
          $set: {
            status: "RESOLVED",
            resolvedApplicationId: new mongoose.Types.ObjectId(
              resolvedApplicationId
            ),
            resolvedAt: new Date(),
            resolvedBy: new mongoose.Types.ObjectId(resolvedBy),
          },
        },
        { new: true }
      )
      .populate("conflictingApplications")
      .populate("votes.voterId", "firstName lastName email role")
      .populate("resolvedBy", "firstName lastName email role")
      .lean()
      .exec() as any;
  }

  /**
   * Cancel poll
   */
  async cancelPoll(pollId: string): Promise<IVendorPoll | null> {
    return this.model
      .findByIdAndUpdate(
        pollId,
        { $set: { status: "CANCELLED" } },
        { new: true }
      )
      .lean()
      .exec() as any;
  }

  /**
   * Get poll with vote counts
   */
  async getPollWithVoteCounts(pollId: string): Promise<any> {
    const result = await this.model.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(pollId) } },
      {
        $lookup: {
          from: "vendorapplications",
          localField: "conflictingApplications",
          foreignField: "_id",
          as: "applications",
        },
      },
      {
        $addFields: {
          voteCounts: {
            $map: {
              input: "$conflictingApplications",
              as: "appId",
              in: {
                applicationId: "$$appId",
                count: {
                  $size: {
                    $filter: {
                      input: "$votes",
                      as: "vote",
                      cond: { $eq: ["$$vote.applicationId", "$$appId"] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ]);

    return result[0] || null;
  }

  /**
   * Get all polls (active, resolved, cancelled)
   */
  async getAllPolls(
    page: number = 1,
    limit: number = 20,
    status?: "ACTIVE" | "RESOLVED" | "CANCELLED"
  ): Promise<{ polls: IVendorPoll[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = status ? { status } : {};

    const [polls, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("conflictingApplications")
        .populate("votes.voterId", "firstName lastName email role")
        .populate("resolvedBy", "firstName lastName email role")
        .lean()
        .exec() as any,
      this.model.countDocuments(filter),
    ]);

    return { polls, total };
  }
}

// Singleton instance
export const vendorPollRepository = new VendorPollRepository();
