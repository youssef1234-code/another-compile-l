/**
 * Vendor Poll Service
 *
 * Business logic for vendor poll management
 * Requirement #82: Events Office can create polls for conflicting vendor booth requests
 *
 * @module services/vendor-poll.service
 */

import { BaseService } from "./base.service.js";
import {
  VendorPollRepository,
  vendorPollRepository,
} from "../repositories/vendor-poll.repository.js";
import type { IVendorPoll } from "../models/vendor-poll.model.js";
import { ServiceError } from "../errors/errors.js";
import mongoose from "mongoose";
import { vendorApplicationRepository } from "../repositories/vendor-application.repository.js";

export class VendorPollService extends BaseService<
  IVendorPoll,
  VendorPollRepository
> {
  constructor(repository: VendorPollRepository) {
    super(repository);
  }

  protected getEntityName(): string {
    return "VendorPoll";
  }

  /**
   * Create a poll for conflicting vendor applications
   */
  async createPoll(
    boothLocationId: string,
    boothLabel: string | undefined,
    startDate: Date,
    duration: number,
    applicationIds: string[],
    createdBy: string,
    description?: string
  ): Promise<IVendorPoll> {
    // Validate applications exist
    const applications = await Promise.all(
      applicationIds.map((id) => vendorApplicationRepository.findById(id))
    );

    const validApplications = applications.filter((app) => app !== null);
    if (validApplications.length < 2) {
      throw new ServiceError(
        "BAD_REQUEST",
        "At least 2 applications are required to create a poll",
        400
      );
    }

    // Calculate end date
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration * 7);

    // Check if poll already exists for this booth and time period
    const existingPoll = await this.repository.findPollByBoothAndDateRange(
      boothLocationId,
      startDate,
      endDate
    );

    if (existingPoll) {
      throw new ServiceError(
        "CONFLICT",
        "A poll already exists for this booth and time period",
        409
      );
    }

    // Create poll
    const poll = await this.repository.create({
      boothLocationId,
      boothLabel,
      startDate,
      endDate,
      duration,
      conflictingApplications: applicationIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      ),
      votes: [],
      status: "ACTIVE",
      description,
      createdBy: new mongoose.Types.ObjectId(createdBy),
    } as any);

    return poll;
  }

  /**
   * Add an application to an existing poll
   */
  async addApplicationToPoll(
    pollId: string,
    applicationId: string
  ): Promise<IVendorPoll> {
    const poll = await this.repository.findById(pollId);
    if (!poll) {
      throw new ServiceError("NOT_FOUND", "Poll not found", 404);
    }

    if (poll.status !== "ACTIVE") {
      throw new ServiceError(
        "BAD_REQUEST",
        "Can only add applications to active polls",
        400
      );
    }

    const application = await vendorApplicationRepository.findById(
      applicationId
    );
    if (!application) {
      throw new ServiceError("NOT_FOUND", "Application not found", 404);
    }

    const updatedPoll = await this.repository.addApplicationToPoll(
      pollId,
      applicationId
    );
    if (!updatedPoll) {
      throw new ServiceError("INTERNAL_ERROR", "Failed to update poll", 500);
    }

    return updatedPoll;
  }

  /**
   * Cast or update vote
   */
  async vote(
    pollId: string,
    voterId: string,
    applicationId: string
  ): Promise<IVendorPoll> {
    const poll = await this.repository.findById(pollId);
    if (!poll) {
      throw new ServiceError("NOT_FOUND", "Poll not found", 404);
    }

    if (poll.status !== "ACTIVE") {
      throw new ServiceError("BAD_REQUEST", "Poll is not active", 400);
    }

    // Verify application is in the poll
    const appInPoll = poll.conflictingApplications.some(
      (id) => id.toString() === applicationId
    );
    if (!appInPoll) {
      throw new ServiceError(
        "BAD_REQUEST",
        "Application is not part of this poll",
        400
      );
    }

    const updatedPoll = await this.repository.addVote(
      pollId,
      voterId,
      applicationId
    );
    if (!updatedPoll) {
      throw new ServiceError("INTERNAL_ERROR", "Failed to cast vote", 500);
    }

    return updatedPoll;
  }

  /**
   * Resolve poll and approve winning application
   */
  async resolvePoll(
    pollId: string,
    winningApplicationId: string,
    resolvedBy: string
  ): Promise<IVendorPoll> {
    const poll = await this.repository.findById(pollId);
    if (!poll) {
      throw new ServiceError("NOT_FOUND", "Poll not found", 404);
    }

    if (poll.status !== "ACTIVE") {
      throw new ServiceError("BAD_REQUEST", "Poll is not active", 400);
    }

    // Verify winning application is in the poll
    const appInPoll = poll.conflictingApplications.some(
      (id) => id.toString() === winningApplicationId
    );
    if (!appInPoll) {
      throw new ServiceError(
        "BAD_REQUEST",
        "Selected application is not part of this poll",
        400
      );
    }

    // Resolve the poll
    const resolvedPoll = await this.repository.resolvePoll(
      pollId,
      winningApplicationId,
      resolvedBy
    );
    if (!resolvedPoll) {
      throw new ServiceError("INTERNAL_ERROR", "Failed to resolve poll", 500);
    }

    // Approve the winning application
    const { vendorApplicationService } = await import(
      "./vendor-application.service.js"
    );
    await vendorApplicationService.approveApplication(winningApplicationId);

    // Reject losing applications
    const losingApplicationIds = poll.conflictingApplications
      .filter((id) => id.toString() !== winningApplicationId)
      .map((id) => id.toString());

    for (const appId of losingApplicationIds) {
      await vendorApplicationService.rejectApplication(
        appId,
        "Another vendor was selected through the Events Office poll"
      );
    }

    return resolvedPoll;
  }

  /**
   * Cancel poll
   */
  async cancelPoll(pollId: string): Promise<IVendorPoll> {
    const poll = await this.repository.findById(pollId);
    if (!poll) {
      throw new ServiceError("NOT_FOUND", "Poll not found", 404);
    }

    if (poll.status !== "ACTIVE") {
      throw new ServiceError("BAD_REQUEST", "Poll is not active", 400);
    }

    const cancelledPoll = await this.repository.cancelPoll(pollId);
    if (!cancelledPoll) {
      throw new ServiceError("INTERNAL_ERROR", "Failed to cancel poll", 500);
    }

    return cancelledPoll;
  }

  /**
   * Get active polls
   */
  async getActivePolls(
    page: number = 1,
    limit: number = 20
  ): Promise<{ polls: IVendorPoll[]; total: number }> {
    return this.repository.findActivePolls(page, limit);
  }

  /**
   * Get all polls with optional status filter
   */
  async getAllPolls(
    page: number = 1,
    limit: number = 20,
    status?: "ACTIVE" | "RESOLVED" | "CANCELLED"
  ): Promise<{ polls: IVendorPoll[]; total: number }> {
    return this.repository.getAllPolls(page, limit, status);
  }

  /**
   * Get poll with vote counts
   */
  async getPollWithVoteCounts(pollId: string): Promise<any> {
    const pollWithCounts = await this.repository.getPollWithVoteCounts(pollId);
    if (!pollWithCounts) {
      throw new ServiceError("NOT_FOUND", "Poll not found", 404);
    }

    return pollWithCounts;
  }

  /**
   * Get poll by ID with full details
   */
  async getPollById(pollId: string): Promise<IVendorPoll> {
    const poll = await this.repository.findById(pollId);
    if (!poll) {
      throw new ServiceError("NOT_FOUND", "Poll not found", 404);
    }

    return poll;
  }
}

// Singleton instance
export const vendorPollService = new VendorPollService(vendorPollRepository);
