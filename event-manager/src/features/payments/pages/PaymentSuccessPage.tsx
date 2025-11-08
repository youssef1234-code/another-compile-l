import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  const [search] = useSearchParams();
  const pid = search.get("pid") ?? "—";

  return (
    <div className="container max-w-lg py-10">
      <Card>
        <CardHeader>
          <CardTitle>Payment Successful</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Your payment was received. Receipt ID:
          </div>
          <div className="font-mono text-sm">{pid}</div>
          <div className="pt-4">
            <Button asChild className="w-full">
              <Link to="/events?tab=registrations">Go to My Registrations</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
