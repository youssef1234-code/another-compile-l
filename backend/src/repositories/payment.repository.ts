import { FilterQuery, Types } from "mongoose";
import { Payment, IPayment } from "../models/payment.model";

import { BaseRepository } from "./base.repository";

export class PaymentRepository extends BaseRepository<IPayment> {
  constructor() {
      super(Payment);
    }

  findMine(userId: string, filter: FilterQuery<IPayment> = {}, skip = 0, limit = 20) {
    return this.model
      .find({ user: new Types.ObjectId(userId), ...filter })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }
  countMine(userId: string, filter: FilterQuery<IPayment> = {}) {
    return this.model.countDocuments({ user: new Types.ObjectId(userId), ...filter });
  }

async findMinePaginated(
  userId: string,
  skip: number,
  limit: number,
  filter: FilterQuery<IPayment> = {}
) {
  const [rows, total] = await Promise.all([
    Payment.find({ user: userId, ...filter })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments({ user: userId, ...filter }),
  ]);
  return { rows, total };
}

}
export const paymentRepository = new PaymentRepository();
