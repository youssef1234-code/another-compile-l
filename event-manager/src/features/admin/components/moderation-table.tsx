import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { useDataTable } from "@/hooks/use-data-table";
import type { QueryKeys } from "@/types/data-table";
import { getModerationTableColumns } from "./moderation-table-columns";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

interface FlaggedComment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userEmail: string;
  eventId: string;
  eventName: string;
  eventType?: string;
  createdAt: Date | string;
  moderationStatus: string | null;
  moderationFlags: string[];
  moderationSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  moderationConfidence: number;
  moderationAiSuggestion?: 'approve' | 'remove';
}
import { useQueryState, parseAsBoolean, parseAsString } from "nuqs";
import { Button } from "@/components/ui/button";
import { ListFilter, Search, CheckCircle2, Trash2 } from "lucide-react";

interface ModerationTableProps {
  data: FlaggedComment[];
  pageCount: number;
  queryKeys?: Partial<QueryKeys>;
  isSearching?: boolean;
  onApprove?: (commentId: string) => void;
  onRemove?: (commentId: string) => void;
  onBulkApprove?: (commentIds: string[]) => void;
  onBulkRemove?: (commentIds: string[]) => void;
}

export function ModerationTable({
  data,
  pageCount,
  queryKeys,
  isSearching = false,
  onApprove,
  onRemove,
  onBulkApprove,
  onBulkRemove,
}: ModerationTableProps) {
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

  // Local search state for immediate UI feedback
  const [localSearch, setLocalSearch] = React.useState(search);

  // Debounced search update (500ms)
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setSearch(value || null);
  }, 500);

  // Update local search and trigger debounced URL update
  const handleSearchChange = React.useCallback((value: string | null) => {
    const searchValue = value || '';
    setLocalSearch(searchValue);
    debouncedSetSearch(searchValue);
  }, [debouncedSetSearch]);

  // Sync local search with URL param on mount/change
  React.useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const columns = React.useMemo(
    () =>
      getModerationTableColumns({
        onApprove,
        onRemove,
      }),
    [onApprove, onRemove],
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
      {/* Toggle Buttons & Bulk Actions */}
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

        {/* Bulk Actions */}
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} selected
            </span>
            {onBulkApprove && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                onClick={() => {
                  const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
                  onBulkApprove(selectedIds);
                  table.resetRowSelection();
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve Selected
              </Button>
            )}
            {onBulkRemove && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                onClick={() => {
                  const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
                  onBulkRemove(selectedIds);
                  table.resetRowSelection();
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete & Warn Selected
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
        // Simple mode: Global search bar + faceted filters
        <DataTableToolbar 
          table={table} 
          showColumnFilters={true}
          showGlobalSearch={true}
          globalSearchValue={localSearch}
          onGlobalSearchChange={handleSearchChange}
          globalSearchPlaceholder="Search comments, users, or events..."
          isSearching={isSearching}
        />
      )}
    </DataTable>
  );
}
