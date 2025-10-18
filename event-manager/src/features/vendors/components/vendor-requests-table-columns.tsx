/**
 * Vendor Requests Table Columns (Admin/Event Office)
 * 
 * Column definitions for vendor requests management with approve/reject actions
 * Follows EventsTable pattern with filters, sorting, and action buttons
 */

import type { VendorApplication } from "@event-manager/shared";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { 
  Calendar, 
  Users, 
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/design-system";
import { cn } from "@/lib/utils";

interface GetVendorRequestsTableColumnsProps {
  statusCounts: Record<string, number>;
  eventTypeCounts: Record<string, number>;
  boothSizeCounts: Record<string, number>;
  onApprove: (applicationId: string) => void;
  onReject: (applicationId: string) => void;
}

// ✅ Memoized Actions Component to prevent re-renders
const VendorRequestActions = React.memo(({ 
  applicationId, 
  status, 
  onApprove, 
  onReject 
}: { 
  applicationId: string; 
  status: string; 
  onApprove: (id: string) => void; 
  onReject: (id: string) => void; 
}) => {
  const isPending = status === 'PENDING';
  
  const handleApprove = React.useCallback(() => {
    onApprove(applicationId);
  }, [applicationId, onApprove]);
  
  const handleReject = React.useCallback(() => {
    onReject(applicationId);
  }, [applicationId, onReject]);
  
  if (!isPending) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }
  
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
        onClick={handleApprove}
      >
        <CheckCircle2 className="size-4 mr-1" />
        Approve
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={handleReject}
      >
        <XCircle className="size-4 mr-1" />
        Reject
      </Button>
    </div>
  );
});

VendorRequestActions.displayName = 'VendorRequestActions';

// Application Status Badge Component
function ApplicationStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
  };

  const labels: Record<string, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };

  const icons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="size-3" />,
    APPROVED: <CheckCircle2 className="size-3" />,
    REJECTED: <XCircle className="size-3" />,
  };

  return (
    <Badge variant="outline" className={cn("font-medium gap-1.5", colors[status])}>
      {icons[status]}
      {labels[status] || status}
    </Badge>
  );
}

// Event Type Badge Component
function EventTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    BAZAAR: "bg-orange-100 text-orange-700 border-orange-200",
    PLATFORM: "bg-purple-100 text-purple-700 border-purple-200",
  };

  const labels: Record<string, string> = {
    BAZAAR: "Bazaar",
    PLATFORM: "Platform Booth",
  };

  return (
    <Badge variant="outline" className={cn("font-medium", colors[type])}>
      {labels[type] || type}
    </Badge>
  );
}

