/**
 * Admin Dashboard
 * 
 * Dashboard for administrators showing:
 * - Platform-wide statistics
 * - User management overview
 * - Event management overview
 * - Vendor management
 * - System health
 */

import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  Store, 
  TrendingUp,
  ArrowRight,
  Shield,
  UserCheck,
  AlertTriangle,
  Building2,
  FileBarChart,
  Dumbbell,
  CreditCard,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NumberFlow from '@number-flow/react';
import type { Event, User } from '@event-manager/shared';
import { MetricCard } from '../cards/MetricCard';
import { DonutChart } from '../charts/DonutChart';

// Admin Action Card
function AdminActionCard({ 
  icon: Icon, 
  title, 
  count,
  description, 
  href, 
  variant = 'default' 
}: { 
  icon: React.ElementType; 
  title: string; 
  count?: number;
  description: string; 
  href: string;
  variant?: 'warning' | 'default' | 'primary';
}) {
  const navigate = useNavigate();
  
  const variantStyles = {
    default: 'hover:border-primary/50 hover:shadow-md',
    warning: 'border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10',
    primary: 'border-primary/30 bg-primary/5 hover:bg-primary/10',
  };
  
  const iconStyles = {
    default: 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
    warning: 'bg-yellow-500/20 text-yellow-600',
    primary: 'bg-primary/20 text-primary',
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
          <div className={cn("p-3 rounded-xl transition-colors", iconStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">{title}</h3>
              {count !== undefined && count > 0 && (
                <Badge variant={variant === 'warning' ? 'destructive' : 'secondary'} className="text-xs">
                  {count}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
}

// System Status Indicator
function SystemStatusCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">API Server</span>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
            Online
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Database</span>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
            Connected
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">File Storage</span>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
            Active
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Payment Gateway</span>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
            Connected
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard() {
  
  // Fetch user statistics
  const { data: usersData } = trpc.auth.getAllUsers.useQuery({
    page: 1,
    perPage: 1000,
  });
  
  // Fetch event statistics
  const { data: statsData } = trpc.events.getEventStats.useQuery();
  
  // Fetch all events
  const { data: eventsData } = trpc.events.getAllEvents.useQuery({
    page: 1,
    perPage: 100,
  });
  
  // Fetch vendor application stats
  const { data: vendorStats } = trpc.vendorApplications.getApplicationStats.useQuery();
  
  const users = usersData?.users || [];
  const events = eventsData?.events || [];
  const stats = statsData || { total: 0, upcoming: 0, past: 0, byType: {} };
  
  // User role breakdown
  const roleBreakdown = users.reduce((acc: Record<string, number>, u: User) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});
  
  // User status breakdown - use vendorStats for pending vendors
  const pendingVendors = vendorStats?.pending || 0;
  const blockedUsers = users.filter((u: User) => u.isBlocked);
  const activeUsers = users.filter((u: User) => u.status === 'ACTIVE');
  
  // Events breakdown
  const pendingWorkshops = events.filter((e: Event) => e.type === 'WORKSHOP' && e.status === 'PENDING_APPROVAL');
  const publishedEvents = events.filter((e: Event) => e.status === 'PUBLISHED');
  
  // Chart data for user roles
  const roleChartData = [
    { name: 'Students', value: roleBreakdown['STUDENT'] || 0, fill: 'hsl(217, 91%, 60%)' },
    { name: 'Staff', value: roleBreakdown['STAFF'] || 0, fill: 'hsl(142, 76%, 36%)' },
    { name: 'Professors', value: roleBreakdown['PROFESSOR'] || 0, fill: 'hsl(262, 83%, 58%)' },
    { name: 'TAs', value: roleBreakdown['TA'] || 0, fill: 'hsl(45, 93%, 47%)' },
    { name: 'Vendors', value: roleBreakdown['VENDOR'] || 0, fill: 'hsl(24, 95%, 53%)' },
    { name: 'Event Office', value: roleBreakdown['EVENT_OFFICE'] || 0, fill: 'hsl(0, 84%, 60%)' },
  ].filter(d => d.value > 0);
  
  const roleChartConfig = {
    Students: { label: 'Students', color: 'hsl(217, 91%, 60%)' },
    Staff: { label: 'Staff', color: 'hsl(142, 76%, 36%)' },
    Professors: { label: 'Professors', color: 'hsl(262, 83%, 58%)' },
    TAs: { label: 'TAs', color: 'hsl(45, 93%, 47%)' },
    Vendors: { label: 'Vendors', color: 'hsl(24, 95%, 53%)' },
    'Event Office': { label: 'Event Office', color: 'hsl(0, 84%, 60%)' },
  };
  
  const pendingVendorApps = vendorStats?.pending || 0;
  const totalActionItems = pendingWorkshops.length + pendingVendors + pendingVendorApps;
  
  return (
    <div className="space-y-6">
      {/* Platform Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={users.length}
          format="number"
        />
        <MetricCard
          title="Total Events"
          value={stats.total}
          format="number"
        />
        <MetricCard
          title="Active Users"
          value={activeUsers.length}
          format="number"
        />
        <Card className={cn(
          totalActionItems > 0 ? 'border-yellow-500/50 bg-yellow-500/5' : ''
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <NumberFlow value={totalActionItems} />
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Action Items Section */}
      {totalActionItems > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Pending Actions
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {pendingVendors > 0 && (
              <AdminActionCard
                icon={UserCheck}
                title="Vendor Approvals"
                count={pendingVendors}
                description="New vendors awaiting approval"
                href={ROUTES.ADMIN_USERS + '?vendorApprovalStatus=PENDING'}
                variant="warning"
              />
            )}
            {pendingWorkshops.length > 0 && (
              <AdminActionCard
                icon={Calendar}
                title="Workshop Approvals"
                count={pendingWorkshops.length}
                description="Workshops pending review"
                href={ROUTES.ADMIN_EVENTS + '?status=PENDING_APPROVAL'}
                variant="warning"
              />
            )}
            {pendingVendorApps > 0 && (
              <AdminActionCard
                icon={Store}
                title="Booth Applications"
                count={pendingVendorApps}
                description="Vendor booth applications"
                href={ROUTES.VENDOR_REQUESTS}
                variant="warning"
              />
            )}
          </div>
        </div>
      )}
      
      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Management Quick Access */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Platform Management
          </h2>
          
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminActionCard
              icon={Users}
              title="User Management"
              description="Manage all platform users"
              href={ROUTES.ADMIN_USERS}
              variant="primary"
            />
            <AdminActionCard
              icon={Calendar}
              title="Event Management"
              description="Manage all events"
              href={ROUTES.ADMIN_EVENTS}
              variant="primary"
            />
            <AdminActionCard
              icon={Dumbbell}
              title="Gym Schedule"
              description="Manage gym sessions"
              href={ROUTES.GYM_SCHEDULE}
            />
            <AdminActionCard
              icon={Building2}
              title="Platform Setup"
              description="Configure platform booths"
              href={ROUTES.PLATFORM_SETUP}
            />
            <AdminActionCard
              icon={FileBarChart}
              title="Event Reports"
              description="View attendance analytics"
              href={ROUTES.EVENTS_REPORTS}
            />
            <AdminActionCard
              icon={CreditCard}
              title="Sales Reports"
              description="Revenue and transactions"
              href={ROUTES.SALES_REPORTS}
            />
          </div>
          
          {/* User Stats Summary */}
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-blue-600">
                    <NumberFlow value={roleBreakdown['STUDENT'] || 0} />
                  </div>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-purple-600">
                    <NumberFlow value={roleBreakdown['PROFESSOR'] || 0} />
                  </div>
                  <p className="text-xs text-muted-foreground">Professors</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-orange-600">
                    <NumberFlow value={roleBreakdown['VENDOR'] || 0} />
                  </div>
                  <p className="text-xs text-muted-foreground">Vendors</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-red-600">
                    <NumberFlow value={blockedUsers.length} />
                  </div>
                  <p className="text-xs text-muted-foreground">Blocked</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-4">
          {/* User Role Distribution */}
          {roleChartData.length > 0 && (
            <DonutChart
              title="Users by Role"
              description="Platform user distribution"
              data={roleChartData}
              config={roleChartConfig}
              centerLabel="Users"
            />
          )}
          
          {/* System Status */}
          <SystemStatusCard />
          
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Platform Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Published Events</span>
                <span className="font-medium text-green-600">{publishedEvents.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Upcoming Events</span>
                <span className="font-medium">{stats.upcoming}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Vendors</span>
                <span className="font-medium">{(roleBreakdown['VENDOR'] || 0) - pendingVendors}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Event Office Staff</span>
                <span className="font-medium">{roleBreakdown['EVENT_OFFICE'] || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
