/**
 * Events Table Columns
 * 
 * Column definitions for the events data table
 * Follows AdminUsersPage pattern with inline editing, filters, sorting
 */

import type { Event } from "@event-manager/shared";
import type { ColumnDef } from "@tanstack/react-table";
import { 
  Calendar, 
  MapPin, 
  Users, 
  MoreHorizontal, 
  Trash2, 
  Eye,
  Edit,
  Archive,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { InlineEditCell } from "@/components/generic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/design-system";
import { cn } from "@/lib/utils";

interface GetEventsTableColumnsProps {
  typeCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  onUpdateEvent?: (eventId: string, field: string, value: string) => Promise<void>;
  onViewDetails?: (eventId: string) => void;
  onEditEvent?: (eventId: string) => void;
  onArchiveEvent?: (eventId: string) => void;
  onDeleteEvent?: (eventId: string) => void;
}

// Event Type Badge Component
function EventTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    WORKSHOP: "bg-purple-100 text-purple-700 border-purple-200",
    TRIP: "bg-blue-100 text-blue-700 border-blue-200",
    BAZAAR: "bg-amber-100 text-amber-700 border-amber-200",
    CONFERENCE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    BOOTH: "bg-pink-100 text-pink-700 border-pink-200",
    GYM_SESSION: "bg-orange-100 text-orange-700 border-orange-200",
  };

  const labels: Record<string, string> = {
    WORKSHOP: "Workshop",
    TRIP: "Trip",
    BAZAAR: "Bazaar",
    CONFERENCE: "Conference",
    BOOTH: "Booth",
    GYM_SESSION: "Gym Session",
  };

  return (
    <Badge variant="outline" className={cn("font-medium", colors[type])}>
      {labels[type] || type}
    </Badge>
  );
}

// Event Status Badge Component
function EventStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PUBLISHED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    APPROVED: "bg-green-100 text-green-700 border-green-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
    NEEDS_EDITS: "bg-orange-100 text-orange-700 border-orange-200",
    CANCELLED: "bg-red-100 text-red-700 border-red-200",
  };

  const labels: Record<string, string> = {
    PUBLISHED: "Published",
    DRAFT: "Draft",
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    NEEDS_EDITS: "Needs Edits",
    CANCELLED: "Cancelled",
  };

  return (
    <Badge variant="outline" className={cn("font-medium", colors[status])}>
      {labels[status] || status}
    </Badge>
  );
}

