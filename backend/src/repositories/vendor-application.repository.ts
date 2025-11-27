import {
  VendorApplication,
  type IVendorApplication,
} from "../models/vendor-application.model";
import { BaseRepository } from "./base.repository";
import type { ClientSession, FilterQuery } from "mongoose";
import { userRepository } from "./user.repository";

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
  async advancedSearch(
    vendorId: string,
    params: {
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
    },
  ): Promise<{ applications: IVendorApplication[]; total: number }> {
    const filter: FilterQuery<IVendorApplication> =
      {} as FilterQuery<IVendorApplication>;

    const vendor = await userRepository.findById(vendorId);
    if (vendor?.role === "VENDOR") {
      filter.createdBy = vendorId;
    }

    if (params.search) {
      const searchRegex = new RegExp(params.search, "i");
      filter.$or = [{ companyName: searchRegex }, { bazaarName: searchRegex }];
    }

    if (params.type) {
      filter.type = params.type as any;
    }

    if (params.location) {
      filter.location = params.location as any;
    }

    if (params.isApproved === true) {
      filter.status = "APPROVED" as any;
    } else if (params.isApproved === false) {
      filter.status = { $in: ["PENDING", "REJECTED"] };
    }
    
    if (params.status) {
      filter.status = params.status as any;
    }

    if (params.boothSize) {
      filter.boothSize = params.boothSize as any;
    }

    if (params.duration) {
      filter.duration = params.duration as any;
    }

    const sort: Record<string, 1 | -1> = {};
    if (params.sortBy) {
      sort[params.sortBy] = params.sortOrder === "desc" ? -1 : 1;
    } else {
      sort.startDate = -1; // Default: newest first
    }

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
  

    async markAcceptedWithFee(
    id: string,
    opts: {
      paymentAmount: number;                  // minor
      paymentCurrency: "EGP" | "USD";
      acceptedAt: Date;
      paymentDueAt: Date;
    },
    session?: ClientSession
  ) {
    return this.model.findByIdAndUpdate(
      id,
      {
        status: "APPROVED",
        paymentStatus: "PENDING",
        paymentAmount: opts.paymentAmount,
        paymentCurrency: opts.paymentCurrency,
        acceptedAt: opts.acceptedAt,
        paymentDueAt: opts.paymentDueAt,
      },
      { new: true, session }
    );
  }

  async markPaid(id: string, when = new Date(), session?: ClientSession) {
    return this.model.findByIdAndUpdate(
      id,
      { paymentStatus: "PAID", paidAt: when },
      { new: true, session }
    );
  }

  async failPayment(id: string, session?: ClientSession) {
    return this.model.findByIdAndUpdate(id, { paymentStatus: "FAILED" }, { new: true, session });
  }
}

export const vendorApplicationRepository = new VendorApplicationRepository();
