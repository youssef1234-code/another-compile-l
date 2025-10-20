/**
 * Status Badge Component
 * 
 * Semantic status indicator with color roles
 * Based on Pro Design principles:
 * - Color has purpose (not decoration)
 * - Clear affordances for status understanding
 * - Consistent across the application
 * 
 * Usage:
 * <StatusBadge status="ACTIVE" />
 * <StatusBadge status="PENDING" variant="soft" />
 * <StatusBadge status="CRITICAL" icon={AlertCircle} />
 */

import { type LucideIcon } from 'lucide-react';
import { cn, getStatusVariant, getColorClasses } from '@/lib/design-system';

export interface StatusBadgeProps {
  /** Status value (maps to semantic color) */
  status: string;
  
  /** Display text (defaults to formatted status) */
  label?: string;
  
  /** Visual variant */
  variant?: 'solid' | 'soft' | 'outline';
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Optional icon */
  icon?: LucideIcon;
  
  /** Additional classes */
  className?: string;
  
  /** Show dot indicator */
  dot?: boolean;
}

/**
 * Format status text for display
 */
function formatStatus(status: string | undefined): string {
  if (!status) return 'Unknown';
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function StatusBadge({
  status,
  label,
  variant = 'soft',
  size = 'md',
  icon: Icon,
  className,
  dot = false,
}: StatusBadgeProps) {
  if (!status) return null;
  
  const colorRole = getStatusVariant(status);
  const colorClasses = getColorClasses(colorRole, variant);
  const displayLabel = label || formatStatus(status);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  const dotSizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-md border transition-colors',
        sizeClasses[size],
        colorClasses,
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'rounded-full',
            dotSizes[size],
            variant === 'solid' ? 'bg-background/80' : 'bg-current'
          )}
        />
      )}
      {Icon && <Icon className={cn(iconSizes[size])} />}
      <span>{displayLabel}</span>
    </span>
  );
}

/**
 * User Status Badge - Specialized for user statuses
 */
export function UserStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: 'solid' | 'soft' | 'outline'; dot: boolean }> = {
    ACTIVE: { label: 'Active', variant: 'soft', dot: true },
    PENDING_VERIFICATION: { label: 'Pending', variant: 'soft', dot: true },
    BLOCKED: { label: 'Blocked', variant: 'soft', dot: true },
  };

  const config = statusConfig[status] || { label: status, variant: 'soft', dot: true };

  return (
    <StatusBadge
      status={status}
      label={config.label}
      variant={config.variant}
      dot={config.dot}
      size="sm"
    />
  );
}

/**
 * Event Status Badge - Specialized for event statuses
 */
export function EventStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: 'solid' | 'soft' | 'outline' }> = {
    UPCOMING: { label: 'Upcoming', variant: 'soft' },
    ONGOING: { label: 'Ongoing', variant: 'soft' },
    COMPLETED: { label: 'Completed', variant: 'soft' },
    CANCELLED: { label: 'Cancelled', variant: 'soft' },
    DRAFT: { label: 'Draft', variant: 'outline' },
  };

  const config = statusConfig[status] || { label: status, variant: 'soft' };

  return (
    <StatusBadge
      status={status}
      label={config.label}
      variant={config.variant}
      size="sm"
    />
  );
}

/**
 * Role Badge - For displaying user roles
 */
export function RoleBadge({ role }: { role: string }) {
  const roleColors: Record<string, 'success' | 'info' | 'warning' | 'critical' | 'brand'> = {
    ADMIN: 'critical',
    EVENT_OFFICE: 'brand',
    PROFESSOR: 'info',
    TA: 'info',
    STAFF: 'success',
    STUDENT: 'success',
    VENDOR: 'warning',
  };

  const roleLabels: Record<string, string> = {
    ADMIN: 'Admin',
    EVENT_OFFICE: 'Events Office',
    PROFESSOR: 'Professor',
    TA: 'TA',
    STAFF: 'Staff',
    STUDENT: 'Student',
    VENDOR: 'Vendor',
  };

  const colorRole = roleColors[role] || 'info';
  const label = roleLabels[role] || role;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        getColorClasses(colorRole, 'soft')
      )}
    >
      {label}
    </span>
  );
}

/**
 * Type Badge - For event types
 */
export function TypeBadge({ type }: { type: string }) {
  const typeColors: Record<string, 'success' | 'info' | 'warning' | 'critical' | 'brand'> = {
    WORKSHOP: 'brand',
    TRIP: 'success',
    BAZAAR: 'warning',
    CONFERENCE: 'info',
    BOOTH: 'warning',
  };

  const colorRole = typeColors[type] || 'info';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        getColorClasses(colorRole, 'outline')
      )}
    >
      {formatStatus(type)}
    </span>
  );
}
