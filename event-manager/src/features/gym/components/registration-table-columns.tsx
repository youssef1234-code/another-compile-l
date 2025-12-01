/**
 * Registration Table Columns
 * 
 * Column definitions for court registrations data table
 */

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { format } from "date-fns";
import { User, IdCard } from "lucide-react";
import type { CourtSport } from "@event-manager/shared";

const SPORTS = [
  { value: "BASKETBALL", label: "Basketball", icon: "🏀" },
  { value: "TENNIS", label: "Tennis", icon: "🎾" },
  { value: "FOOTBALL", label: "Football", icon: "⚽" },
] as const;

export interface Registration {
  id: string;
  courtId: string;
  courtName: string;
  sport: CourtSport;
  location: string;
  studentName: string;
  studentGucId: string;
  startDate: string;
  endDate: string;
  status: string;
}

export function getRegistrationTableColumns(): ColumnDef<Registration>[] {
  return [
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date & Time" />
      ),
      cell: ({ row }) => {
        const startDate = new Date(row.getValue("startDate"));
        const endDate = new Date(row.original.endDate);
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {format(startDate, 'MMM d, yyyy')}
            </span>
            <span className="text-sm text-muted-foreground">
              {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
            </span>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "courtName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Court" />
      ),
      cell: ({ row }) => {
        const sportInfo = SPORTS.find(s => s.value === row.original.sport);
        return (
          <div className="flex items-center gap-2">
            <span>{sportInfo?.icon || '🏟️'}</span>
            <span>{row.getValue("courtName")}</span>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "sport",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sport" />
      ),
      cell: ({ row }) => {
        const sportInfo = SPORTS.find(s => s.value === row.getValue("sport"));
        return (
          <Badge variant="outline">
            {sportInfo?.label || row.getValue("sport")}
          </Badge>
        );
      },
      enableSorting: true,
      enableHiding: true,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
      meta: {
        label: "Sport",
        variant: "multiSelect",
        options: SPORTS.map(s => ({
          label: `${s.icon} ${s.label}`,
          value: s.value,
        })),
      },
    },
    {
      accessorKey: "studentName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Student Name" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.getValue("studentName")}</span>
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
      meta: {
        label: "Student Name",
        placeholder: "Filter by name...",
        variant: "text",
      },
    },
    {
      accessorKey: "studentGucId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="GUC ID" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IdCard className="h-4 w-4 text-muted-foreground" />
          <code className="text-sm bg-muted px-2 py-0.5 rounded">
            {row.getValue("studentGucId")}
          </code>
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
      meta: {
        label: "GUC ID",
        placeholder: "Filter by GUC ID...",
        variant: "text",
      },
    },
  ];
}
