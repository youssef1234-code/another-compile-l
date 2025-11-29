/**
 * Events Table Columns
 * 
 * Column definitions for the events data table
 * Follows AdminUsersPage pattern with inline editing, filters, sorting
 */

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import type { Event } from "@event-manager/shared";
import { UserRole } from "@event-manager/shared";
import type { ColumnDef } from "@tanstack/react-table";
import {
    Calendar,
    MapPin,
    Users
} from "lucide-react";

interface GetEventsTableColumnsProps {
    typeCounts: Record<string, number>;
    statusCounts: Record<string, number>;
    userRole?: string;
    onUpdateEvent?: (eventId: string, field: string, value: string) => Promise<void>;
    onViewDetails?: (eventId: string) => void;
    onEditEvent?: (eventId: string) => void;
    onArchiveEvent?: (eventId: string) => void;
    onDeleteEvent?: (eventId: string) => void;
    onPublishEvent?: (eventId: string) => void;
    onApproveWorkshop?: (eventId: string) => void;
    onRejectWorkshop?: (eventId: string) => void;
    onNeedsEdits?: (eventId: string) => void;
}

// Event Type Badge Component
function EventTypeBadge({ type }: { type: string }) {
    const colors: Record<string, string> = {
        WORKSHOP: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
        TRIP: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
        BAZAAR: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
        CONFERENCE: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
        BOOTH: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
        GYM_SESSION: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
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


export function getEventsTableColumns({
    typeCounts,
    userRole,
}: GetEventsTableColumnsProps): ColumnDef<Event>[] {
    // Define all type options
    const allTypeOptions = [
        { label: "Workshop", value: "WORKSHOP", count: typeCounts.WORKSHOP },
        { label: "Trip", value: "TRIP", count: typeCounts.TRIP },
        { label: "Bazaar", value: "BAZAAR", count: typeCounts.BAZAAR },
        { label: "Conference", value: "CONFERENCE", count: typeCounts.CONFERENCE },
        { label: "Booth", value: "BOOTH", count: typeCounts.BOOTH },
        { label: "Gym Session", value: "GYM_SESSION", count: typeCounts.GYM_SESSION },
    ];

    // Filter type options based on user role
    const typeOptions = allTypeOptions.filter((option) => {
        if (userRole === UserRole.PROFESSOR) {
            // Professors can only create/see workshops
            return option.value === "WORKSHOP";
        } else if (userRole === UserRole.EVENT_OFFICE || userRole === UserRole.ADMIN) {
            // Manage Events page: hide Gym Sessions for Admin/Event Office
            return option.value !== 'GYM_SESSION';
        }
        // Default: show all types
        return true;
    });

    return [
        {
            id: "name",
            accessorKey: "name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Event Name" />
            ),
            cell: ({ row }) => {
                const event = row.original;
                return (
                    <div className="flex items-center gap-2">
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
                options: typeOptions,
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
            id: "endDate",
            accessorKey: "endDate",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="End Date" />
            ),
            cell: ({ row }) => {
                const date = row.getValue("endDate") as Date;
                return (
                    <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground" />
                        <span>{formatDate(date)}</span>
                    </div>
                );
            },
            enableColumnFilter: true,
            meta: {
                label: "End Date",
                variant: "dateRange" as const,
                operators: ["gt", "lt", "gte", "lte", "isBetween"],
            },
            size: 150,
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
                        <MapPin className="size-4 text-muted-foreground" />
                        <span className="truncate ">{location || 'N/A'}</span>
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
            size: 130,
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
            size: 130,
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
                        {price > 0 ? `${price.toLocaleString()} EGP` : "Free"}
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
            id: "totalSales",
            accessorKey: "totalSales",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Total Sales" />
            ),
            cell: ({ row }) => {
                const totalSales = row.getValue("totalSales") as number;
                return (
                    <span className="font-mono text-sm">
                        {totalSales > 0 ? `${totalSales.toLocaleString()} EGP` : "0 EGP"}
                    </span>
                );
            },
            enableColumnFilter: true,
            meta: {
                label: "Total Sales",
                variant: "range" as const,
                operators: ["gt", "lt", "gte", "lte", "eq"],
            },
            size: 130,

        },
    ];
}
