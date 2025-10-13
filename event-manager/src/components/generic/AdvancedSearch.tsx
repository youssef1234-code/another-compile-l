/**
 * Advanced Search Component
 * 
 * Search with column selection
 * 
 * Usage:
 * <AdvancedSearch
 *   value={search}
 *   onChange={setSearch}
 *   columns={[
 *     { value: 'email', label: 'Email' },
 *     { value: 'name', label: 'Name' }
 *   ]}
 *   selectedColumns={selectedColumns}
 *   onColumnsChange={setSelectedColumns}
 * />
 */

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface SearchColumn {
  value: string;
  label: string;
}

interface AdvancedSearchProps {
  value: string;
  onChange: (value: string) => void;
  columns: SearchColumn[];
  selectedColumns: string[];
  onColumnsChange: (columns: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function AdvancedSearch({
  value,
  onChange,
  columns,
  selectedColumns,
  onColumnsChange,
  placeholder = 'Search...',
  className,
}: AdvancedSearchProps) {
  const handleToggleColumn = (columnValue: string) => {
    if (selectedColumns.includes(columnValue)) {
      onColumnsChange(selectedColumns.filter((c) => c !== columnValue));
    } else {
      onColumnsChange([...selectedColumns, columnValue]);
    }
  };

  const selectedCount = selectedColumns.length;
  const allSelected = selectedCount === columns.length;

  return (
    <div className={cn('relative flex items-center gap-2', className)}>
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Column Selector */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap">
            <Search className="h-4 w-4" />
            {allSelected
              ? 'All Fields'
              : selectedCount > 0
              ? `${selectedCount} Field${selectedCount > 1 ? 's' : ''}`
              : 'Select Fields'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="end">
          <div className="space-y-3">
            <div className="font-medium text-sm">Search in:</div>
            
            {/* Select All */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="all-columns"
                checked={allSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onColumnsChange(columns.map((c) => c.value));
                  } else {
                    onColumnsChange([]);
                  }
                }}
              />
              <label
                htmlFor="all-columns"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                All fields
              </label>
            </div>

            <div className="border-t pt-2 space-y-2">
              {columns.map((column) => (
                <div key={column.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.value}
                    checked={selectedColumns.includes(column.value)}
                    onCheckedChange={() => handleToggleColumn(column.value)}
                  />
                  <label
                    htmlFor={column.value}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {column.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
