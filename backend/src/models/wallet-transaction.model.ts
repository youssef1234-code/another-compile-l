import { model } from "mongoose";
import { WalletTxnType } from "../shared/index.js";
import type { Currency } from "../shared/index.js";
import { createBaseSchema } from "`./base.model.js";
import type { IBaseDocument } from "`./base.model.js";

export interface IWalletTxn extends IBaseDocument {
  user: string;
  type: WalletTxnType;
  amountMinor: number;      // always positive — sign is implied by type
  currency: Currency;
  reference?: {
    registrationId?: string;
    eventId?: string;
    paymentId?: string;
    note?: string;
  };
}

const WalletTxnSchema = createBaseSchema<IWalletTxn>(
  {
    user: { type: String, ref: "User", required: true },
    type: { type: String, enum: Object.values(WalletTxnType), required: true },
    amountMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    reference: {
      registrationId: { type: String, ref: "Registration" },
      eventId: { type: String, ref: "Event" },
      paymentId: { type: String, ref: "Payment" },
      note: { type: String },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

WalletTxnSchema.index({ user: 1, createdAt: -1 });

export const WalletTxn = model<IWalletTxn>("WalletTxn", WalletTxnSchema);
