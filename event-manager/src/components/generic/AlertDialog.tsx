/**
 * Enhanced Alert Dialog Component
 * 
 * Professional confirmation dialogs with semantic variants
 * Supports: default, warning, danger (destructive)
 * 
 * Usage:
 * <EnhancedAlertDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   variant="danger"
 *   title="Delete User"
 *   description="This action cannot be undone."
 *   confirmLabel="Delete"
 *   onConfirm={handleDelete}
 *   isLoading={isDeleting}
 * />
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Info, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface EnhancedAlertDialogProps {
  /** Control open state */
  open: boolean;
  
  /** Handle open state changes */
  onOpenChange: (open: boolean) => void;
  
  /** Dialog variant */
  variant?: 'default' | 'warning' | 'danger';
  
  /** Dialog title */
  title: string;
  
  /** Dialog description */
  description: string;
  
  /** Confirm button label */
  confirmLabel?: string;
  
  /** Cancel button label */
  cancelLabel?: string;
  
  /** Confirm action handler */
  onConfirm: () => void;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Additional details to show */
  details?: React.ReactNode;
}

const variantConfig = {
  default: {
    icon: Info,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
    buttonClass: 'bg-orange-600 hover:bg-orange-700 text-white',
  },
  danger: {
    icon: AlertCircle,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
    buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
  },
};

export function EnhancedAlertDialog({
  open,
  onOpenChange,
  variant = 'default',
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isLoading = false,
  details,
}: EnhancedAlertDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoading) {
      onConfirm();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          {/* Icon */}
          <div className="flex items-center gap-4 mb-2">
            <div className={cn('rounded-full p-3', config.iconBg)}>
              <Icon className={cn('h-6 w-6', config.iconColor)} />
            </div>
            <AlertDialogTitle className="text-xl font-semibold">
              {title}
            </AlertDialogTitle>
          </div>
          
          {/* Description */}
          <AlertDialogDescription className="text-base text-muted-foreground">
            {description}
          </AlertDialogDescription>
          
          {/* Additional Details */}
          {details && (
            <div className="mt-4 p-3 bg-muted/50 rounded-md border border-border">
              {details}
            </div>
          )}
        </AlertDialogHeader>
        
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(config.buttonClass)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Quick preset for delete actions
 */
export interface DeleteAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteAlertDialog({
  open,
  onOpenChange,
  itemName,
  itemType = 'item',
  onConfirm,
  isLoading,
}: DeleteAlertDialogProps) {
  return (
    <EnhancedAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="danger"
      title={`Delete ${itemType}?`}
      description={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={onConfirm}
      isLoading={isLoading}
      details={
        <div className="flex items-start gap-2 text-sm">
          <Trash2 className="h-4 w-4 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium">This will permanently delete:</p>
            <p className="text-muted-foreground">• {itemName}</p>
            <p className="text-muted-foreground">• All associated data</p>
          </div>
        </div>
      }
    />
  );
}

/**
 * Quick preset for block/warning actions
 */
export interface WarningAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  details?: React.ReactNode;
}

export function WarningAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Proceed',
  onConfirm,
  isLoading,
  details,
}: WarningAlertDialogProps) {
  return (
    <EnhancedAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="warning"
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      onConfirm={onConfirm}
      isLoading={isLoading}
      details={details}
    />
  );
}
