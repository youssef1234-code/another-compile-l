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
import { getEventsTableColumns } from "./events-table-columns";
import { EventExpandedRow } from "./EventExpandedRow";
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
    <DataTable 
      table={table}
      renderSubComponent={(row) => (
        <EventExpandedRow
          event={row.original}
          onEdit={onEditEvent}
          onArchive={onArchiveEvent}
          onDelete={onDeleteEvent}
          onApproveWorkshop={onApproveWorkshop}
          onRejectWorkshop={onRejectWorkshop}
          onNeedsEdits={onNeedsEdits}
        />
      )}
    >
      {/* Toggle Buttons and Action Buttons */}
      <div className="flex items-center justify-between gap-2 p-1">
        <div className="flex items-center gap-2">
          <Button
            variant={!enableAdvancedFilter ? "default" : "outline"}
            size="sm"
            onClick={() => setEnableAdvancedFilter(false)}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            Simple filters
          </Button>

          <Button
            variant={enableAdvancedFilter ? "default" : "outline"}
            size="sm"
            onClick={() => setEnableAdvancedFilter(true)}
            className="gap-2"
          >
            <ListFilter className="h-4 w-4" />
            Advanced filters
          </Button>
        </div>

        {/* Action Buttons */}
        {(onExport || onCreate) && (
          <div className="flex items-center gap-2">
            {onExport && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const selectedRows = table.getFilteredSelectedRowModel().rows;
                  if (selectedRows.length > 0 && onExportParticipants) {
                    const eventIds = selectedRows.map(row => row.original.id);
                    onExportParticipants(eventIds);
                  } else {
                    onExport();
                  }
                }}
                disabled={exportDisabled}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {table.getFilteredSelectedRowModel().rows.length > 0 && onExportParticipants
                  ? `Export Participants (${table.getFilteredSelectedRowModel().rows.length} events)`
                  : exportLabel}
              </Button>
            )}
            {onCreate && (
              <Button 
                size="sm" 
                onClick={onCreate}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {createLabel}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Conditional Toolbar Rendering */}
      {enableAdvancedFilter ? (
        // Advanced mode: Complex filters with column -> operator -> value
        <DataTableAdvancedToolbar table={table}>
          <DataTableSortList table={table} align="start" />
          <DataTableFilterList
            table={table}
            shallow={shallow}
            debounceMs={debounceMs}
            throttleMs={throttleMs}
            align="start"
          />
        </DataTableAdvancedToolbar>
      ) : (
        // Simple mode: Global search + faceted filters
        <DataTableToolbar 
          table={table} 
          showColumnFilters={true}
          showGlobalSearch={true}
          globalSearchValue={search}
          onGlobalSearchChange={(value) => setSearch(value || null)}
          globalSearchPlaceholder="Search events by title, description, or professor..."
          isSearching={isSearching}
        />
      )}
    </DataTable>
  );
}
