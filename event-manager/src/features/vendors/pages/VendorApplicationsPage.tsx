/**
 * Vendor Applications Page
 * 
 * VENDOR VIEW ONLY - Read-only table showing their own applications
 * For admin/event office management, see VendorRequestsPage
 * 
 * Optimized with React 19 features:
 * - useMemo for expensive computations
 * 
 * Requirements #68, #69
 */

import { useMemo, useEffect } from "react";
import { useQueryState, parseAsInteger, parseAsStringEnum } from "nuqs";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, XCircle, Clock, Package, Filter } from "lucide-react";
import { VendorApplicationsTable } from "../components/vendor-applications-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { VendorApplication } from "@event-manager/shared";
import { usePageMeta } from '@/components/layout/page-meta-context';

type QuickFilter = "all" | "participating" | "pending-rejected";

export function VendorApplicationsPage() {
  const { setPageMeta } = usePageMeta();
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [quickFilter, setQuickFilter] = useQueryState(
    'quickFilter',
    parseAsStringEnum<QuickFilter>(['all', 'participating', 'pending-rejected']).withDefault('all')
  );

  useEffect(() => {
    setPageMeta({
      title: 'My Applications',
      description: 'View and track your vendor application submissions',
    });
  }, [setPageMeta]);

  // Get applications with pagination and filter
  const { data } = trpc.vendorApplications.getApplications.useQuery({
    page,
    limit: perPage,
    isApproved: quickFilter === 'participating' ? true : quickFilter === 'pending-rejected' ? false : undefined,
  });

  // Get aggregated statistics from backend
  const { data: stats } = trpc.vendorApplications.getApplicationStats.useQuery();

  const applications = useMemo(() => (data?.applications || []) as VendorApplication[], [data?.applications]);
  const total = data?.total || 0;
  const pageCount = Math.ceil(total / perPage);

  // Calculate counts for filters (from current page)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    };
    
    applications.forEach((app: VendorApplication) => {
      if (app.status && counts[app.status] !== undefined) {
        counts[app.status]++;
      }
    });
    
    return counts;
  }, [applications]);

  const eventTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      BAZAAR: 0,
      PLATFORM: 0,
    };
    
    applications.forEach((app: VendorApplication) => {
      if (app.type && counts[app.type] !== undefined) {
        counts[app.type]++;
      }
    });
    
    return counts;
  }, [applications]);

  // Stats for page header (use backend analytics)
  const headerStats = useMemo(() => [
    { label: 'Total Applications', value: stats?.total || 0, icon: Package, colorRole: 'info' as const },
    { label: 'Approved', value: stats?.approved || 0, icon: CheckCircle2, colorRole: 'success' as const },
    { label: 'Pending', value: stats?.pending || 0, icon: Clock, colorRole: 'warning' as const },
    { label: 'Rejected', value: stats?.rejected || 0, icon: XCircle, colorRole: 'critical' as const },
  ], [stats]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {headerStats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            success: 'text-green-600 bg-green-50 border-green-200',
            warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
            critical: 'text-red-600 bg-red-50 border-red-200',
            info: 'text-blue-600 bg-blue-50 border-blue-200',
            brand: 'text-purple-600 bg-purple-50 border-purple-200',
          };
          const colorRole = stat.colorRole || 'info';
          
          return (
            <div key={index} className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-card">
              {Icon && (
                <div className={`p-2 rounded-md ${colorClasses[colorRole]}`}>
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Filter Buttons - Requirements #68, #69 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Quick Filters:</span>
        </div>
        
        <Button
          variant={quickFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuickFilter('all')}
          className="gap-2"
        >
          <Package className="h-4 w-4" />
          All Applications
          {stats?.total ? (
            <Badge variant="secondary" className="ml-1">
              {stats.total}
            </Badge>
          ) : null}
        </Button>

        {/* #68: View participating (accepted only) */}
        <Button
          variant={quickFilter === 'participating' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuickFilter('participating')}
          className="gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Participating
          {stats?.approved ? (
            <Badge variant="secondary" className="ml-1">
              {stats.approved}
            </Badge>
          ) : null}
        </Button>

        {/* #69: View pending or rejected */}
        <Button
          variant={quickFilter === 'pending-rejected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuickFilter('pending-rejected')}
          className="gap-2"
        >
          <Clock className="h-4 w-4" />
          Pending / Rejected
          {(stats?.pending || 0) + (stats?.rejected || 0) > 0 ? (
            <Badge variant="secondary" className="ml-1">
              {(stats?.pending || 0) + (stats?.rejected || 0)}
            </Badge>
          ) : null}
        </Button>
      </div>

      <div className="mt-6">
        <VendorApplicationsTable
          data={applications}
          pageCount={pageCount}
          statusCounts={statusCounts}
          eventTypeCounts={eventTypeCounts}
        />
      </div>
    </div>
  );
}
