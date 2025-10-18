import {
  VendorApplicationRepository,
  vendorApplicationRepository,
} from "../repositories/vendor-application.repository";
import { BaseService } from "./base.service";
import { ServiceError } from "../errors/errors";
import { type IVendorApplication } from "../models/vendor-application.model";
import { CreateApplicationSchema } from "@event-manager/shared";
import mongoose from "mongoose";
import { userRepository } from "../repositories/user.repository";

export class VendorApplicationService extends BaseService<
  IVendorApplication,
  VendorApplicationRepository
> {
  constructor(repository: VendorApplicationRepository) {
    super(repository);
  }

  protected getEntityName(): string {
    return "VendorApplication";
  }

  async createApplication(
    data: Partial<CreateApplicationSchema>,
    vendorID: string,
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
          "CONFLICT",
          "You have already applied to this bazaar",
          409
        );
      }
    }
    
    // Check for booth availability for PLATFORM applications
    // Must check for ALL applications (PENDING and APPROVED) that will overlap
    if (data.type === "PLATFORM" && data.boothLocationId && data.startDate && data.duration) {
      const requestedStart = new Date(data.startDate);
      const requestedEnd = new Date(requestedStart);
      requestedEnd.setDate(requestedEnd.getDate() + (data.duration * 7)); // duration is in weeks
      
      // Find all applications for the same booth (APPROVED and PENDING that might be approved)
      const existingApplications = await this.repository.findAll({
        boothLocationId: data.boothLocationId,
        status: { $in: ["APPROVED", "PENDING"] },
        startDate: { $ne: null },
        duration: { $ne: null },
      } as any, {});
      
      // Check for date overlaps
      for (const app of existingApplications) {
        if (app.startDate && app.duration) {
          const existingStart = new Date(app.startDate);
          const existingEnd = new Date(existingStart);
          existingEnd.setDate(existingEnd.getDate() + (app.duration * 7));
          
          // Check if dates overlap using proper interval overlap logic
          // Two intervals overlap if: start1 < end2 AND start2 < end1
          if (requestedStart < existingEnd && existingStart < requestedEnd) {
            const statusText = app.status === "APPROVED" ? "reserved" : "pending approval";
            throw new ServiceError(
              "CONFLICT",
              `This booth is already ${statusText} from ${existingStart.toLocaleDateString()} to ${existingEnd.toLocaleDateString()} (${app.duration} week${app.duration > 1 ? 's' : ''})`,
              409
            );
          }
        }
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
      sortOrder?: "asc" | "desc";
    } = {},
    vendorId: string,
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
    const enrichedApplications = await this.enrichWithBoothLabels(res.applications);

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
      app => app.type === "PLATFORM" && app.boothLocationId && !app.boothLabel
    );

    if (!needsEnrichment) {
      return applications;
    }

    try {
      const { platformMapService } = await import("./platform-map.service");
      const platform = await platformMapService.getActivePlatformMap();

      // Create a map of boothId -> label for quick lookup
      const boothLabelMap = new Map<string, string>();
      platform.booths.forEach(booth => {
        boothLabelMap.set(booth.id, booth.label || `${booth.width}×${booth.height}`);
      });

      // Enrich applications with booth labels
      return applications.map(app => {
        if (app.type === "PLATFORM" && app.boothLocationId && !app.boothLabel) {
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
    
    const applications = await this.repository.findAll({
      createdBy: vendorId,
      bazaarId: { $in: objectIds },
    }, {});

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
      if (vendor?.role === "VENDOR") {
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
      if (app.status === "PENDING") stats.pending++;
      if (app.status === "APPROVED") stats.approved++;
      if (app.status === "REJECTED") stats.rejected++;

      // Type counts
      if (app.type === "BAZAAR") stats.byType.BAZAAR++;
      if (app.type === "PLATFORM") stats.byType.PLATFORM++;

      // Booth size counts
      if (app.boothSize === "TWO_BY_TWO") stats.byBoothSize.TWO_BY_TWO++;
      if (app.boothSize === "FOUR_BY_FOUR") stats.byBoothSize.FOUR_BY_FOUR++;
    });

    return stats;
  }

  /**
   * Approve a vendor application
   * Requirements #77: Events Office/Admin accept vendor participation requests
   */
  async approveApplication(applicationId: string): Promise<IVendorApplication> {
    const application = await this.repository.findById(applicationId);
    
    if (!application) {
      throw new ServiceError("NOT_FOUND", "Application not found", 404);
    }

    if (application.status !== "PENDING") {
      throw new ServiceError("BAD_REQUEST", "Only pending applications can be approved", 400);
    }

    // If this is a platform booth application with a booth location, mark the booth as occupied
    if (application.type === "PLATFORM" && application.boothLocationId) {
      const { platformMapService } = await import("./platform-map.service");
      const platform = await platformMapService.getActivePlatformMap();
      
      const booth = platform.booths.find((b) => b.id === application.boothLocationId);
      if (booth) {
        booth.isOccupied = true;
        booth.applicationId = application._id as any;
        
        await platformMapService.updatePlatformMap(platform.id, {
          booths: platform.booths,
        });
      }
    }

    const updated = await this.repository.update(applicationId, {
      status: "APPROVED" as any,
      updatedAt: new Date(),
    });

    if (!updated) {
      throw new ServiceError("INTERNAL_ERROR", "Failed to approve application", 500);
    }

    // Add vendor to event's vendors array if this is a BAZAAR event
    if (application.type === "BAZAAR" && application.bazaarId) {
      console.log(`🎯 Linking vendor to bazaar event. Application ID: ${applicationId}, Bazaar ID: ${application.bazaarId}`);
      
      const { eventRepository } = await import("../repositories/event.repository");
      const event = await eventRepository.findById(application.bazaarId.toString());
      
      console.log(`📦 Event found:`, { 
        eventId: event?._id, 
        eventType: event?.type, 
        currentVendors: event?.vendors?.length || 0 
      });
      
      if (event && event.type === "BAZAAR") {
        // Add vendor to event's vendors array if not already added
        const vendors = event.vendors || [];
        const vendorId = application.createdBy;
        
        console.log(`👤 Vendor ID to add: ${vendorId}`);
        
        if (vendorId && !vendors.some(v => v.toString() === vendorId.toString())) {
          vendors.push(vendorId as any);
          await eventRepository.update((event._id as any).toString(), {
            vendors: vendors as any,
          });
          console.log(`✅ Vendor added to event. Total vendors now: ${vendors.length}`);
        } else {
          console.log(`⚠️ Vendor already in list or vendorId is null`);
        }
      } else {
        console.log(`❌ Event not found or not a BAZAAR type`);
      }
    } else {
      console.log(`⚠️ Not a BAZAAR application or no bazaarId. Type: ${application.type}, BazaarId: ${application.bazaarId}`);
    }

    return updated;
  }

  /**
   * Reject a vendor application with reason
   * Requirements #77: Events Office/Admin reject vendor participation requests
   */
  async rejectApplication(
    applicationId: string,
    reason: string,
  ): Promise<IVendorApplication> {
    const application = await this.repository.findById(applicationId);
    
    if (!application) {
      throw new ServiceError("NOT_FOUND", "Application not found", 404);
    }

    if (application.status !== "PENDING") {
      throw new ServiceError("BAD_REQUEST", "Only pending applications can be rejected", 400);
    }

    const updated = await this.repository.update(applicationId, {
      status: "REJECTED" as any,
      rejectionReason: reason,
      updatedAt: new Date(),
    });

    if (!updated) {
      throw new ServiceError("INTERNAL_ERROR", "Failed to reject application", 500);
    }

    return updated;
  }

  /**
   * Validate before deleting a vendor application
   * Prevents deletion of APPROVED platform booth applications to maintain booking integrity
   */
  protected async validateDelete(_id: string, existing: IVendorApplication): Promise<void> {
    // Prevent deletion of approved PLATFORM applications with booth reservations
    if (existing.type === "PLATFORM" && existing.status === "APPROVED" && existing.boothLocationId) {
      throw new ServiceError(
        "FORBIDDEN",
        "Cannot delete an approved platform booth reservation. Please contact an administrator if you need to cancel this booking.",
        403
      );
    }
    
    // Allow deletion of PENDING or REJECTED applications
    // Allow deletion of BAZAAR applications (they don't reserve physical space)
  }
}
export const vendorApplicationService = new VendorApplicationService(
  vendorApplicationRepository,
);
