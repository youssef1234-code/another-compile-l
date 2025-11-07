import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { trpc } from "@/lib/trpc";

export default function PaymentMethodsPage() {
  const { eventId, registrationId } = useParams();
  const navigate = useNavigate();

  // You probably have event details via parent or query:
  // const eventQ = trpc.events.getById.useQuery({ id: eventId! });

  const payWallet = trpc.payments.payWithWallet.useMutation({
    onSuccess: () => {
      toast.success("Payment successful. Registration confirmed.");
      navigate(`/events/${eventId}`); // or My Registrations
    },
    onError: (e) => toast.error(e.message ?? "Wallet payment failed"),
  });

  const initCard = trpc.payments.initCard.useMutation({
    onSuccess: (res) => {
      // res = { paymentId, clientSecret }
      console.log("Card payment initialized", res);
      const qs = new URLSearchParams({ clientSecret: res.clientSecret as any});
      navigate(`/payments/card/${res.paymentId}?${qs.toString()}`, {
        replace: true, // optional
      });
    },
    onError: (e) => toast.error(e.message ?? "Card init failed"),
  });

  const handleWallet = () => {
    // Supply amountMinor & currency from event data; example only:
    // const amountMinor = Math.round(eventQ.data.price * 100);
    // const currency = "EGP";
    payWallet.mutate({
      registrationId: registrationId!,
      eventId: eventId!,
      amountMinor: /* from event */ 10000,
      currency: "EGP",
    });
  };

  const handleCard = () => {
    initCard.mutate({
      registrationId: registrationId!,
      eventId: eventId!,
      amountMinor: /* from event */ 10000,
      currency: "EGP",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a payment method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full" onClick={handleWallet} disabled={payWallet.isPending}>
          Pay with Wallet
        </Button>
        <Button className="w-full" variant="secondary" onClick={handleCard} disabled={initCard.isPending}>
          Pay with Card
        </Button>
      </CardContent>
    </Card>
  );
}
