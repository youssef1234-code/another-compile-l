import type { ClientSession } from "mongoose";
import { WalletTxn } from "../models/wallet-transaction.model.js";
import type { IWalletTxn } from "../models/wallet-transaction.model.js";
import { BaseRepository } from "./base.repository.js";

export class WalletRepository extends BaseRepository<IWalletTxn> {

    constructor() {
        super(WalletTxn);
    }

  async listUser(userId: string, skip = 0, limit = 50) {
    return WalletTxn
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async balance(userId: string) {
    // Credits are positive, debits negative — we encode via type
    const rows = await WalletTxn.aggregate([
      { $match: { user: userId } },
      {
        $project: {
          signAmount: {
            $cond: [
              { $in: ["$type", ["CREDIT_REFUND", "CREDIT_TOPUP", "CREDIT_ADJUSTMENT"]] },
              "$amountMinor",
              { $multiply: ["$amountMinor", -1] }
            ]
          },
          currency: 1
        }
      },
      { $group: { _id: "$currency", balanceMinor: { $sum: "$signAmount" } } },
      { $sort: { _id: 1 } }
    ]);

    // Single currency deployment: return first (or zero)
    const first = rows[0];
    // this returns the currency of the first transaction in the aggregation or EGP if no transactions exist
    return { currency: first?._id ?? "EGP", balanceMinor: first?.balanceMinor ?? 0 };
    
}


async createWithSession(data: Partial<IWalletTxn>, session: ClientSession) {
  const docs = await this.model.create([data], { session });
  return docs[0];
}
}
export const walletRepository = new WalletRepository();
