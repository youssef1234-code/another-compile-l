/**
 * Events Table Component
 * 
 * Professional data table for events management
 * Features:
 * - Advanced/Simple filter toggle
 * - Multi-field sorting
 * - Global search
 * - Faceted filters
 * - Column visibility
 * - Inline editing
 */

import { DataTable } from "@/components/data-table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import type { QueryKeys } from "@/types/data-table";
import type { Event } from "../../../shared";
import * as React from "react";
import { getEventsTableColumns } from "./event-report-columns";

interface EventsTableProps {
    data: Event[];
    pageCount: number;
    typeCounts?: Record<string, number>;
    statusCounts?: Record<string, number>;
    userRole?: string;
    queryKeys?: Partial<QueryKeys>;
    isSearching?: boolean;
    onUpdateEvent?: (eventId: string, field: string, value: string) => Promise<void>;
    onViewDetails?: (eventId: string) => void;
    onEditEvent?: (eventId: string) => void;
    onArchiveEvent?: (eventId: string) => void;
    onDeleteEvent?: (eventId: string) => void;
    onPublishEvent?: (eventId: string) => void;
    onApproveWorkshop?: (eventId: string) => void;
    onRejectWorkshop?: (eventId: string) => void;
    onNeedsEdits?: (eventId: string) => void;
    // Action buttons for toolbar
    onExport?: () => void;
    onExportParticipants?: (eventIds: string[]) => void;
    onCreate?: () => void;
    exportDisabled?: boolean;
    exportLabel?: string;
    createLabel?: string;
}

export function EventsReportsTable({
    data,
    pageCount,
    typeCounts = {},
    statusCounts = {},
    userRole,
    queryKeys,
}: EventsTableProps) {



    const columns = React.useMemo(
        () =>
            getEventsTableColumns({
                typeCounts,
                statusCounts,
                userRole,

            }),
        [typeCounts, statusCounts, userRole],
    );

    const { table } = useDataTable({
        data,
        columns,
        pageCount,
        initialState: {
            sorting: [{ id: "startDate", desc: true }], // Upcoming events first
            columnPinning: { right: ["actions"] },
        },
        queryKeys,
        getRowId: (originalRow) => originalRow.id,
        shallow: false,
        clearOnDefault: true,
    });

    return (
        <DataTable table={table} />

    );
}