export function getEventsTableColumns({
  typeCounts,
  statusCounts,
  onUpdateEvent,
  onViewDetails,
  onEditEvent,
  onArchiveEvent,
  onDeleteEvent,
}: GetEventsTableColumnsProps): ColumnDef<Event>[] {
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
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      id: "expand",
      header: () => null,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => row.toggleExpanded()}
          className="p-0 h-8 w-8"
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Event Name" />
      ),
      cell: ({ row }) => {
        const event = row.original;
        return onUpdateEvent ? (
          <InlineEditCell
            value={event.name}
            onSave={(newValue) => onUpdateEvent(event.id, 'name', newValue)}
            validate={(value) => {
              if (value.length < 3) return 'Name too short';
              return null;
            }}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="font-medium">{event.name}</span>
          </div>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "Name",
        placeholder: "Filter event names...",
        variant: "text" as const,
        operators: ["iLike", "eq", "ne", "isEmpty", "isNotEmpty"],
      },
      size: 250,
    },
    {
      id: "type",
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => <EventTypeBadge type={row.getValue("type")} />,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id));
      },
      meta: {
        label: "Type",
        variant: "multiSelect" as const,
        options: [
          { label: "Workshop", value: "WORKSHOP", count: typeCounts.WORKSHOP },
          { label: "Trip", value: "TRIP", count: typeCounts.TRIP },
          { label: "Bazaar", value: "BAZAAR", count: typeCounts.BAZAAR },
          { label: "Conference", value: "CONFERENCE", count: typeCounts.CONFERENCE },
          { label: "Booth", value: "BOOTH", count: typeCounts.BOOTH },
          { label: "Gym Session", value: "GYM_SESSION", count: typeCounts.GYM_SESSION },
        ],
      },
      size: 130,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <EventStatusBadge status={row.getValue("status")} />,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id));
      },
      meta: {
        label: "Status",
        variant: "multiSelect" as const,
        options: [
          { label: "Published", value: "PUBLISHED", count: statusCounts.PUBLISHED, icon: CheckCircle2 },
          { label: "Draft", value: "DRAFT", count: statusCounts.DRAFT, icon: Clock },
          { label: "Pending", value: "PENDING", count: statusCounts.PENDING, icon: Clock },
          { label: "Approved", value: "APPROVED", count: statusCounts.APPROVED, icon: CheckCircle2 },
          { label: "Rejected", value: "REJECTED", count: statusCounts.REJECTED, icon: XCircle },
          { label: "Needs Edits", value: "NEEDS_EDITS", count: statusCounts.NEEDS_EDITS, icon: Edit },
        ],
      },
      size: 130,
    },
    {
      id: "startDate",
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Date" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("startDate") as Date;
        return (
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span>{formatDate(date)}</span>
          </div>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "Start Date",
        variant: "dateRange" as const,
        operators: ["gt", "lt", "gte", "lte", "isBetween"],
      },
      size: 150,
    },
    {
      id: "locationDetails",
      accessorKey: "locationDetails",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Location" />
      ),
      cell: ({ row }) => {
        const location = row.getValue("locationDetails") as string;
        return (
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            <span className="truncate max-w-[150px]">{location || 'N/A'}</span>
          </div>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "Location",
        placeholder: "Filter locations...",
        variant: "text" as const,
        operators: ["iLike", "eq", "ne"],
      },
      size: 180,
    },
    {
      id: "professorName",
      accessorKey: "professorName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Professor" />
      ),
      cell: ({ row }) => {
        const event = row.original;
        // Only show for workshops
        if (event.type !== 'WORKSHOP') return <span className="text-muted-foreground">-</span>;
        const professorName = row.getValue("professorName") as string;
        return (
          <span className="text-sm">{professorName || '-'}</span>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "Professor Name",
        placeholder: "Filter by professor...",
        variant: "text" as const,
        operators: ["iLike", "eq", "ne"],
      },
      size: 150,
    },
    {
      id: "faculty",
      accessorKey: "faculty",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Faculty" />
      ),
      cell: ({ row }) => {
        const event = row.original;
        // Only show for workshops
        if (event.type !== 'WORKSHOP') return <span className="text-muted-foreground">-</span>;
        const faculty = row.getValue("faculty") as string;
        return faculty ? (
          <Badge variant="outline" className="font-mono text-xs">
            {faculty}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
      filterFn: (row, id, value) => {
        // Custom filter to exclude null/undefined/empty values
        const event = row.original;
        const faculty = row.getValue(id) as string | undefined;
        
        // If no filter is selected, show all
        if (!value || value.length === 0) return true;
        
        // Only show workshops when filtering by faculty
        if (event.type !== 'WORKSHOP') return false;
        
        // Only include rows that have a non-empty faculty value AND it matches the filter
        return faculty && faculty.trim() !== '' ? value.includes(faculty) : false;
      },
      enableColumnFilter: true,
      meta: {
        label: "Faculty",
        variant: "multiSelect" as const,
        options: [
          { label: "MET", value: "MET" },
          { label: "IET", value: "IET" },
          { label: "ARTS", value: "ARTS" },
          { label: "LAW", value: "LAW" },
          { label: "PHARMACY", value: "PHARMACY" },
          { label: "BUSINESS", value: "BUSINESS" },
          { label: "BIOTECHNOLOGY", value: "BIOTECHNOLOGY" },
        ],
      },
      size: 120,
    },
    {
      id: "capacity",
      accessorKey: "capacity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Capacity" />
      ),
      cell: ({ row }) => {
        const capacity = row.getValue("capacity") as number;
        const registeredCount = row.original.registeredCount || 0;
        const percentFull = capacity > 0 ? (registeredCount / capacity) * 100 : 0;

        return (
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <span className="font-mono text-sm">
              {registeredCount} / {capacity}
            </span>
            {percentFull >= 90 && (
              <Badge variant="destructive" className="text-xs">
                Full
              </Badge>
            )}
          </div>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "Capacity",
        variant: "range" as const,
        operators: ["gt", "lt", "gte", "lte", "isBetween"],
      },
      size: 150,
    },
    {
      id: "registeredCount",
      accessorKey: "registeredCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Registrations" />
      ),
      cell: ({ row }) => {
        const count = row.getValue("registeredCount") as number;
        return (
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <span className="font-mono text-sm">{count || 0}</span>
          </div>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "Registrations",
        variant: "range" as const,
        operators: ["gt", "lt", "gte", "lte", "eq", "ne"],
      },
      size: 130,
    },
    {
      id: "price",
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price" />
      ),
      cell: ({ row }) => {
        const price = row.getValue("price") as number;
        return (
          <span className="font-mono text-sm">
            {price > 0 ? `${price} EGP` : "Free"}
          </span>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "Price",
        variant: "range" as const,
        operators: ["gt", "lt", "gte", "lte", "eq"],
      },
      size: 100,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return <span className="text-sm text-muted-foreground">{formatDate(date)}</span>;
      },
      enableColumnFilter: true,
      meta: {
        label: "Created Date",
        variant: "dateRange" as const,
        operators: ["gt", "lt", "gte", "lte", "isBetween"],
      },
      size: 130,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const event = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {onViewDetails && (
                <DropdownMenuItem onClick={() => onViewDetails(event.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}
              {onEditEvent && (
                <DropdownMenuItem onClick={() => onEditEvent(event.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Event
                </DropdownMenuItem>
              )}
              {onArchiveEvent && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onArchiveEvent(event.id)}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                </>
              )}
              {onDeleteEvent && (
                <DropdownMenuItem
                  onClick={() => onDeleteEvent(event.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 60,
    },
  ];
}
