import { model} from "mongoose";
import { PaymentMethod, PaymentStatus } from "../shared/index.js";
import type { Currency } from "../shared/index.js";
import { createBaseSchema } from "`./base.model.js";
import type { IBaseDocument } from "`./base.model.js";

export interface IPayment extends IBaseDocument {
    
  user: string;
  registration?: string;
  event?: string;

  method: PaymentMethod;
  status: PaymentStatus;

  amountMinor: number;
  currency: Currency;

  // Stripe-specific
  stripePaymentIntentId?: string;
  stripeClientSecret?: string;
  vendorApplication?: string;
  

  purpose?: "EVENT_PAYMENT" | "WALLET_TOPUP" | "VENDOR_FEE";

}

const PaymentSchema = createBaseSchema<IPayment>(
  {
    user: { type: String, ref: "User", required: true },
    registration: { type: String, ref: "Registration" },
    event: { type: String, ref: "Event" },

    method: { type: String, enum: Object.values(PaymentMethod), required: true },
    status: { type: String, enum: Object.values(PaymentStatus), required: true, default: "PENDING" },

    amountMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },

    stripePaymentIntentId: { type: String },
    stripeClientSecret: { type: String },
    vendorApplication: { type: String, ref: "VendorApplication" },


    purpose: { type: String }, // "EVENT_PAYMENT" | "WALLET_TOPUP"
  },
  { timestamps: true }
);

PaymentSchema.index({ user: 1, createdAt: -1 });
PaymentSchema.index({ stripePaymentIntentId: 1 }, { unique: true, sparse: true });

export const Payment = model<IPayment>("Payment", PaymentSchema);
