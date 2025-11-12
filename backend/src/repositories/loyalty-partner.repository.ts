/**
 * Loyalty Partner Repository
 * 
 * Repository Pattern for LoyaltyPartner entity
 * Handles all database operations for accepted loyalty program vendors
 * 
 * @module repositories/loyalty-partner.repository
 */

import { LoyaltyPartner, type ILoyaltyPartner } from '../models/loyalty-partner.model';
import { BaseRepository } from './base.repository';
import { Types } from 'mongoose';

/**
 * Transform loyalty partner document to match frontend interface
 */
function transformLoyaltyPartner<T = any>(doc: T | null | undefined): T | null {
  if (!doc) return null;
  
  const rawDoc = doc as any;
  
  const transformed: any = {
    ...rawDoc,
    id: rawDoc._id?.toString?.() || rawDoc.id,
    vendorId: rawDoc.vendor?._id?.toString?.() || rawDoc.vendor?.toString?.() || rawDoc.vendorId,
  };
  
  // Clean up MongoDB internals
  delete transformed._id;
  delete transformed.__v;
  
  // Handle vendor field
  if (rawDoc.vendor && typeof rawDoc.vendor === 'object') {
    // If vendor was populated with user data, preserve it
    if (rawDoc.vendor.firstName) {
      transformed.vendor = {
        id: rawDoc.vendor._id?.toString?.() || rawDoc.vendor.id,
        firstName: rawDoc.vendor.firstName,
        lastName: rawDoc.vendor.lastName,
        email: rawDoc.vendor.email,
        companyName: rawDoc.vendor.companyName,
      };
    } else {
      // Vendor is just an ObjectId, delete it (we have vendorId now)
      delete transformed.vendor;
    }
  }
  
  return transformed as T;
}

export class LoyaltyPartnerRepository extends BaseRepository<ILoyaltyPartner> {
  constructor() {
    super(LoyaltyPartner);
  }

  /**
   * Override create to apply transform
   */
  async create(data: Partial<ILoyaltyPartner>): Promise<ILoyaltyPartner> {
    const doc = await this.model.create(data);
    return transformLoyaltyPartner(doc.toObject()) as ILoyaltyPartner;
  }

  /**
   * Override update to apply transform
   */
  async update(
    id: string,
    updateData: any,
    options?: any
  ): Promise<ILoyaltyPartner | null> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true, ...options }
    )
    .lean()
    .exec();

    return transformLoyaltyPartner(doc) as ILoyaltyPartner | null;
  }

  /**
   * Override findById to apply transform
   */
  async findById(id: string): Promise<ILoyaltyPartner | null> {
    const doc = await this.model
      .findById(id)
      .lean()
      .exec();
    
    return transformLoyaltyPartner(doc) as ILoyaltyPartner | null;
  }

  /**
   * Find partner by vendor ID
   */
  async findByVendor(vendorId: string): Promise<ILoyaltyPartner | null> {
    const doc = await this.model
      .findOne({ vendor: new Types.ObjectId(vendorId) })
      .lean()
      .exec();
    
    return transformLoyaltyPartner(doc) as ILoyaltyPartner | null;
  }

  /**
   * Get all current loyalty partners
   * Populates vendor information for display
   */
  async findAllPartners(): Promise<ILoyaltyPartner[]> {
    const docs = await this.model
      .find()
      .populate('vendor', 'firstName lastName email companyName')
      .sort({ joinedAt: -1 })
      .lean()
      .exec();
    
    return docs.map(doc => transformLoyaltyPartner(doc) as ILoyaltyPartner | null).filter((doc): doc is ILoyaltyPartner => doc !== null);
  }

  /**
   * Delete partner by vendor ID
   */
  async deleteByVendor(vendorId: string): Promise<boolean> {
    const result = await this.model.deleteOne({
      vendor: new Types.ObjectId(vendorId),
    });
    
    return result.deletedCount > 0;
  }

  /**
   * Check if vendor is a partner
   */
  async isPartner(vendorId: string): Promise<boolean> {
    const count = await this.model.countDocuments({
      vendor: new Types.ObjectId(vendorId),
    });
    
    return count > 0;
  }
}

export const loyaltyPartnerRepository = new LoyaltyPartnerRepository();