export function getVendorRequestsTableColumns({
  statusCounts,
  eventTypeCounts,
  boothSizeCounts,
  onApprove,
  onReject,
}: GetVendorRequestsTableColumnsProps): ColumnDef<VendorApplication>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      id: "companyName",
      accessorKey: "companyName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Company" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <span className="font-medium">{row.getValue("companyName")}</span>
          </div>
        );
      },
      enableSorting: true, // ✅ Enable sorting
      enableColumnFilter: true,
      meta: {
        label: "Company Name",
        placeholder: "Filter by company...",
        variant: "text" as const,
      },
      size: 200,
    },
    {
      id: "eventName",
      accessorKey: "event.name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Event" />
      ),
      cell: ({ row }) => {
        const application = row.original;
        const eventName = application.type === 'BAZAAR' 
          ? (application.bazaarName || 'Bazaar')
          : 'Platform Booth';
        return (
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="font-medium">{eventName}</span>
          </div>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "Event Name",
        placeholder: "Filter by event...",
        variant: "text" as const,
      },
      size: 200,
    },
    {
      id: "type", // ✅ Changed from "eventType" to match URL parameter
      accessorFn: (row) => row.type,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.original.type;
        return type ? <EventTypeBadge type={type} /> : <span className="text-sm text-muted-foreground">-</span>;
      },
      enableColumnFilter: true,
      filterFn: (row, _id, value) => {
        return Array.isArray(value) && value.includes(row.original.type);
      },
      meta: {
        label: "Event Type",
        variant: "multiSelect" as const,
        options: [
          { label: "Bazaar", value: "BAZAAR", count: eventTypeCounts.BAZAAR || 0 },
          { label: "Platform Booth", value: "PLATFORM", count: eventTypeCounts.PLATFORM || 0 },
        ],
      },
      size: 150,
    },
    {
      id: "boothLocation",
      accessorKey: "boothLabel",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Booth #" />
      ),
      cell: ({ row }) => {
        const application = row.original;
        if (application.type === 'PLATFORM' && application.boothLabel) {
          return (
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              <span className="font-semibold">{application.boothLabel}</span>
            </div>
          );
        }
        return <span className="text-muted-foreground text-sm">N/A</span>;
      },
      enableColumnFilter: false,
      size: 120,
    },
    {
      id: "duration",
      accessorKey: "duration",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Duration" />
      ),
      cell: ({ row }) => {
        const application = row.original;
        if (application.type === 'PLATFORM' && application.duration) {
          return (
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <span>{application.duration} week{application.duration > 1 ? 's' : ''}</span>
            </div>
          );
        }
        return <span className="text-muted-foreground text-sm">N/A</span>;
      },
      enableSorting: true,
      enableColumnFilter: false,
      size: 120,
    },
    {
      id: "boothSize",
      accessorFn: (row) => row.boothSize,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Booth Size" />
      ),
      cell: ({ row }) => {
        const size = row.original.boothSize;
        return (
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <span>{size || 'N/A'}</span>
          </div>
        );
      },
      enableColumnFilter: true,
      filterFn: (row, _id, value) => {
        return Array.isArray(value) && value.includes(row.original.boothSize);
      },
      meta: {
        label: "Booth Size",
        variant: "multiSelect" as const,
        options: [
          { label: "2x2", value: "TWO_BY_TWO", count: boothSizeCounts.TWO_BY_TWO || 0 },
          { label: "4x4", value: "FOUR_BY_FOUR", count: boothSizeCounts.FOUR_BY_FOUR || 0 },
        ],
      },
      size: 130,
    },
    {
      id: "attendees",
      accessorFn: (row) => row.names?.length || 0,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Attendees" />
      ),
      cell: ({ row }) => {
        const names = row.original.names || [];
        return (
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <span>{names.length} / 5</span>
          </div>
        );
      },
      enableSorting: false,
      size: 120,
    },
    {
      id: "status",
      accessorFn: (row) => row.status,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        return <ApplicationStatusBadge status={row.original.status} />;
      },
      enableSorting: true, // ✅ Enable sorting
      enableColumnFilter: true,
      filterFn: (row, _id, value) => {
        return Array.isArray(value) && value.includes(row.original.status);
      },
      meta: {
        label: "Status",
        variant: "multiSelect" as const,
        options: [
          { label: "Pending", value: "PENDING", count: statusCounts.PENDING || 0 },
          { label: "Approved", value: "APPROVED", count: statusCounts.APPROVED || 0 },
          { label: "Rejected", value: "REJECTED", count: statusCounts.REJECTED || 0 },
        ],
      },
      size: 130,
    },
    {
      id: "startDate", // ✅ Changed from "submittedAt" to match backend field
      accessorFn: (row) => row.startDate,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Date" />
      ),
      cell: ({ row }) => {
        const date = row.original.startDate;
        return date ? formatDate(new Date(date)) : 'N/A';
      },
      enableSorting: true, // ✅ Enable sorting
      enableColumnFilter: true,
      meta: {
        label: "Start Date",
        variant: "date" as const,
      },
      size: 150,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <VendorRequestActions
          applicationId={row.original.id}
          status={row.original.status}
          onApprove={onApprove}
          onReject={onReject}
        />
      ),
      enableSorting: false,
      size: 200,
    },
  ];
}
