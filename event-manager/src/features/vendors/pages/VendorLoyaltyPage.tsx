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
import { Loader2, Sparkles, AlertCircle, CheckCircle2, XCircle, Clock, Ban } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { LoyaltyApplicationForm } from '../components/LoyaltyApplicationForm';
import { VendorLoyaltyStatus } from '../components/VendorLoyaltyStatus';
import type { ApplyToLoyaltyInput } from '@event-manager/shared';

interface LoyaltyRequest {
  id: string;
  vendorId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
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
  const hasPendingRequest = vendorRequests?.some((r: any) => r.status === 'pending') || false;
  const hasAcceptedRequest = vendorRequests?.some((r: any) => r.status === 'accepted') || false;
  const canApply = !hasPendingRequest && !hasAcceptedRequest;

  // Mutations
  const applyMutation = trpc.loyalty.applyToProgram.useMutation({
    onSuccess: () => {
      toast.success('Application submitted successfully! Waiting for admin review.');
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
    onError: (error: any) => {
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
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm">
            <Sparkles className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Loyalty Program</h1>
            <p className="text-muted-foreground mt-1">
              Offer exclusive discounts to the GUC community
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {isLoadingRequests ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Show rejection alert only if most recent is rejected */}
            {vendorRequests && vendorRequests.length > 0 && vendorRequests[0].status === 'rejected' && (
              <Alert variant="destructive" className="mb-6">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Previous Application Rejected</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2 mt-2">
                    <div>
                      Your last application (submitted {new Date(vendorRequests[0].createdAt).toLocaleDateString()}) was rejected.
                    </div>
                    {vendorRequests[0].rejectionReason && (
                      <div className="p-2 rounded bg-destructive/10 text-sm">
                        <span className="font-medium">Reason:</span> {vendorRequests[0].rejectionReason}
                      </div>
                    )}
                    <div className="text-sm">
                      You can submit a new application with updated information below.
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Current Status */}
            {vendorRequests && vendorRequests.length > 0 && (hasPendingRequest || hasAcceptedRequest) && (
              <VendorLoyaltyStatus
                requests={vendorRequests as any}
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

            {/* Full Application History */}
            {vendorRequests && vendorRequests.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Application History</h3>
                <div className="grid gap-4">
                  {(vendorRequests as any[]).map((request: any, index: number) => {
                    const getStatusIcon = () => {
                      switch (request.status) {
                        case 'rejected':
                          return <XCircle className="h-5 w-5 text-destructive" />;
                        case 'cancelled':
                          return <Ban className="h-5 w-5 text-muted-foreground" />;
                        case 'pending':
                          return <Clock className="h-5 w-5 text-amber-500" />;
                        case 'accepted':
                          return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
                      }
                    };

                    const getStatusLabel = () => {
                      switch (request.status) {
                        case 'rejected':
                          return 'Rejected';
                        case 'cancelled':
                          return 'Cancelled';
                        case 'pending':
                          return 'Pending';
                        case 'accepted':
                          return 'Accepted';
                      }
                    };

                    const isCurrent = index === 0 && (request.status === 'pending' || request.status === 'accepted');

                    return (
                      <div
                        key={request.id}
                        className={`p-4 rounded-lg border space-y-3 ${
                          isCurrent 
                            ? 'bg-primary/5 border-primary/50' 
                            : 'bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon()}
                            <div className="font-medium">{getStatusLabel()}</div>
                            {isCurrent && (
                              <Badge variant="secondary" className="text-xs">Current</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
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

                        {request.rejectionReason && (
                          <div className="text-sm p-2 rounded bg-destructive/10 text-destructive">
                            <span className="font-medium">Rejection Reason:</span> {request.rejectionReason}
                          </div>
                        )}

                        {request.reviewedAt && (
                          <div className="text-xs text-muted-foreground">
                            Reviewed: {new Date(request.reviewedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
