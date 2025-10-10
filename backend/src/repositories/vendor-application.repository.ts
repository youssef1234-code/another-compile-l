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

  // Vendor functions
  async findUpcomingAccepted(
    id: string,
    options: {
      skip?: number;
      limit?: number;
    } = {},
  ): Promise<IVendorApplication[]> {
    return this.findAll(
      {
        vendor: id,
        status: "ACCEPTED",
      } as FilterQuery<IVendorApplication>,
      options,
    );
  }

  async findUpcoming(
    id: string,
    options: {
      skip?: number;
      limit?: number;
    } = {},
  ): Promise<IVendorApplication[]> {
    return this.findAll(
      {
        vendor: id,
        status: { $in: ["PENDING", "REJECTED"] },
      } as FilterQuery<IVendorApplication>,
      options,
    );
  }

  // Event Manager and Admin functions
  async findAllApplications(
    options: {
      skip?: number;
      limit?: number;
    } = {},
  ): Promise<IVendorApplication[]> {
    return this.findAll(options);
  }

  async findPendingApplications(
    options: {
      skip?: number;
      limit?: number;
    } = {},
  ): Promise<IVendorApplication[]> {
    return this.findAll(
      {
        startDate: { $gt: new Date() },
        status: "PENDING",
      } as FilterQuery<IVendorApplication>,
      options,
    );
  }
}

export const vendorApplicationRepository = new VendorApplicationRepository();
