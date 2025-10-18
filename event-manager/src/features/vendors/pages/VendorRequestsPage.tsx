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
import { PageHeader } from "@/components/generic";
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
import type { VendorApplication } from "@event-manager/shared";

export function VendorRequestsPage() {
  // Pagination
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  
  // Search
  const [search] = useQueryState('search', parseAsString.withDefault(''));
  
  // Sorting
  const [sortState] = useQueryState('sort', parseAsJson<Array<{id: string; desc: boolean}>>([] as any).withDefault([]));
  
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
  const filters = useMemo(() => {
    const result: Record<string, any> = {};
    
    if (typeFilter.length > 0) {
      result.type = typeFilter[0];
    }
    
    if (statusFilter.length > 0) {
      result.status = statusFilter[0];
    }
    
    if (boothSizeFilter.length > 0) {
      result.boothSize = boothSizeFilter[0];
    }
    
    return result;
  }, [typeFilter, statusFilter, boothSizeFilter]);

  // Build query input
  const queryInput = useMemo(() => {
    const input: Record<string, any> = {
      page,
      limit: perPage,
    };
    
    if (search) {
      input.search = search;
    }
    
    if (parsedSort) {
      input.sortBy = parsedSort.sortBy;
      input.sortOrder = parsedSort.sortOrder;
    }
    
    Object.assign(input, filters);
    
    return input;
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
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve application");
    },
  });

  // Reject mutation
  const rejectMutation = trpc.vendorApplications.rejectApplication.useMutation({
    onSuccess: () => {
      toast.success("Application rejected");
      setRejectDialog({ open: false, applicationId: null, reason: "" });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reject application");
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
    <>
      <PageHeader
        title="Vendor Requests"
        description="Review and manage vendor participation requests for bazaars and platform booths"
        stats={headerStats}
      />

      <div className="mt-6">
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
      </div>

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
    </>
  );
}
