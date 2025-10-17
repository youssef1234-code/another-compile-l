/**
 * Gym Schedule Table Component
 * 
 * Professional data table for gym schedule management
 * Features:
 * - Advanced/Simple filter toggle
 * - Multi-field sorting
 * - Global search
 * - Faceted filters
 * - Column visibility
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
import { getGymScheduleTableColumns } from "./gym-schedule-table-columns";
import { useQueryState, parseAsBoolean, parseAsString } from "nuqs";
import { Button } from "@/components/ui/button";
import { ListFilter, Search } from "lucide-react";

interface GymScheduleTableProps {
  data: Event[];
  pageCount: number;
  typeCounts?: Record<string, number>;
  statusCounts?: Record<string, number>;
  queryKeys?: Partial<QueryKeys>;
  isSearching?: boolean;
  onEditSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

export function GymScheduleTable({
  data,
  pageCount,
  typeCounts = {},
  statusCounts = {},
  queryKeys,
  isSearching = false,
  onEditSession,
  onDeleteSession,
}: GymScheduleTableProps) {
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
      getGymScheduleTableColumns({
        typeCounts,
        statusCounts,
        onEditSession,
        onDeleteSession,
      }),
    [typeCounts, statusCounts, onEditSession, onDeleteSession],
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "startDate", desc: false }], // Upcoming sessions first
      columnPinning: { right: ["actions"] },
    },
    queryKeys,
  });

  return (
    <DataTable 
      table={table}
    >
      {enableAdvancedFilter ? (
        <>
          <DataTableAdvancedToolbar table={table}>
            <DataTableSortList table={table} align="start" />
            <DataTableFilterList
              table={table}
              shallow={shallow}
              debounceMs={debounceMs}
              throttleMs={throttleMs}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEnableAdvancedFilter(false)}
              className="ml-auto h-8"
            >
              <Search className="mr-2 h-4 w-4" />
              Simple Search
            </Button>
          </DataTableAdvancedToolbar>
        </>
      ) : (
        <DataTableToolbar 
          table={table}
          showGlobalSearch={true}
          globalSearchValue={search}
          onGlobalSearchChange={setSearch}
          globalSearchPlaceholder="Search gym sessions..."
          isSearching={isSearching}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEnableAdvancedFilter(true)}
            className="ml-auto h-8"
          >
            <ListFilter className="mr-2 h-4 w-4" />
            Advanced Filters
          </Button>
        </DataTableToolbar>
      )}
    </DataTable>
  );
}
