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

import type { Event } from "@event-manager/shared";
import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { useDataTable } from "@/hooks/use-data-table";
import type { QueryKeys } from "@/types/data-table";
import { getEventsTableColumns } from "./event-report-columns";
import { useQueryState, parseAsBoolean, parseAsString } from "nuqs";
import { Button } from "@/components/ui/button";
import { ListFilter, Search, Download, Plus } from "lucide-react";

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

export function EventsTable({
    data,
    pageCount,
    typeCounts = {},
    statusCounts = {},
    userRole,
    queryKeys,
    isSearching = false,
    onUpdateEvent,
    onViewDetails,
    onEditEvent,
    onArchiveEvent,
    onDeleteEvent,
    onPublishEvent,
    onApproveWorkshop,
    onRejectWorkshop,
    onNeedsEdits,
    onExport,
    onExportParticipants,
    onCreate,
    exportDisabled,
    exportLabel = 'Export All',
    createLabel = 'Create Event',
}: EventsTableProps) {
    // Toggle between advanced and simple filters (default to simple)
    const [enableAdvancedFilter, setEnableAdvancedFilter] = useQueryState(
        'advanced',
        parseAsBoolean.withOptions({
            history: 'replace',
            shallow: false,
        }).withDefault(false)
    );

    // Global search state (for simple mode)
    const [search, setSearch] = useQueryState(
        'search',
        parseAsString.withOptions({
            history: 'replace',
            shallow: false,
        }).withDefault('')
    );

    const columns = React.useMemo(
        () =>
            getEventsTableColumns({
                typeCounts,
                statusCounts,
                userRole,
                onUpdateEvent,
                onViewDetails,
                onEditEvent,
                onArchiveEvent,
                onDeleteEvent,
                onPublishEvent,
                onApproveWorkshop,
                onRejectWorkshop,
                onNeedsEdits,
            }),
        [typeCounts, statusCounts, userRole, onUpdateEvent, onViewDetails, onEditEvent, onArchiveEvent, onDeleteEvent, onPublishEvent, onApproveWorkshop, onRejectWorkshop, onNeedsEdits],
    );

    const { table, shallow, debounceMs, throttleMs } = useDataTable({
        data,
        columns,
        pageCount,
        enableAdvancedFilter,
        initialState: {
            sorting: [{ id: "startDate", desc: false }], // Upcoming events first
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
