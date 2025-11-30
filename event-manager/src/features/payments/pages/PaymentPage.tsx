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
import { usePageMeta } from '@/components/layout/page-meta-context';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

function getStripeAppearance(theme: string | undefined) {
  const isDark = theme === "dark";
  return {
    theme: isDark ? "night" : "stripe",
    variables: {
      borderRadius: "0.75rem",
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      colorPrimary: "hsla(222, 37%, 89%, 1.00)",
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

export default function PaymentPage({ isVendor = false }: { isVendor?: boolean }) {
  const params = useParams<{ registrationId?: string; applicationId?: string }>();
  const registrationId = params.registrationId ?? undefined;
  const applicationId = params.applicationId ?? undefined;
  console.log("PaymentPage params:", { registrationId, applicationId, isVendor });

  const { setPageMeta } = usePageMeta();

  useEffect(() => {
    setPageMeta({
      title: isVendor ? "Vendor Payment" : "Event Payment",
      description: isVendor
        ? "Complete your vendor participation fee payment."
        : "Complete your event registration payment.",
    });
  }, [setPageMeta, isVendor]);

  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const [tab, setTab] = useState<"card" | "wallet">("card");
  const { resolvedTheme } = useTheme();

  // Normal event flow data (from URL)
  const eventId = search.get("eventId") ?? undefined;
  const amountMinorFromUrl = Number(search.get("amountMinor") ?? 0);
  const currencyFromUrl = (search.get("currency") ?? "EGP") as "EGP" | "USD";

  // For non-vendor: fetch event details to get name and validate
  const eventQ = trpc.events.getEventById.useQuery(
    { id: eventId ?? "" },
    { enabled: !!eventId && !isVendor }
  );

  // For vendor: fetch application
  const vendorAppQ = trpc.vendorApplications.getApplication.useQuery(
    { applicationId: applicationId ?? "" },
    { enabled: isVendor && !!applicationId }
  );
  // Cast to proper type since tRPC inference doesn't capture backend model
  const vendorApp = vendorAppQ.data as { paymentAmount?: number; paymentCurrency?: string; type?: string; bazaarName?: string; boothLabel?: string } | undefined;

  // Debug: Log vendor application data
  useEffect(() => {
    if (isVendor && vendorApp) {
      console.log("Vendor application data:", vendorApp);
    }
  }, [isVendor, vendorApp]);

  // Compute display values - paymentAmount is already in minor units from backend
  const displayAmountMinor = isVendor
    ? (vendorApp?.paymentAmount ?? 0)
    : amountMinorFromUrl;

  const displayCurrency = (isVendor
    ? (vendorApp?.paymentCurrency ?? "EGP")
    : currencyFromUrl) as "EGP" | "USD";

  // For vendor PLATFORM applications, show booth info; for BAZAAR, show bazaar name
  const displayTitle = isVendor
    ? (vendorApp?.type === "BAZAAR" 
        ? (vendorApp?.bazaarName ?? "Bazaar participation fee")
        : (vendorApp?.boothLabel ?? "Platform booth fee"))
    : (eventQ.data?.name ?? "Event");

  // Check if this is a free event (should not be on payment page)
  const isFreeEvent = !isVendor && amountMinorFromUrl === 0;

  // Redirect free events away from payment page
  useEffect(() => {
    if (isFreeEvent && eventId) {
      toast.error("This is a free event. No payment required.");
      navigate(ROUTES.EVENT_DETAILS.replace(":id", eventId));
    }
  }, [isFreeEvent, eventId, navigate]);

  const [clientSecret, setClientSecret] = useState<string | null>(search.get("cs"));

  const initCard = trpc.payments.initCard.useMutation({
    onSuccess: (res) => {
      const next = new URLSearchParams(search);
      next.set("cs", String(res.clientSecret));
      next.set("pid", res.paymentId);
      setSearch(next, { replace: true });
      setClientSecret(String(res.clientSecret));
      setTab("card");
      toast.success("Card payment session created");
    },
    onError: (e) => toast.error(e.message ?? "Failed to start card payment"),
  });

  const initVendorCard = trpc.payments.initVendorCard.useMutation({
    onSuccess: (res) => {
      const next = new URLSearchParams(search);
      next.set("cs", String(res.clientSecret));
      next.set("pid", res.paymentId);
      setSearch(next, { replace: true });
      setClientSecret(String(res.clientSecret));
      setTab("card");
      toast.success("Vendor fee payment session created");
    },
    onError: (e) => toast.error(e.message ?? "Failed to start vendor payment"),
  });

  const payWallet = trpc.payments.payWithWallet.useMutation({
    onSuccess: (res) => {
      navigate(`${ROUTES.PAY_SUCCESS}?pid=${res.paymentId}`);
    },
    onError: (e) => {
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

  const handleStartCard = () => {
    if (isVendor) {
      if (!applicationId) {
        toast.error("Missing vendor application. Open the payment link again.");
        return;
      }
      initVendorCard.mutate({ applicationId });
      return;
    }

    // Validate required fields for event payment
    if (!registrationId || !eventId) {
      toast.error("Missing payment session data. Go back and start again.");
      return;
    }

    // Check for free event
    if (amountMinorFromUrl === 0) {
      toast.error("This is a free event. No payment required.");
      navigate(ROUTES.EVENT_DETAILS.replace(":id", eventId));
      return;
    }

    if (!currencyFromUrl) {
      toast.error("Missing currency information. Go back and start again.");
      return;
    }

    initCard.mutate({
      registrationId,
      eventId,
      amountMinor: amountMinorFromUrl,
      currency: currencyFromUrl,
    });
  };

  const handleWallet = () => {
    if (isVendor) return;

    if (!registrationId || !eventId) {
      toast.error("Missing payment session data. Go back and start again.");
      return;
    }

    // Check for free event
    if (amountMinorFromUrl === 0) {
      toast.error("This is a free event. No payment required.");
      navigate(ROUTES.EVENT_DETAILS.replace(":id", eventId));
      return;
    }

    if (!currencyFromUrl) {
      toast.error("Missing currency information. Go back and start again.");
      return;
    }

    payWallet.mutate({
      registrationId,
      eventId,
      amountMinor: amountMinorFromUrl,
      currency: currencyFromUrl,
    });
  };

  // Don't render payment UI for free events
  if (isFreeEvent) {
    return null;
  }

  // Show loading state while fetching vendor application data
  if (isVendor && vendorAppQ.isLoading) {
    return (
      <div className="max-w-2xl max-h-screen flex items-center justify-center mx-auto">
        <div className="container max-w-3xl py-6 space-y-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading payment details...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error if vendor application not found or has no payment amount
  if (isVendor && vendorApp && !vendorApp.paymentAmount) {
    return (
      <div className="max-w-2xl max-h-screen flex items-center justify-center mx-auto">
        <div className="container max-w-3xl py-6 space-y-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">Payment amount not set for this application.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please wait for your application to be approved with a fee.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl max-h-screen flex items-center justify-center mx-auto">
      <div className="container max-w-3xl py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {isVendor ? "Pay your vendor participation fee" : "Complete your payment"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">
                  {isVendor ? "Bazaar / Booth" : "Event"}
                </div>
                <div className="font-medium">{displayTitle}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Amount</div>
                <div className="font-semibold">
                  {(displayAmountMinor / 100).toFixed(2)} {displayCurrency}
                </div>
              </div>
            </div>

            {!isVendor && <Separator />}

            <Tabs value={tab} onValueChange={(v) => setTab(v as "card" | "wallet")} className="w-full">
              {!isVendor && (
                <TabsList className="grid grid-cols-2 justify-self-center w-full">
                  <TabsTrigger value="card">Pay by Card</TabsTrigger>
                  <TabsTrigger value="wallet">Pay from Wallet</TabsTrigger>
                </TabsList>
              )}

              <TabsContent value="card" className="space-y-4">
                {!clientSecret ? (
                  <Button
                    className={cn("w-full")}
                    onClick={handleStartCard}
                    disabled={initCard.isPending || initVendorCard.isPending}
                  >
                    {initCard.isPending || initVendorCard.isPending
                      ? "Starting…"
                      : "Start card payment"}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      A card session is active. You can submit below, or{" "}
                      <button
                        className="underline"
                        onClick={handleStartCard}
                        disabled={initCard.isPending || initVendorCard.isPending}
                      >
                        start a new attempt
                      </button>
                      .
                    </div>
                    {elementsOptions && (
                      <Elements
                        stripe={stripePromise}
                        options={{
                          ...elementsOptions,
                          appearance: getStripeAppearance(resolvedTheme),
                        }}
                      >
                        <CardCheckoutForm
                          afterSuccess={(pid) =>
                            navigate(
                              isVendor
                                ? `${ROUTES.PAY_SUCCESS}?pid=${pid}&vendor=1`
                                : `${ROUTES.PAY_SUCCESS}?pid=${pid}`
                            )
                          }
                          afterFailure={(msg) => {
                            toast.error(msg);
                            if (!isVendor && eventId) {
                              navigate(ROUTES.EVENT_DETAILS.replace(":id", eventId));
                            } else {
                              navigate(ROUTES.VENDOR_APPLICATIONS);
                            }
                          }}
                        />
                      </Elements>
                    )}
                  </div>
                )}
              </TabsContent>

              {!isVendor && (
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
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}