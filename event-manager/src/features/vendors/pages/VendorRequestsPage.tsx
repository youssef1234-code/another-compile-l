/**
 * Vendor Requests Page (Admin/Event Office Management)
 * 
 * ADMIN/EVENT OFFICE ONLY - Full management with approve/reject dialogs
 * For vendor view, see VendorApplicationsPage
 * 
 * Optimized for performance:
 * - useCallback for stable function references
 * - useMemo for expensive computations
 * - Minimal re-renders
 * 
 * Requirements #75, #77
 */

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useQueryState, parseAsInteger, parseAsString, parseAsArrayOf, parseAsJson } from "nuqs";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, XCircle, Clock, Package } from "lucide-react";
import { VendorRequestsTable } from "../components/vendor-requests-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import type { VendorApplication } from "../../../shared";
import { usePageMeta } from '@/components/layout/page-meta-context';
import { formatValidationErrors } from '@/lib/format-errors';

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

export function VendorRequestsPage() {
  const { setPageMeta } = usePageMeta();
  
  useEffect(() => {
    setPageMeta({
      title: 'Vendor Requests',
      description: 'Review and manage vendor participation requests for bazaars and platform booths',
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
  const [typeFilter] = useQueryState('type', parseAsArrayOf(parseAsString, ',').withDefault([]));
  const [statusFilter] = useQueryState('status', parseAsArrayOf(parseAsString, ',').withDefault([]));
  const [boothSizeFilter] = useQueryState('boothSize', parseAsArrayOf(parseAsString, ',').withDefault([]));

  const [approveDialog, setApproveDialog] = useState<{ open: boolean; applicationId: string | null }>({
    open: false,
    applicationId: null,
  });

  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    applicationId: string | null;
    reason: string;
  }>({
    open: false,
    applicationId: null,
    reason: "",
  });

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
    if (boothSizeValue === 'TWO_BY_TWO' || boothSizeValue === 'FOUR_BY_FOUR') {
      result.boothSize = boothSizeValue;
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
  const { data, refetch, isLoading, isFetching } = trpc.vendorApplications.getApplications.useQuery(
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

  // Get aggregated statistics from backend
  const { data: stats } = trpc.vendorApplications.getApplicationStats.useQuery();

  // Approve mutation
  const approveMutation = trpc.vendorApplications.approveApplication.useMutation({
    onSuccess: () => {
      toast.success("Application approved successfully");
      setApproveDialog({ open: false, applicationId: null });
      refetch();
    },
    onError: (error: unknown) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, {
        style: { whiteSpace: 'pre-line' },
      });
    },
  });

  // Reject mutation
  const rejectMutation = trpc.vendorApplications.rejectApplication.useMutation({
    onSuccess: () => {
      toast.success("Application rejected");
      setRejectDialog({ open: false, applicationId: null, reason: "" });
      refetch();
    },
    onError: (error: unknown) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, {
        style: { whiteSpace: 'pre-line' },
      });
    },
  });

  // ✅ Stable callback refs that never change
  const handleApproveRef = useRef((applicationId: string) => {
    setApproveDialog({ open: true, applicationId });
  });
  
  const handleRejectRef = useRef((applicationId: string) => {
    setRejectDialog({ open: true, applicationId, reason: "" });
  });
  
  // Update refs if needed (though these never change)
  useEffect(() => {
    handleApproveRef.current = (applicationId: string) => {
      setApproveDialog({ open: true, applicationId });
    };
    handleRejectRef.current = (applicationId: string) => {
      setRejectDialog({ open: true, applicationId, reason: "" });
    };
  });

  // Stable callback functions
  const handleApprove = useCallback((applicationId: string) => {
    handleApproveRef.current(applicationId);
  }, []);

  const handleReject = useCallback((applicationId: string) => {
    handleRejectRef.current(applicationId);
  }, []);

  const closeApproveDialog = useCallback(() => {
    setApproveDialog({ open: false, applicationId: null });
  }, []);

  const closeRejectDialog = useCallback(() => {
    setRejectDialog({ open: false, applicationId: null, reason: "" });
  }, []);

  const confirmApprove = useCallback(() => {
    if (approveDialog.applicationId) {
      approveMutation.mutate({ applicationId: approveDialog.applicationId });
    }
  }, [approveDialog.applicationId, approveMutation]);

  const confirmReject = useCallback(() => {
    if (rejectDialog.applicationId && rejectDialog.reason.trim()) {
      rejectMutation.mutate({
        applicationId: rejectDialog.applicationId,
        reason: rejectDialog.reason,
      });
    } else {
      toast.error("Rejection reason is required");
    }
  }, [rejectDialog.applicationId, rejectDialog.reason, rejectMutation]);

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
    FOUR_BY_FOUR: stats?.byBoothSize?.FOUR_BY_FOUR || 0,
  }), [stats]);

  // ✅ Memoized stats for page header - only recalculate when stats change
  const headerStats = useMemo(() => [
    { label: 'Total Requests', value: stats?.total || 0, icon: Package, colorRole: 'info' as const },
    { label: 'Approved', value: stats?.approved || 0, icon: CheckCircle2, colorRole: 'success' as const },
    { label: 'Pending Review', value: stats?.pending || 0, icon: Clock, colorRole: 'warning' as const },
    { label: 'Rejected', value: stats?.rejected || 0, icon: XCircle, colorRole: 'critical' as const },
  ], [stats]);

  const handleReasonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRejectDialog(prev => ({ ...prev, reason: e.target.value }));
  }, []);

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

      <VendorRequestsTable
          data={applications}
          pageCount={pageCount}
          statusCounts={statusCounts}
          eventTypeCounts={eventTypeCounts}
          boothSizeCounts={boothSizeCounts}
          onApprove={handleApprove}
          onReject={handleReject}
          isSearching={isLoading || isFetching}
        />

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialog.open} onOpenChange={closeApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this vendor application? The vendor will be notified.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeApproveDialog}>
              Cancel
            </Button>
            <Button onClick={confirmApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog with Reason */}
      <Dialog open={rejectDialog.open} onOpenChange={closeRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application. The vendor will receive this feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for rejection..."
                value={rejectDialog.reason}
                onChange={handleReasonChange}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeRejectDialog}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectMutation.isPending || !rejectDialog.reason.trim()}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
