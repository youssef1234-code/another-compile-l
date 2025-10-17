/**
 * Gym Schedule Table Columns
 * 
 * Column definitions for the gym schedule data table
 * Follows the events table pattern with inline editing, filters, sorting
 */

import type { Event } from "@event-manager/shared";
import type { ColumnDef } from "@tanstack/react-table";
import { 
  Calendar, 
  Clock, 
  Users, 
  MoreHorizontal, 
  Trash2, 
  Edit,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
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
import { cn } from "@/lib/utils";

interface GetGymScheduleTableColumnsProps {
  typeCounts?: Record<string, number>;
  statusCounts?: Record<string, number>;
  onEditSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

// Gym Type Badge Component
function GymTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    YOGA: "bg-purple-100 text-purple-700 border-purple-200",
    PILATES: "bg-pink-100 text-pink-700 border-pink-200",
    AEROBICS: "bg-orange-100 text-orange-700 border-orange-200",
    ZUMBA: "bg-yellow-100 text-yellow-700 border-yellow-200",
    CROSS_CIRCUIT: "bg-red-100 text-red-700 border-red-200",
    KICK_BOXING: "bg-rose-100 text-rose-700 border-rose-200",
    CROSSFIT: "bg-amber-100 text-amber-700 border-amber-200",
    CARDIO: "bg-blue-100 text-blue-700 border-blue-200",
    STRENGTH: "bg-slate-100 text-slate-700 border-slate-200",
    DANCE: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
    MARTIAL_ARTS: "bg-gray-100 text-gray-700 border-gray-200",
    OTHER: "bg-neutral-100 text-neutral-700 border-neutral-200",
  };

  const labels: Record<string, string> = {
    YOGA: "Yoga",
    PILATES: "Pilates",
    AEROBICS: "Aerobics",
    ZUMBA: "Zumba",
    CROSS_CIRCUIT: "Cross Circuit",
    KICK_BOXING: "Kick-Boxing",
    CROSSFIT: "CrossFit",
    CARDIO: "Cardio",
    STRENGTH: "Strength",
    DANCE: "Dance",
    MARTIAL_ARTS: "Martial Arts",
    OTHER: "Other",
  };

  return (
    <Badge variant="outline" className={cn("font-medium", colors[type])}>
      {labels[type] || type.replace(/_/g, " ")}
    </Badge>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PUBLISHED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-red-100 text-red-700 border-red-200",
    ACTIVE: "bg-green-100 text-green-700 border-green-200",
  };

  const labels: Record<string, string> = {
    PUBLISHED: "Published",
    CANCELLED: "Cancelled",
    ACTIVE: "Active",
  };

  return (
    <Badge variant="outline" className={cn("font-medium", colors[status] || "")}>
      {labels[status] || status}
    </Badge>
  );
}

export function getGymScheduleTableColumns({
  typeCounts = {},
  statusCounts = {},
  onEditSession,
  onDeleteSession,
}: GetGymScheduleTableColumnsProps): ColumnDef<Event>[] {
  const GYM_TYPES = [
    "YOGA", "PILATES", "AEROBICS", "ZUMBA", "CROSS_CIRCUIT", "KICK_BOXING",
    "CROSSFIT", "CARDIO", "STRENGTH", "DANCE", "MARTIAL_ARTS", "OTHER"
  ];

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
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Session Name" />
      ),
      cell: ({ row }) => {
        const name = row.getValue("name") as string || "Unnamed Session";
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{name}</span>
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: false,
      size: 200,
    },
    {
      id: "startDate",
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("startDate"));
        return (
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="whitespace-nowrap">
              {date.toLocaleDateString()}
            </span>
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: false,
      size: 150,
    },
    {
      id: "time",
      accessorFn: (row) => row.startDate,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Time" />
      ),
      cell: ({ row }) => {
        const start = row.original.startDate ? new Date(row.original.startDate) : new Date();
        const end = row.original.endDate ? new Date(row.original.endDate) : new Date();
        const startTime = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
        const endTime = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
        return (
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <span className="whitespace-nowrap">{startTime}–{endTime}</span>
          </div>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
      size: 130,
    },
    {
      id: "sessionType",
      accessorKey: "sessionType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.getValue("sessionType") || "OTHER";
        return <GymTypeBadge type={type as string} />;
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id));
      },
      meta: {
        label: "Type",
        variant: "multiSelect" as const,
        options: GYM_TYPES.map(type => ({
          label: type.replace(/_/g, " "),
          value: type,
          count: typeCounts[type] || 0,
        })),
      },
      size: 150,
    },
    {
      id: "duration",
      accessorKey: "duration",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Duration" />
      ),
      cell: ({ row }) => {
        const duration = (row.getValue("duration") as number) || 0;
        return <span>{duration} min</span>;
      },
      enableSorting: true,
      enableColumnFilter: false,
      size: 100,
    },
    {
      id: "capacity",
      accessorKey: "capacity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Capacity" />
      ),
      cell: ({ row }) => {
        const capacity = (row.getValue("capacity") as number) || 0;
        return (
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <span>{capacity > 0 ? capacity : "-"}</span>
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: false,
      size: 100,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") || "PUBLISHED";
        return <StatusBadge status={status as string} />;
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id));
      },
      meta: {
        label: "Status",
        variant: "multiSelect" as const,
        options: [
          { label: "Published", value: "PUBLISHED", count: statusCounts.PUBLISHED || 0, icon: CheckCircle2 },
          { label: "Cancelled", value: "CANCELLED", count: statusCounts.CANCELLED || 0, icon: XCircle },
        ],
      },
      size: 120,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const session = row.original;

        return (
          <div className="flex items-center justify-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Open menu"
                  variant="ghost"
                  className="flex size-8 p-0 data-[state=open]:bg-muted"
                >
                  <MoreHorizontal className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onEditSession && (
                  <DropdownMenuItem onClick={() => onEditSession(session.id)}>
                    <Edit className="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onEditSession && onDeleteSession && <DropdownMenuSeparator />}
                {onDeleteSession && (
                  <DropdownMenuItem
                    onClick={() => onDeleteSession(session.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      size: 60,
    },
  ];
}
