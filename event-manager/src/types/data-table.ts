import type { ColumnSort, Row, RowData } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // biome-ignore lint/correctness/noUnusedVariables: TData is used in the TableMeta interface
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    queryKeys?: QueryKeys;
  }

  // biome-ignore lint/correctness/noUnusedVariables: TValue is used in the ColumnMeta interface
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string;
    placeholder?: string;
    variant?: FilterVariant;
    operators?: FilterOperator[];
    options?: Option[];
    range?: [number, number];
    unit?: string;
    icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  }
}

export interface QueryKeys {
  page: string;
  perPage: string;
  sort: string;
  filters: string;
  joinOperator: string;
}

export interface Option {
  label: string;
  value: string;
  count?: number;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

export type FilterOperator =
  | "iLike"
  | "notILike"
  | "eq"
  | "ne"
  | "inArray"
  | "notInArray"
  | "isEmpty"
  | "isNotEmpty"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "isBetween"
  | "isRelativeToToday";

export type FilterVariant =
  | "text"
  | "number"
  | "range"
  | "date"
  | "dateRange"
  | "boolean"
  | "select"
  | "multiSelect";

export type JoinOperator = "and" | "or";

export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, "id"> {
  id: Extract<keyof TData, string>;
}

export interface ExtendedColumnFilter<TData> {
  id: Extract<keyof TData, string>;
  value: unknown;
  operator: FilterOperator;
  variant: FilterVariant;
  filterId: string;
}

export interface DataTableRowAction<TData> {
  row: Row<TData>;
  variant: "update" | "delete";
}
