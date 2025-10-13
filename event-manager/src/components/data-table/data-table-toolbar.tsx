"use client";

import type { Column, Table } from "@tanstack/react-table";
import { Loader2, X } from "lucide-react";
import * as React from "react";

import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { FilterOperator } from "@/types/data-table";

interface DataTableToolbarProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
  showColumnFilters?: boolean; // Control whether to show auto column filters
  showGlobalSearch?: boolean; // Show single global search bar
  globalSearchValue?: string; // Controlled search value
  onGlobalSearchChange?: (value: string) => void; // Search change handler
  globalSearchPlaceholder?: string; // Placeholder for global search
  isSearching?: boolean; // Loading state for search
}

export function DataTableToolbar<TData>({
  table,
  children,
  className,
  showColumnFilters = true,
  showGlobalSearch = false,
  globalSearchValue,
  onGlobalSearchChange,
  globalSearchPlaceholder = "Search...",
  isSearching = false,
  ...props
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || (showGlobalSearch && globalSearchValue);

  const columns = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table],
  );

  const onReset = React.useCallback(() => {
    table.resetColumnFilters();
    if (showGlobalSearch && onGlobalSearchChange) {
      onGlobalSearchChange("");
    }
  }, [table, showGlobalSearch, onGlobalSearchChange]);

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn(
        "flex w-full items-start justify-between gap-2 p-1",
        className,
      )}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Global Search - single search bar that searches across multiple fields */}
        {showGlobalSearch && onGlobalSearchChange && (
          <div className="relative">
            <Input
              placeholder={globalSearchPlaceholder}
              value={globalSearchValue || ""}
              onChange={(e) => {
                onGlobalSearchChange(e.target.value);
              }}
              className={cn(
                "h-9 w-[300px] pr-8",
                isSearching && "opacity-70"
              )}
            />
            {isSearching && (
              <Loader2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        )}
        
        {/* Column-specific text filters (only if NOT using global search) */}
        {showColumnFilters && !showGlobalSearch && columns
          .filter((col) => col.columnDef.meta?.variant === "text" || col.columnDef.meta?.variant === "number")
          .map((column) => (
            <DataTableToolbarFilter key={column.id} column={column} />
          ))}
        
        {/* Faceted filters (always show for multiSelect columns) */}
        {showColumnFilters && columns
          .filter((col) => col.columnDef.meta?.variant === "multiSelect" || col.columnDef.meta?.variant === "select")
          .map((column) => (
            <DataTableFacetedFilter
              key={column.id}
              column={column}
              title={column.columnDef.meta?.label ?? column.id}
              options={column.columnDef.meta?.options ?? []}
            />
          ))}
        
        {isFiltered && (
          <Button
            aria-label="Reset filters"
            variant="outline"
            size="sm"
            className="border-dashed"
            onClick={onReset}
          >
            <X />
            Reset
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}

interface DataTableToolbarFilterProps<TData> {
  column: Column<TData>;
}

function DataTableToolbarFilter<TData>({
  column,
}: DataTableToolbarFilterProps<TData>) {
  const columnMeta = column.columnDef.meta;
  const [operator, setOperator] = React.useState<FilterOperator>(
    (columnMeta?.operators?.[0] as FilterOperator) ?? "iLike"
  );

  const operatorLabels: Record<FilterOperator, string> = {
    iLike: "Contains",
    notILike: "Not contains",
    eq: "Equals",
    ne: "Not equals",
    isEmpty: "Is empty",
    isNotEmpty: "Is not empty",
    lt: "Less than",
    lte: "Less or equal",
    gt: "Greater than",
    gte: "Greater or equal",
    isBetween: "Between",
    isRelativeToToday: "Relative to today",
    inArray: "In array",
    notInArray: "Not in array",
  };

  const onFilterRender = React.useCallback(() => {
    if (!columnMeta?.variant) return null;

    switch (columnMeta.variant) {
      case "text":
        const hasOperators = columnMeta.operators && columnMeta.operators.length > 0;
        
        return (
          <div className="flex items-center gap-1">
            {hasOperators && (
              <Select
                value={operator}
                onValueChange={(value) => setOperator(value as FilterOperator)}
              >
                <SelectTrigger className="h-8 w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columnMeta.operators!.map((op) => (
                    <SelectItem key={op} value={op}>
                      {operatorLabels[op as FilterOperator]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Input
              placeholder={columnMeta.placeholder ?? columnMeta.label}
              value={(column.getFilterValue() as string) ?? ""}
              onChange={(event) => column.setFilterValue(event.target.value)}
              className="h-8 w-40 lg:w-56"
              disabled={operator === "isEmpty" || operator === "isNotEmpty"}
            />
          </div>
        );

      case "number":
        return (
          <div className="relative">
            <Input
              type="number"
              inputMode="numeric"
              placeholder={columnMeta.placeholder ?? columnMeta.label}
              value={(column.getFilterValue() as string) ?? ""}
              onChange={(event) => column.setFilterValue(event.target.value)}
              className={cn("h-8 w-[120px]", columnMeta.unit && "pr-8")}
            />
            {columnMeta.unit && (
              <span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-muted-foreground text-sm">
                {columnMeta.unit}
              </span>
            )}
          </div>
        );

      case "select":
      case "multiSelect":
        return (
          <DataTableFacetedFilter
            column={column}
            title={columnMeta.label ?? column.id}
            options={columnMeta.options ?? []}
            multiple={columnMeta.variant === "multiSelect"}
          />
        );

      default:
        return null;
    }
  }, [column, columnMeta, operator, operatorLabels]);

  return onFilterRender();
}
