/**
 * Loyalty Request Repository
 * 
 * Repository Pattern for LoyaltyRequest entity
 * Handles all database operations for vendor loyalty program applications
 * 
 * @module repositories/loyalty-request.repository
 */

import { LoyaltyRequest, type ILoyaltyRequest } from '../models/loyalty-request.model';
import { BaseRepository } from './base.repository';
import { Types } from 'mongoose';

/**
 * Transform loyalty request document to match frontend interface
 */
function transformLoyaltyRequest<T = any>(doc: T | null | undefined): T | null {
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

export class LoyaltyRequestRepository extends BaseRepository<ILoyaltyRequest> {
  constructor() {
    super(LoyaltyRequest);
  }

  /**
   * Override create to apply transform
   */
  async create(data: Partial<ILoyaltyRequest>): Promise<ILoyaltyRequest> {
    const doc = await this.model.create(data);
    return transformLoyaltyRequest(doc.toObject()) as ILoyaltyRequest;
  }

  /**
   * Override update to apply transform
   */
  async update(
    id: string,
    updateData: any,
    options?: any
  ): Promise<ILoyaltyRequest | null> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true, ...options }
    )
    .lean()
    .exec();

    return transformLoyaltyRequest(doc) as ILoyaltyRequest | null;
  }

  /**
   * Override findById to apply transform
   */
  async findById(id: string): Promise<ILoyaltyRequest | null> {
    const doc = await this.model
      .findById(id)
      .lean()
      .exec();
    
    return transformLoyaltyRequest(doc) as ILoyaltyRequest | null;
  }

  /**
   * Find active request by vendor ID
   * Active means status is 'pending' or 'accepted'
   */
  async findActiveByVendor(vendorId: string): Promise<ILoyaltyRequest | null> {
    const doc = await this.model
      .findOne({
        vendor: new Types.ObjectId(vendorId),
        status: { $in: ['pending', 'accepted'] },
      })
      .lean()
      .exec();
    
    return transformLoyaltyRequest(doc) as ILoyaltyRequest | null;
  }

  /**
   * Find all requests by vendor ID
   */
  async findByVendor(vendorId: string): Promise<ILoyaltyRequest[]> {
    const docs = await this.model
      .find({ vendor: new Types.ObjectId(vendorId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    return docs.map(doc => transformLoyaltyRequest(doc) as ILoyaltyRequest | null).filter((doc): doc is ILoyaltyRequest => doc !== null);
  }

  /**
   * Find request by vendor and status
   */
  async findByVendorAndStatus(
    vendorId: string,
    status: 'pending' | 'cancelled' | 'accepted'
  ): Promise<ILoyaltyRequest | null> {
    const doc = await this.model
      .findOne({
        vendor: new Types.ObjectId(vendorId),
        status,
      })
      .lean()
      .exec();
    
    return transformLoyaltyRequest(doc) as ILoyaltyRequest | null;
  }

  /**
   * Get all pending requests (for admin review)
   */
  async findPending(): Promise<ILoyaltyRequest[]> {
    const docs = await this.model
      .find({ status: 'pending' })
      .populate('vendor', 'firstName lastName email companyName')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    return docs.map(doc => transformLoyaltyRequest(doc) as ILoyaltyRequest | null).filter((doc): doc is ILoyaltyRequest => doc !== null);
  }

  /**
   * Get paginated pending requests (for admin review)
   */
  async findPendingPaginated(
    page: number = 1,
    limit: number = 20
  ): Promise<{ requests: ILoyaltyRequest[]; total: number }> {
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.model
        .find({ status: 'pending' })
        .populate('vendor', 'firstName lastName email companyName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.model.countDocuments({ status: 'pending' }),
    ]);
    
    const requests = docs
      .map(doc => transformLoyaltyRequest(doc) as ILoyaltyRequest | null)
      .filter((doc): doc is ILoyaltyRequest => doc !== null);

    return { requests, total };
  }

  /**
   * Get all requests (for admin - all statuses)
   */
  async findAllRequests(options?: {
    status?: 'pending' | 'cancelled' | 'accepted' | 'rejected';
    page?: number;
    limit?: number;
  }): Promise<{ requests: ILoyaltyRequest[]; total: number }> {
    const { status, page = 1, limit = 20 } = options || {};
    const skip = (page - 1) * limit;

    const filter = status ? { status } : {};

    const [docs, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('vendor', 'firstName lastName email companyName')
        .populate('reviewedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.model.countDocuments(filter),
    ]);
    
    const requests = docs
      .map(doc => transformLoyaltyRequest(doc) as ILoyaltyRequest | null)
      .filter((doc): doc is ILoyaltyRequest => doc !== null);

    return { requests, total };
  }
}

export const loyaltyRequestRepository = new LoyaltyRequestRepository();
