import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Download, CalendarDays, ArrowRight } from "lucide-react";

export default function PaymentSuccessPage() {
  const [search] = useSearchParams();
  const pid = search.get("pid") ?? "—";

  return (
     <div className="relative min-h-screen flex items-center justify-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(34,197,94,0.18),transparent_60%)]"
      />
      <div className="container max-w-2xl py-12">
        <Card className="border-green-600/20 shadow-lg">
        <CardHeader className="flex items-center gap-3 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <CardTitle className="text-2xl">Payment successful</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md border bg-muted/40 p-4">
              <div className="text-sm text-muted-foreground">Receipt ID</div>
              <div className="font-mono text-sm">{pid}</div>
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
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
            </div>

            <div className="pt-2 text-center text-xs text-muted-foreground">
              You’ll also receive a payment receipt by email.
            </div>

            <div className="flex justify-center pt-1">
              <Button asChild className="w-full sm:w-auto">
                <Link to="/events">
                  Explore more events <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
