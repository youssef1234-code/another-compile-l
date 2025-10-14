/**
 * Vendor Application Service
 * @module services/vendor-application.service
 */

import { TRPCError } from '@trpc/server';
import { BaseService } from './base.service';
import { vendorApplicationRepository, VendorApplicationRepository } from '../repositories/vendor-application.repository';
import type { IVendorApplication } from '../models/vendor-application.model';
import { eventRepository } from '../repositories/event.repository';
import mongoose from 'mongoose';

export class VendorApplicationService extends BaseService<IVendorApplication, VendorApplicationRepository> {
  constructor(repo: VendorApplicationRepository) {
    super(repo);
  }

  protected getEntityName(): string { return 'VendorApplication'; }

  /**
   * applyToBazaar
   * - Validates event exists and is a BAZAAR
   * - Ensures (vendor,event) is unique
   * - Creates PENDING application
   */
  async applyToBazaar(params: {
    vendorId: string;
    eventId: string;
    attendees?: string[];
    boothSize: IVendorApplication['boothSize'];
  }, options?: { userId?: string }): Promise<IVendorApplication> {

    const event = await eventRepository.findById(params.eventId);
    if (!event) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
    }
    if (event.type !== 'BAZAAR') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only bazaar events accept vendor applications' });
    }

    const existing = await this.repository.getByVendorAndEvent(params.vendorId, params.eventId);
    if (existing) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'You already applied to this bazaar' });
    }

    // Optionally, block if registration deadline has passed:
    if (event.registrationDeadline && event.registrationDeadline < new Date()) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Registration is closed' });
    }

    const doc = await this.repository.create({
      vendor: new mongoose.Types.ObjectId(params.vendorId),
      event:  new mongoose.Types.ObjectId(params.eventId),
      attendees: (params.attendees ?? []).map(a => String(a).trim()).filter(Boolean),
      boothSize: params.boothSize,
      status: 'PENDING',
      ...(options?.userId ? { createdBy: new mongoose.Types.ObjectId(options.userId) } : {}),
    } as any);

    return doc;
  }

  /**
   * getMyApplications: list applications created by current user (or customize to vendor ownership)
   */
  async getMyApplications(userId: string, options?: { page?: number; limit?: number }) {
    const page  = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);
    const skip  = (page - 1) * limit;

    const { rows, total } = await this.repository.listMine(userId, { skip, limit });
    return {
      applications: rows.map(a => this.present(a)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * getUpcomingBazaars: convenience list of bazaar events (for a vendor to choose from)
   */
  async getUpcomingBazaars(options?: { page?: number; limit?: number }) {
    const page  = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);
    const skip  = (page - 1) * limit;

    const filter = {
      type: 'BAZAAR',
      isArchived: false,
      startDate: { $gte: new Date() },
    } as any;

    const [events, total] = await Promise.all([
      eventRepository.findAll(filter, { skip, limit, sort: { startDate: 1 } }),
      eventRepository.count(filter),
    ]);

    return {
      bazaars: events.map((e:any) => ({
        id: (e._id as any).toString(),
        name: e.name,
        startDate: e.startDate,
        endDate: e.endDate,
        registrationDeadline: e.registrationDeadline,
        location: e.location,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Presenter
  private present(a: any) {
    return {
      id: (a._id as any).toString(),
      vendor: a.vendor ? {
        id: (a.vendor._id ?? a.vendor).toString?.() ?? String(a.vendor),
        name: (a.vendor as any).companyName ?? undefined,
      } : null,
      event: a.event ? {
        id: (a.event._id ?? a.event).toString?.() ?? String(a.event),
        name: (a.event as any).name,
        startDate: (a.event as any).startDate,
      } : null,
      attendees: a.attendees ?? [],
      boothSize: a.boothSize,
      status: a.status,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }
}

export const vendorApplicationService = new VendorApplicationService(vendorApplicationRepository);