import { Types } from "mongoose";
import type { ClientSession, FilterQuery } from "mongoose";
import { Payment } from "../models/payment.model";
import type { IPayment } from "../models/payment.model";

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



async createWithSession(data: Partial<IPayment>, session: ClientSession) {
  const docs = await this.model.create([data], { session });
  return docs[0];
}

async findSucceededByRegistration(registrationId: string) {
  return this.model.findOne({
    registration: registrationId,
    paymentStatus: 'SUCCEEDED',
  });
}

findByStripePI(piId: string, opts?: { session?: ClientSession }) {
  return this.model
    .findOne({ stripePaymentIntentId: piId })
    .select({ _id: 1, amountMinor: 1, currency: 1, event: 1, user: 1, status: 1 }) // <-- crucial
    .session(opts?.session ?? null);
}

findByIdForTransaction(id: string, opts?: { session?: ClientSession; lean?: boolean }) {
  const q = this.model.findById(id)
    .select({ _id: 1, amountMinor: 1, currency: 1, event: 1, user: 1, status: 1 });
  if (opts?.session) q.session(opts.session);
  if (opts?.lean) return q.lean();
  return q;
}

update(id: string, patch: any, session?: ClientSession) {
  // Return the updated doc with the fields we need:
  return this.model.findByIdAndUpdate(
    id,
    { $set: patch },
    { new: true, session }
  ).select({ _id: 1, amountMinor: 1, currency: 1, event: 1, user: 1, status: 1 });
}

findLatestForRegistration(registrationId: string) {
  return this.model
    .findOne({ registration: registrationId })
    .sort({ createdAt: -1 })
    .lean();
}

}
export const paymentRepository = new PaymentRepository();
