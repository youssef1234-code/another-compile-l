/**
 * Courts Table Component
 * 
 * Professional data table for courts management
 */

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { useDataTable } from "@/hooks/use-data-table";
import { getCourtTableColumns } from "./court-table-columns";
import { CourtExpandedRow } from "./court-expanded-row";
import { useQueryState, parseAsString, parseAsBoolean } from "nuqs";
import { Button } from "@/components/ui/button";
import { Plus, Search, ListFilter } from "lucide-react";
import type { CourtSport } from "@event-manager/shared";
import type { QueryKeys } from "@/types/data-table";

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

interface CourtsTableProps {
  data: Court[];
  pageCount?: number;
  isLoading?: boolean;
  onEdit: (court: Court) => void;
  onDelete: (id: string) => void;
  onViewSchedule: (court: Court) => void;
  onCreate?: () => void;
  queryKeys?: QueryKeys;
  isSearching?: boolean;
}

export function CourtsTable({
  data,
  pageCount = 1,
  onEdit,
  onDelete,
  onViewSchedule,
  onCreate,
  queryKeys,
  isSearching = false,
}: CourtsTableProps) {
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
      getCourtTableColumns({
        onEdit,
        onDelete,
        onViewSchedule,
      }),
    [onEdit, onDelete, onViewSchedule]
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "name", desc: false }],
      columnPinning: { right: ["actions"] },
    },
    queryKeys,
    getRowId: (originalRow) => originalRow.id,
    getRowCanExpand: () => true,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <DataTable 
      table={table}
      renderSubComponent={(row) => <CourtExpandedRow court={row.original} />}
    >
      {/* Toggle Buttons and Action Button */}
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

        {/* Create Button */}
        {onCreate && (
          <Button size="sm" onClick={onCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Court
          </Button>
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
          globalSearchPlaceholder="Search courts by name or location..."
          isSearching={isSearching}
        />
      )}
    </DataTable>
  );
}
