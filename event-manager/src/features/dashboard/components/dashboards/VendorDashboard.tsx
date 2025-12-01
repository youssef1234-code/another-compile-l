/**
 * Vendor Dashboard
 * 
 * Dashboard for vendors showing:
 * - Application status overview
 * - Upcoming bazaars
 * - Loyalty program participation
 * - Booth information
 */

import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Store, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  Heart,
  MapPin,
  FileText,
  Building2,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import { formatDate } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import NumberFlow from '@number-flow/react';
import type { Event } from '@event-manager/shared';
import { DonutChart } from '../charts/DonutChart';

// Application Status Card
function ApplicationStatusCard({ 
  application, 
  onView 
}: { 
  application: any; 
  onView: () => void;
}) {
  const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    PENDING: { color: 'bg-yellow-500', icon: Clock, label: 'Pending Review' },
    APPROVED: { color: 'bg-green-500', icon: CheckCircle, label: 'Approved' },
    REJECTED: { color: 'bg-red-500', icon: XCircle, label: 'Rejected' },
    PAYMENT_PENDING: { color: 'bg-blue-500', icon: CreditCard, label: 'Payment Pending' },
    CONFIRMED: { color: 'bg-emerald-500', icon: CheckCircle, label: 'Confirmed' },
  };
  
  const config = statusConfig[application.status] || statusConfig.PENDING;
  const StatusIcon = config.icon;
  
  return (
    <Card className="hover:shadow-md transition-all duration-200 group cursor-pointer" onClick={onView}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn(config.color, 'text-white text-xs')}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>
            <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {application.bazaar?.name || 'Bazaar Application'}
            </h4>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {application.bazaar?.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(application.bazaar.startDate)}
                </span>
              )}
              {application.boothNumber && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Booth #{application.boothNumber}
                </span>
              )}
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

