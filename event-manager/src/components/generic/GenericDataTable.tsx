/**
 * Generic Data Table Component
 * 
 * Fully featured data table with TanStack Table v8 best practices
 * Features:
 * - ✅ Sorting (client-side & server-side)
 * - ✅ Filtering (column filters & global search)
 * - ✅ Pagination (client-side & server-side)
 * - ✅ Column visibility
 * - ✅ Row selection
 * - ✅ Custom filters
 * - ✅ Loading states
 * - ✅ Empty states
 * - ✅ Animations
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  PaginationState,
  OnChangeFn,
} from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Search, Loader2, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export interface FilterConfig {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
}

export interface GenericDataTableProps<TData> {
  // Data
  data: TData[];
  columns: ColumnDef<TData>[];
  
  // Loading state
  isLoading?: boolean;
  
  // Search
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKey?: string;
  
  // Filters
  filters?: FilterConfig[];
  onFilterChange?: (filters: Record<string, string>) => void;
  
  // Pagination (client-side or server-side)
  pagination?: {
    // Client-side pagination
    pageSize?: number;
    
    // Server-side pagination
    pageIndex?: number;
    pageCount?: number;
    total?: number;
    onPaginationChange?: OnChangeFn<PaginationState>;
    
    // Display options
    showPageNumbers?: boolean;
    showPageSizeSelector?: boolean;
    pageSizeOptions?: number[];
  };
  
  // Sorting (server-side)
  sorting?: {
    state?: SortingState;
    onSortingChange?: OnChangeFn<SortingState>;
    manualSorting?: boolean;
  };
  
  // Row selection
  rowSelection?: {
    enabled?: boolean;
    state?: RowSelectionState;
    onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  };
  
  // Empty state
  emptyStateIcon?: React.ReactNode;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  
  // Row actions
  onRowClick?: (row: TData) => void;
  
  // Row animations
  animateRows?: boolean;
  
  // Styling
  className?: string;
  tableClassName?: string;
}

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: index * 0.05,
      duration: 0.3,
    },
  }),
};

export function GenericDataTable<TData>({
  data,
  columns,
  isLoading = false,
  searchable = true,
  searchPlaceholder = 'Search...',
  filters = [],
  onFilterChange,
  pagination,
  sorting,
  rowSelection,
  emptyStateIcon,
  emptyStateTitle = 'No results found',
  emptyStateDescription = 'Try adjusting your search or filters',
  onRowClick,
  animateRows = true,
  className,
  tableClassName,
}: GenericDataTableProps<TData>) {
  // Client-side state
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: pagination?.pageIndex || 0,
    pageSize: pagination?.pageSize || 10,
  });

  // Use server-side or client-side state
  const sortingState = sorting?.state ?? internalSorting;
  const rowSelectionState = rowSelection?.state ?? internalRowSelection;
  const paginationState = pagination?.pageIndex !== undefined && pagination?.pageCount !== undefined
    ? { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize || 10 }
    : internalPagination;

  const table = useReactTable({
    data,
    columns,
    // Sorting
    onSortingChange: sorting?.onSortingChange ?? setInternalSorting,
    getSortedRowModel: getSortedRowModel(),
    manualSorting: sorting?.manualSorting,
    // Filtering
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    // Pagination
    onPaginationChange: pagination?.onPaginationChange ?? setInternalPagination,
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: pagination?.pageCount !== undefined, // Server-side if pageCount provided
    pageCount: pagination?.pageCount,
    // Row Selection
    onRowSelectionChange: rowSelection?.onRowSelectionChange ?? setInternalRowSelection,
    enableRowSelection: rowSelection?.enabled,
    // Column Visibility
    onColumnVisibilityChange: setColumnVisibility,
    // Core
    getCoreRowModel: getCoreRowModel(),
    state: {
      sorting: sortingState,
      columnFilters,
      columnVisibility,
      globalFilter,
      rowSelection: rowSelectionState,
      pagination: paginationState,
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters };
    if (value === 'all') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setGlobalFilter('');
    onFilterChange?.({});
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0 || globalFilter;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filters */}
      {(searchable || filters.length > 0) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* Search */}
              {searchable && (
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  {globalFilter && (
                    <button
                      onClick={() => setGlobalFilter('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Filters */}
              {filters.map((filter) => (
                <Select
                  key={filter.key}
                  value={activeFilters[filter.key] || 'all'}
                  onValueChange={(value) => handleFilterChange(filter.key, value)}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {filter.label}</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="overflow-hidden shadow-sm border border-border/50">
        <CardContent className="p-0">
          <div className={cn('overflow-x-auto', tableClassName)}>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/70 border-b border-border">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="font-semibold text-foreground">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-muted-foreground">Loading...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, index) =>
                    animateRows ? (
                      <motion.tr
                        key={row.id}
                        custom={index}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        onClick={() => onRowClick?.(row.original)}
                        className={cn(
                          "border-b transition-colors hover:bg-muted/50 dark:hover:bg-muted/30",
                          onRowClick && "cursor-pointer"
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </motion.tr>
                    ) : (
                      <TableRow 
                        key={row.id}
                        onClick={() => onRowClick?.(row.original)}
                        className={cn(
                          "hover:bg-muted/50 dark:hover:bg-muted/30",
                          onRowClick && "cursor-pointer"
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  )
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-32 text-center"
                    >
                      <div className="flex flex-col items-center gap-3 py-8">
                        {emptyStateIcon || <Search className="h-12 w-12 text-muted-foreground opacity-50" />}
                        <div className="space-y-1">
                          <p className="font-semibold text-lg">{emptyStateTitle}</p>
                          <p className="text-sm text-muted-foreground">
                            {emptyStateDescription}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && table.getRowModel().rows?.length > 0 && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4">
              {/* Results count and page size selector */}
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {pagination.total !== undefined ? (
                    <>
                      Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                      {Math.min(
                        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                        pagination.total
                      )}{' '}
                      of {pagination.total} results
                    </>
                  ) : (
                    <>
                      {table.getFilteredRowModel().rows.length} result(s)
                    </>
                  )}
                </div>
                
                {/* Page size selector */}
                {pagination.showPageSizeSelector && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select
                      value={String(table.getState().pagination.pageSize)}
                      onValueChange={(value) => {
                        table.setPageSize(Number(value));
                      }}
                    >
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(pagination.pageSizeOptions || [10, 20, 30, 50, 100]).map((size) => (
                          <SelectItem key={size} value={String(size)}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Pagination controls */}
              <div className="flex items-center gap-2">
                {/* First page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="hidden sm:flex"
                >
                  First
                </Button>
                
                {/* Previous page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                
                {/* Page numbers */}
                {pagination.showPageNumbers && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Page {table.getState().pagination.pageIndex + 1} of{' '}
                      {table.getPageCount()}
                    </span>
                  </div>
                )}
                
                {/* Next page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
                
                {/* Last page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="hidden sm:flex"
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
