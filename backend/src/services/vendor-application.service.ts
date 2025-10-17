import {
  VendorApplicationRepository,
  vendorApplicationRepository,
} from "../repositories/vendor-application.repository";
import { BaseService } from "./base.service";
// import { TRPCError } from "@trpc/server";
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
    var enrichedData = {
      ...data,
      bazaarId: new mongoose.Types.ObjectId(data.bazaarId),
      companyName: vendor?.companyName,
      createdBy: new mongoose.Types.ObjectId(vendorID),
      createdAt: new Date(),
    };

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

    return res;
  }
}
export const vendorApplicationService = new VendorApplicationService(
  vendorApplicationRepository,
);
