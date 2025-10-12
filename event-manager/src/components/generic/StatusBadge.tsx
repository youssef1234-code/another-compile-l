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
  default: 'bg-neutral-alpha-100 text-neutral-base',
  success: 'bg-success-alpha-100 text-success-base',
  warning: 'bg-warning-alpha-100 text-warning-base',
  error: 'bg-error-alpha-100 text-error-base',
  info: 'bg-information-alpha-100 text-information-base',
  secondary: 'bg-primary-alpha-100 text-primary-base',
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
