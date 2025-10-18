import type { User } from "@event-manager/shared";
import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { useDataTable } from "@/hooks/use-data-table";
import type { QueryKeys } from "@/types/data-table";
import { getUsersTableColumns } from "./users-table-columns.tsx";
import { useQueryState, parseAsBoolean, parseAsString } from "nuqs";
import { Button } from "@/components/ui/button";
import { ListFilter, Search, Filter, FilterX, Download, UserPlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface UsersTableProps {
  data: User[];
  pageCount: number;
  roleCounts?: Record<string, number>;
  statusCounts?: { active: number; blocked: number };
  queryKeys?: Partial<QueryKeys>;
  isSearching?: boolean; // Loading state for search
  showPendingApprovals?: boolean;
  onTogglePendingApprovals?: () => void;
  onExport?: () => void;
  onCreateUser?: () => void;
  exportDisabled?: boolean;
  exportLabel?: string;
  onUpdateUser?: (userId: string, field: string, value: string) => Promise<void>;
  onVerifyRole?: (userId: string) => void;
  onApproveVendor?: (userId: string) => void;
  onRejectVendor?: (userId: string) => void;
  onBlockUser?: (userId: string) => void;
  onUnblockUser?: (userId: string) => void;
  onDeleteUser?: (userId: string) => void;
}

export function UsersTable({
  data,
  pageCount,
  roleCounts = {},
  statusCounts = { active: 0, blocked: 0 },
  queryKeys,
  isSearching = false,
  showPendingApprovals = false,
  onTogglePendingApprovals,
  onExport,
  onCreateUser,
  exportDisabled = false,
  exportLabel = 'Export All',
  onUpdateUser,
  onVerifyRole,
  onApproveVendor,
  onRejectVendor,
  onBlockUser,
  onUnblockUser,
  onDeleteUser,
}: UsersTableProps) {
  // Toggle between advanced and simple filters (default to simple)
  const [enableAdvancedFilter, setEnableAdvancedFilter] = useQueryState(
    'advanced',
    parseAsBoolean.withOptions({
      history: 'replace',
      shallow: false,
    }).withDefault(false) // Default to simple mode
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
      getUsersTableColumns({
        roleCounts,
        statusCounts,
        onUpdateUser,
        onVerifyRole,
        onApproveVendor,
        onRejectVendor,
        onBlockUser,
        onUnblockUser,
        onDeleteUser,
      }),
    [roleCounts, statusCounts, onUpdateUser, onVerifyRole, onApproveVendor, onRejectVendor, onBlockUser, onUnblockUser, onDeleteUser],
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    queryKeys,
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <DataTable table={table}>
      {/* Toggle Buttons */}
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

          {onTogglePendingApprovals && (
            <>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button
                variant={showPendingApprovals ? "default" : "outline"}
                size="sm"
                onClick={onTogglePendingApprovals}
                className="gap-2"
              >
                {showPendingApprovals ? <FilterX className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
                {showPendingApprovals ? 'Show All' : 'Pending Approvals'}
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onExport && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onExport} 
              className="gap-2" 
              disabled={exportDisabled}
            >
              <Download className="h-4 w-4" />
              {exportLabel}
            </Button>
          )}
          {onCreateUser && (
            <Button 
              size="sm"
              onClick={onCreateUser} 
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Create User
            </Button>
          )}
        </div>
      </div>

      {/* Conditional Toolbar Rendering */}
      {enableAdvancedFilter ? (
        // Advanced mode: Complex filters with column -> operator -> value (like the image)
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
        // Simple mode: Global search bar (searches across name & email) + faceted filters (with plus icons)
        <DataTableToolbar 
          table={table} 
          showColumnFilters={true}
          showGlobalSearch={true}
          globalSearchValue={search}
          onGlobalSearchChange={(value) => setSearch(value || null)}
          globalSearchPlaceholder="Search by name or email..."
          isSearching={isSearching}
        />
      )}
    </DataTable>
  );
}
