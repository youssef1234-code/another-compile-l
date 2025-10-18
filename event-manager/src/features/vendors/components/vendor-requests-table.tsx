/**
 * Vendor Requests Table (Admin/Event Office)
 * 
 * Data table for vendor requests with approve/reject actions and advanced filters
 * Follows EventsTable pattern with URL state sync
 */

import type { VendorApplication } from "@event-manager/shared";
import * as React from "react";
import { useQueryState, parseAsBoolean, parseAsString } from "nuqs";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { useDataTable } from "@/hooks/use-data-table";
import { Button } from "@/components/ui/button";
import { ListFilter, Search } from "lucide-react";
import { getVendorRequestsTableColumns } from "./vendor-requests-table-columns";

interface VendorRequestsTableProps {
  data: VendorApplication[];
  pageCount: number;
  statusCounts: Record<string, number>;
  eventTypeCounts: Record<string, number>;
  boothSizeCounts: Record<string, number>;
  onApprove: (applicationId: string) => void;
  onReject: (applicationId: string) => void;
  isSearching?: boolean;
}

export function VendorRequestsTable({
  data,
  pageCount,
  statusCounts,
  eventTypeCounts,
  boothSizeCounts,
  onApprove,
  onReject,
  isSearching = false,
}: VendorRequestsTableProps) {
  // Toggle between advanced and simple filters
  const [enableAdvancedFilter, setEnableAdvancedFilter] = useQueryState(
    'advanced',
    parseAsBoolean.withOptions({
      history: 'replace',
      shallow: false,
    }).withDefault(false)
  );

  // Global search state
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withOptions({
      history: 'replace',
      shallow: false,
    }).withDefault('')
  );

  const columns = React.useMemo(
    () =>
      getVendorRequestsTableColumns({
        statusCounts,
        eventTypeCounts,
        boothSizeCounts,
        onApprove,
        onReject,
      }),
    [statusCounts, eventTypeCounts, boothSizeCounts, onApprove, onReject]
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "startDate", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <DataTable table={table}>
      {/* Toggle Buttons */}
      <div className="flex items-center gap-2 p-1">
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

      {/* Conditional Toolbar */}
      {enableAdvancedFilter ? (
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
        <DataTableToolbar 
          table={table}
          showColumnFilters={true}
          showGlobalSearch={true}
          globalSearchValue={search}
          onGlobalSearchChange={(value) => setSearch(value || null)}
          globalSearchPlaceholder="Search by company or event..."
          isSearching={isSearching}
        />
      )}
    </DataTable>
  );
}
