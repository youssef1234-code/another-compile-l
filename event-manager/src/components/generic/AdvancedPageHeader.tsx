/**
 * Advanced Page Header Component
 * 
 * Professional page header with breadcrumbs, actions, stats, and filters
 * Based on Pro Design principles - clear hierarchy, purposeful spacing
 * 
 * Features:
 * - Breadcrumb navigation
 * - Primary and secondary actions
 * - Stat cards (optional)
 * - Integrated search and filters
 * - Responsive layout
 * 
 * Usage:
 * <PageHeader
 *   title="Users"
 *   breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Users' }]}
 *   actions={<Button>Create User</Button>}
 *   stats={[{ label: 'Total Users', value: 150 }]}
 * />
 */

import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight, ArrowLeft, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

// ============================================================================
// Types
// ============================================================================

export interface Breadcrumb {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

export interface StatCard {
  label: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon?: LucideIcon;
  colorRole?: 'success' | 'warning' | 'critical' | 'info' | 'brand';
}

export interface PageHeaderProps {
  /** Page title */
  title: string;
  
  /** Optional subtitle/description */
  description?: string;
  
  /** Breadcrumb navigation */
  breadcrumbs?: Breadcrumb[];
  
  /** Primary action button(s) */
  actions?: React.ReactNode;
  
  /** Secondary actions (typically icon buttons) */
  secondaryActions?: React.ReactNode;
  
  /** Stat cards to display */
  stats?: StatCard[];
  
  /** Additional content below header (filters, tabs, etc) */
  children?: React.ReactNode;
  
  /** Custom className */
  className?: string;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Breadcrumb Navigation
 */
interface BreadcrumbsProps {
  items: Breadcrumb[];
}

function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;

        return (
          <div key={index} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className={cn(
                'flex items-center gap-1.5',
                isLast && 'font-medium text-foreground'
              )}>
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </div>
        );
      })}
    </nav>
  );
}

/**
 * Stat Card Component
 */
interface StatCardComponentProps extends StatCard {}

function StatCardComponent({ 
  label, 
  value, 
  change, 
  icon: Icon,
  colorRole = 'info'
}: StatCardComponentProps) {
  const colorClasses = {
    success: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    critical: 'text-red-600 bg-red-50 border-red-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200',
    brand: 'text-purple-600 bg-purple-50 border-purple-200',
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-card">
      {Icon && (
        <div className={cn(
          'p-2 rounded-md',
          colorClasses[colorRole]
        )}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground truncate">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {change && (
            <span className={cn(
              'text-xs font-medium',
              change.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {change.isPositive ? '+' : ''}{change.value}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Page Header Component
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  secondaryActions,
  stats,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-6 pb-6', className)}>
      {/* Top Section: Breadcrumbs + Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs items={breadcrumbs} />
          )}
        </div>
        {secondaryActions && (
          <div className="flex items-center gap-2">
            {secondaryActions}
          </div>
        )}
      </div>

      {/* Title Section */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight truncate">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Stats Section */}
      {stats && stats.length > 0 && (
        <>
          <Separator />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <StatCardComponent key={index} {...stat} />
            ))}
          </div>
        </>
      )}

      {/* Additional Content (Filters, Tabs, etc) */}
      {children && (
        <>
          <Separator />
          {children}
        </>
      )}
    </div>
  );
}

/**
 * Compact Page Header (for nested/detail pages)
 */
export interface CompactPageHeaderProps {
  title: string;
  subtitle?: string;
  backUrl?: string;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
  className?: string;
}

export function CompactPageHeader({
  title,
  subtitle,
  backUrl,
  actions,
  tabs,
  className,
}: CompactPageHeaderProps) {
  return (
    <div className={cn('space-y-4 pb-6 border-b', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          {backUrl && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="mb-2 -ml-2"
            >
              <Link to={backUrl}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
          )}
          <h2 className="text-2xl font-semibold tracking-tight truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
      {tabs && <div>{tabs}</div>}
    </div>
  );
}

/**
 * Section Header (for content sections within a page)
 */
export interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 pb-4', className)}>
      <div className="flex-1 min-w-0 space-y-1">
        <h3 className="text-lg font-semibold tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
