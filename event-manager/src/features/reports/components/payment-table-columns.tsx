import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/design-system";
import type { Payment } from "@event-manager/shared";
import type { ColumnDef } from "@tanstack/react-table";
import {
    Calendar,
} from "lucide-react";

// Event Type Badge Component
function EventTypeBadge({ type }: { type: string }) {
    const colors: Record<string, string> = {
        WORKSHOP: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
        TRIP: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
        BAZAAR: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
        CONFERENCE: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
        BOOTH: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    };

    const labels: Record<string, string> = {
        WORKSHOP: "Workshop",
        TRIP: "Trip",
        BAZAAR: "Bazaar",
        CONFERENCE: "Conference",
        BOOTH: "Vendor Reservation",
    };

    return (
        <Badge variant="outline" className={cn("font-medium", colors[type])}>
            {labels[type] || type}
        </Badge>
    );
}
function PaymentPurposeBadge({ type }: { type: string }) {
    const colors: Record<string, string> = {
        EVENT_PAYMENT: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
        VENDOR_FEE: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    };

    const labels: Record<string, string> = {
        EVENT_PAYMENT: "Event Fee",
        VENDOR_FEE: "Vendor Fee",

    };

    return (
        <Badge variant="outline" className={cn("font-medium", colors[type])}>
            {labels[type] || type}
        </Badge>
    );
}


export function getPaymentsTableColumns(): ColumnDef<Payment>[] {

    return [
        {
            id: "userName",
            accessorKey: "userName",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="User Name" />
            ),
            cell: ({ row }) => {
                const payment = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{payment.purpose === "VENDOR_FEE" ? payment.user?.companyName : payment.user?.firstName + " " + payment.user?.lastName}</span>
                    </div>
                );
            },
            enableColumnFilter: true,
            meta: {
                label: "Name",
                placeholder: "Filter user names...",
                variant: "text" as const,
                operators: ["iLike", "eq", "ne", "isEmpty", "isNotEmpty"],
            },
            size: 250,
        },
        {
            id: "eventName",
            accessorKey: "eventName",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Event Name" />
            ),
            cell: ({ row }) => {
                const payment = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{payment.event ? payment.event?.name : "Vendor Reservation"}</span>
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
                <DataTableColumnHeader column={column} title="Event Type" />
            ),
            cell: ({ row }) => {
                const payment = row.original;
                return (
                    <EventTypeBadge type={(payment.event?.type || "BOOTH")} />
                );
            },
            enableColumnFilter: true,
            filterFn: (row, id, value) => {
                return Array.isArray(value) && value.includes(row.getValue(id));
            },
            meta: {
                label: "Event Type",
                variant: "multiSelect" as const,
                options: [],
            },
            size: 130,
        },
        {
            id: "purpose",
            accessorKey: "purpose",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Purpose" />
            ),
            cell: ({ row }) => <PaymentPurposeBadge type={row.getValue("purpose")} />,
            enableColumnFilter: true,
            filterFn: (row, id, value) => {
                return Array.isArray(value) && value.includes(row.getValue(id));
            },
            meta: {
                label: "Purpose",
                variant: "multiSelect" as const,
                options: [],
            },
            size: 130,
        },
        {
            id: "amountMinor",
            accessorKey: "amountMinor",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Amount" />
            ),
            cell: ({ row }) => {
                const amount = row.getValue("amountMinor") as number;
                return (
                    <span className="font-mono text-sm">
                        {amount > 0 ? `${(amount / 100).toLocaleString()} EGP` : "Free"}
                    </span>
                );
            },
            enableColumnFilter: true,
            meta: {
                label: "Amount",
                variant: "range" as const,
                operators: ["gt", "lt", "gte", "lte", "eq"],
            },
            size: 100,
        },
        {
            id: "createdAt",
            accessorKey: "createdAt",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Date of Payment" />
            ),
            cell: ({ row }) => {
                const date = row.getValue("createdAt") as Date;
                return (
                    <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-muted-foreground" />
                        <span>{formatDate(date)}</span>
                    </div>
                );
            },
            enableColumnFilter: true,
            meta: {
                label: "Date of Payment",
                variant: "dateRange" as const,
                operators: ["gt", "lt", "gte", "lte", "isBetween"],
            },
            size: 150,
        },
    ];

}