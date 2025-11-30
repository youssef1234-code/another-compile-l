import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Download,
  CalendarDays,
  ArrowRight,
  Store,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";

export default function PaymentSuccessPage() {
  const [search] = useSearchParams();
  const pid = search.get("pid") ?? "—";
  const isVendor = search.get("vendor") === "1";

  const title = isVendor ? "Vendor payment successful" : "Payment successful";
  const subtitle = isVendor
    ? "Your bazaar/booth participation fee has been paid."
    : "Your event payment has been completed.";

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(34,197,94,0.18),transparent_60%)]"
      />
      <div className="container max-w-2xl py-12">
        <Card className="border-green-600/20 shadow-lg">
          <CardHeader className="flex flex-col items-center gap-2 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <CardTitle className="text-2xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md border bg-muted/40 p-4 space-y-1">
              <div className="text-sm text-muted-foreground">Receipt ID</div>
              <div className="font-mono text-sm break-all">{pid}</div>
            </div>

            <Separator />

            {/* Primary actions differ for vendor vs attendee */}
            <div className="grid gap-3 sm:grid-cols-2">
              {isVendor ? (
                <>
                  <Button asChild variant="secondary" className="w-full">
                    <Link to={ROUTES.VENDOR_APPLICATIONS}>
                      <Store className="mr-2 h-4 w-4" />
                      My applications
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link to={ROUTES.DASHBOARD}>
                      Vendor dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="secondary" className="w-full">
                    <Link to="/events/my-registrations">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      My registrations
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Download receipt (soon)
                  </Button>
                </>
              )}
            </div>

            <div className="pt-2 text-center text-xs text-muted-foreground">
              You&apos;ll also receive a payment receipt by email.
            </div>

            {!isVendor && (
              <div className="flex justify-center pt-1">
                <Button asChild className="w-full sm:w-auto">
                  <Link to="/events">
                    Explore more events
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
