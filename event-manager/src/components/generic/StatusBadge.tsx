/**
 * StatusBadge Component
 * 
 * Generic status badge with predefined color schemes
 */

import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type BadgeVariant = 
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'secondary';

interface StatusBadgeProps {
  variant?: BadgeVariant;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  secondary: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

export function StatusBadge({
  variant = 'default',
  icon: Icon,
  children,
  className,
}: StatusBadgeProps) {
  return (
    <Badge className={cn(variantClasses[variant], 'gap-1', className)}>
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </Badge>
  );
}
