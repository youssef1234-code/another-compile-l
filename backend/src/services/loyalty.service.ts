/**
 * Loyalty Service
 * 
 * Business logic for GUC loyalty program management
 * 
 * Core User Stories:
 * - #70: Vendor can apply to participate in the GUC loyalty program
 * - #71: Vendor can cancel participation in the GUC loyalty program
 * - #72: All roles can view list of current loyalty partners
 * 
 * @module services/loyalty.service
 */

import { LoyaltyRequestRepository, loyaltyRequestRepository } from '../repositories/loyalty-request.repository';
import { LoyaltyPartnerRepository, loyaltyPartnerRepository } from '../repositories/loyalty-partner.repository';
import { BaseService } from './base.service';
import { TRPCError } from '@trpc/server';
import type { ILoyaltyRequest } from '../models/loyalty-request.model';
import type { ILoyaltyPartner } from '../models/loyalty-partner.model';
import type { ApplyToLoyaltyInput, ReviewLoyaltyRequestInput } from '@event-manager/shared';
import { Types } from 'mongoose';

export class LoyaltyService extends BaseService<ILoyaltyRequest, LoyaltyRequestRepository> {
  private partnerRepository: LoyaltyPartnerRepository;

  constructor(
    requestRepository: LoyaltyRequestRepository,
    partnerRepository: LoyaltyPartnerRepository
  ) {
    super(requestRepository);
    this.partnerRepository = partnerRepository;
  }

  /**
   * Get entity name for error messages
   */
  protected getEntityName(): string {
    return 'Loyalty Request';
  }

