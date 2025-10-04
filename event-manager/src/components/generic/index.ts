/**
 * Generic Components Export
 * 
 * Centralized export for all reusable generic components
 */

// Original components
export { DataTable } from './DataTable';
export type { DataTableProps } from './DataTable';

export { LoadingSpinner } from './LoadingSpinner';
export { EmptyState } from './EmptyState';
export { PageHeader } from './PageHeader';
export { StatusBadge } from './StatusBadge';
export { ConfirmDialog } from './ConfirmDialog';
export type { BadgeVariant } from './StatusBadge';

// New generic components
export { GenericDataTable } from './GenericDataTable';
export type { GenericDataTableProps, FilterConfig } from './GenericDataTable';

export { GenericForm } from './GenericForm';
export type { GenericFormProps, FormFieldConfig, FieldType } from './GenericForm';

