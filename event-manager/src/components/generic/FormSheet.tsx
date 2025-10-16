/**
 * Form Sheet Component
 * 
 * Slide-out sheet for Create/Edit forms
 * Replaces center modals with a professional slide-from-right panel
 * 
 * Inspired by: Shopify admin, Linear, Notion
 * 
 * Usage:
 * <FormSheet open={open} onOpenChange={setOpen} title="Create Event">
 *   <FormSheetContent>
 *     ... form fields ...
 *   </FormSheetContent>
 *   <FormSheetFooter>
 *     <Button>Save</Button>
 *   </FormSheetFooter>
 * </FormSheet>
 */

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface FormSheetProps {
  /** Control open state */
  open: boolean;
  
  /** Handle open state changes */
  onOpenChange: (open: boolean) => void;
  
  /** Sheet title */
  title: string;
  
  /** Optional description */
  description?: string;
  
  /** Sheet content and actions */
  children: React.ReactNode;
  
  /** Sheet width */
  size?: 'default' | 'wide' | 'full';
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Additional classes */
  className?: string;
}

export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'default',
  isLoading = false,
  className,
}: FormSheetProps) {
  const sizeClasses = {
    default: 'sm:max-w-lg',
    wide: 'sm:max-w-2xl',
    full: 'sm:max-w-full sm:w-screen',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'w-full p-0 flex flex-col gap-0',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-lg font-semibold">
                {title}
              </SheetTitle>
              {description && (
                <SheetDescription className="text-sm text-muted-foreground">
                  {description}
                </SheetDescription>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Form Sheet Content
 * Scrollable content area for form fields
 */
interface FormSheetContentProps {
  children: React.ReactNode;
  className?: string;
}

export function FormSheetContent({ children, className }: FormSheetContentProps) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-6', className)}>
      <div className="py-6 space-y-6">{children}</div>
    </div>
  );
}

/**
 * Form Sheet Section
 * Grouped section with title
 */
interface FormSheetSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSheetSection({
  title,
  description,
  children,
  className,
}: FormSheetSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/**
 * Form Sheet Footer
 * Sticky footer for actions
 */
interface FormSheetFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function FormSheetFooter({ children, className }: FormSheetFooterProps) {
  return (
    <>
      <Separator />
      <div className={cn('px-6 py-4 bg-muted/30', className)}>
        <div className="flex items-center justify-end gap-3">
          {children}
        </div>
      </div>
    </>
  );
}

/**
 * Form Sheet Field
 * Individual form field with label
 */
interface FormSheetFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSheetField({
  label,
  required = false,
  error,
  hint,
  children,
  className,
}: FormSheetFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

/**
 * Confirmation Dialog Sheet
 * For dangerous actions
 */
interface ConfirmSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  isLoading = false,
}: ConfirmSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className="pt-4">
            {description}
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex items-center gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Loading...' : confirmLabel}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
