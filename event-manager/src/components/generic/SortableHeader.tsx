/**
 * Sortable Column Header
 * 
 * Helper component for creating sortable table headers with TanStack Table
 * 
 * Usage:
 * ```tsx
 * {
 *   accessorKey: 'name',
 *   header: ({ column }) => <SortableHeader column={column} title="Name" />,
 *   cell: ({ row }) => row.getValue('name'),
 * }
 * ```
 */

import type { Column } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SortableHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}

export function SortableHeader<TData, TValue>({
  column,
  title,
  className,
}: SortableHeaderProps<TData, TValue>) {
  const sorted = column.getIsSorted();

  return (
    <Button
      mode="ghost"
      size="sm"
      className={cn('-ml-3 h-8 data-[state=open]:bg-accent', className)}
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {title}
      {sorted === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}

/**
 * Helper function to create a sortable column definition
 * 
 * Usage:
 * ```tsx
 * const columns: ColumnDef<User>[] = [
 *   createSortableColumn('email', 'Email'),
 *   createSortableColumn('firstName', 'First Name'),
 *   // ... custom cell rendering
 *   {
 *     accessorKey: 'role',
 *     header: ({ column }) => <SortableHeader column={column} title="Role" />,
 *     cell: ({ row }) => <Badge>{row.getValue('role')}</Badge>,
 *   },
 * ];
 * ```
 */
export function createSortableColumn<TData>(
  accessorKey: string,
  title: string,
  cell?: (value: any) => React.ReactNode
) {
  return {
    accessorKey,
    header: ({ column }: { column: Column<TData, any> }) => (
      <SortableHeader column={column} title={title} />
    ),
    cell: cell ? ({ row }: { row: any }) => cell(row.getValue(accessorKey)) : undefined,
  };
}
