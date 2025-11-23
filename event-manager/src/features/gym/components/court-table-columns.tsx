/**
 * Court Table Columns
 * 
 * Column definitions for courts data table with expandable rows
 */

import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2, MapPin, Trophy, Calendar, MoreHorizontal, ChevronDown, ChevronRight } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { CourtSport } from "@event-manager/shared";

interface Court {
  id: string;
  name: string;
  sport: CourtSport;
  location: string;
  description?: string;
  specs?: string;
  customInstructions?: string;
  images: string[];
}

interface GetCourtTableColumnsProps {
  onEdit: (court: Court) => void;
  onDelete: (id: string) => void;
  onViewSchedule: (court: Court) => void;
}

// Sport Badge Component
function SportBadge({ sport }: { sport: CourtSport }) {
  const colors: Record<CourtSport, string> = {
    BASKETBALL: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    TENNIS: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    FOOTBALL: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  };

  return (
    <Badge variant="outline" className={cn("font-medium gap-1.5", colors[sport])}>
      <Trophy className="size-3" />
      {sport}
    </Badge>
  );
}

export function getCourtTableColumns({
  onEdit,
  onDelete,
  onViewSchedule,
}: GetCourtTableColumnsProps): ColumnDef<Court>[] {
  return [
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
        <DataTableColumnHeader column={column} title="Court Name" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <div className="font-medium">{row.getValue("name")}</div>
          </div>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "Court Name",
        variant: "text" as const,
        operators: ["iLike", "eq", "ne", "notILike"],
      },
    },
    {
      id: "sport",
      accessorKey: "sport",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sport" />
      ),
      cell: ({ row }) => {
        const sport = row.getValue("sport") as CourtSport;
        return <SportBadge sport={sport} />;
      },
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id));
      },
      enableColumnFilter: true,
      meta: {
        label: "Sport",
        variant: "multiSelect" as const,
        options: [
          { label: "Basketball", value: "BASKETBALL" },
          { label: "Tennis", value: "TENNIS" },
          { label: "Football", value: "FOOTBALL" },
        ],
      },
    },
    {
      id: "location",
      accessorKey: "location",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Location" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {row.getValue("location")}
          </div>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "Location",
        variant: "text" as const,
        operators: ["iLike", "eq", "ne", "notILike"],
      },
    },
    {
      id: "description",
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string | undefined;
        return description ? (
          <div className="max-w-[300px] truncate text-sm">{description}</div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "Description",
        variant: "text" as const,
        operators: ["iLike", "eq", "ne", "isEmpty", "isNotEmpty"],
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const court = row.original;
        
        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewSchedule(court);
                  }}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(court);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(court.id);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
