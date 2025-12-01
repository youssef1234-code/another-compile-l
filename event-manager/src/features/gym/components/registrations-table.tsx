/**
 * Registrations Table Component
 * 
 * Professional data table for court registrations with:
 * - Proper server-side pagination (separate from courts table)
 * - Debounced search
 * - Server-side sorting
 */

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { getRegistrationTableColumns, type Registration } from "./registration-table-columns";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

interface RegistrationsTableProps {
  data: Registration[];
  pageCount?: number;
  isLoading?: boolean;
  // Callback to notify parent of search/sort/page changes
  onQueryChange?: (params: {
    page: number;
    perPage: number;
    search: string;
    sorting: Array<{ id: string; desc: boolean }>;
  }) => void;
}

export function RegistrationsTable({
  data,
  pageCount = 1,
  isLoading = false,
  onQueryChange,
}: RegistrationsTableProps) {
  // Local search state for immediate UI feedback
  const [searchInput, setSearchInput] = React.useState('');
  // The actual search value sent to server (debounced)
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  const columns = React.useMemo(
    () => getRegistrationTableColumns(),
    []
  );

  // Use separate query keys for registrations table to avoid conflict with courts table
  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter: false,
    initialState: {
      sorting: [{ id: "startDate", desc: true }],
      pagination: { pageIndex: 0, pageSize: 50 },
    },
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
    // Use reg- prefixed keys to avoid conflict with courts table
    queryKeys: {
      page: 'regPage',
      perPage: 'regPerPage',
      sort: 'regSort',
      filters: 'regFilters',
      joinOperator: 'regJoinOperator',
    },
    debounceMs: 300,
  });

  // Extract state from table for dependency tracking
  const paginationState = table.getState().pagination;
  const sortingState = table.getState().sorting;

  // Debounced search update
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value);
    // Reset to first page when searching
    table.setPageIndex(0);
  }, 300);

  // Handle search input change
  const handleSearchChange = React.useCallback((value: string) => {
    setSearchInput(value);
    debouncedSetSearch(value);
  }, [debouncedSetSearch]);

  // Notify parent of query changes
  React.useEffect(() => {
    if (onQueryChange) {
      onQueryChange({
        page: paginationState.pageIndex + 1,
        perPage: paginationState.pageSize,
        search: debouncedSearch,
        sorting: sortingState.map(s => ({ id: s.id, desc: s.desc })),
      });
    }
  }, [paginationState.pageIndex, paginationState.pageSize, sortingState, debouncedSearch, onQueryChange]);

  return (
    <DataTable table={table}>
      <DataTableToolbar
        table={table}
        showGlobalSearch
        globalSearchValue={searchInput}
        onGlobalSearchChange={handleSearchChange}
        globalSearchPlaceholder="Search by name, GUC ID..."
        isSearching={isLoading}
        showColumnFilters={false}
      />
    </DataTable>
  );
}
