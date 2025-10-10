import {
  VendorApplicationRepository,
  vendorApplicationRepository,
} from "../repositories/vendor-application.repository";
import { BaseService } from "./base.service";
import { TRPCError } from "@trpc/server";
import { type IVendorApplication } from "../models/vendor-application.model";
import { CreateApplicationSchema } from "@event-manager/shared";
import mongoose from "mongoose";

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
    const bazaar = new mongoose.Types.ObjectId(data.bazaarId);
    const enrichedData = {
      ...data,
      bazaar,
      createdBy: new mongoose.Types.ObjectId(vendorID),
      createdAt: new Date(),
    };

    const doc = await this.repository.create(enrichedData);
    return doc;
  }
  async getUpcoming(
    id: string,
    isAccepted: boolean,
    options: {
      page?: number;
      limit?: number;
    } = {},
  ): Promise<any> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    if (isAccepted) {
      const applications = await this.repository.findUpcomingAccepted(id, {
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
      const applications = await this.repository.findUpcoming(id, {
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
    }
  }

  async getAllApplications(
    options: {
      page?: number;
      limit?: number;
    } = {},
  ): Promise<any> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    return await this.repository.findAllApplications({
      skip,
      limit,
    });
  }

  async getPendingApplications(
    options: {
      page?: number;
      limit?: number;
    } = {},
  ): Promise<any> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    return await this.repository.findPendingApplications({
      skip,
      limit,
    });
  }
}
export const vendorApplicationService = new VendorApplicationService(
  vendorApplicationRepository,
);
