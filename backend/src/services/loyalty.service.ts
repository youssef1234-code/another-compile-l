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

import { LoyaltyRequestRepository, loyaltyRequestRepository } from '../repositories/loyalty-request.repository.js';
import { LoyaltyPartnerRepository, loyaltyPartnerRepository } from '../repositories/loyalty-partner.repository.js';
import { BaseService } from './base.service.js';
import { TRPCError } from '@trpc/server';
import type { ILoyaltyRequest } from '../models/loyalty-request.model.js';
import type { ILoyaltyPartner } from '../models/loyalty-partner.model.js';
import type { ApplyToLoyaltyInput } from '../shared/index.js';
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
   * - Applications are auto-activated (no admin review needed)
   * - Can re-apply after cancelling
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

    // Check if vendor has an active request
    const activeRequest = await this.repository.findByVendorAndStatus(vendorId, 'active');
    if (activeRequest) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You already have an active loyalty program participation. Please cancel it before applying again.',
      });
    }

    // Create new loyalty request with auto-active status
    const loyaltyRequest = await this.repository.create({
      vendor: new Types.ObjectId(vendorId),
      discountRate: input.discountRate,
      promoCode: input.promoCode.toUpperCase(), // Ensure uppercase
      terms: input.terms,
      status: 'active', // Auto-activate
    });

    // Automatically create partner record
    await this.partnerRepository.create({
      vendor: new Types.ObjectId(vendorId),
      discountRate: input.discountRate,
      promoCode: input.promoCode.toUpperCase(),
      terms: input.terms,
    });
    
    // Requirement #73: Notify all users about new loyalty partner
    const { User } = await import('../models/user.model.js');
    const vendor = await User.findById(vendorId).lean();
    const { notificationService } = await import('./notification.service.js');
    await notificationService.notifyNewLoyaltyPartner(
      vendor?.companyName || 'New Partner',
      input.discountRate,
      input.promoCode
    );

    return loyaltyRequest;
  }

  /**
   * Cancel participation in the loyalty program (Story #71)
   * 
   * Business Rules:
   * - If vendor has active request:
   *   - Remove from loyalty_partners collection
   *   - Mark request as cancelled in loyalty_requests
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

    // If active, remove from partners collection
    if (activeRequest.status === 'active') {
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
   * Note: Admin approval workflow removed - applications are now auto-activated
   * Vendors are automatically activated in the loyalty program when they apply
   */
}

export const loyaltyService = new LoyaltyService(
  loyaltyRequestRepository,
  loyaltyPartnerRepository
);
