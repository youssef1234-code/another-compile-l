/**
 * Bazaars Table Columns
 * Proper DataTable implementation with filters
 * Requirements #59, #60
 */

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Calendar, MapPin, Clock, ShoppingBag, ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/design-system";
import type { Event } from "@event-manager/shared";
import { cn } from "@/lib/utils";

interface GetBazaarsTableColumnsProps {
  onApply: (bazaar: Event) => void;
  appliedBazaarIds?: string[]; // IDs of bazaars vendor has already applied to
}

export function getBazaarsTableColumns({ onApply, appliedBazaarIds = [] }: GetBazaarsTableColumnsProps): ColumnDef<Event>[] {
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
      id: "expander",
      header: () => null,
      cell: ({ row }) => {
        return row.getCanExpand() ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={row.getToggleExpandedHandler()}
            className="h-8 w-8 p-0"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                row.getIsExpanded() && "rotate-180"
              )}
            />
          </Button>
        ) : null;
      },
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Bazaar Name" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
      enableColumnFilter: true,
      meta: {
        label: "Bazaar Name",
        placeholder: "Filter by name...",
        variant: "text" as const,
      },
      size: 200,
    },
    {
      id: "location",
      accessorKey: "location",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Location" />
      ),
      cell: ({ row }) => {
        const location = row.getValue("location") as string;
        return (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{location || "TBA"}</span>
          </div>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "Location",
        placeholder: "Filter by location...",
        variant: "text" as const,
      },
      size: 180,
    },
    {
      id: "startDate",
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Date" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("startDate") as Date;
        return date ? (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(new Date(date))}</span>
          </div>
        ) : (
          "TBA"
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "Start Date",
        variant: "date" as const,
      },
      size: 180,
    },
    {
      id: "endDate",
      accessorKey: "endDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="End Date" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("endDate") as Date;
        return date ? (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(new Date(date))}</span>
          </div>
        ) : (
          "TBA"
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "End Date",
        variant: "date" as const,
      },
      size: 180,
    },
    {
      id: "registrationDeadline",
      accessorKey: "registrationDeadline",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Registration Deadline" />
      ),
      cell: ({ row }) => {
        const deadline = row.getValue("registrationDeadline") as Date;
        if (!deadline) return <Badge variant="secondary">No deadline</Badge>;

        const isPast = new Date(deadline) < new Date();
        return (
          <Badge
            variant={isPast ? "destructive" : "secondary"}
            className={cn(!isPast && "bg-emerald-100 text-emerald-700 border-emerald-200")}
          >
            {formatDate(new Date(deadline))}
          </Badge>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "Registration Deadline",
        variant: "date" as const,
      },
      size: 200,
    },
    {
      id: "description",
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const desc = row.getValue("description") as string;
        return (
          <div className="max-w-[300px] truncate" title={desc}>
            {desc || "No description"}
          </div>
        );
      },
      enableSorting: false,
      size: 300,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const bazaar = row.original;
        const isPastDeadline = bazaar.registrationDeadline
          ? new Date(bazaar.registrationDeadline) < new Date()
          : false;
        const hasApplied = appliedBazaarIds.includes(bazaar.id);

        if (hasApplied) {
          return (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
              Already Applied
            </Badge>
          );
        }

        return (
          <Button
            size="sm"
            onClick={() => onApply(bazaar)}
            disabled={isPastDeadline}
            className="gap-2"
          >
            <ShoppingBag className="h-4 w-4" />
            Apply
          </Button>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 150,
    },
  ];
}
