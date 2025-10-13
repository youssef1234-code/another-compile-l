/**
 * Column Visibility Toggle Component
 * 
 * Dropdown to show/hide table columns
 * - Stays open for multiple selections
 * - Checkboxes instead of check items
 * - Toggle all functionality
 * 
 * Usage:
 * <ColumnVisibilityToggle table={table} />
 */

import type { Table } from '@tanstack/react-table';
import { Settings2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

interface ColumnVisibilityToggleProps<TData> {
  table: Table<TData>;
}

export function ColumnVisibilityToggle<TData>({
  table,
}: ColumnVisibilityToggleProps<TData>) {
  const [open, setOpen] = useState(false);
  
  const columns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== 'undefined' && column.getCanHide()
    );

  const visibleCount = columns.filter(col => col.getIsVisible()).length;
  const allVisible = visibleCount === columns.length;

  const handleToggleAll = () => {
    if (allVisible) {
      // Hide all
      columns.forEach(column => column.toggleVisibility(false));
    } else {
      // Show all
      columns.forEach(column => column.toggleVisibility(true));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Columns
          {visibleCount < columns.length && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({visibleCount}/{columns.length})
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 p-0" 
        align="end"
      >
        <div className="p-4 space-y-4">
          {/* Header with Toggle All */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Toggle Columns</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleAll}
                className="h-7 text-xs"
              >
                {allVisible ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hide All
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Show All
                  </>
                )}
              </Button>
            </div>
            <Separator />
          </div>

          {/* Column Checkboxes */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {columns.map((column) => {
              return (
                <div
                  key={column.id}
                  className="flex items-center space-x-2 px-1 py-1.5 hover:bg-accent rounded-md cursor-pointer"
                  onClick={() => column.toggleVisibility(!column.getIsVisible())}
                >
                  <Checkbox
                    id={`column-${column.id}`}
                    checked={column.getIsVisible()}
                    onCheckedChange={(checked) => column.toggleVisibility(!!checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label
                    htmlFor={`column-${column.id}`}
                    className="text-sm capitalize cursor-pointer flex-1 select-none"
                  >
                    {column.id.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="w-full"
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
