/**
 * Loyalty Program Page - Public View
 * 
 * Displays public loyalty partners list for all non-vendor users (Story #72)
 * Students, staff, and other roles can view available partner offers
 */

import { useEffect } from 'react';
import { usePageMeta } from '@/components/layout/page-meta-context';
import { trpc } from '@/lib/trpc';
import { Loader2, Users, Gift } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
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

  const showLoading = useDelayedLoading(isLoadingPartners);

  return (
    <div className="w-full py-6 px-4">

      {/* Partners List */}
      <div className="space-y-6">
        {showLoading ? (
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
              {partners.map((partner) => (
                <LoyaltyPartnerCard key={partner.id} partner={partner} />
              ))}
            </div>
          </>
        ) : (
          <div className="border border-dashed rounded-lg">
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              {/* Icon */}
              <div className="relative mb-4">
                <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10 blur-xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                  <Gift className="h-8 w-8 text-primary" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold mb-2">No Partners Yet</h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground max-w-md">
                Exclusive vendor partnerships and special offers will appear here. Check back soon for discounts at campus vendors!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
