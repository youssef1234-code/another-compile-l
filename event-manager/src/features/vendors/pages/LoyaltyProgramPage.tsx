/**
 * Loyalty Program Page - Public View
 * 
 * Displays public loyalty partners list for all non-vendor users (Story #72)
 * Students, staff, and other roles can view available partner offers
 */

import { useEffect } from 'react';
import { usePageMeta } from '@/components/layout/page-meta-context';
import { trpc } from '@/lib/trpc';
import { Loader2, Users, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoyaltyPartnerCard } from '../components/LoyaltyPartnerCard';

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

export function LoyaltyProgramPage() {
  const { setPageMeta } = usePageMeta();

  useEffect(() => {
    setPageMeta({
      title: 'GUC Loyalty Program',
      description: 'Discover exclusive vendor partnerships and special offers',
    });
  }, [setPageMeta]);

  // Fetch all loyalty partners (public)
  const {
    data: partners,
    isLoading: isLoadingPartners,
  } = trpc.loyalty.getAllPartners.useQuery() as { data: LoyaltyPartner[] | undefined; isLoading: boolean };

  return (
    <div className="w-full py-6 px-4">

      {/* Partners List */}
      <div className="space-y-6">
        {isLoadingPartners ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : partners && partners.length > 0 ? (
          <>
            <Alert>
              <Users className="h-4 w-4" />
              <AlertTitle>Exclusive GUC Partner Offers</AlertTitle>
              <AlertDescription>
                Show your GUC ID and use the promo codes below to enjoy exclusive discounts at our partner vendors!
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(partners as any[]).map((partner: any) => (
                <LoyaltyPartnerCard key={partner.id} partner={partner} />
              ))}
            </div>
          </>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Partners Yet</AlertTitle>
            <AlertDescription>
              There are no loyalty partners at the moment. Check back later for exclusive offers!
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
