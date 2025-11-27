/**
 * Vendor Applications Table
 * 
 * Data table for vendor applications with advanced filters
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
import { getVendorApplicationsTableColumns } from "./vendor-applications-table-columns";
import { VendorApplicationExpandedRow } from "./vendor-application-expanded-row";

interface VendorApplicationsTableProps {
  data: VendorApplication[];
  pageCount?: number;
  statusCounts: Record<string, number>;
  eventTypeCounts: Record<string, number>;
  boothSizeCounts: Record<string, number>;
  isSearching?: boolean;
  onPayVendorFee?: (app: VendorApplication) => void; 
}

export function VendorApplicationsTable({
  data,
  pageCount = 1,
  statusCounts,
  eventTypeCounts,
  boothSizeCounts,
  isSearching = false,
  onPayVendorFee = (app: VendorApplication) => {console.log("Pay vendor fee clicked on", app);}, 
}: VendorApplicationsTableProps) {
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
      getVendorApplicationsTableColumns({
        statusCounts,
        eventTypeCounts,
        boothSizeCounts,
        onPayVendorFee,
      }),
    [statusCounts, eventTypeCounts, boothSizeCounts,onPayVendorFee]
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "startDate", desc: true }],
      columnPinning: { right: [] },
    },
    getRowId: (originalRow) => originalRow.id,
    getRowCanExpand: () => true,
    shallow: false,
    clearOnDefault: true,
    });

  return (
    <DataTable 
      table={table}
      renderSubComponent={(row) => (
        <VendorApplicationExpandedRow application={row.original} />
      )}
    >
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
