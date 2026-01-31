/**
 * Vendor Loyalty Program Page
 * 
 * Allows vendors to:
 * - View their current loyalty program status
 * - Apply to join the loyalty program (Story #70)
 * - Cancel their participation (Story #71)
 * - View their application history
 * 
 * NOTE: Vendors cannot see the list of other accepted partners
 */

import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'react-hot-toast';
import { usePageMeta } from '@/components/layout/page-meta-context';
import { Loader2, AlertCircle, CheckCircle2, Ban } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { LoyaltyApplicationForm } from '../components/LoyaltyApplicationForm';
import { VendorLoyaltyStatus } from '../components/VendorLoyaltyStatus';
import type { ApplyToLoyaltyInput } from '../../../shared';

interface LoyaltyRequest {
  id: string;
  vendorId: string;
  status: 'active' | 'cancelled';
  discountRate: number;
  promoCode: string;
  terms: string;
  createdAt: string;
  updatedAt?: string;
  rejectionReason?: string;
  reviewedAt?: string;
}

export function VendorLoyaltyPage() {
  const { setPageMeta } = usePageMeta();

  useEffect(() => {
    setPageMeta({
      title: 'My Loyalty Program',
      description: 'Manage your loyalty program participation and offer exclusive discounts',
    });
  }, [setPageMeta]);

  // Fetch vendor's own requests
  const {
    data: vendorRequests,
    isLoading: isLoadingRequests,
    refetch: refetchRequests,
  } = trpc.loyalty.getVendorRequests.useQuery(undefined, {
    enabled: true,
  }) as { data: LoyaltyRequest[] | undefined; isLoading: boolean; refetch: () => void };

  // Check vendor status
  const hasActiveRequest = vendorRequests?.some((r: LoyaltyRequest) => r.status === 'active') || false;
  const canApply = !hasActiveRequest;

  // Mutations
  const applyMutation = trpc.loyalty.applyToProgram.useMutation({
    onSuccess: () => {
      toast.success('Application submitted and activated successfully!');
      refetchRequests();
    },
    onError: (error) => {
      const errorMessage = error.message || 'Failed to submit application';
      toast.error(errorMessage);
    },
  });

  const cancelMutation = trpc.loyalty.cancelParticipation.useMutation({
    onSuccess: () => {
      toast.success('Application cancelled successfully');
      refetchRequests();
    },
    onError: (error) => {
      const errorMessage = error.message || 'Failed to cancel application';
      toast.error(errorMessage);
    },
  });

  const handleApply = (data: ApplyToLoyaltyInput) => {
    applyMutation.mutate(data);
  };

  const handleCancel = () => {
    cancelMutation.mutate({});
  };

  return (
    <>
      {/* Content with constrained width */}
      <div className="mx-auto max-w-5xl space-y-6 mt-6">
        {isLoadingRequests ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Current Status */}
            {vendorRequests && vendorRequests.length > 0 && hasActiveRequest && (
              <VendorLoyaltyStatus
                requests={vendorRequests}
                onCancel={handleCancel}
                isCancelling={cancelMutation.isPending}
              />
            )}

            {/* Application Form */}
            {canApply && (
              <LoyaltyApplicationForm
                onSubmit={handleApply}
                isLoading={applyMutation.isPending}
              />
            )}

            {/* No applications yet */}
            {(!vendorRequests || vendorRequests.length === 0) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Applications</AlertTitle>
                <AlertDescription>
                  You haven't applied to the loyalty program yet. Submit an application above to get started.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>

      {/* Full Width Application History */}
      {!isLoadingRequests && vendorRequests && vendorRequests.length > 0 && (
        <div className="w-full mt-8">
          <div className="px-4 mb-3">
            <h3 className="text-lg font-semibold">Application History</h3>
          </div>
          <div className="px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendorRequests.map((request: LoyaltyRequest, index: number) => {
                    const getStatusIcon = () => {
                      switch (request.status) {
                        case 'cancelled':
                          return <Ban className="h-5 w-5 text-muted-foreground" />;
                        case 'active':
                          return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
                      }
                    };

                    const getStatusLabel = () => {
                      switch (request.status) {
                        case 'cancelled':
                          return 'Cancelled';
                        case 'active':
                          return 'Active';
                      }
                    };

                    const getStatusBadge = () => {
                      switch (request.status) {
                        case 'cancelled':
                          return null;
                        case 'active':
                          return (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                              Active
                            </Badge>
                          );
                      }
                    };

                    const isCurrent = index === 0 && request.status === 'active';

                    return (
                      <div
                        key={request.id}
                        className={`p-4 rounded-lg border space-y-3 bg-card ${
                          isCurrent 
                            ? 'border-primary/50 shadow-sm' 
                            : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon()}
                            <div className="font-medium">{getStatusLabel()}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge()}
                            <div className="text-sm text-muted-foreground">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Discount:</span>{' '}
                            <span className="font-medium">{request.discountRate}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Promo Code:</span>{' '}
                            <code className="font-mono font-medium">{request.promoCode}</code>
                          </div>
                        </div>

                        <div className="text-sm">
                          <div className="text-muted-foreground mb-1">Terms & Conditions:</div>
                          <div className="p-2 rounded bg-muted/50 text-xs whitespace-pre-wrap max-h-20 overflow-y-auto">
                            {request.terms}
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