// Upcoming Bazaar Card
function UpcomingBazaarCard({ 
  bazaar, 
  hasApplication,
  onApply, 
  onView 
}: { 
  bazaar: Event; 
  hasApplication: boolean;
  onApply: () => void;
  onView: () => void;
}) {
  const startDate = bazaar.startDate ? new Date(bazaar.startDate) : new Date();
  const daysUntil = Math.ceil((startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <Card className="hover:shadow-md transition-all duration-200 group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/30">
                Bazaar
              </Badge>
              {daysUntil <= 14 && daysUntil > 0 && (
                <Badge variant="outline" className="text-xs">
                  {daysUntil} days away
                </Badge>
              )}
            </div>
            <h4 
              className="font-medium text-sm truncate cursor-pointer hover:text-primary transition-colors"
              onClick={onView}
            >
              {bazaar.name}
            </h4>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {bazaar.startDate ? formatDate(bazaar.startDate) : 'TBD'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {bazaar.location === 'ON_CAMPUS' ? 'On Campus' : 'Off Campus'}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">
            {hasApplication ? (
              <Badge variant="secondary" className="text-xs">
                Applied
              </Badge>
            ) : (
              <Button size="sm" onClick={onApply}>
                Apply
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Action for Vendors
function VendorQuickAction({ 
  icon: Icon, 
  title, 
  description, 
  href,
  variant = 'default'
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  href: string;
  variant?: 'default' | 'primary';
}) {
  const navigate = useNavigate();
  
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 group hover:shadow-md",
        variant === 'primary' ? 'border-primary/30 bg-primary/5' : ''
      )}
      onClick={() => navigate(href)}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn(
          "p-3 rounded-xl transition-colors",
          variant === 'primary' 
            ? 'bg-primary/10 text-primary' 
            : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardContent>
    </Card>
  );
}

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
  const upcomingBazaars = bazaars.filter((b: Event) => b.startDate && new Date(b.startDate) > new Date());
  
  // Application status breakdown
  const statusBreakdown = applications.reduce((acc: Record<string, number>, a: any) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});
  
  const pendingApplications = applications.filter((a: any) => a.status === 'PENDING');
  const approvedApplications = applications.filter((a: any) => a.status === 'APPROVED' || a.status === 'CONFIRMED');
  const paymentPendingApps = applications.filter((a: any) => a.status === 'PAYMENT_PENDING');
  
  // Chart data for application status
  const statusChartData = [
    { name: 'Confirmed', value: statusBreakdown['CONFIRMED'] || 0, fill: 'hsl(142, 76%, 36%)' },
    { name: 'Approved', value: statusBreakdown['APPROVED'] || 0, fill: 'hsl(217, 91%, 60%)' },
    { name: 'Pending', value: statusBreakdown['PENDING'] || 0, fill: 'hsl(45, 93%, 47%)' },
    { name: 'Payment Pending', value: statusBreakdown['PAYMENT_PENDING'] || 0, fill: 'hsl(262, 83%, 58%)' },
    { name: 'Rejected', value: statusBreakdown['REJECTED'] || 0, fill: 'hsl(0, 84%, 60%)' },
  ].filter(d => d.value > 0);
  
  const statusChartConfig = {
    Confirmed: { label: 'Confirmed', color: 'hsl(142, 76%, 36%)' },
    Approved: { label: 'Approved', color: 'hsl(217, 91%, 60%)' },
    Pending: { label: 'Pending', color: 'hsl(45, 93%, 47%)' },
    'Payment Pending': { label: 'Payment Pending', color: 'hsl(262, 83%, 58%)' },
    Rejected: { label: 'Rejected', color: 'hsl(0, 84%, 60%)' },
  };
  
  // Check which bazaars have existing applications
  const applicationBazaarIds = new Set(existingApplications?.map((a: any) => a.bazaarId) || []);
  
  // Loyalty program status
  const loyaltyRequests = loyaltyData || [];
  const activeLoyalty = loyaltyRequests.filter((r: any) => r.status === 'APPROVED').length;
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                <NumberFlow value={applications.length} />
              </div>
            )}
            <p className="text-xs text-muted-foreground">Total submitted</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                <NumberFlow value={approvedApplications.length} />
              </div>
            )}
            <p className="text-xs text-muted-foreground">Booths secured</p>
          </CardContent>
        </Card>
        
        <Card className={cn(
          pendingApplications.length > 0 || paymentPendingApps.length > 0 
            ? 'border-yellow-500/50 bg-yellow-500/5' 
            : ''
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                <NumberFlow value={pendingApplications.length + paymentPendingApps.length} />
              </div>
            )}
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Loyalty Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              <NumberFlow value={activeLoyalty} />
            </div>
            <p className="text-xs text-muted-foreground">Active partnerships</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Payment Pending Alert */}
      {paymentPendingApps.length > 0 && (
        <Card className="border-blue-500/50 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/20">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Payment Required</h3>
                  <p className="text-sm text-muted-foreground">
                    {paymentPendingApps.length} application(s) awaiting payment to confirm your booth
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate(ROUTES.VENDOR_APPLICATIONS)}>
                Complete Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Applications and Bazaars */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Applications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                Your Applications
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.VENDOR_APPLICATIONS)}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            {applicationsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : applications.length > 0 ? (
              <div className="space-y-3">
                {applications.slice(0, 4).map((app: any) => (
                  <ApplicationStatusCard 
                    key={app.id} 
                    application={app}
                    onView={() => navigate(ROUTES.VENDOR_APPLICATIONS)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <h3 className="font-medium mb-1">No applications yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Browse upcoming bazaars and apply for a booth!
                  </p>
                  <Button onClick={() => navigate(ROUTES.BROWSE_BAZAARS)}>
                    Browse Bazaars
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Upcoming Bazaars */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Bazaars
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.BROWSE_BAZAARS)}>
                Browse All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            {bazaarsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : upcomingBazaars.length > 0 ? (
              <div className="space-y-3">
                {upcomingBazaars.slice(0, 3).map((bazaar: Event) => (
                  <UpcomingBazaarCard
                    key={bazaar.id}
                    bazaar={bazaar}
                    hasApplication={applicationBazaarIds.has(bazaar.id)}
                    onApply={() => navigate(ROUTES.BROWSE_BAZAARS)}
                    onView={() => navigate(ROUTES.EVENT_DETAILS.replace(':id', bazaar.id))}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No upcoming bazaars at the moment
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Application Status Chart */}
          {statusChartData.length > 0 && (
            <DonutChart
              title="Application Status"
              description="Status distribution"
              data={statusChartData}
              config={statusChartConfig}
              centerLabel="Apps"
            />
          )}
          
          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Quick Actions</h3>
            <VendorQuickAction
              icon={Store}
              title="Browse Bazaars"
              description="Find and apply to bazaars"
              href={ROUTES.BROWSE_BAZAARS}
              variant="primary"
            />
            <VendorQuickAction
              icon={Building2}
              title="Platform Booth"
              description="Apply for permanent booth"
              href={ROUTES.APPLY_PLATFORM_BOOTH}
            />
            <VendorQuickAction
              icon={Heart}
              title="Loyalty Program"
              description="Join loyalty partnerships"
              href={ROUTES.VENDOR_LOYALTY}
            />
          </div>
          
          {/* Company Info Card */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{user?.companyName || 'Your Company'}</h3>
                  <p className="text-xs text-muted-foreground">Vendor Account</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Active Booths</span>
                  <span className="font-medium">{approvedApplications.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
