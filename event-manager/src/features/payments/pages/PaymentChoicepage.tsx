import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PaymentChoicePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const regQ = trpc.events.getMineForEvent.useQuery({ eventId: eventId! });
  const initCard = trpc.payments.initCard.useMutation({
    onSuccess: (res) => {
      if (!res.clientSecret) {
        toast.error("Could not start card payment");
        return;
      }
      navigate(`/checkout/${regQ.data!.id}?cs=${encodeURIComponent(res.clientSecret)}`);
    },
    onError: (e) => toast.error(e.message ?? "Failed to start card payment"),
  });

  const payWallet = trpc.payments.payWithWallet.useMutation({
    onSuccess: () => {
      toast.success("Payment successful");
      navigate(`/events/${eventId}`);
    },
    onError: (e) => toast.error(e.message ?? "Wallet payment failed"),
  });

  useEffect(() => {
    if (regQ.data && regQ.data.status !== "PENDING") {
      toast.error("No active hold. Please register again.");
      navigate(`/events/${eventId}`);
    }
  }, [regQ.data, eventId, navigate]);

  if (regQ.isLoading) return null;
  if (!regQ.data) return <div className="p-6">No registration found.</div>;

  const amountMinor = regQ.data.paymentAmount ?? 0;
  const currency = regQ.data.currency ?? "EGP";

  return (
    <div className="max-w-xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Choose payment method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            You have a temporary hold on your seat. Complete payment to confirm.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={() =>
                initCard.mutate({
                  eventId: eventId!,
                  registrationId: regQ.data!.id,
                  amountMinor: amountMinor * 100,
                  currency,
                })
              }
            >
              Pay by Card
            </Button>

            <Button
              variant="secondary"
              onClick={() =>
                payWallet.mutate({
                  eventId: eventId!,
                  registrationId: regQ.data!.id,
                  amountMinor,
                  currency,
                })
              }
            >
              Pay from Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
