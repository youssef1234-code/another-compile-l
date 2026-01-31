import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { RegistrationStatus } from "../shared";
import { toast } from 'react-hot-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


function useMyRegistration(eventId: string) {
  const q = trpc.registrations.getMyRegistrationForEvent.useQuery({ eventId }, { staleTime: 15_000 });
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
    startDate?: string | Date | null;
  };
}) {
  const navigate = useNavigate();
  const { state, reg, refetch, isFetching } = useMyRegistration(event.id);
  const utils = trpc.useUtils();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Check if event is free
  const isFreeEvent = !event.price || event.price === 0;

  const registerM = trpc.events.registerForEvent.useMutation({
    onSuccess: async (newReg) => {
      console.log("Registration successful", { isFreeEvent });
      
      if (isFreeEvent) {
        // For free events, registration is immediately confirmed
        toast.success("Successfully registered for this free event!");
        await refetch();
        utils.events.isRegistered.invalidate({ eventId: event.id });
        return;
      }

      // For paid events, redirect to payment
      toast.success("Seat held. Complete payment to confirm.");
      await refetch();
      const params = new URLSearchParams({
        eventId: event.id,
        amountMinor: String(event.price ? event.price * 100 : 0),
        currency: "EGP" 
      });
      navigate(`/checkout/${(newReg.registration as { id: string }).id}?${params.toString()}`);
    },
    onError: (e) => {
      toast.error(e.message ?? "Registration failed");
    },
  });

  const refundM = trpc.payments.refundToWallet.useMutation({
    onSuccess: async () => {
      toast.success("Registration cancelled and refunded to your wallet");
      setShowCancelDialog(false);
      await Promise.all([
        refetch(), // refresh this registration
        utils.events.isRegistered.invalidate({ eventId: event.id }),
        utils.payments?.myWallet?.invalidate?.(),
        utils.payments?.myPayments?.invalidate?.(),
      ].filter(Boolean));
    },
    onError: (e) => {
      toast.error(e.message ?? "Refund failed");
    },
  });

  // Check if refund window is open (14 days before event start)
  const canRefund = useMemo(() => {
    if (state !== "CONFIRMED") return false;
    if (!reg?.paymentId) return false; // No payment to refund (free event)
    if (!event.startDate) return false;
    
    const eventStart = new Date(event.startDate);
    const now = new Date();
    const daysUntilEvent = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilEvent >= 14;
  }, [state, reg?.paymentId, event.startDate]);

  // Debug logging
  console.log("RegistrationCTA Debug:", {
    state,
    regPaymentId: reg?.paymentId,
    eventStartDate: event.startDate,
    canRefund,
    isFreeEvent,
  });

  const handleCancelRegistration = () => {
    if (!reg?.paymentId || !reg?.id) {
      toast.error("Unable to process refund");
      return;
    }
    refundM.mutate({
      registrationId: reg.id,
      paymentId: reg.paymentId,
    });
  };


  const btn = useMemo(() => {
    switch (state) {
      case "CONFIRMED":
        return { label: "You're Registered", variant: "secondary" as const, disabled: true };
      case "PENDING":
        // For free events with pending status (edge case), show different message
        if (isFreeEvent) {
          return { label: "Processing...", variant: "default" as const, disabled: true };
        }
        return {
          label: `Complete Payment (${Math.ceil(msLeft(reg?.holdUntil) / 60000)}m left)`,
          variant: "default" as const,
          disabled: false,
        };
      case "EXPIRED":
        return { label: "Hold Expired — Try Again", variant: "destructive" as const, disabled: false };
      default:
        return { label: isFreeEvent ? "Register Now (Free)" : "Register Now", variant: "default" as const, disabled: false };
    }
  }, [state, reg?.holdUntil, isFreeEvent]);

  const onClick = () => {
    console.log("RegistrationCTA onClick", { state, eventId: event.id, isFreeEvent });
    
    if (state === "CONFIRMED") return;
    
    if (state === "PENDING" && reg && !isFreeEvent) {
      // Only redirect to payment for paid events
      const params = new URLSearchParams({
        eventId: event.id,
        amountMinor: String(event.price ? event.price * 100 : 0),
        currency: "EGP"
      });
      console.log("reg id:", reg.id);
      navigate(`/checkout/${reg.id}?${params.toString()}`);
      return;
    }
    
    // NONE or EXPIRED → (re)register to (re)hold
    registerM.mutate({ eventId: event.id });
  }; 

  // Different card style for confirmed registrations
  const isConfirmed = state === "CONFIRMED";

  return (
    <Card className={isConfirmed 
      ? "border-green-500 dark:border-green-600 shadow-lg bg-green-50/50 dark:bg-green-900/20" 
      : "border-primary shadow-lg"
    }>
      <CardContent className="pt-6 space-y-4">
        {isConfirmed ? (
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              ✓ You're Registered
            </p>
            <p className="text-sm text-muted-foreground">
              {event.price ? `Paid: ${event.price} EGP` : "Free Event"}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-3xl font-bold text-primary mb-1">
              {event.price ? `${event.price} EGP` : "FREE"}
            </p>
            <p className="text-sm text-muted-foreground">
              {event.capacity ? `${(event.capacity - (event.registeredCount ?? 0))} spots left` : "Open registration"}
            </p>
          </div>
        )}

        {/* Only show register/payment button when not confirmed */}
        {!isConfirmed && (
          <Button
            className="w-full"
            size="lg"
            variant={btn.variant}
            onClick={onClick}
            disabled={btn.disabled || registerM.isPending || isFetching}
          >
            {registerM.isPending ? "Registering..." : btn.label}
          </Button>
        )}

        {/* Cancel Registration Button - shown for confirmed paid registrations within refund window */}
        {state === "CONFIRMED" && canRefund && (
          <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
            <AlertDialogTrigger asChild>
              <Button
                className="w-full"
                size="sm"
                variant="outline"
                disabled={refundM.isPending}
              >
                {refundM.isPending ? "Processing..." : "Cancel Registration"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Registration?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel your registration? The payment amount will be refunded to your wallet.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Registration</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelRegistration}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Cancel & Refund
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Show message when refund window has passed */}
        {state === "CONFIRMED" && reg?.paymentId && !canRefund && (
          <p className="text-xs text-center text-muted-foreground">
            Cancellation window closed (must be 14+ days before event)
          </p>
        )}

        {event.registrationDeadline && (
          <p className="text-xs text-center text-muted-foreground">
            Register by {new Date(event.registrationDeadline).toLocaleString()}
          </p>

          
        )}

        
      </CardContent>
    </Card>
  );
}