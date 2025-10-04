/**
 * Vendor Approvals Page
 * Admin page to review and approve/reject vendor applications
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/generic';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2, Mail, Calendar, FileImage, CheckCircle, XCircle } from 'lucide-react';

export function VendorApprovalsPage() {
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [action, setAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: vendors, isLoading, refetch } = trpc.auth.getPendingVendors.useQuery();

  const processApprovalMutation = trpc.auth.processVendorApproval.useMutation({
    onSuccess: () => {
      toast.success(action === 'APPROVED' ? 'Vendor approved successfully!' : 'Vendor rejected');
      setSelectedVendor(null);
      setAction(null);
      setRejectionReason('');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to process approval');
    },
  });

  const handleApprove = (vendorId: string) => {
    setSelectedVendor(vendorId);
    setAction('APPROVED');
  };

  const handleReject = (vendorId: string) => {
    setSelectedVendor(vendorId);
    setAction('REJECTED');
  };

  const confirmAction = () => {
    if (!selectedVendor || !action) return;

    processApprovalMutation.mutate({
      userId: selectedVendor,
      status: action,
      rejectionReason: action === 'REJECTED' ? rejectionReason : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendor Approvals</h1>
        <p className="text-neutral-500 mt-2">
          Review vendor applications and verify tax card documentation
        </p>
      </div>

      {!vendors || vendors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-500">No pending vendor approvals</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {vendors.map((vendor) => (
            <Card key={vendor.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {vendor.companyName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {vendor.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Applied {new Date(vendor.createdAt).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant={vendor.isVerified ? 'default' : 'secondary'}>
                    {vendor.isVerified ? 'Email Verified' : 'Email Pending'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>First Name</Label>
                    <p className="text-sm">{vendor.firstName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label>Last Name</Label>
                    <p className="text-sm">{vendor.lastName}</p>
                  </div>
                </div>

                {/* Tax Card Preview */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileImage className="h-4 w-4" />
                    Tax Card Documentation
                  </Label>
                  {vendor.taxCardUrl ? (
                    <div className="border rounded-md p-4 bg-neutral-50">
                      <img
                        src={vendor.taxCardUrl}
                        alt="Tax Card"
                        className="max-w-full max-h-96 mx-auto rounded"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">No tax card uploaded</p>
                  )}
                </div>

                {/* Logo Preview (if available) */}
                {vendor.logoUrl && (
                  <div className="space-y-2">
                    <Label>Company Logo</Label>
                    <div className="border rounded-md p-4 bg-neutral-50">
                      <img
                        src={vendor.logoUrl}
                        alt="Company Logo"
                        className="max-w-xs max-h-32 mx-auto rounded"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleReject(vendor.id)}
                    disabled={processApprovalMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(vendor.id)}
                    disabled={processApprovalMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedVendor && !!action} onOpenChange={() => {
        setSelectedVendor(null);
        setAction(null);
        setRejectionReason('');
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === 'APPROVED' ? 'Approve Vendor?' : 'Reject Vendor?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === 'APPROVED' 
                ? 'This vendor will be approved and able to create events.'
                : 'This vendor will be rejected and unable to access the platform.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {action === 'REJECTED' && (
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                placeholder="Explain why this vendor is being rejected..."
                rows={3}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={
                processApprovalMutation.isPending ||
                (action === 'REJECTED' && !rejectionReason.trim())
              }
            >
              {processApprovalMutation.isPending ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
