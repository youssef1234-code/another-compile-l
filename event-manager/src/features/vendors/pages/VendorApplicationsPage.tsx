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
import { useQueryState, parseAsInteger, parseAsString, parseAsArrayOf, parseAsJson } from "nuqs";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, XCircle, Clock, Package } from "lucide-react";
import { VendorApplicationsTable } from "../components/vendor-applications-table";
import type { VendorApplication } from "@event-manager/shared";
import { usePageMeta } from '@/components/layout/page-meta-context';
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

type SortState = Array<{ id: string; desc: boolean }>;

type VendorApplicationType = 'BAZAAR' | 'PLATFORM';
type VendorApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type VendorBoothSize = 'TWO_BY_TWO' | 'FOUR_BY_FOUR';

type VendorApplicationsQueryInput = {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  type?: VendorApplicationType;
  status?: VendorApplicationStatus;
  boothSize?: VendorBoothSize;
};

export function VendorApplicationsPage() {
  const { setPageMeta } = usePageMeta();
  
  useEffect(() => {
    setPageMeta({
      title: 'My Applications',
      description: 'View and track your vendor application submissions',
    });
  }, [setPageMeta]);

  // Pagination
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  
  // Search
  const [search] = useQueryState('search', parseAsString.withDefault(''));
  
  // Sorting
  const [sortStateRaw] = useQueryState(
    'sort',
    parseAsJson<Array<{ id: string; desc: boolean }>>((value) => {
      if (Array.isArray(value)) {
        return value as Array<{ id: string; desc: boolean }>;
      }
      return null;
    }).withDefault([])
  );
  const sortState: SortState = useMemo(() => sortStateRaw ?? [], [sortStateRaw]);
  
  // Simple filters
  const [typeFilter] = useQueryState('eventType', parseAsArrayOf(parseAsString, ',').withDefault([]));
  const [statusFilter] = useQueryState('status', parseAsArrayOf(parseAsString, ',').withDefault([]));
  const [boothSizeFilter] = useQueryState('boothSize', parseAsArrayOf(parseAsString, ',').withDefault([]));

  // Parse sort state
  const parsedSort = useMemo(() => {
    try {
      if (Array.isArray(sortState) && sortState.length > 0) {
        const firstSort = sortState[0];
        return {
          sortBy: firstSort.id,
          sortOrder: firstSort.desc ? 'desc' as const : 'asc' as const,
        };
      }
      return undefined;
    } catch {
      return undefined;
    }
  }, [sortState]);

  // Build simple filters for backend
  const filters = useMemo<Partial<VendorApplicationsQueryInput>>(() => {
    const result: Partial<VendorApplicationsQueryInput> = {};

    const typeValue = typeFilter[0];
    if (typeValue === 'BAZAAR' || typeValue === 'PLATFORM') {
      result.type = typeValue;
    }

    const statusValue = statusFilter[0];
    if (statusValue === 'PENDING' || statusValue === 'APPROVED' || statusValue === 'REJECTED') {
      result.status = statusValue;
    }

    const boothSizeValue = boothSizeFilter[0];
    // Handle the typo in shared types where FOUR_BY_FOUR has trailing ": "
    if (boothSizeValue === 'TWO_BY_TWO') {
      result.boothSize = 'TWO_BY_TWO';
    } else if (boothSizeValue === 'FOUR_BY_FOUR: ' || boothSizeValue === 'FOUR_BY_FOUR') {
      result.boothSize = 'FOUR_BY_FOUR';
    }

    return result;
  }, [typeFilter, statusFilter, boothSizeFilter]);

  // Build query input
  const queryInput = useMemo<VendorApplicationsQueryInput>(() => {
    return {
      page,
      limit: perPage,
      ...(search ? { search } : {}),
      ...(parsedSort ? { sortBy: parsedSort.sortBy, sortOrder: parsedSort.sortOrder } : {}),
      ...filters,
    };
  }, [page, perPage, search, parsedSort, filters]);

  // Get applications with ALL URL parameters
  const { data, isFetching } = trpc.vendorApplications.getApplications.useQuery(
    queryInput,
    {
      // Keep previous data while fetching new data
      placeholderData: (previousData) => previousData,
      // Refetch when URL params change
      refetchOnMount: true,
      // Shorter stale time to ensure fresh data
      staleTime: 2000,
    }
  );

const navigate = useNavigate();
  const utils = trpc.useUtils();

  // Navigate to vendor payment page - payment initialization happens there
  const handlePayVendorFee = (app: VendorApplication) => {
    // Navigate to payment page with applicationId - payment init happens on that page
    navigate(`/checkout/vendor/${app.id}`);
  };

  // Download visitor badges mutation (Requirement #66)
  const downloadBadgesMutation = trpc.vendorApplications.generateVisitorBadges.useMutation({
    onSuccess: (result) => {
      // Convert base64 to blob and download
      const blob = new Blob(
        [Uint8Array.from(atob(result.data), c => c.charCodeAt(0))],
        { type: result.mimeType }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Badges downloaded successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to download badges');
    },
  });

  const handleDownloadBadges = (applicationId: string) => {
    downloadBadgesMutation.mutate({ applicationId });
  };

  // Send badges to email mutation (Requirement #66)
  const sendBadgesEmailMutation = trpc.vendorApplications.sendVisitorBadges.useMutation({
    onSuccess: () => {
      toast.success('Badges sent to your email successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send badges to email');
    },
  });

  const handleSendBadgesToEmail = (applicationId: string) => {
    sendBadgesEmailMutation.mutate({ applicationId });
  };

  // Cancel application mutation (Requirement #67)
  const cancelApplicationMutation = trpc.vendorApplications.cancelApplication.useMutation({
    onSuccess: () => {
      toast.success('Application cancelled successfully');
      utils.vendorApplications.getApplications.invalidate();
      utils.vendorApplications.getApplicationStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel application');
    },
  });

  const handleCancelApplication = (applicationId: string) => {
    cancelApplicationMutation.mutate({ applicationId });
  };


  // Get aggregated statistics from backend
  const { data: stats } = trpc.vendorApplications.getApplicationStats.useQuery();

  const applications = (data?.applications || []) as VendorApplication[];
  const total = data?.total || 0;
  const pageCount = Math.ceil(total / perPage);

  // ✅ Memoized count calculations using stats from backend
  const statusCounts = useMemo(() => ({
    PENDING: stats?.pending || 0,
    APPROVED: stats?.approved || 0,
    REJECTED: stats?.rejected || 0,
  }), [stats]);

  const eventTypeCounts = useMemo(() => ({
    BAZAAR: stats?.byType?.BAZAAR || 0,
    PLATFORM: stats?.byType?.PLATFORM || 0,
  }), [stats]);

  const boothSizeCounts = useMemo(() => ({
    TWO_BY_TWO: stats?.byBoothSize?.TWO_BY_TWO || 0,
    'FOUR_BY_FOUR: ': stats?.byBoothSize?.FOUR_BY_FOUR || 0,
  }), [stats]);

  // ✅ Memoized stats for page header - only recalculate when stats change
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
            success: 'text-[var(--stat-icon-success-fg)] bg-[var(--stat-icon-success-bg)] border-[var(--stat-icon-success-border)]',
            warning: 'text-[var(--stat-icon-warning-fg)] bg-[var(--stat-icon-warning-bg)] border-[var(--stat-icon-warning-border)]',
            critical: 'text-[var(--stat-icon-critical-fg)] bg-[var(--stat-icon-critical-bg)] border-[var(--stat-icon-critical-border)]',
            info: 'text-[var(--stat-icon-info-fg)] bg-[var(--stat-icon-info-bg)] border-[var(--stat-icon-info-border)]',
            brand: 'text-[var(--stat-icon-brand-fg)] bg-[var(--stat-icon-brand-bg)] border-[var(--stat-icon-brand-border)]',
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

      <div className="mt-6">
        <VendorApplicationsTable
          data={applications}
          pageCount={pageCount}
          statusCounts={statusCounts}
          eventTypeCounts={eventTypeCounts}
          boothSizeCounts={boothSizeCounts}
          isSearching={isFetching}
          onPayVendorFee={handlePayVendorFee}
          onDownloadBadges={handleDownloadBadges}
          onSendBadgesToEmail={handleSendBadgesToEmail}
          onCancelApplication={handleCancelApplication}
        />
      </div>
    </div>
  );
}


