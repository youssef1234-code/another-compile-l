import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { RegistrationStatus } from "@event-manager/shared";
import { toast } from 'react-hot-toast';
import { ROUTES } from "@/lib/constants";
import { Registration } from "../../../backend/src/models/registration.model";


function useMyRegistration(eventId: string) {
  // Backend should return: { id, status, holdUntil, paymentAmountMinor, currency } or null
  const q = trpc.events.getMineForEvent.useQuery({ eventId }, { staleTime: 15_000 });
  const reg = q.data ?? null;

  const state: RegistrationStatus | "NONE" = useMemo(() => {
    if (!reg) return "NONE";
    if (reg.status === "CONFIRMED") return "CONFIRMED";
    if (reg.status === "PENDING") {
      const ok = reg.holdUntil && new Date(reg.holdUntil).getTime() > Date.now();
      return ok ? "PENDING" : "EXPIRED";
    }
    return "NONE";
  }, [reg]);

  return { state, reg, ...q };
}

function msLeft(d?: string | Date | null) {
  if (!d) return 0;
  return Math.max(0, new Date(d).getTime() - Date.now());
}

export function RegistrationCTA({
  event,
}: {
  event: {
    id: string;
    price?: number;
    capacity?: number;
    registeredCount?: number;
    registrationDeadline?: string | Date | null;
  };
}) {
  const navigate = useNavigate();
  const { state, reg, refetch, isFetching } = useMyRegistration(event.id);

  const registerM = trpc.events.registerForEvent.useMutation({
    onSuccess: async (newReg) => {
      console.log("Registration successful");
      toast.success("Seat held. Complete payment to confirm.");
      await refetch();
      const params = new URLSearchParams({
        eventId: event.id,
        amountMinor: String(event.price ? event.price * 100 : 0),
        currency: "EGP" 
      });
      navigate(`/checkout/${(newReg.registration as any).id}?${params.toString()}`);

    },
    onError: (e) => {
      toast.error(e.message ?? "Registration failed");
    },
  });

  const btn = useMemo(() => {
    switch (state) {
      case "CONFIRMED":
        return { label: "You're Registered", variant: "secondary" as const, disabled: true };
      case "PENDING":
        return {
          label: `Complete Payment (${Math.ceil(msLeft(reg?.holdUntil) / 60000)}m left)`,
          variant: "default" as const,
          disabled: false,
        };
      case "EXPIRED":
        return { label: "Hold Expired — Try Again", variant: "destructive" as const, disabled: false };
      default:
        return { label: "Register Now", variant: "default" as const, disabled: false };
    }
  }, [state, reg?.holdUntil]);

    const onClick = () => {
    console.log("RegistrationCTA onClick", { state, eventId: event.id });
    console.log("onclick state:", state);
    if (state === "CONFIRMED") return;
    if (state === "PENDING" && reg) {
      const params = new URLSearchParams({
        eventId: event.id,
        amountMinor: String(event.price ? event.price * 100 : 0),
        currency: "EGP" // You might want to make this dynamic based on your app's configuration
      });
      console.log("reg id:", reg.id);
      
      navigate(`/checkout/${reg.id}?${params.toString()}`);
      return;
    }
    // NONE or EXPIRED → (re)register to (re)hold
    registerM.mutate({ eventId: event.id });
  }; 

  return (
    <Card className="border-primary shadow-lg">
      <CardContent className="pt-6 space-y-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-primary mb-1">
            {event.price ? `${event.price} EGP` : "FREE"}
          </p>
          <p className="text-sm text-muted-foreground">
            {event.capacity ? `${(event.capacity - (event.registeredCount ?? 0))} spots left` : "Open registration"}
          </p>
        </div>

        <Button
          className="w-full"
          size="lg"
          variant={btn.variant}
          onClick={onClick}
          disabled={btn.disabled || registerM.isPending || isFetching}
        >
          {registerM.isPending ? "Registering..." : btn.label}
        </Button>

        {event.registrationDeadline && (
          <p className="text-xs text-center text-muted-foreground">
            Register by {new Date(event.registrationDeadline).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
