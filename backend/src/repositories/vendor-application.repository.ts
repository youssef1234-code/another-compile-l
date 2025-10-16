import {
  VendorApplication,
  type IVendorApplication,
} from "../models/vendor-application.model";
import { BaseRepository } from "./base.repository";
import type { FilterQuery } from "mongoose";

/**
 * Repository Pattern for Vendor Application entity
 * Extends BaseRepository for common CRUD operations
 * Handles all database operations for users
 * Benefits: Centralized data access, easy testing, database independence
 */
export class VendorApplicationRepository extends BaseRepository<IVendorApplication> {
  constructor() {
    super(VendorApplication);
  }
  async advancedSearch(params: {
    search?: string;
    type?: string;
    location?: number;
    startDate?: Date;
    status?: string;
    isApproved?: boolean;
    boothSize?: string;
    duration?: number;
    skip?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{ applications: IVendorApplication[]; total: number }> {
    const filter: FilterQuery<IVendorApplication> =
      {} as FilterQuery<IVendorApplication>;

    // Text search
    if (params.search) {
      const searchRegex = new RegExp(params.search, "i");
      filter.$or = [{ companyName: searchRegex }, { bazaarName: searchRegex }];
    }

    // Type filter
    if (params.type) {
      filter.type = params.type as any;
    }

    // Location filter
    if (params.location) {
      filter.location = params.location as any;
    }

    if (params.isApproved === true) {
      filter.status = "APPROVED" as any;
    } else if (params.isApproved === false) {
      filter.status = { $in: ["PENDING", "REJECTED"] };
    }
    // Status filter
    if (params.status) {
      filter.status = params.status as any;
    }

    // Booth Size filter
    if (params.boothSize) {
      filter.boothSize = params.boothSize as any;
    }

    // Duration filter
    if (params.duration) {
      filter.duration = params.duration as any;
    }

    // Sorting
    const sort: Record<string, 1 | -1> = {};
    if (params.sortBy) {
      sort[params.sortBy] = params.sortOrder === "desc" ? -1 : 1;
    } else {
      sort.startDate = 1; // Default sort by start date ascending
    }

    // Execute query with pagination
    const [applications, total] = await Promise.all([
      this.findAll(filter, {
        skip: params.skip || 0,
        limit: params.limit || 10,
        sort,
      }),
      this.count(filter),
    ]);

    return { applications, total };
  }
}

export const vendorApplicationRepository = new VendorApplicationRepository();
