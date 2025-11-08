import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowLeft, ArrowRight } from "lucide-react";

export default function InsufficientFundsPage() {
  const [search] = useSearchParams();
  const eventId = search.get("eventId") ?? "";

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(234,179,8,0.16),transparent_60%)]"
      />
      <div className="container max-w-2xl py-12">
        <Card className="border-yellow-600/20 shadow-lg">
        <CardHeader className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-yellow-600" />
            <CardTitle>Insufficient wallet balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
              Your wallet doesn’t have enough funds to complete this payment. You can top up now, or go back and choose to pay by card.
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild className="w-full">
                <Link to="/wallet">
                  Top up wallet <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {eventId ? (
                <Button asChild variant="secondary" className="w-full">
                  <Link to={`/events/${eventId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to event
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="secondary" className="w-full">
                  <Link to="/events">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to events
                  </Link>
                </Button>
              )}
            </div>

            <div className="pt-1 text-center text-xs text-muted-foreground">
              Tip: after topping up, you can retry wallet or switch to card on the checkout page.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
