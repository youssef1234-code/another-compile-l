import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";
import { ApplyToBazaarForm } from "@/components/ApplyToBazaarForm";
import { useAuthStore } from "@/store/authStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function VendorBazaarsPage() {
  const { user } = useAuthStore();  
  const vendorId = (user as any)?.vendorId || ""; // adjust if stored elsewhere
  const [openFor, setOpenFor] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } =
    trpc.vendor.getUpcomingBazaars.useQuery({ page: 1, limit: 100 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Upcoming Bazaars</h1>
          <p className="text-sm text-muted-foreground">
            Browse upcoming bazaars and apply for a booth.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {!vendorId && (
        <Card>
          <CardContent className="py-3 text-sm text-red-600">
            No vendor linked to your account. Ask an admin to attach your vendor profile to enable applications.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : error ? (
          <div className="text-sm text-red-600">{error.message || "Failed to load bazaars"}</div>
        ) : (data?.bazaars?.length ?? 0) === 0 ? (
          <div className="text-sm text-muted-foreground">No upcoming bazaars.</div>
        ) : (
          data!.bazaars.map((b) => (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{b.name}</div>
                  {b.location && <Badge variant="secondary">{b.location}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {new Date(b.startDate).toLocaleString()}
                  {b.endDate ? ` – ${new Date(b.endDate).toLocaleString()}` : ""}
                </div>

                <Dialog open={openFor === b.id} onOpenChange={(o) => setOpenFor(o ? b.id : null)}>
                  <DialogTrigger asChild>
                    <Button disabled={!vendorId}>Apply</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Apply to {b.name}</DialogTitle>
                    </DialogHeader>
                    <ApplyToBazaarForm
                      vendorId={vendorId}
                      eventId={b.id}
                      onSuccess={() => {
                        toast.success("Application submitted");
                        setOpenFor(null);
                      }}
                      onCancel={() => setOpenFor(null)}
                    />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
