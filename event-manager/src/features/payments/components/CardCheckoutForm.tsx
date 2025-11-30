import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

export function CardCheckoutForm({
  afterSuccess,
  afterFailure,
}: {
  afterSuccess: (paymentId: string) => void;
  afterFailure: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      // This uses the client_secret already wired via <Elements options={{ clientSecret }}>
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        afterFailure(error.message || "Card confirmation failed");
        return;
      }

      if (!paymentIntent) {
        afterFailure("No payment intent returned");
        return;
      }

      if (paymentIntent.status === "succeeded") {
        // Webhook will finalize DB; we just route to success screen
        afterSuccess(paymentIntent.id);
      } else if (paymentIntent.status === "processing" || paymentIntent.status === "requires_action") {
        toast("Action may be required. Follow any prompts that appear.");
      } else {
        afterFailure(`Payment status: ${paymentIntent.status}`);
      }
    } catch (e) {
      afterFailure((e as Error)?.message || "Payment error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement />
      <Button className="w-full" onClick={onSubmit} disabled={submitting || !stripe || !elements}>
        {submitting ? "Processing…" : "Pay now"}
      </Button>
      
    </div>
  );
}
