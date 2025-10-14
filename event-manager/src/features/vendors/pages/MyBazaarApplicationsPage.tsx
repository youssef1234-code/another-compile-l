import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GenericDataTable } from "@/components/generic/GenericDataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useAuthStore } from "@/store/authStore";


type Row = {
  id: string;
  eventName: string;
  startDate?: string;
  boothSize: string;
  attendees: string[];
  status: string;
};

export default function MyBazaarApplicationsPage() {
  const { user } = useAuthStore();
  const vendorId = (user as any)?.vendorId || ""; // adjust

  const query = trpc.vendor.getMyApplications.useQuery(
    { vendorId, page: 1, limit: 100 },
    { enabled: !!vendorId }
  );

  const rows: Row[] = useMemo(() => {
    const all = query.data?.applications ?? [];
    const accepted = all.filter((a) => a.status === "APPROVED"); // accepted only
    return accepted.map((a) => ({
      id: a.id,
      eventName: a.event?.name ?? a.event?.id ?? "",
      startDate: a.event?.startDate,
      boothSize: a.boothSize,
      attendees: a.attendees ?? [],
      status: a.status,
    }));
  }, [query.data]);

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "eventName",
      header: "Bazaar",
      cell: ({ row }) => <span className="font-medium">{row.original.eventName}</span>,
    },
    {
      accessorKey: "startDate",
      header: "Date",
      cell: ({ row }) =>
        row.original.startDate ? new Date(row.original.startDate).toLocaleString() : "—",
    },
    {
      accessorKey: "boothSize",
      header: "Booth",
    },
    {
      accessorKey: "attendees",
      header: "Attendees",
      cell: ({ row }) =>
        row.original.attendees.length ? row.original.attendees.join(", ") : "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge className="bg-emerald-600 hover:bg-emerald-600">{row.original.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Bazaar Applications</h1>
        <Button
          variant="outline"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${query.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {!vendorId ? (
        <Card>
          <CardContent className="py-3 text-sm text-red-600">
            No vendor linked to your account.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader />
          <CardContent>
            <GenericDataTable
              data={rows}
              columns={columns}
              isLoading={query.isLoading}
              emptyStateTitle="No accepted applications"
              emptyStateDescription="You don't have any approved applications yet."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
