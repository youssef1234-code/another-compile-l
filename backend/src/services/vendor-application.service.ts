import {
  VendorApplicationRepository,
  vendorApplicationRepository,
} from '../repositories/vendor-application.repository.js';
import { BaseService } from './base.service.js';
import { ServiceError } from '../errors/errors.js';
import { type IVendorApplication } from '../models/vendor-application.model.js';
import { CreateApplicationSchema } from '../shared/index.js';
import mongoose from 'mongoose';
import { userRepository } from '../repositories/user.repository.js';
import { mailService } from './mail.service.js';
import { computeVendorFee } from './vendor-pricing.service.js';
import { DateTime } from 'luxon';
import { TRPCError } from '@trpc/server/unstable-core-do-not-import';


const VENDOR_PAY_DEADLINE_DAYS = 3;

  export async function  assertVendorAppPayable(applicationId: string, vendorUserId: string) {
  const app = await vendorApplicationRepository.findById(applicationId);
  if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });

  if (String(app.createdBy) !== String(vendorUserId)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not your application" });
  }
  if (app.status !== "APPROVED") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Application is not approved" });
  }
  if (app.paymentStatus === "PAID") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Fee already paid" });
  }
  if (!app.paymentAmount || !app.paymentCurrency) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Fee not set yet" });
  }
  const now = new Date();
  if (app.paymentDueAt && app.paymentDueAt < now) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Payment deadline passed" });
  }
  return app;
}


export class VendorApplicationService extends BaseService<
  IVendorApplication,
  VendorApplicationRepository
