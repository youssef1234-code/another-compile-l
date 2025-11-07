// src/features/payments/pages/CardCheckoutPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Elements, useElements, useStripe, PaymentElement } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast"; // you already have shadcn/sonner hooked up
import { Loader2 } from "lucide-react";

type Appearance = NonNullable<Parameters<typeof Elements>[0]["options"]>["appearance"];

function useClientSecret() {
  const location = useLocation();
  const [sp] = useSearchParams();

  // We accept any of these sources:
  // - ?cs=... (your current URL)
  // - ?client_secret=...
  // - location.state.clientSecret (if navigated programmatically)
  const fromQuery =
    sp.get("cs") ||
    sp.get("client_secret");

  const fromState = (location.state as any)?.clientSecret as string | undefined;

  return fromQuery || fromState || "";
}

export default function CardCheckoutPage() {
  const { paymentId } = useParams(); // /checkout/:paymentId
  const clientSecret = useClientSecret();

  // Stripe Elements appearance that matches your app styling a bit
  const appearance = useMemo<Appearance>(
    () => ({
      theme: "stripe",
      variables: {
        colorPrimary: "hsl(var(--primary))",
        colorText: "hsl(var(--foreground))",
        colorBackground: "hsl(var(--card))",
        borderRadius: "8px",
      },
      rules: {
        ".Input": { borderRadius: "8px" },
        ".Tab": { borderRadius: "8px" },
      },
    }),
    []
  );

  if (!paymentId) {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader><CardTitle>Missing payment</CardTitle></CardHeader>
          <CardContent>Invalid URL. No payment id.</CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader><CardTitle>Missing payment session</CardTitle></CardHeader>
          <CardContent>
            Missing payment session. Go back and start again.
            <div className="mt-4">
              <Button onClick={() => history.back()} variant="outline">Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card className="border-primary">
        <CardHeader>
          <CardTitle>Card Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance,
            }}
          >
            <CheckoutInner paymentId={paymentId} />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckoutInner({ paymentId }: { paymentId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Optional: show a soft warning if Stripe isn't ready (very rare)
  useEffect(() => {
    if (!stripe || !elements) return;
  }, [stripe, elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);

    // Prefer redirect flow; if 3DS is not required, Stripe resolves immediately
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // After 3DS/redirect, Stripe will send the user here
        return_url: `${window.location.origin}/payments/result/${paymentId}`,
      },
    });

    setSubmitting(false);

    if (error) {
      // e.g. validation_error, card_error, etc.
      toast.error(error.message ?? "Payment failed. Please try again.");
      return;
    }

    // If no redirect was needed, you can optionally poll your backend or
    // just navigate to the result page (backend webhook should mark success).
    navigate(`/payments/result/${paymentId}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Separator />
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || !elements || submitting}>
          {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</> : "Pay"}
        </Button>
      </div>
    </form>
  );
}
