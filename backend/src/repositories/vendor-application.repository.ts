/**
 * Vendor Application Repository
 * @module repositories/vendor-application.repository
 */
import { BaseRepository } from './base.repository';
import { VendorApplication, type IVendorApplication } from '../models/vendor-application.model';
import { Types } from 'mongoose';

export class VendorApplicationRepository extends BaseRepository<IVendorApplication> {
  constructor() { super(VendorApplication); }

  async getByVendorAndEvent(vendorId: string, eventId: string) {
    return this.model.findOne({
      vendor: new Types.ObjectId(vendorId),
      event:  new Types.ObjectId(eventId),
      isDeleted: false,
    }).lean();
  }

  async listMine(userId: string, options?: { skip?: number; limit?: number }) {
    const query: any = { isDeleted: false, createdBy: new Types.ObjectId(userId) };

    const [rows, total] = await Promise.all([
      this.model
        .find(query)
        .populate('event')
        .populate('vendor')
        .sort({ createdAt: -1 })
        .skip(options?.skip ?? 0)
        .limit(options?.limit ?? 50)
        .lean(),
      this.model.countDocuments(query),
    ]);

    return { rows, total };
  }
}

export const vendorApplicationRepository = new VendorApplicationRepository();