> {
  constructor(repository: VendorApplicationRepository) {
    super(repository);
  }

  protected getEntityName(): string {
    return 'VendorApplication';
  }

  async createApplication(
    data: Partial<CreateApplicationSchema>,
    vendorID: string
  ): Promise<IVendorApplication> {
    const vendor = await userRepository.findById(vendorID);

    // Check for duplicate BAZAAR application
    if (data.bazaarId) {
      const existing = await this.repository.findOne({
        createdBy: vendorID,
        bazaarId: new mongoose.Types.ObjectId(data.bazaarId),
      });

      if (existing) {
        throw new ServiceError(
          'CONFLICT',
          'You have already applied to this bazaar',
          409
        );
      }
    }

    // Check for booth availability for PLATFORM applications
    // Requirement #82: Create polls when multiple vendors request same booth during overlapping durations
    if (
      data.type === 'PLATFORM' &&
      data.boothLocationId &&
      data.startDate &&
      data.duration
    ) {
      const requestedStart = new Date(data.startDate);
      const requestedEnd = new Date(requestedStart);
      requestedEnd.setDate(requestedEnd.getDate() + data.duration * 7); // duration is in weeks

      // Find all PENDING applications for the same booth that overlap
      const conflictingApplications = await this.repository.findAll(
        {
          boothLocationId: data.boothLocationId,
          status: 'PENDING',
          startDate: { $ne: null },
          duration: { $ne: null },
        } as any,
        {}
      );

      // Filter for actual time overlaps
      const overlappingApps = conflictingApplications.filter((app) => {
        if (app.startDate && app.duration) {
          const existingStart = new Date(app.startDate);
          const existingEnd = new Date(existingStart);
          existingEnd.setDate(existingEnd.getDate() + app.duration * 7);

          // Two intervals overlap if: start1 < end2 AND start2 < end1
          return requestedStart < existingEnd && existingStart < requestedEnd;
        }
        return false;
      });

      // Check for APPROVED applications (these are truly blocked)
      const approvedApplications = await this.repository.findAll(
        {
          boothLocationId: data.boothLocationId,
          status: 'APPROVED',
          startDate: { $ne: null },
          duration: { $ne: null },
        } as any,
        {}
      );

      for (const app of approvedApplications) {
        if (app.startDate && app.duration) {
          const existingStart = new Date(app.startDate);
          const existingEnd = new Date(existingStart);
          existingEnd.setDate(existingEnd.getDate() + app.duration * 7);

          if (requestedStart < existingEnd && existingStart < requestedEnd) {
            throw new ServiceError(
              'CONFLICT',
              `This booth is already reserved from ${existingStart.toLocaleDateString()} to ${existingEnd.toLocaleDateString()} (${
                app.duration
              } week${app.duration > 1 ? 's' : ''})`,
              409
            );
          }
        }
      }

      // If there are overlapping PENDING applications, handle poll creation
      if (overlappingApps.length > 0) {
        // Create the new application first
        var enrichedData: any = {
          ...data,
          companyName: vendor?.companyName,
          createdBy: new mongoose.Types.ObjectId(vendorID),
          createdAt: new Date(),
        };

        if (data.bazaarId) {
          enrichedData.bazaarId = new mongoose.Types.ObjectId(data.bazaarId);
        }

        const doc = await this.repository.create(enrichedData);

        // Check if poll already exists for this booth and time period
        const { vendorPollRepository } = await import(
          '../repositories/vendor-poll.repository.js'
        );
        const existingPoll =
          await vendorPollRepository.findPollByBoothAndDateRange(
            data.boothLocationId,
            requestedStart,
            requestedEnd
          );

        if (existingPoll) {
          // Add this application to the existing poll
          await vendorPollRepository.addApplicationToPoll(
            String(existingPoll._id),
            String(doc._id)
          );
        } else {
          // Create a new poll with all conflicting applications
          const { vendorPollService } = await import(
            './vendor-poll.service.js'
          );
          const allApplicationIds = [
            ...overlappingApps.map((app) => String(app._id)),
            String(doc._id),
          ];

          const poll = await vendorPollService.createPoll(
            data.boothLocationId,
            data.boothLabel,
            requestedStart,
            data.duration,
            allApplicationIds,
            vendorID, // Created by the system on behalf of vendor
            `Conflicting booth requests for ${
              data.boothLabel || data.boothLocationId
            }`
          );

          // Notify Events Office about new poll
          const { notificationService } = await import(
            './notification.service.js'
          );
          await notificationService.notifyVendorPollCreated(
            String(poll._id),
            data.boothLabel || data.boothLocationId,
            allApplicationIds.length
          );
        }

        // Still notify about the pending request
        const { notificationService } = await import(
          './notification.service.js'
        );
        await notificationService.notifyPendingVendorRequest(
          String(doc._id),
          vendor?.companyName || 'Unknown Vendor',
          'booth setup (poll created)'
        );

        return doc;
      }
    }

    var enrichedData: any = {
      ...data,
      companyName: vendor?.companyName,
      createdBy: new mongoose.Types.ObjectId(vendorID),
      createdAt: new Date(),
    };

    // Only set bazaarId if it exists (for BAZAAR type applications)
    if (data.bazaarId) {
      enrichedData.bazaarId = new mongoose.Types.ObjectId(data.bazaarId);
    }

    const doc = await this.repository.create(enrichedData);

    // Requirement #74: Notify Events Office/Admin about pending vendor request
    const { notificationService } = await import('./notification.service.js');
    await notificationService.notifyPendingVendorRequest(
      String(doc._id),
      vendor?.companyName || 'Unknown Vendor',
      data.type === 'BAZAAR' ? 'bazaar participation' : 'booth setup'
    );

    return doc;
  }

  async getApplications(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      type?: string;
      location?: number;
      startDate?: Date;
      status?: string;
      isApproved?: boolean;
      boothSize?: string;
      duration?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {},
    vendorId: string
  ): Promise<{ applications: IVendorApplication[]; total: number }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const res = await this.repository.advancedSearch(vendorId, {
      ...params,
      skip,
      limit,
    });

    // Enrich platform applications with booth labels if missing
    const enrichedApplications = await this.enrichWithBoothLabels(
      res.applications
    );

    return {
      applications: enrichedApplications,
      total: res.total,
    };
  }

  /**
   * Enrich platform applications with booth labels from platform map
   */
  private async enrichWithBoothLabels(
    applications: IVendorApplication[]
  ): Promise<IVendorApplication[]> {
    // Check if any platform applications need booth labels
    const needsEnrichment = applications.some(
      (app) => app.type === 'PLATFORM' && app.boothLocationId && !app.boothLabel
    );

    if (!needsEnrichment) {
      return applications;
    }

    try {
      const { platformMapService } = await import('./platform-map.service');
      const platform = await platformMapService.getActivePlatformMap();

      // Create a map of boothId -> label for quick lookup
      const boothLabelMap = new Map<string, string>();
      platform.booths.forEach((booth) => {
        boothLabelMap.set(
          booth.id,
          booth.label || `${booth.width}×${booth.height}`
        );
      });

      // Enrich applications with booth labels
      return applications.map((app) => {
        if (app.type === 'PLATFORM' && app.boothLocationId && !app.boothLabel) {
          const label = boothLabelMap.get(app.boothLocationId);
          if (label) {
            (app as any).boothLabel = label;
          }
        }
        return app;
      });
    } catch (error) {
      console.error('Failed to enrich applications with booth labels:', error);
      return applications;
    }
  }

  /**
   * Check if vendor has applied to specific bazaars
   * Returns array of bazaar IDs that vendor has already applied to
   */
  async checkExistingApplications(
    vendorId: string,
    bazaarIds: string[]
  ): Promise<string[]> {
    const objectIds = bazaarIds.map((id) => new mongoose.Types.ObjectId(id));

    const applications = await this.repository.findAll(
      {
        createdBy: vendorId,
        bazaarId: { $in: objectIds },
      },
      {}
    );

    return applications.map((app) => (app.bazaarId as any).toString());
  }

  /**
   * Get aggregated statistics for vendor applications
   * Requirements #75: Events Office/Admin view vendor participation requests with stats
   */
  async getApplicationStats(vendorId?: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byType: { BAZAAR: number; PLATFORM: number };
    byBoothSize: { TWO_BY_TWO: number; FOUR_BY_FOUR: number };
  }> {
    const filter: any = {};

    // If vendorId provided, check if they are a vendor role
    if (vendorId) {
      const vendor = await userRepository.findById(vendorId);
      // Only filter by vendorId if they are actually a VENDOR
      // Admins and Event Office should see all applications
      if (vendor?.role === 'VENDOR') {
        filter.createdBy = vendorId;
      }
    }

    const [applications] = await Promise.all([
      this.repository.findAll(filter, {}),
    ]);

    const stats = {
      total: applications.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      byType: { BAZAAR: 0, PLATFORM: 0 },
      byBoothSize: { TWO_BY_TWO: 0, FOUR_BY_FOUR: 0 },
    };

    applications.forEach((app) => {
      // Status counts
      if (app.status === 'PENDING') stats.pending++;
      if (app.status === 'APPROVED') stats.approved++;
      if (app.status === 'REJECTED') stats.rejected++;

      // Type counts
      if (app.type === 'BAZAAR') stats.byType.BAZAAR++;
      if (app.type === 'PLATFORM') stats.byType.PLATFORM++;

      // Booth size counts
      if (app.boothSize === 'TWO_BY_TWO') stats.byBoothSize.TWO_BY_TWO++;
      if (app.boothSize === 'FOUR_BY_FOUR') stats.byBoothSize.FOUR_BY_FOUR++;
    });

    return stats;
  }

  /**
   * Approve a vendor application
   * Requirements #77: Events Office/Admin accept vendor participation requests
   */
  async approveApplication(applicationId: string): Promise<IVendorApplication> {
    const application = await this.repository.findById(applicationId);
    const vendor = await userRepository.findById(
      application?.createdBy?.toString() || ""
    );
    
    if (!application) {
      throw new ServiceError('NOT_FOUND', 'Application not found', 404);
    }

    if (application.status !== 'PENDING') {
      throw new ServiceError(
        'BAD_REQUEST',
        'Only pending applications can be approved',
        400
      );
    }

    // If this is a platform booth application with a booth location, mark the booth as occupied
    if (application.type === 'PLATFORM' && application.boothLocationId) {
      const { platformMapService } = await import('./platform-map.service');
      const platform = await platformMapService.getActivePlatformMap();

      const booth = platform.booths.find(
        (b) => b.id === application.boothLocationId
      );
      if (booth) {
        booth.isOccupied = true;
        booth.applicationId = application._id as any;

        await platformMapService.updatePlatformMap(platform.id, {
          booths: platform.booths,
        });
      }
    }

    const updated = await this.repository.update(applicationId, {
      status: 'APPROVED' as any,
      updatedAt: new Date(),
    });

    if (!updated) {
      throw new ServiceError(
        'INTERNAL_ERROR',
        'Failed to approve application',
        500
      );
    }


  const fee = computeVendorFee({
    type: application.type as "BAZAAR" | "PLATFORM",
    boothSize: application.boothSize as "TWO_BY_TWO" | "FOUR_BY_FOUR",
    location: application.location ?? 0,
    duration: application.duration ?? undefined,
  });

    const acceptedAt = new Date();
    const paymentDueAt = DateTime.fromJSDate(acceptedAt).plus({ days: VENDOR_PAY_DEADLINE_DAYS }).toJSDate();

    const updatedWithPayment = await this.repository.markAcceptedWithFee(
      applicationId,
      {
        paymentAmount: fee.paymentAmount,
        paymentCurrency: fee.paymentCurrency,
        acceptedAt,
        paymentDueAt,
      }
    );

    if (!updatedWithPayment) {
      throw new ServiceError("INTERNAL_ERROR", "Failed to approve application", 500);
    }
    
    // Requirement #63: Notify vendor about application approval
    const { notificationService } = await import('./notification.service.js');
      mailService.sendVendorApplicationStatusEmail(vendor?.email || "", {
      vendorName: application.companyName,
      status: "approved",
      applicationId: applicationId,
      eventName:
      application.type === "BAZAAR" ? "bazaar participation" : "booth setup",
    });
    await notificationService.notifyVendorRequestStatus(
      String(application.createdBy),
      applicationId,
      application.type === 'BAZAAR' ? 'bazaar participation' : 'booth setup',
      'ACCEPTED'
    );

    // Add vendor to event's vendors array if this is a BAZAAR event
    if (application.type === 'BAZAAR' && application.bazaarId) {
      console.log(
        `🎯 Linking vendor to bazaar event. Application ID: ${applicationId}, Bazaar ID: ${application.bazaarId}`
      );

      const { eventRepository } = await import(
        '../repositories/event.repository'
      );
      const event = await eventRepository.findById(
        application.bazaarId.toString()
      );

      console.log(`📦 Event found:`, {
        eventId: event?._id,
        eventType: event?.type,
        currentVendors: event?.vendors?.length || 0,
      });

      if (event && event.type === 'BAZAAR') {
        // Add vendor to event's vendors array if not already added
        const vendors = event.vendors || [];
        const vendorId = application.createdBy;

        console.log(`👤 Vendor ID to add: ${vendorId}`);

        if (
          vendorId &&
          !vendors.some((v) => v.toString() === vendorId.toString())
        ) {
          vendors.push(vendorId as any);
          await eventRepository.update((event._id as any).toString(), {
            vendors: vendors as any,
          });
          console.log(
            `✅ Vendor added to event. Total vendors now: ${vendors.length}`
          );
        } else {
          console.log(`⚠️ Vendor already in list or vendorId is null`);
        }
      } else {
        console.log(`❌ Event not found or not a BAZAAR type`);
      }
    } else {
      console.log(
        `⚠️ Not a BAZAAR application or no bazaarId. Type: ${application.type}, BazaarId: ${application.bazaarId}`
      );
    }

    return updated;
  }

  /**
   * Reject a vendor application with reason
   * Requirements #77: Events Office/Admin reject vendor participation requests
   */
  async rejectApplication(
    applicationId: string,
    reason: string
  ): Promise<IVendorApplication> {
    const application = await this.repository.findById(applicationId);
    const vendor = await userRepository.findById(
      application?.createdBy?.toString() || ""
    );
    
    if (!application) {
      throw new ServiceError('NOT_FOUND', 'Application not found', 404);
    }

    if (application.status !== 'PENDING') {
      throw new ServiceError(
        'BAD_REQUEST',
        'Only pending applications can be rejected',
        400
      );
    }

    const updated = await this.repository.update(applicationId, {
      status: 'REJECTED' as any,
      rejectionReason: reason,
      updatedAt: new Date(),
    });

    if (!updated) {
      throw new ServiceError(
        'INTERNAL_ERROR',
        'Failed to reject application',
        500
      );
    }

    // Requirement #63: Notify vendor about application rejection
    const { notificationService } = await import('./notification.service.js');
    mailService.sendVendorApplicationStatusEmail(vendor?.email || "", {
      vendorName: application.companyName,
      status: "rejected",
      applicationId: applicationId,
      rejectionReason: reason,
      eventName:
        application.type === "BAZAAR" ? "bazaar participation" : "booth setup",
    });
    await notificationService.notifyVendorRequestStatus(
      String(application.createdBy),
      applicationId,
      application.type === 'BAZAAR' ? 'bazaar participation' : 'booth setup',
      'REJECTED'
    );

    return updated;
  }

  /**
   * Cancel vendor application (Requirement #67)
   * Can only cancel if payment has not been made
   */
  async cancelApplication(
    applicationId: string,
    vendorId: string
  ): Promise<{ message: string }> {
    const application = await this.repository.findById(applicationId);

    if (!application) {
      throw new ServiceError('NOT_FOUND', 'Application not found', 404);
    }

    // Verify ownership
    if (String(application.createdBy) !== vendorId) {
      throw new ServiceError(
        'FORBIDDEN',
        'You can only cancel your own applications',
        403
      );
    }

    // Check if payment has been made
    if (application.paymentStatus === 'PAID') {
      throw new ServiceError(
        'FORBIDDEN',
        'Cannot cancel application after payment has been made. Please contact Events Office for refund assistance.',
        403
      );
    }

    // Note: For approved platform booths, the booth will become available again 
    // when the application is cancelled (booth availability is checked against active approved applications)

    // Mark as cancelled instead of deleting
    await this.repository.update(applicationId, {
      status: 'CANCELLED' as any,
      updatedAt: new Date(),
    });

    return { message: 'Application cancelled successfully' };
  }

  /**
   * Validate before deleting a vendor application
   * Prevents deletion of APPROVED platform booth applications to maintain booking integrity
   */
  protected async validateDelete(
    _id: string,
    existing: IVendorApplication
  ): Promise<void> {
    // Prevent deletion of approved PLATFORM applications with booth reservations
    if (
      existing.type === 'PLATFORM' &&
      existing.status === 'APPROVED' &&
      existing.boothLocationId
    ) {
      throw new ServiceError(
        'FORBIDDEN',
        'Cannot delete an approved platform booth reservation. Please contact an administrator if you need to cancel this booking.',
        403
      );
    }

    // Check payment status
    if (existing.paymentStatus === 'PAID') {
      throw new ServiceError(
        'FORBIDDEN',
        'Cannot delete applications with completed payments. Please use the cancel option or contact Events Office.',
        403
      );
    }

    // Allow deletion of PENDING or REJECTED applications
    // Allow deletion of BAZAAR applications (they don't reserve physical space)
  }

   async getApplicationForVendor(
    applicationId: string,
    vendorId: string
  ): Promise<IVendorApplication> {
    const app = await this.repository.findById(applicationId);
    console.log(`🔍 Fetched application:`, { applicationId, vendorId, appId: app?._id, paymentAmount: app?.paymentAmount });
    if (!app) {
      throw new ServiceError("NOT_FOUND", "Application not found", 404);
    }

    if (String(app.createdBy) !== String(vendorId)) {
      throw new ServiceError("FORBIDDEN", "Not your application", 403);
    }

    return app;
  }
}


export const vendorApplicationService = new VendorApplicationService(
  vendorApplicationRepository
);
