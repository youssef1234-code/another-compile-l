/**
 * Vendor Dashboard
 * 
 * Enhanced dashboard with welcome section, business metrics,
 * application tracking, and growth opportunities
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Store, 
  Calendar, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Heart,
  MapPin,
  FileText,
  Building2,
  Sparkles,
  CreditCard,
  TrendingUp,
  Target,
  Rocket,
  AlertCircle,
  Award,
  ShoppingBag
} from 'lucide-react';
import { formatDate } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import NumberFlow from '@number-flow/react';
import type { Event } from '@event-manager/shared';

export function VendorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Fetch vendor's applications
  const { data: applicationsData, isLoading: applicationsLoading } = trpc.vendorApplications.getApplications.useQuery({
    page: 1,
    limit: 50,
  });
  
  // Fetch upcoming bazaars
  const { data: bazaarsData, isLoading: bazaarsLoading } = trpc.events.getEvents.useQuery({
    page: 1,
    limit: 20,
    type: 'BAZAAR',
  });
  
  // Fetch loyalty program status
  const { data: loyaltyData } = trpc.loyalty.getVendorRequests.useQuery();
  
  // Check for existing applications
  const bazaarIds = bazaarsData?.events?.map((b: Event) => b.id) || [];
  const { data: existingApplications } = trpc.vendorApplications.checkExistingApplications.useQuery(
    { bazaarIds },
    { enabled: bazaarIds.length > 0 }
  );
  
  const applications = applicationsData?.applications || [];
  const bazaars = bazaarsData?.events || [];

  // Analytics calculations
  const analytics = useMemo(() => {
    const statusBreakdown: Record<string, number> = {};
    applications.forEach((a: any) => {
      statusBreakdown[a.status] = (statusBreakdown[a.status] || 0) + 1;
    });
    
    const pending = applications.filter((a: any) => a.status === 'PENDING');
    const approved = applications.filter((a: any) => a.status === 'APPROVED' || a.status === 'CONFIRMED');
    const paymentPending = applications.filter((a: any) => a.status === 'PAYMENT_PENDING');
    const rejected = applications.filter((a: any) => a.status === 'REJECTED');
    
    const upcomingBazaars = bazaars.filter((b: Event) => b.startDate && new Date(b.startDate) > new Date());
    
    // Get next bazaar with confirmed booth
    const confirmedApps = applications.filter((a: any) => a.status === 'CONFIRMED');
    const nextBooth = confirmedApps.find((a: any) => {
      const bazaar = a.bazaar;
      return bazaar?.startDate && new Date(bazaar.startDate) > new Date();
    }) as { bazaar?: { name?: string; startDate?: string }; boothNumber?: string } | undefined;
    
    const loyaltyRequests = loyaltyData || [];
    const activeLoyalty = loyaltyRequests.filter((r: any) => r.status === 'APPROVED').length;
    const pendingLoyalty = loyaltyRequests.filter((r: any) => r.status === 'PENDING').length;
    
    const applicationBazaarIds = new Set(existingApplications?.map((a: any) => a.bazaarId) || []);
    
    // Success rate
    const totalDecided = approved.length + rejected.length;
    const successRate = totalDecided > 0 ? Math.round((approved.length / totalDecided) * 100) : 0;
    
    return {
      statusBreakdown,
      pending,
      approved,
      paymentPending,
      rejected,
      upcomingBazaars,
      activeLoyalty,
      pendingLoyalty,
      applicationBazaarIds,
      nextBooth,
      successRate,
      totalApplications: applications.length,
      actionRequired: pending.length + paymentPending.length,
    };
  }, [applications, bazaars, loyaltyData, existingApplications]);

  // Get greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const isLoading = applicationsLoading || bazaarsLoading;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Section */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[hsl(220,80%,45%)] via-[hsl(220,80%,50%)] to-[hsl(220,80%,55%)] text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItMnptMCAwYzAtMiAyLTQgMi00czIgMiAyIDRjMCAyLTIgNC0yIDRzLTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm text-white/80">{getGreeting()}</span>
                  <Sparkles className="h-4 w-4 text-white/60" />
                </div>
                <h1 className="text-xl font-bold">{user?.companyName || 'Your Business'}</h1>
                <p className="text-white/70 text-sm">
                  {analytics.approved.length > 0 
                    ? `${analytics.approved.length} active booth${analytics.approved.length > 1 ? 's' : ''} secured`
                    : "Ready to grow your business at campus events?"
                  }
                </p>
              </div>
            </div>
            
            {/* Next Booth Info */}
            {analytics.nextBooth && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-xs text-white/70 uppercase tracking-wide mb-1">Next Event</p>
                <p className="font-semibold text-sm mb-1 truncate max-w-[200px]">
                  {analytics.nextBooth.bazaar?.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <Calendar className="h-3 w-3" />
                  {analytics.nextBooth.bazaar?.startDate 
                    ? formatDate(analytics.nextBooth.bazaar.startDate)
                    : 'TBD'
                  }
                  {analytics.nextBooth.boothNumber && (
                    <>
                      <span className="text-white/40">•</span>
                      <span>Booth #{analytics.nextBooth.boothNumber}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Booths Secured */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--stat-icon-success-bg)] text-[var(--stat-icon-success-fg)]">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Booths Secured</p>
              {isLoading ? (
                <Skeleton className="h-6 w-8 mt-0.5" />
              ) : (
                <p className="text-xl font-semibold">
                  <NumberFlow value={analytics.approved.length} />
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Total Applications */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[hsl(220,80%,50%)]/10 text-[hsl(220,80%,50%)]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Applications</p>
              {isLoading ? (
                <Skeleton className="h-6 w-8 mt-0.5" />
              ) : (
                <p className="text-xl font-semibold">
                  <NumberFlow value={analytics.totalApplications} />
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Loyalty Programs */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[hsl(220,80%,60%)]/10 text-[hsl(220,80%,60%)]">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Loyalty Partners</p>
              {isLoading ? (
                <Skeleton className="h-6 w-8 mt-0.5" />
              ) : (
                <p className="text-xl font-semibold">
                  <NumberFlow value={analytics.activeLoyalty} />
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Action Required */}
        <Card className={cn(
          "p-4",
          analytics.actionRequired > 0 && "ring-1 ring-[hsl(220,80%,50%)]/30 bg-[hsl(220,80%,50%)]/5"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 flex items-center justify-center rounded-lg",
              analytics.actionRequired > 0 
                ? "bg-[hsl(220,80%,50%)]/20 text-[hsl(220,80%,50%)]"
                : "bg-muted text-muted-foreground"
            )}>
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Action Needed</p>
              {isLoading ? (
                <Skeleton className="h-6 w-8 mt-0.5" />
              ) : (
                <p className="text-xl font-semibold">
                  <NumberFlow value={analytics.actionRequired} />
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Pending Banner */}
      {analytics.paymentPending.length > 0 && (
        <Card className="border-[hsl(220,80%,50%)]/50 bg-gradient-to-r from-[hsl(220,80%,50%)]/10 to-[hsl(220,80%,60%)]/10">
          <div className="p-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[hsl(220,80%,50%)]/20">
                <CreditCard className="h-5 w-5 text-[hsl(220,80%,50%)]" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Payment Required</h3>
                <p className="text-xs text-muted-foreground">
                  {analytics.paymentPending.length} booth{analytics.paymentPending.length > 1 ? 's' : ''} awaiting payment confirmation
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate(ROUTES.VENDOR_APPLICATIONS)}>
              <CreditCard className="h-4 w-4 mr-1" />
              Complete Payment
            </Button>
          </div>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Applications and Opportunities */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recent Applications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-[hsl(220,80%,50%)]" />
                Your Applications
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.VENDOR_APPLICATIONS)} className="text-xs">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            
            {applicationsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-3">
                    <Skeleton className="h-14 w-full" />
                  </Card>
                ))}
              </div>
            ) : applications.length > 0 ? (
              <div className="space-y-2">
                {applications.slice(0, 4).map((app: any) => {
                  const statusConfig: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
                    CONFIRMED: { color: 'bg-[hsl(142,76%,45%)]', icon: CheckCircle, label: 'Confirmed' },
                    APPROVED: { color: 'bg-[hsl(220,80%,50%)]', icon: CheckCircle, label: 'Approved' },
                    PENDING: { color: 'bg-[hsl(220,80%,65%)]', icon: Clock, label: 'Pending' },
                    PAYMENT_PENDING: { color: 'bg-[hsl(38,92%,50%)]', icon: CreditCard, label: 'Pay Now' },
                    REJECTED: { color: 'bg-muted', icon: AlertCircle, label: 'Rejected' },
                  };
                  const config = statusConfig[app.status] || statusConfig.PENDING;
                  const StatusIcon = config.icon;
                  
                  return (
                    <Card 
                      key={app.id}
                      className={cn(
                        "p-3 cursor-pointer transition-all hover:shadow-md group",
                        app.status === 'PAYMENT_PENDING' && "ring-1 ring-[hsl(38,92%,50%)]/30"
                      )}
                      onClick={() => navigate(ROUTES.VENDOR_APPLICATIONS)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0",
                          config.color
                        )}>
                          <Store className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm truncate">{app.bazaar?.name || 'Bazaar'}</span>
                            <Badge 
                              variant={app.status === 'CONFIRMED' ? 'default' : 'outline'} 
                              className={cn(
                                "text-[10px] px-1.5",
                                app.status === 'CONFIRMED' && "bg-[hsl(142,76%,45%)]",
                                app.status === 'PAYMENT_PENDING' && "border-[hsl(38,92%,50%)] text-[hsl(38,92%,50%)]"
                              )}
                            >
                              <StatusIcon className="h-2.5 w-2.5 mr-1" />
                              {config.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {app.bazaar?.startDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(app.bazaar.startDate)}
                              </span>
                            )}
                            {app.boothNumber && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Booth #{app.boothNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-6 text-center bg-muted/30">
                <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="font-medium text-sm mb-1">No applications yet</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Start growing your business at campus bazaars!
                </p>
                <Button size="sm" onClick={() => navigate(ROUTES.BROWSE_BAZAARS)}>
                  <Rocket className="h-4 w-4 mr-1" />
                  Browse Bazaars
                </Button>
              </Card>
            )}
          </div>

          {/* Upcoming Opportunities */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-[hsl(220,80%,60%)]" />
                Upcoming Opportunities
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.BROWSE_BAZAARS)} className="text-xs">
                Browse All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            
            {bazaarsLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[1, 2].map(i => (
                  <Card key={i} className="p-3">
                    <Skeleton className="h-20 w-full" />
                  </Card>
                ))}
              </div>
            ) : analytics.upcomingBazaars.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {analytics.upcomingBazaars.slice(0, 4).map((bazaar: Event) => {
                  const hasApplication = analytics.applicationBazaarIds.has(bazaar.id);
                  const startDate = bazaar.startDate ? new Date(bazaar.startDate) : new Date();
                  const daysUntil = Math.ceil((startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <Card 
                      key={bazaar.id} 
                      className={cn(
                        "p-3 cursor-pointer transition-all hover:shadow-md group",
                        hasApplication && "bg-[hsl(220,80%,50%)]/5 border-[hsl(220,80%,50%)]/20"
                      )}
                      onClick={() => navigate(`/events/${bazaar.id}`)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px]">
                          {daysUntil <= 7 ? `${daysUntil}d` : 'Bazaar'}
                        </Badge>
                        {hasApplication ? (
                          <Badge variant="secondary" className="text-[10px]">
                            <CheckCircle className="h-2.5 w-2.5 mr-1" />
                            Applied
                          </Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(ROUTES.BROWSE_BAZAARS);
                            }}
                          >
                            Apply
                          </Button>
                        )}
                      </div>
                      <h4 className="font-medium text-sm mb-1 line-clamp-1 group-hover:text-[hsl(220,80%,50%)]">
                        {bazaar.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {bazaar.startDate ? formatDate(bazaar.startDate) : 'TBD'}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-4 text-center bg-muted/30">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming bazaars at the moment</p>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Business Metrics */}
          <Card className="p-4 bg-gradient-to-br from-[hsl(220,80%,50%)]/5 to-[hsl(220,80%,60%)]/10">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-[hsl(220,80%,50%)]" />
              <span className="text-sm font-medium">Business Metrics</span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Approval Rate</span>
                  <span className="font-medium">{analytics.successRate}%</span>
                </div>
                <Progress value={analytics.successRate} className="h-1.5" />
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold text-[hsl(220,80%,50%)]">
                    <NumberFlow value={analytics.approved.length} />
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase">Secured</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-[hsl(220,80%,60%)]">
                    <NumberFlow value={analytics.pending.length} />
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Company Card */}
          <Card className="p-4 border-[hsl(220,80%,50%)]/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(220,80%,50%)] to-[hsl(220,80%,60%)] flex items-center justify-center text-white font-semibold">
                {(user?.companyName || 'V')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{user?.companyName || 'Your Company'}</h4>
                <p className="text-xs text-muted-foreground">Vendor Account</p>
              </div>
              <Badge variant="outline" className="text-[10px] bg-[var(--stat-icon-success-bg)] text-[var(--stat-icon-success-fg)] border-transparent">
                Active
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Active Booths</span>
                <span className="font-medium text-xs">{analytics.approved.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Loyalty Partners</span>
                <span className="font-medium text-xs">{analytics.activeLoyalty}</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground px-1">Quick Actions</h2>
            
            <Card 
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => navigate(ROUTES.BROWSE_BAZAARS)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[hsl(220,80%,50%)]/10 flex items-center justify-center text-[hsl(220,80%,50%)]">
                  <Store className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium flex-1">Browse Bazaars</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
            
            <Card 
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => navigate(ROUTES.APPLY_PLATFORM_BOOTH)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[hsl(220,80%,60%)]/10 flex items-center justify-center text-[hsl(220,80%,60%)]">
                  <Building2 className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium flex-1">Platform Booth</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
            
            <Card 
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => navigate(ROUTES.VENDOR_LOYALTY)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[hsl(220,80%,70%)]/10 flex items-center justify-center text-[hsl(220,80%,70%)]">
                  <Heart className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium flex-1">Loyalty Program</span>
                {analytics.pendingLoyalty > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{analytics.pendingLoyalty}</Badge>
                )}
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
            
            <Card 
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => navigate(ROUTES.VENDOR_APPLICATIONS)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium flex-1">All Applications</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
