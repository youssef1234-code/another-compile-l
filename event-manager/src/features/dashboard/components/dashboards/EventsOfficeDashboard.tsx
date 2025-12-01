/**
 * Events Office Dashboard
 * 
 * Dashboard for Events Office staff showing:
 * - Event management overview
 * - Pending workshop approvals
 * - Vendor application status
 * - Gym session management
 * - Quick access to reports
 */

import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  AlertCircle,
  ArrowRight,
  Plus,
  Store,
  Dumbbell,
  FileBarChart,
  ClipboardList,
  Building2,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { formatDate } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import type { Event } from '@event-manager/shared';
import { MetricCard } from '../cards/MetricCard';
import { DonutChart } from '../charts/DonutChart';

// Action Item Card for things needing attention
function ActionItemCard({ 
  icon: Icon, 
  title, 
  count, 
  description, 
  href, 
  variant = 'default' 
}: { 
  icon: React.ElementType; 
  title: string; 
  count: number;
  description: string; 
  href: string;
  variant?: 'warning' | 'default' | 'success';
}) {
  const navigate = useNavigate();
  
  const variantStyles = {
    default: 'hover:border-primary/50',
    warning: 'border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10',
    success: 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10',
  };
  
  const iconStyles = {
    default: 'bg-muted text-muted-foreground',
    warning: 'bg-yellow-500/20 text-yellow-600',
    success: 'bg-emerald-500/20 text-emerald-600',
  };
  
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 group",
        variantStyles[variant]
      )}
      onClick={() => navigate(href)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-xl", iconStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">{title}</h3>
              <Badge variant={variant === 'warning' ? 'destructive' : 'secondary'} className="text-xs">
                {count}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Nav Card
function QuickNavCard({ 
  icon: Icon, 
  title, 
  description, 
  href 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  href: string;
}) {
  const navigate = useNavigate();
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
      onClick={() => navigate(href)}
    >
      <CardContent className="p-4 flex flex-col items-center text-center">
        <div className="p-3 rounded-xl bg-primary/10 text-primary mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="font-medium text-sm mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function EventsOfficeDashboard() {
  const navigate = useNavigate();
  
  // Fetch event statistics
  const { data: statsData } = trpc.events.getEventStats.useQuery();
  
  // Fetch all events for breakdown
  const { data: eventsData, isLoading: eventsLoading } = trpc.events.getAllEvents.useQuery({
    page: 1,
    perPage: 100,
    filters: { status: ['PENDING_APPROVAL', 'PUBLISHED', 'APPROVED', 'DRAFT'] },
  });
  
  // Fetch vendor application stats
  const { data: vendorStats } = trpc.vendorApplications.getApplicationStats.useQuery();
  
  const events = eventsData?.events || [];
  const stats = statsData || { total: 0, upcoming: 0, past: 0, byType: {} };
  
  // Calculate pending items
  const pendingWorkshops = events.filter((e: Event) => e.type === 'WORKSHOP' && e.status === 'PENDING_APPROVAL');
  const publishedEvents = events.filter((e: Event) => e.status === 'PUBLISHED');
  const upcomingEvents = publishedEvents.filter((e: Event) => e.startDate && new Date(e.startDate) > new Date());
  
  // Event type breakdown for chart
  const typeBreakdown = events.reduce((acc: Record<string, number>, e: Event) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});
  
  const typeChartData = [
    { name: 'Workshops', value: typeBreakdown['WORKSHOP'] || 0, fill: 'hsl(217, 91%, 60%)' },
    { name: 'Trips', value: typeBreakdown['TRIP'] || 0, fill: 'hsl(142, 76%, 36%)' },
    { name: 'Conferences', value: typeBreakdown['CONFERENCE'] || 0, fill: 'hsl(262, 83%, 58%)' },
    { name: 'Bazaars', value: typeBreakdown['BAZAAR'] || 0, fill: 'hsl(24, 95%, 53%)' },
    { name: 'Gym Sessions', value: typeBreakdown['GYM_SESSION'] || 0, fill: 'hsl(0, 84%, 60%)' },
  ].filter(d => d.value > 0);
  
  const typeChartConfig = {
    Workshops: { label: 'Workshops', color: 'hsl(217, 91%, 60%)' },
    Trips: { label: 'Trips', color: 'hsl(142, 76%, 36%)' },
    Conferences: { label: 'Conferences', color: 'hsl(262, 83%, 58%)' },
    Bazaars: { label: 'Bazaars', color: 'hsl(24, 95%, 53%)' },
    'Gym Sessions': { label: 'Gym Sessions', color: 'hsl(0, 84%, 60%)' },
  };
  
  // Calculate total registrations
  const totalRegistrations = events.reduce((sum: number, e: Event) => sum + (e.registeredCount || 0), 0);
  
  const pendingVendorApps = vendorStats?.pending || 0;
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Events"
          value={stats.total}
          format="number"
        />
        <MetricCard
          title="Upcoming Events"
          value={upcomingEvents.length}
          format="number"
        />
        <MetricCard
          title="Total Registrations"
          value={totalRegistrations}
          format="number"
        />
        <MetricCard
          title="Published Events"
          value={publishedEvents.length}
          format="number"
        />
      </div>
      
      {/* Action Items */}
      {(pendingWorkshops.length > 0 || pendingVendorApps > 0) && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Action Required
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {pendingWorkshops.length > 0 && (
              <ActionItemCard
                icon={BookOpen}
                title="Workshop Approvals"
                count={pendingWorkshops.length}
                description="Workshops waiting for your review"
                href={ROUTES.ADMIN_EVENTS + '?status=PENDING_APPROVAL'}
                variant="warning"
              />
            )}
            {pendingVendorApps > 0 && (
              <ActionItemCard
                icon={Store}
                title="Vendor Applications"
                count={pendingVendorApps}
                description="Booth applications to review"
                href={ROUTES.VENDOR_REQUESTS}
                variant="warning"
              />
            )}
          </div>
        </div>
      )}
      
      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Navigation */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Management
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickNavCard
              icon={Calendar}
              title="Manage Events"
              description="Create and manage all events"
              href={ROUTES.ADMIN_EVENTS}
            />
            <QuickNavCard
              icon={Dumbbell}
              title="Gym Schedule"
              description="Manage gym sessions"
              href={ROUTES.GYM_SCHEDULE}
            />
            <QuickNavCard
              icon={Store}
              title="Vendor Apps"
              description="Review booth applications"
              href={ROUTES.VENDOR_REQUESTS}
            />
            <QuickNavCard
              icon={Building2}
              title="Platform Setup"
              description="Configure platform booths"
              href={ROUTES.PLATFORM_SETUP}
            />
            <QuickNavCard
              icon={FileBarChart}
              title="Event Reports"
              description="View attendance reports"
              href={ROUTES.EVENTS_REPORTS}
            />
            <QuickNavCard
              icon={TrendingUp}
              title="Sales Reports"
              description="Revenue and transactions"
              href={ROUTES.SALES_REPORTS}
            />
          </div>
          
          {/* Recent Events Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Events
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.ADMIN_EVENTS)}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            {eventsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-12 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {events.slice(0, 5).map((event: Event) => (
                  <Card 
                    key={event.id} 
                    className="cursor-pointer hover:shadow-sm transition-all"
                    onClick={() => navigate(ROUTES.EVENT_DETAILS.replace(':id', event.id))}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {event.type.replace('_', ' ')}
                        </Badge>
                        <span className="font-medium text-sm truncate max-w-[200px]">{event.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{event.startDate ? formatDate(event.startDate) : 'TBD'}</span>
                        <Badge 
                          variant={event.status === 'PUBLISHED' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {event.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar with Charts */}
        <div className="space-y-4">
          {/* Event Type Distribution */}
          {typeChartData.length > 0 && (
            <DonutChart
              title="Events by Type"
              description="Distribution of event types"
              data={typeChartData}
              config={typeChartConfig}
              centerLabel="Events"
            />
          )}
          
          {/* Quick Stats Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Event Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Published</span>
                <span className="font-medium text-green-600">{publishedEvents.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending Approval</span>
                <span className="font-medium text-yellow-600">{pendingWorkshops.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Draft</span>
                <span className="font-medium">{events.filter((e: Event) => e.status === 'DRAFT').length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Approved</span>
                <span className="font-medium text-blue-600">{events.filter((e: Event) => e.status === 'APPROVED').length}</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Create Event CTA */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-primary/10 mb-3">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-1">Create New Event</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Start organizing your next event
                </p>
                <Button className="w-full" onClick={() => navigate(ROUTES.ADMIN_EVENTS)}>
                  Create Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
