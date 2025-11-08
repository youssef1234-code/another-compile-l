import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function InsufficientFundsPage() {
  const [search] = useSearchParams();
  const eventId = search.get("eventId") ?? "";

  return (
    <div className="container max-w-lg py-10">
      <Card>
        <CardHeader>
          <CardTitle>Insufficient Wallet Balance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your wallet balance isn’t enough to complete this payment.
          </p>
          <div className="grid gap-2">
            <Button asChild>
              <Link to="/wallet">Top up wallet</Link>
            </Button>
            {/* Optionally let them switch back to card for the same registration */}
            {eventId && (
              <Button asChild variant="outline">
                <Link to={`/events/${eventId}`}>Go back to event</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
