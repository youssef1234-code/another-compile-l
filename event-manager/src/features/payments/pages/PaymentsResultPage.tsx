// src/features/payments/pages/PaymentResultPage.tsx
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

export default function PaymentResultPage() {
  const { paymentId } = useParams();

  useEffect(() => {
    // Optionally: call a tiny tRPC query to fetch the latest payment status by paymentId
    // and toast success/failure. For now, show a generic message.
    toast.success("We’re finalizing your payment. You’ll see it reflected shortly.");
  }, []);

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Payment Received</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>Thanks! If your bank required extra verification, you may have been redirected and brought back here.</p>
          <p>Payment ID: <span className="font-mono">{paymentId}</span></p>
          <div className="pt-2">
            <Button asChild>
              <Link to="/events">Back to Events</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
