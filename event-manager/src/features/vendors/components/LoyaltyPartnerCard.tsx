/**
 * Loyalty Partner Card Component
 * 
 * Displays loyalty partner information in a premium card format
 * Used across all roles to view loyalty partners
 * 
 * Features:
 * - Vendor company name and details
 * - Large centered discount display
 * - Promo code with copy functionality
 * - Expandable terms and conditions
 * - Premium hover effects and animations
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Sparkles, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LoyaltyPartner {
  id: string;
  vendorId: string;
  discountRate: number;
  promoCode: string;
  terms: string;
  vendor?: {
    id: string; 
    firstName?: string;
    lastName?: string;
    email?: string;
    companyName?: string;
  };
}

interface LoyaltyPartnerCardProps {
  partner: LoyaltyPartner;
}

export function LoyaltyPartnerCard({ 
  partner
}: LoyaltyPartnerCardProps) {
  const vendorName = partner.vendor?.companyName || 
                     `${partner.vendor?.firstName || ''} ${partner.vendor?.lastName || ''}`.trim() ||
                     'Partner';

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl group-hover:text-primary transition-colors">
              {vendorName}
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full cursor-pointer hover:bg-accent transition-colors"
            >
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
  );
}
