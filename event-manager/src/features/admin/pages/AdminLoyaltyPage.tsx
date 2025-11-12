/**
 * Admin Loyalty Management Page
 * 
 * ADMIN ONLY - Manage all loyalty program requests
 * - View all requests with filtering
 * - Accept or reject pending applications
 * - View request history
 * 
 * Admin Stories: Review and manage loyalty program applications
 */

import { useMemo, useState, useEffect } from 'react';
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';
import { trpc } from '@/lib/trpc';
import { toast } from 'react-hot-toast';
import { usePageMeta } from '@/components/layout/page-meta-context';
import { CheckCircle2, XCircle, Clock, Loader2, AlertCircle, Filter, Sparkles, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type LoyaltyRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

interface LoyaltyRequest {
  id: string;
  vendorId: string;
  status: LoyaltyRequestStatus;
  discountRate: number;
  promoCode: string;
  terms: string;
  createdAt: string;
  updatedAt?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  vendor?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    companyName?: string;
  };
}

export function AdminLoyaltyManagementPage() {
  const { setPageMeta } = usePageMeta();

  useEffect(() => {
    setPageMeta({
      title: 'Loyalty Program Management',
      description: 'Review and manage vendor loyalty program applications',
    });
  }, [setPageMeta]);

  // URL State
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [limit] = useQueryState('limit', parseAsInteger.withDefault(20));
  const [statusFilter] = useQueryState('status', parseAsString);

  // Dialogs
  const [acceptDialog, setAcceptDialog] = useState<{ open: boolean; requestId: string | null }>({
    open: false,
    requestId: null,
  });

  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    requestId: string | null;
    reason: string;
  }>({
    open: false,
    requestId: null,
    reason: '',
  });

  // Filter - default to showing pending requests
  const statusFilterValue = (statusFilter || 'pending') as LoyaltyRequestStatus | 'all';

  // Fetch loyalty partners (accepted only) for the "Loyalty Program" tab
  const { 
    data: partners, 
    isLoading: isLoadingPartners,
    refetch: refetchPartners 
  } = trpc.loyalty.getAllPartners.useQuery();

  // Fetch ALL requests when "all" is selected
  const {
    data: allData,
    isLoading: isLoadingAllData,
    refetch: refetchAllData,
  } = trpc.loyalty.getAllRequests.useQuery(
    {
      status: undefined, // No filter - get everything
      page,
      limit: 100, // Higher limit for showing all
    },
    { enabled: statusFilterValue === 'all' }
  );

  // Fetch pending requests (default view)
  const {
    data: pendingData,
    isLoading: isLoadingPending,
    refetch: refetchPending,
  } = trpc.loyalty.getPendingRequests.useQuery(
    { page, limit },
    { enabled: statusFilterValue === 'pending' }
  );

  // Fetch requests with specific status filter
  const {
    data: filteredData,
    isLoading: isLoadingFiltered,
    refetch: refetchFiltered,
  } = trpc.loyalty.getAllRequests.useQuery(
    {
      status: statusFilterValue as LoyaltyRequestStatus,
      page,
      limit,
    },
    { enabled: statusFilterValue !== 'pending' && statusFilterValue !== 'all' }
  );

  // Mutations
  const reviewMutation = trpc.loyalty.reviewRequest.useMutation({
    onSuccess: (_, variables) => {
      const action = variables.action === 'accept' ? 'accepted' : 'rejected';
      toast.success(`Application ${action} successfully!`);
      refetchPending();
      refetchFiltered();
      refetchAllData();
      refetchPartners(); // Refresh partners list when accepting/rejecting
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to review application');
    },
  });

  const handleAccept = () => {
    if (!acceptDialog.requestId) return;

    reviewMutation.mutate({
      requestId: acceptDialog.requestId,
      action: 'accept',
    });

    setAcceptDialog({ open: false, requestId: null });
  };

  const handleReject = () => {
    if (!rejectDialog.requestId) return;
    
    const reason = rejectDialog.reason.trim();
    
    if (!reason) {
      toast.error('Rejection reason is required');
      return;
    }

    if (reason.length < 10) {
      toast.error('Rejection reason must be at least 10 characters');
      return;
    }

    reviewMutation.mutate({
      requestId: rejectDialog.requestId,
      action: 'reject',
      rejectionReason: reason,
    });

    setRejectDialog({ open: false, requestId: null, reason: '' });
  };

  // Determine which data to show
  const requests = useMemo(() => {
    if (statusFilterValue === 'all') {
      return allData?.requests || [];
    }
    if (statusFilterValue === 'pending') {
      return pendingData?.requests || [];
    }
    return filteredData?.requests || [];
  }, [statusFilterValue, allData, pendingData, filteredData]);

  const totalRequests = useMemo(() => {
    if (statusFilterValue === 'all') {
      return allData?.total || 0;
    }
    if (statusFilterValue === 'pending') {
      return pendingData?.total || 0;
    }
    return filteredData?.total || 0;
  }, [statusFilterValue, allData, pendingData, filteredData]);

  const isLoading = isLoadingAllData || isLoadingPending || isLoadingFiltered;

  const getStatusBadge = (status: LoyaltyRequestStatus) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"><CheckCircle2 className="h-3 w-3 mr-1" />Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
    }
  };

  const getVendorName = (request: LoyaltyRequest) => {
    return request.vendor?.companyName ||
           `${request.vendor?.firstName || ''} ${request.vendor?.lastName || ''}`.trim() ||
           'Unknown Vendor';
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Loyalty Program Management</h1>
          <p className="text-muted-foreground">
            Review vendor applications and view active partners
          </p>
        </div>
      </div>

      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="manage">Manage Requests</TabsTrigger>
          <TabsTrigger value="partners">Loyalty Program</TabsTrigger>
        </TabsList>

        {/* Manage Requests Tab */}
        <TabsContent value="manage" className="space-y-6">
          {/* Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-xs">
                  <Label>Status</Label>
                  <Select
                    value={statusFilterValue}
                    onValueChange={(value) => {
                      const url = new URL(window.location.href);
                      if (value === 'pending') {
                        // Default is pending, so remove the param to keep URL clean
                        url.searchParams.delete('status');
                      } else {
                        url.searchParams.set('status', value);
                      }
                      window.history.pushState({}, '', url);
                      window.location.reload();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pending Requests" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending Only (Default)</SelectItem>
                      <SelectItem value="all">All Requests</SelectItem>
                      <SelectItem value="accepted">Accepted Only</SelectItem>
                      <SelectItem value="rejected">Rejected Only</SelectItem>
                      <SelectItem value="cancelled">Cancelled Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-sm text-muted-foreground self-end pb-2">
                  Showing {requests.length} of {totalRequests} requests
                </div>
              </div>
            </CardContent>
          </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Requests Found</AlertTitle>
          <AlertDescription>
            {statusFilterValue 
              ? `There are no ${statusFilterValue} requests at the moment.`
              : 'There are no loyalty program requests at the moment.'}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {(requests as any[]).map((request: any) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Vendor Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold text-lg">{getVendorName(request)}</h3>
                        {request.vendor?.email && (
                          <p className="text-sm text-muted-foreground">{request.vendor.email}</p>
                        )}
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <span className="text-sm text-muted-foreground block mb-1">Discount Rate</span>
                        <div className="font-semibold text-lg">{request.discountRate}%</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground block mb-1">Promo Code</span>
                        <code className="font-mono font-semibold text-sm">{request.promoCode}</code>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-muted-foreground">Terms & Conditions</span>
                      <div className="text-sm mt-1 p-2 rounded bg-muted/50 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {request.terms}
                      </div>
                    </div>

                    {request.rejectionReason && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Rejection Reason</AlertTitle>
                        <AlertDescription>{request.rejectionReason}</AlertDescription>
                      </Alert>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Applied: {new Date(request.createdAt).toLocaleString()}
                      {request.reviewedAt && ` • Reviewed: ${new Date(request.reviewedAt).toLocaleString()}`}
                    </div>
                  </div>

                  {/* Actions */}
                  {request.status === 'pending' && (
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => setAcceptDialog({ open: true, requestId: request.id })}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRejectDialog({ open: true, requestId: request.id, reason: '' })}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

        </TabsContent>

        {/* Loyalty Program Tab */}
        <TabsContent value="partners" className="space-y-6">
          {isLoadingPartners ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !partners || partners.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Partners Yet</AlertTitle>
              <AlertDescription>
                There are no accepted loyalty partners at the moment.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(partners as any[]).map((partner: any) => (
                <Card key={partner.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {partner.vendor?.companyName || 
                           `${partner.vendor?.firstName || ''} ${partner.vendor?.lastName || ''}`.trim() ||
                           'Partner'}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {partner.vendor?.email}
                        </CardDescription>
                      </div>
                      <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Partner
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Discount */}
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-primary">{partner.discountRate}%</div>
                      <div className="text-sm text-muted-foreground">Exclusive Discount</div>
                    </div>

                    {/* Promo Code */}
                    <div>
                      <Label className="text-xs text-muted-foreground">Promo Code</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 px-3 py-2 bg-muted rounded font-mono text-sm font-semibold">
                          {partner.promoCode}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          className="cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => {
                            navigator.clipboard.writeText(partner.promoCode);
                            toast.success('Promo code copied!');
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Terms */}
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full cursor-pointer hover:bg-accent transition-colors">
                          View Terms & Conditions
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="text-sm p-3 rounded-lg bg-muted/50 whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {partner.terms}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Accept Dialog */}
      <Dialog open={acceptDialog.open} onOpenChange={(open) => setAcceptDialog({ ...acceptDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Loyalty Application</DialogTitle>
            <DialogDescription>
              This vendor will be added to the loyalty partners list and displayed publicly.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptDialog({ open: false, requestId: null })}>
              Cancel
            </Button>
            <Button onClick={handleAccept} disabled={reviewMutation.isPending}>
              {reviewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Accept Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ ...rejectDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Loyalty Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be visible to the vendor.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <span className={`text-xs ${rejectDialog.reason.trim().length < 10 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {rejectDialog.reason.trim().length}/10 min
              </span>
            </div>
            <Textarea
              id="rejection-reason"
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
              placeholder="e.g., Discount rate is too low, incomplete terms, etc."
              rows={4}
              className="mt-2"
            />
            {rejectDialog.reason.trim().length > 0 && rejectDialog.reason.trim().length < 10 && (
              <p className="text-xs text-destructive">
                Please provide at least 10 characters
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, requestId: null, reason: '' })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={reviewMutation.isPending || rejectDialog.reason.trim().length < 10}
            >
              {reviewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
