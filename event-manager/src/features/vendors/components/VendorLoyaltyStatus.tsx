/**
 * Vendor Loyalty Status Component
 * 
 * Shows vendor's current loyalty status and available actions
 * Handles two states: not applied, active
 * 
 * Story #70, #71
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { CheckCircle2, Loader2, Tag, Percent } from 'lucide-react';

interface LoyaltyRequest {
  id: string;
  vendorId: string;
  status: 'active' | 'cancelled';
  discountRate: number;
  promoCode: string;
  terms: string;
  createdAt: string;
  updatedAt?: string;
}

interface VendorLoyaltyStatusProps {
  requests: LoyaltyRequest[];
  onCancel: () => void;
  isCancelling: boolean;
}

export function VendorLoyaltyStatus({ 
  requests, 
  onCancel,
  isCancelling 
}: VendorLoyaltyStatusProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Find the active request
  const hasActive = requests.some(r => r.status === 'active');

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    onCancel();
  };

  // Show current active status
  if (hasActive) {
    const activeRequest = requests.find(r => r.status === 'active');
    
    if (!activeRequest) return null;

    return (
      <>
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Active Loyalty Partner
                </CardTitle>
                <CardDescription>
                  You are currently enrolled in the GUC Loyalty Program
                </CardDescription>
              </div>

              <Badge 
                variant="default"
                className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
              >
                Active
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Application Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5" />
                  Discount Rate
                </div>
                <div className="text-lg font-semibold">{activeRequest.discountRate}%</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Promo Code
                </div>
                <code className="text-lg font-mono font-semibold">{activeRequest.promoCode}</code>
              </div>
            </div>

            {/* Terms */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Terms & Conditions</div>
              <div className="text-sm text-muted-foreground p-3 rounded-md bg-muted/50 whitespace-pre-wrap">
                {activeRequest.terms}
              </div>
            </div>

            {/* Timestamps */}
            <div className="text-xs text-muted-foreground">
              <div>Applied: {new Date(activeRequest.createdAt).toLocaleString()}</div>
            </div>

            {/* Cancel Button */}
            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                onClick={handleCancelClick}
                disabled={isCancelling}
                className="w-full cursor-pointer hover:bg-destructive/90 transition-colors"
              >
                {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Leave Loyalty Program
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave Loyalty Program?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to leave the loyalty program? Your vendor profile will be removed from the partners list. You can re-apply later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer hover:bg-accent transition-colors">
                Keep Enrollment
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmCancel}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer transition-colors"
              >
                Confirm Cancellation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return null;
}
