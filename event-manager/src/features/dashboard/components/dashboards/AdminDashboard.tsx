/**
 * Admin Dashboard
 * 
 * Analytics-focused dashboard with blue gradient theme
 * Shows: platform-wide stats, user analytics, event analytics, system status
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AIAnalyticsDashboard } from '@/components/ai';
import { 
  Users, 
  Calendar, 
  Store, 
  TrendingUp,
  ArrowRight,
  Shield,
  AlertCircle,
  Dumbbell,
  FileBarChart,
  CreditCard,
  Clock,
  UserCheck,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NumberFlow from '@number-flow/react';
import type { Event, User } from '../../../../shared';
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

export function AdminDashboard() {
  const navigate = useNavigate();
  
  // Fetch user statistics
  const { data: usersData, isLoading: usersLoading } = trpc.auth.getAllUsers.useQuery({
    page: 1,
    perPage: 1000,
  });
  
  // Fetch event statistics
  const { data: statsData, isLoading: statsLoading } = trpc.events.getEventStats.useQuery();
  
  // Fetch all events
  const { data: eventsData, isLoading: eventsLoading } = trpc.events.getAllEvents.useQuery({
    page: 1,
    perPage: 100,
  });
  
  // Fetch vendor application stats
  const { data: vendorStats } = trpc.vendorApplications.getApplicationStats.useQuery();
  
  const users = usersData?.users || [];
  const events = eventsData?.events || [];
  const stats = statsData || { total: 0, upcoming: 0, past: 0, byType: {} };

  // Analytics calculations
  const analytics = useMemo(() => {
    // User role breakdown
    const roleBreakdown: Record<string, number> = {};
    users.forEach((u: User) => {
      roleBreakdown[u.role] = (roleBreakdown[u.role] || 0) + 1;
    });
    
    const activeUsers = users.filter((u: User) => u.status === 'ACTIVE');
    const blockedUsers = users.filter((u: User) => u.isBlocked);
    
    // Event analytics
    const eventTypeBreakdown: Record<string, number> = {};
    let totalRegistrations = 0;
    
    events.forEach((e: Event) => {
      eventTypeBreakdown[e.type] = (eventTypeBreakdown[e.type] || 0) + 1;
      totalRegistrations += e.registeredCount || 0;
    });
    
    const pendingWorkshops = events.filter((e: Event) => e.type === 'WORKSHOP' && e.status === 'PENDING_APPROVAL');
    const publishedEvents = events.filter((e: Event) => e.status === 'PUBLISHED');
    
    // User role chart data
    const roleChartData = Object.entries(roleBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([role, count], index) => ({
        name: role.replace('_', ' '),
        count,
        fill: BLUE_PALETTE[index % BLUE_PALETTE.length],
      }));
    
    // Event type chart data
    const eventTypeChartData = Object.entries(eventTypeBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count], index) => ({
        name: type.replace('_', ' '),
        count,
        fill: BLUE_PALETTE[index % BLUE_PALETTE.length],
      }));
    
    const pendingVendors = vendorStats?.pending || 0;
    const pendingVendorApps = vendorStats?.pending || 0;
    const actionRequired = pendingWorkshops.length + pendingVendors + pendingVendorApps;
    
    return {
      roleBreakdown,
      activeUsers,
      blockedUsers,
      pendingWorkshops,
      publishedEvents,
      roleChartData,
      eventTypeChartData,
      totalRegistrations,
      pendingVendors,
      pendingVendorApps,
      actionRequired,
    };
  }, [users, events, vendorStats]);

  const isLoading = usersLoading || statsLoading || eventsLoading;

  // Quick links
  const quickLinks = [
    { icon: Users, title: 'User Management', desc: 'Manage users', href: ROUTES.ADMIN_USERS },
    { icon: Calendar, title: 'Event Management', desc: 'Manage events', href: ROUTES.ADMIN_EVENTS },
    { icon: Dumbbell, title: 'Gym Schedule', desc: 'Session management', href: ROUTES.GYM_SCHEDULE },
    { icon: Store, title: 'Vendor Apps', desc: 'Review applications', href: ROUTES.VENDOR_REQUESTS },
    { icon: FileBarChart, title: 'Event Reports', desc: 'Attendance data', href: ROUTES.EVENTS_REPORTS },
    { icon: CreditCard, title: 'Sales Reports', desc: 'Revenue analytics', href: ROUTES.SALES_REPORTS },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[hsl(220,80%,45%)] via-[hsl(220,80%,50%)] to-[hsl(220,80%,55%)] text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNGMwIDItMiA0LTIgNHMtMi0yLTItNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm text-white/80">Admin Dashboard</span>
                  <Sparkles className="h-4 w-4 text-white/60" />
                </div>
                <h1 className="text-xl font-bold">Platform Overview</h1>
                <p className="text-white/70 text-sm">
                  {analytics.actionRequired > 0 
                    ? `${analytics.actionRequired} items need your attention`
                    : "All systems running smoothly"
                  }
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 text-center">
                <div className="text-2xl font-bold"><NumberFlow value={users.length} /></div>
                <p className="text-[10px] text-white/70 uppercase">Users</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 text-center">
                <div className="text-2xl font-bold"><NumberFlow value={stats.total} /></div>
                <p className="text-[10px] text-white/70 uppercase">Events</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg text-[var(--stat-icon-info-fg)] bg-[var(--stat-icon-info-bg)]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Users</p>
              {isLoading ? (
                <Skeleton className="h-6 w-12 mt-0.5" />
              ) : (
                <p className="text-xl font-semibold">
                  <NumberFlow value={users.length} />
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Total Events */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[hsl(220,80%,50%)]/10 text-[hsl(220,80%,50%)]">
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
            <div className="w-10 h-10 flex items-center justify-center rounded-lg text-[var(--stat-icon-success-fg)] bg-[var(--stat-icon-success-bg)]">
              <TrendingUp className="h-5 w-5" />
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
                : "text-[var(--stat-icon-info-fg)] bg-[var(--stat-icon-info-bg)]"
            )}>
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Action Items</p>
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
                  {analytics.pendingVendors > 0 && `${analytics.pendingVendors} vendor approvals`}
                  {analytics.pendingVendors > 0 && analytics.pendingWorkshops.length > 0 && ' • '}
                  {analytics.pendingWorkshops.length > 0 && `${analytics.pendingWorkshops.length} workshop approvals`}
                  {(analytics.pendingVendors > 0 || analytics.pendingWorkshops.length > 0) && analytics.pendingVendorApps > 0 && ' • '}
                  {analytics.pendingVendorApps > 0 && `${analytics.pendingVendorApps} booth applications`}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {analytics.pendingVendors > 0 && (
                <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.ADMIN_USERS + '?vendorApprovalStatus=PENDING')}>
                  <UserCheck className="h-4 w-4 mr-1" /> Vendors
                </Button>
              )}
              {analytics.pendingWorkshops.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.ADMIN_EVENTS + '?status=PENDING_APPROVAL')}>
                  <Calendar className="h-4 w-4 mr-1" /> Workshops
                </Button>
              )}
              {analytics.pendingVendorApps > 0 && (
                <Button size="sm" onClick={() => navigate(ROUTES.VENDOR_REQUESTS)}>
                  <Store className="h-4 w-4 mr-1" /> Booths
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Users by Role */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Users by Role</h3>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          {analytics.roleChartData.length > 0 ? (
            <>
              <ChartContainer
                config={Object.fromEntries(
                  analytics.roleChartData.map(item => [item.name, { label: item.name, color: item.fill }])
                )}
                className="h-[180px]"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={analytics.roleChartData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={75}
                  >
                    {analytics.roleChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {analytics.roleChartData.map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-muted-foreground">{item.name} ({item.count})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No user data yet
            </div>
          )}
        </Card>

        {/* Events by Type */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Events by Type</h3>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          {analytics.eventTypeChartData.length > 0 ? (
            <ChartContainer
              config={{
                count: { label: 'Count', color: 'hsl(220, 80%, 50%)' }
              }}
              className="h-[220px]"
            >
              <BarChart 
                data={analytics.eventTypeChartData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {analytics.eventTypeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground">
              No event data yet
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Quick Navigation */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-[hsl(220,80%,50%)]" />
              Platform Management
            </h2>
          </div>
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

          {/* User Overview */}
          <Card className="mt-4 p-4">
            <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Overview
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-[hsl(220,80%,50%)]/10">
                <div className="text-2xl font-bold text-[hsl(220,80%,50%)]">
                  <NumberFlow value={analytics.roleBreakdown['STUDENT'] || 0} />
                </div>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-[hsl(220,80%,60%)]/10">
                <div className="text-2xl font-bold text-[hsl(220,80%,60%)]">
                  <NumberFlow value={analytics.roleBreakdown['PROFESSOR'] || 0} />
                </div>
                <p className="text-xs text-muted-foreground">Professors</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-[hsl(220,80%,70%)]/10">
                <div className="text-2xl font-bold text-[hsl(220,80%,70%)]">
                  <NumberFlow value={analytics.roleBreakdown['VENDOR'] || 0} />
                </div>
                <p className="text-xs text-muted-foreground">Vendors</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-[hsl(220,80%,40%)]/10">
                <div className="text-2xl font-bold text-[hsl(220,80%,40%)]">
                  <NumberFlow value={analytics.blockedUsers.length} />
                </div>
                <p className="text-xs text-muted-foreground">Blocked</p>
              </div>
            </div>
          </Card>

          {/* AI Analytics Insights */}
          <AIAnalyticsDashboard />
        </div>

        {/* Performance Sidebar */}
        <div className="space-y-3">
          {/* Platform Stats */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-[hsl(220,80%,50%)]" />
              <span className="text-sm font-medium">Platform Stats</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-[hsl(220,80%,50%)]/10">
                <div className="text-lg font-semibold text-[hsl(220,80%,50%)]">
                  <NumberFlow value={analytics.publishedEvents.length} />
                </div>
                <p className="text-[10px] text-muted-foreground">Published</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-[hsl(220,80%,60%)]/10">
                <div className="text-lg font-semibold text-[hsl(220,80%,60%)]">
                  <NumberFlow value={stats.upcoming} />
                </div>
                <p className="text-[10px] text-muted-foreground">Upcoming</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-[hsl(220,80%,70%)]/10">
                <div className="text-lg font-semibold text-[hsl(220,80%,70%)]">
                  <NumberFlow value={analytics.activeUsers.length} />
                </div>
                <p className="text-[10px] text-muted-foreground">Active</p>
              </div>
            </div>
          </Card>
          
          {/* System Health */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-[hsl(142,76%,45%)]" />
              <span className="text-sm font-medium">System Health</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[hsl(142,76%,45%)]" />
                <span className="text-xs flex-1">API Server</span>
                <span className="text-[10px] text-muted-foreground">Online</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[hsl(142,76%,45%)]" />
                <span className="text-xs flex-1">Database</span>
                <span className="text-[10px] text-muted-foreground">Connected</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[hsl(142,76%,45%)]" />
                <span className="text-xs flex-1">Payments</span>
                <span className="text-[10px] text-muted-foreground">Active</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground px-1">Quick Actions</p>
            
            <Card 
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => navigate(ROUTES.ADMIN_USERS)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[hsl(220,80%,50%)]/10 flex items-center justify-center text-[hsl(220,80%,50%)]">
                  <Users className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium flex-1">Manage Users</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
            
            <Card 
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => navigate(ROUTES.EVENTS_REPORTS)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[hsl(220,80%,60%)]/10 flex items-center justify-center text-[hsl(220,80%,60%)]">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium flex-1">Full Analytics</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
