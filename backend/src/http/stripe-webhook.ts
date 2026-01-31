import Stripe from "stripe";
import type { Request, Response } from "express";
import { paymentService } from "`../services/payment.service.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function stripeWebhookExpressHandler(req: Request, res: Response) {
  try {
    const sig = req.headers["stripe-signature"] as string;
    // req.body is a Buffer because of express.raw
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    const result = await paymentService.handleStripeWebhook(event);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}



/*
Stripe commands to be remembered:


to listen to webhooks locally:

./stripe listen --forward-to localhost:5000/webhooks/stripe




to confirm a PaymentIntent from CLI (for testing):

./stripe payment_intents confirm pi_3SQU70B4TNXUp3hU0TTIQUgr --payment-method pm_card_visa   --return-url http://localhost:5173/payments/complete

./stripe payment_intents confirm pi_3SQsRtB4TNXUp3hU1XYGafML --payment-method pm_card_chargeDeclined   --return-url http://localhost:5173/payments/complete

the pi_... is obtained from the client secret (the part before _secret_...)





*/