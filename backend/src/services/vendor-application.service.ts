import {
  VendorApplicationRepository,
  vendorApplicationRepository,
} from "../repositories/vendor-application.repository";
import { BaseService } from "./base.service";
import { TRPCError } from "@trpc/server";
import { type IVendorApplication } from "../models/vendor-application.model";

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

  async getUpcoming(
    id: string,
    status: string,
    options: {
      page?: number;
      limit?: number;
    } = {},
  ): Promise<any> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    if (status === "ACCEPTED") {
      const applications = await this.repository.findUpcomingAccepted(id, {
        ...options,
        skip,
        limit,
      });
      if (!applications) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vendor has no applications",
        });
      }

      return applications;
    } else if (status === "PENDING" || status === "REJECTED") {
      const applications = await this.repository.findUpcoming(id, {
        ...options,
        skip,
        limit,
      });
      if (!applications) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vendor has no applications",
        });
      }
      return applications;
    } else {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invalid status",
      });
    }
  }

  async getAllApplications(
    all: boolean,
    options: {
      page?: number;
      limit?: number;
      sort?: Record<string, -1 | 1>;
    } = {},
  ): Promise<any> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    if (all) {
      return await this.repository.findAllApplications({
        ...options,
        skip,
        limit,
      });
    } else {
      return await this.repository.findPendingApplications({
        ...options,
        skip,
        limit,
      });
    }
  }
}
export const vendorApplicationService = new VendorApplicationService(
  vendorApplicationRepository,
);
