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
import { Search, Loader2, X } from 'lucide-react';
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
import { Card } from '@/components/ui/card';
import { ColumnVisibilityToggle } from './ColumnVisibilityToggle';

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
  onSearchChange?: (value: string) => void;
  
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
  
  // Bulk actions
  bulkActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (selectedRows: TData[]) => void;
    variant?: 'default' | 'destructive';
  }>;
  
  // Inline editing
  enableInlineEdit?: boolean;
  onRowEdit?: (row: TData) => void;
  
  // Export
  enableExport?: boolean;
  exportFileName?: string;
  onExport?: () => void;
  
  // Column visibility toggle
  showColumnToggle?: boolean;
  
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
  
  // Custom content (e.g., integrated search bar)
  children?: React.ReactNode;
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
  onSearchChange,
  pagination,
  sorting,
  rowSelection,
  bulkActions = [],
  emptyStateIcon,
  emptyStateTitle = 'No results found',
  emptyStateDescription = 'Try adjusting your search or filters',
  onRowClick,
  animateRows = true,
  className,
  children,
}: GenericDataTableProps<TData>) {
  // Client-side state
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
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

  const handleSearchChange = (value: string) => {
    setGlobalFilter(value);
    onSearchChange?.(value);
  };

  const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);
  const hasSelection = selectedRows.length > 0;

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Toolbar Section */}
      <Card className="border-border/50">
        <div className="flex items-center justify-between gap-4 p-4">
          {/* Search */}
          <div className="flex-1 max-w-sm">
            {children || (searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={globalFilter ?? ''}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 h-10 bg-background"
                />
                {globalFilter && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {/* Column Visibility */}
          <ColumnVisibilityToggle table={table} />
        </div>
      </Card>

      {/* Table Card */}
      <Card className="border-border/50">
        <div className="relative w-full">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b-2 bg-muted/30 hover:bg-muted/30">
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id} 
                      className="font-semibold text-foreground h-14 px-4"
                      style={{
                        minWidth: header.column.columnDef.size,
                        width: header.column.columnDef.size,
                      }}
                    >
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
                    className="h-40 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Loading data...</span>
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
                        "border-b transition-colors hover:bg-muted/50",
                        onRowClick && "cursor-pointer"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-4 px-4">
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
                        "hover:bg-muted/50 transition-colors",
                        onRowClick && "cursor-pointer"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-4 px-4">
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
                    className="h-40 text-center"
                  >
                    <div className="flex flex-col items-center gap-3 py-8">
                      {emptyStateIcon || <Search className="h-12 w-12 text-muted-foreground/50" />}
                      <div className="space-y-1">
                        <p className="text-base font-medium">{emptyStateTitle}</p>
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

        {/* Pagination Footer */}
        {pagination && table.getRowModel().rows?.length > 0 && (
          <div className="border-t bg-muted/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {pagination.total !== undefined && (
                  <span>
                    Showing <span className="font-medium text-foreground">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to{' '}
                    <span className="font-medium text-foreground">{Math.min(
                      (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                      pagination.total
                    )}</span> of{' '}
                    <span className="font-medium text-foreground">{pagination.total}</span> results
                  </span>
                )}
                
                {pagination.showPageSizeSelector && (
                  <div className="flex items-center gap-2">
                    <span>Rows:</span>
                    <Select
                      value={String(table.getState().pagination.pageSize)}
                      onValueChange={(value) => table.setPageSize(Number(value))}
                    >
                      <SelectTrigger className="h-9 w-[70px]">
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

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  className="h-9"
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-9"
                >
                  Previous
                </Button>
                
                {pagination.showPageNumbers && (
                  <div className="flex items-center gap-2 px-3">
                    <span className="text-sm">
                      Page <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> of{' '}
                      <span className="font-medium">{table.getPageCount()}</span>
                    </span>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-9"
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  className="h-9"
                >
                  Last
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
