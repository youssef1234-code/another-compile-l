/**
 * Events Office Dashboard
 * 
 * Analytics-focused dashboard with blue gradient theme
 * Shows: event management, approvals, registrations, reports access
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
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
  TrendingUp,
  BookOpen,
  Users,
  Clock,
  BarChart3,
  Sparkles,
  Briefcase
} from 'lucide-react';
import { formatDate } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import NumberFlow from '@number-flow/react';
import type { Event } from '@event-manager/shared';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  PieChart, Pie, Cell
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

// Blue gradient palette
const BLUE_PALETTE = [
  'hsl(220, 80%, 70%)',
  'hsl(220, 80%, 60%)',
  'hsl(220, 80%, 50%)',
  'hsl(220, 80%, 40%)',
  'hsl(220, 80%, 30%)',
];

export function EventsOfficeDashboard() {
  const navigate = useNavigate();
  
  // Fetch event statistics
  const { data: statsData, isLoading: statsLoading } = trpc.events.getEventStats.useQuery();
  
  // Fetch all events
  const { data: eventsData, isLoading: eventsLoading } = trpc.events.getAllEvents.useQuery({
    page: 1,
    perPage: 100,
    filters: { status: ['PENDING_APPROVAL', 'PUBLISHED', 'APPROVED', 'DRAFT'] },
  });
  
  // Fetch vendor application stats
  const { data: vendorStats } = trpc.vendorApplications.getApplicationStats.useQuery();
  
  const events = eventsData?.events || [];
  const stats = statsData || { total: 0, upcoming: 0, past: 0, byType: {} };

  // Analytics calculations
  const analytics = useMemo(() => {
    const typeBreakdown: Record<string, number> = {};
    const statusBreakdown: Record<string, number> = {};
    let totalRegistrations = 0;
    let totalCapacity = 0;
    
    events.forEach((e: Event) => {
      typeBreakdown[e.type] = (typeBreakdown[e.type] || 0) + 1;
      statusBreakdown[e.status || 'DRAFT'] = (statusBreakdown[e.status || 'DRAFT'] || 0) + 1;
      totalRegistrations += e.registeredCount || 0;
      totalCapacity += e.capacity || 0;
    });
    
    const pending = events.filter((e: Event) => e.status === 'PENDING_APPROVAL');
    const published = events.filter((e: Event) => e.status === 'PUBLISHED');
    const upcoming = published.filter((e: Event) => e.startDate && new Date(e.startDate) > new Date());
    
    // Events by type for chart (top 5)
    const typeChartData = Object.entries(typeBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count], index) => ({
        name: type.replace('_', ' '),
        count,
        fill: BLUE_PALETTE[index % BLUE_PALETTE.length],
      }));
    
    // Registrations by event type
    const regsByType: Record<string, number> = {};
    events.forEach((e: Event) => {
      regsByType[e.type] = (regsByType[e.type] || 0) + (e.registeredCount || 0);
    });
    
    const registrationsByType = Object.entries(regsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, regs], index) => ({
        name: type.replace('_', ' '),
        registrations: regs,
        fill: BLUE_PALETTE[index % BLUE_PALETTE.length],
      }));
    
    const fillRate = totalCapacity > 0 
      ? Math.round((totalRegistrations / totalCapacity) * 100) 
      : 0;
    
    return {
      typeBreakdown,
      statusBreakdown,
      pending,
      published,
      upcoming,
      totalRegistrations,
      fillRate,
      typeChartData,
      registrationsByType,
      pendingVendorApps: vendorStats?.pending || 0,
      actionRequired: pending.length + (vendorStats?.pending || 0),
    };
  }, [events, vendorStats]);

  const isLoading = statsLoading || eventsLoading;

  // Quick links
  const quickLinks = [
    { icon: Calendar, title: 'Manage Events', desc: 'Create and manage', href: ROUTES.ADMIN_EVENTS },
    { icon: Dumbbell, title: 'Gym Schedule', desc: 'Session management', href: ROUTES.GYM_SCHEDULE },
    { icon: Store, title: 'Vendor Apps', desc: 'Review applications', href: ROUTES.VENDOR_REQUESTS },
    { icon: FileBarChart, title: 'Event Reports', desc: 'Attendance data', href: ROUTES.EVENTS_REPORTS },
    { icon: TrendingUp, title: 'Sales Reports', desc: 'Revenue analytics', href: ROUTES.SALES_REPORTS },
    { icon: BookOpen, title: 'Platform Setup', desc: 'Configure booths', href: ROUTES.PLATFORM_SETUP },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[hsl(220,80%,48%)] via-[hsl(220,80%,53%)] to-[hsl(220,80%,58%)] text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNGMwIDItMiA0LTIgNHMtMi0yLTItNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm text-white/80">Events Office</span>
                  <Sparkles className="h-4 w-4 text-white/60" />
                </div>
                <h1 className="text-xl font-bold">Event Management Hub</h1>
                <p className="text-white/70 text-sm">
                  {analytics.actionRequired > 0 
                    ? `${analytics.actionRequired} items need review`
                    : "All events are up to date"
                  }
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 text-center">
                <div className="text-2xl font-bold"><NumberFlow value={stats.total} /></div>
                <p className="text-[10px] text-white/70 uppercase">Events</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 text-center">
                <div className="text-2xl font-bold"><NumberFlow value={analytics.totalRegistrations} /></div>
                <p className="text-[10px] text-white/70 uppercase">Registrations</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Total Events */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg text-[var(--stat-icon-info-fg)] bg-[var(--stat-icon-info-bg)]">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Events</p>
              {isLoading ? (
                <Skeleton className="h-6 w-12 mt-0.5" />
              ) : (
                <p className="text-xl font-semibold">
                  <NumberFlow value={stats.total} />
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Total Registrations */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[hsl(220,80%,50%)]/10 text-[hsl(220,80%,50%)]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Registrations</p>
              {isLoading ? (
                <Skeleton className="h-6 w-12 mt-0.5" />
              ) : (
                <p className="text-xl font-semibold">
                  <NumberFlow value={analytics.totalRegistrations} />
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg text-[var(--stat-icon-success-fg)] bg-[var(--stat-icon-success-bg)]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
              {isLoading ? (
                <Skeleton className="h-6 w-8 mt-0.5" />
              ) : (
                <p className="text-xl font-semibold">
                  <NumberFlow value={analytics.upcoming.length} />
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Needs Attention */}
        <Card className={cn(
          "p-4",
          analytics.actionRequired > 0 && "ring-1 ring-[hsl(220,80%,50%)]/30 bg-[hsl(220,80%,50%)]/5"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 flex items-center justify-center rounded-lg",
              analytics.actionRequired > 0 
                ? "bg-[hsl(220,80%,50%)]/20 text-[hsl(220,80%,50%)]"
                : "text-[var(--stat-icon-info-fg)] bg-[var(--stat-icon-info-bg)]"
            )}>
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Needs Review</p>
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

      {/* Action Banner */}
      {analytics.actionRequired > 0 && (
        <Card className="border-[hsl(220,80%,50%)]/50 bg-gradient-to-r from-[hsl(220,80%,50%)]/10 to-[hsl(220,80%,60%)]/10">
          <div className="p-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[hsl(220,80%,50%)]/20">
                <Clock className="h-5 w-5 text-[hsl(220,80%,50%)]" />
              </div>
              <div>
                <h3 className="font-medium">Action Required</h3>
                <p className="text-sm text-muted-foreground">
                  {analytics.pending.length > 0 && `${analytics.pending.length} workshop approvals`}
                  {analytics.pending.length > 0 && analytics.pendingVendorApps > 0 && ' • '}
                  {analytics.pendingVendorApps > 0 && `${analytics.pendingVendorApps} vendor applications`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {analytics.pending.length > 0 && (
                <Button variant="outline" onClick={() => navigate(ROUTES.ADMIN_EVENTS + '?status=PENDING_APPROVAL')}>
                  Review Workshops
                </Button>
              )}
              {analytics.pendingVendorApps > 0 && (
                <Button onClick={() => navigate(ROUTES.VENDOR_REQUESTS)}>
                  Review Vendors
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Events by Type */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Events by Type</h3>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          {analytics.typeChartData.length > 0 ? (
            <>
              <ChartContainer
                config={Object.fromEntries(
                  analytics.typeChartData.map(item => [item.name, { label: item.name, color: item.fill }])
                )}
                className="h-[180px]"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={analytics.typeChartData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={75}
                  >
                    {analytics.typeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {analytics.typeChartData.map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-muted-foreground">{item.name} ({item.count})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No event data yet
            </div>
          )}
        </Card>

        {/* Registrations by Type */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Registrations by Type</h3>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          {analytics.registrationsByType.length > 0 ? (
            <ChartContainer
              config={{
                registrations: { label: 'Registrations', color: 'hsl(220, 80%, 50%)' }
              }}
              className="h-[220px]"
            >
              <BarChart 
                data={analytics.registrationsByType} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="registrations" radius={[0, 4, 4, 0]}>
                  {analytics.registrationsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground">
              No registration data yet
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Quick Navigation */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link, index) => (
              <Card 
                key={index}
                className="p-4 cursor-pointer hover:shadow-md hover:bg-[hsl(220,80%,50%)]/5 transition-all group"
                onClick={() => navigate(link.href)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[hsl(220,80%,50%)]/10 flex items-center justify-center text-[hsl(220,80%,50%)] group-hover:bg-[hsl(220,80%,50%)] group-hover:text-white transition-colors">
                    <link.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{link.title}</p>
                    <p className="text-xs text-muted-foreground">{link.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Recent Events */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">Recent Events</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.ADMIN_EVENTS)}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            {eventsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-3">
                    <Skeleton className="h-10 w-full" />
                  </Card>
                ))}
              </div>
            ) : events.length > 0 ? (
              <div className="space-y-2">
                {events.slice(0, 5).map((event: Event) => (
                  <Card 
                    key={event.id} 
                    className="p-3 cursor-pointer hover:shadow-sm transition-all"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded flex items-center justify-center text-white",
                          event.status === 'PUBLISHED' ? 'bg-[hsl(220,80%,50%)]' :
                          event.status === 'PENDING_APPROVAL' ? 'bg-[hsl(220,80%,60%)]' :
                          'bg-[hsl(220,80%,40%)]'
                        )}>
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm truncate max-w-[200px]">{event.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.type.replace('_', ' ')} • {event.startDate ? formatDate(event.startDate) : 'TBD'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <h4 className="font-medium mb-1">No events yet</h4>
                <p className="text-sm text-muted-foreground mb-4">Create your first event to get started</p>
                <Button onClick={() => navigate(ROUTES.ADMIN_EVENTS)}>
                  <Plus className="h-4 w-4 mr-2" /> Create Event
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* Performance Sidebar */}
        <div className="space-y-3">
          {/* Performance Card */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-[hsl(220,80%,50%)]" />
              <span className="text-sm font-medium">Performance</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Fill Rate</span>
                  <span className="font-semibold">{analytics.fillRate}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[hsl(220,80%,50%)] rounded-full transition-all"
                    style={{ width: `${Math.min(analytics.fillRate, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold text-[hsl(220,80%,50%)]">
                    <NumberFlow value={analytics.statusBreakdown['PUBLISHED'] || 0} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Published</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-[hsl(220,80%,60%)]">
                    <NumberFlow value={analytics.statusBreakdown['PENDING_APPROVAL'] || 0} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Pending</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-[hsl(220,80%,70%)]">
                    <NumberFlow value={analytics.upcoming.length} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Upcoming</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground px-1">Quick Actions</p>
            
            <Card 
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => navigate(ROUTES.ADMIN_EVENTS)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[hsl(220,80%,50%)]/10 flex items-center justify-center text-[hsl(220,80%,50%)]">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium flex-1">Create Event</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
            
            <Card 
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => navigate(ROUTES.VENDOR_REQUESTS)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[hsl(220,80%,60%)]/10 flex items-center justify-center text-[hsl(220,80%,60%)]">
                  <Store className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium flex-1">Vendor Apps</span>
                {analytics.pendingVendorApps > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-5">{analytics.pendingVendorApps}</Badge>
                )}
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
            
            <Card 
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => navigate(ROUTES.EVENTS_REPORTS)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[hsl(220,80%,70%)]/10 flex items-center justify-center text-[hsl(220,80%,70%)]">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium flex-1">Analytics</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