  /**
   * Apply to join the loyalty program (Story #70)
   * 
   * Business Rules:
   * - Vendor cannot apply if they are currently a loyalty partner
   * - Vendor cannot apply if they have a pending request
   * - Can re-apply after being rejected or after cancelling
   * - Promo code is automatically converted to uppercase
   * 
   * @param vendorId - The vendor's user ID
   * @param input - Application data (discountRate, promoCode, terms)
   * @returns The created loyalty request
   */
  async applyToLoyaltyProgram(
    vendorId: string,
    input: ApplyToLoyaltyInput
  ): Promise<ILoyaltyRequest> {
    // Check if vendor is currently a loyalty partner
    const isPartner = await this.partnerRepository.findByVendor(vendorId);
    if (isPartner) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You are already a loyalty program partner. Please cancel your participation before applying again.',
      });
    }

    // Check if vendor has a pending request
    const pendingRequest = await this.repository.findByVendorAndStatus(vendorId, 'pending');
    if (pendingRequest) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You already have a pending application. Please wait for it to be reviewed or cancel it before submitting a new one.',
      });
    }

    // Create new loyalty request
    const loyaltyRequest = await this.repository.create({
      vendor: new Types.ObjectId(vendorId),
      discountRate: input.discountRate,
      promoCode: input.promoCode.toUpperCase(), // Ensure uppercase
      terms: input.terms,
      status: 'pending',
    });

    return loyaltyRequest;
  }

  /**
   * Cancel participation in the loyalty program (Story #71)
   * 
   * Business Rules:
   * - If vendor has accepted request:
   *   - Remove from loyalty_partners collection
   *   - Mark request as cancelled in loyalty_requests
   * - If vendor has pending request:
   *   - Mark request as cancelled
   * - If vendor has no active participation:
   *   - Throw error
   * 
   * @param vendorId - The vendor's user ID
   * @returns Success message
   */
  async cancelLoyaltyParticipation(vendorId: string): Promise<{ message: string }> {
    // Check if vendor has an active request
    const activeRequest = await this.repository.findActiveByVendor(vendorId);

    if (!activeRequest) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'You do not have any active loyalty program participation to cancel.',
      });
    }

    // If accepted, remove from partners collection
    if (activeRequest.status === 'accepted') {
      const isPartner = await this.partnerRepository.isPartner(vendorId);
      
      if (isPartner) {
        await this.partnerRepository.deleteByVendor(vendorId);
      }
    }

    // Mark request as cancelled
    await this.repository.update(activeRequest.id, {
      status: 'cancelled',
    });

    return {
      message: 'Your loyalty program participation has been successfully cancelled.',
    };
  }

  /**
   * Get all current loyalty partners (Story #72)
   * 
   * Available to all authenticated users
   * Returns vendor details with discount info
   * 
   * @returns List of all current loyalty partners
   */
  async getAllLoyaltyPartners(): Promise<ILoyaltyPartner[]> {
    const partners = await this.partnerRepository.findAllPartners();
    return partners;
  }

  /**
   * Get vendor's own loyalty status
   * 
   * Returns all loyalty requests created by the vendor
   * 
   * @param vendorId - The vendor's user ID
   * @returns All loyalty requests by the vendor, sorted by most recent first
   */
  async getMyLoyaltyStatus(vendorId: string): Promise<ILoyaltyRequest[]> {
    const allRequests = await this.repository.findByVendor(vendorId);
    return allRequests;
  }

  /**
   * Get all loyalty requests by vendor (history)
   * 
   * @param vendorId - The vendor's user ID
   * @returns All loyalty requests by the vendor
   */
  async getMyLoyaltyHistory(vendorId: string): Promise<ILoyaltyRequest[]> {
    const requests = await this.repository.findByVendor(vendorId);
    return requests;
  }

  /**
   * Admin: Review loyalty request (Accept or Reject)
   * 
   * Business Rules:
   * - Only pending requests can be reviewed
   * - If accepted: create partner record and mark request as accepted
   * - If rejected: mark request as rejected with reason
   * - Track who reviewed and when
   * 
   * @param adminId - The admin's user ID
   * @param input - Review decision (accept/reject) and optional rejection reason
   * @returns Updated loyalty request
   */
  async reviewLoyaltyRequest(
    adminId: string,
    input: ReviewLoyaltyRequestInput
  ): Promise<ILoyaltyRequest> {
    // Find the request
    const request = await this.repository.findById(input.requestId);

    if (!request) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Loyalty request not found.',
      });
    }

    // Only pending requests can be reviewed
    if (request.status !== 'pending') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `This request has already been ${request.status}. Only pending requests can be reviewed.`,
      });
    }

    const now = new Date();

    if (input.action === 'accept') {
      // Check if vendor is already a partner (shouldn't happen, but safety check)
      const vendorId = (request as any).vendorId || request.vendor?.toString();
      const existingPartner = await this.partnerRepository.findByVendor(vendorId);
      
      if (existingPartner) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This vendor is already a loyalty partner.',
        });
      }

      // Create partner record
      await this.partnerRepository.create({
        vendor: new Types.ObjectId(vendorId),
        discountRate: request.discountRate,
        promoCode: request.promoCode,
        terms: request.terms,
        joinedAt: now,
      });

      // Update request status to accepted
      const updatedRequest = await this.repository.update(request.id, {
        status: 'accepted',
        reviewedBy: new Types.ObjectId(adminId),
        reviewedAt: now,
      });

      if (!updatedRequest) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update loyalty request.',
        });
      }

      return updatedRequest;
    } else {
      // Reject the request
      const updatedRequest = await this.repository.update(request.id, {
        status: 'rejected',
        rejectionReason: input.rejectionReason,
        reviewedBy: new Types.ObjectId(adminId),
        reviewedAt: now,
      });

      if (!updatedRequest) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update loyalty request.',
        });
      }

      return updatedRequest;
    }
  }

  /**
   * Admin: Get all pending loyalty requests
   * 
   * @param page - Page number for pagination
   * @param limit - Number of items per page
   * @returns Paginated list of pending requests
   */
  async getPendingRequests(
    page: number = 1,
    limit: number = 20
  ): Promise<{ requests: ILoyaltyRequest[]; total: number; page: number; totalPages: number }> {
    const { requests, total } = await this.repository.findPendingPaginated(page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      requests,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Admin: Get all loyalty requests (all statuses)
   * 
   * @param options - Filter and pagination options
   * @returns Paginated list of all requests
   */
  async getAllRequests(options?: {
    status?: 'pending' | 'cancelled' | 'accepted' | 'rejected';
    page?: number;
    limit?: number;
  }): Promise<{ requests: ILoyaltyRequest[]; total: number; page: number; totalPages: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    const { requests, total } = await this.repository.findAllRequests(options);
    const totalPages = Math.ceil(total / limit);

    return {
      requests,
      total,
      page,
      totalPages,
    };
  }
}

export const loyaltyService = new LoyaltyService(
  loyaltyRequestRepository,
  loyaltyPartnerRepository
);
