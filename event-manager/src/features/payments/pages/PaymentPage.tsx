import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { CardCheckoutForm } from "../components/CardCheckoutForm";
import { ROUTES } from "@/lib/constants";
import { useTheme } from "@/hooks/useTheme";


const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);
function getStripeAppearance(theme: string | undefined) {
  // Use Stripe’s built-in themes and lightly customize to match shadcn
  const isDark = theme === "dark";
  return {
    theme: isDark ? "night" : "stripe",
    variables: {
      borderRadius: "0.75rem",        // matches rounded-xl vibe
      fontFamily: "inherit",
      colorPrimary: "hsla(222, 37%, 89%, 1.00)",    // tweak if you have a brand color
      colorBackground: isDark ? "#0B0F14" : "#ffffff",
      colorText: isDark ? "#ffffffff" : "#0B0F14",
      colorDanger: "#ef4444",
      colorSuccess: "#10b981",
    },
    rules: {
      ".Label": { fontWeight: "500" },
      ".Input": {
        boxShadow: "none",
        border: "1px solid var(--border-color, #e5e7eb)",
      },
      ".Tab, .Block": {
        borderRadius: "0.75rem",
      },
    },
  } as const;
}
export default function PaymentPage() {
  const { registrationId } = useParams(); // route: /checkout/:registrationId
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const [tab, setTab] = useState<"card" | "wallet">("card");

  // We expect eventId & currency/amount to be derivable. If you already have a
  // “getMineForEvent” or registration details endpoint, use it here:
  const regQ = trpc.events.getMineForEvent.useQuery(
    { eventId: search.get("eventId") ?? "" },
    { enabled: !!search.get("eventId") }
  );

  const eventId = search.get("eventId") ?? regQ.data?.eventId ?? "";
  const amountMinor = Number(search.get("amountMinor") ?? regQ.data?.paymentAmount ?? 0);
  const currency = (search.get("currency") ?? regQ.data?.currency ?? "EGP") as "EGP" | "USD";

  // Store latest PI client secret in URL + state
  const [clientSecret, setClientSecret] = useState<string | null>(search.get("cs"));

  const initCard = trpc.payments.initCard.useMutation({
    onSuccess: (res) => {
      // res: { paymentId, clientSecret, status }
      const next = new URLSearchParams(search);
      next.set("cs", (res.clientSecret as any).toString());
      next.set("pid", res.paymentId);
      setSearch(next, { replace: true });
      setClientSecret((res.clientSecret as any).toString());
      setTab("card");
      toast.success("Card payment session created");
    },
    onError: (e) => {
      toast.error(e.message ?? "Failed to start card payment");
    },
  });

  const payWallet = trpc.payments.payWithWallet.useMutation({
    onSuccess: (res) => {
      // res: { paymentId, status }
      navigate(`${ROUTES.PAY_SUCCESS}?pid=${res.paymentId}`);
    },
    onError: (e: any) => {
      const msg = e?.message || "Wallet payment failed";
      if (/Insufficient wallet balance/i.test(msg)) {
        navigate(`${ROUTES.PAY_INSUFFICIENT}?eventId=${eventId}`);
      } else {
        toast.error(msg);
      }
    },
  });

  const elementsOptions = useMemo(
    () => (clientSecret ? ({ clientSecret } as const) : undefined),
    [clientSecret]
  );

  // Tap-to-initialize Stripe PaymentIntent
  const handleStartCard = () => {
    if (!registrationId || !eventId || !amountMinor || !currency) {
      toast.error("Missing payment session data. Go back and start again.");
      return;
    }
    initCard.mutate({
      registrationId,
      eventId,
      amountMinor,
      currency,
    });
  };

  const handleWallet = () => {
    if (!registrationId || !eventId || !amountMinor || !currency) {
      toast.error("Missing payment session data. Go back and start again.");
      return;
    }
    payWallet.mutate({
      registrationId,
      eventId,
      amountMinor,
      currency,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container max-w-3xl py-6 space-y-6">
        <Card>
         <CardHeader>
          <CardTitle>Complete your payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Event</div>
              <div className="font-medium">{regQ.data?.eventId ?? "Event"}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="font-semibold">
                {(amountMinor / 100).toFixed(2)} {currency}
              </div>
            </div>
          </div>

          <Separator />

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-2   justify-self-center w-full">
              <TabsTrigger value="card">Pay by Card</TabsTrigger>
              <TabsTrigger value="wallet">Pay from Wallet</TabsTrigger>
            </TabsList>

            {/* CARD */}
            <TabsContent value="card" className="space-y-4">
              {!clientSecret ? (
                <Button
                  className={cn("w-full")}
                  onClick={handleStartCard}
                  disabled={initCard.isPending}
                >
                  {initCard.isPending ? "Starting…" : "Start card payment"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    A card session is active. You can submit below, or{" "}
                    <button
                      className="underline"
                      onClick={handleStartCard}
                      disabled={initCard.isPending}
                    >
                      start a new attempt
                    </button>
                    .
                  </div>
                  {elementsOptions && (
                    <Elements stripe={stripePromise} options={{ ...elementsOptions, appearance: getStripeAppearance(useTheme().resolvedTheme) }}>
                      <CardCheckoutForm
                        afterSuccess={(pid) => navigate(`${ROUTES.PAY_SUCCESS}?pid=${pid}`)}
                        afterFailure={(msg) => {
                            toast.error(msg);
                            navigate(ROUTES.EVENT_DETAILS.replace(":id", regQ.data?.eventId ?? ''));
                        }}
                      />
                    </Elements>
                  )}
                </div>
              )}
            </TabsContent>

            {/* WALLET */}
            <TabsContent value="wallet" className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Pay directly from your in-app wallet.
              </div>
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleWallet}
                disabled={payWallet.isPending}
              >
                {payWallet.isPending ? "Processing…" : "Pay from wallet"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
