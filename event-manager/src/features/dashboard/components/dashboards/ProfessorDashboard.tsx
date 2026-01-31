/**
 * Professor Dashboard
 * 
 * Analytics-focused dashboard with blue gradient theme
 * Shows: workshop analytics, approval status, attendance trends
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
  BookOpen, 
  Users, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Plus,
  Calendar,
  TrendingUp,
  BarChart3,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { formatDate } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import NumberFlow from '@number-flow/react';
import type { Event } from '../../../../shared';
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

export function ProfessorDashboard() {
  const navigate = useNavigate();
  
  // Fetch workshop statistics
  const { data: statsData, isLoading: statsLoading } = trpc.events.getEventStats.useQuery();
  
  // Fetch professor's workshops
  const { data: workshopsData, isLoading: workshopsLoading } = trpc.events.getAllEvents.useQuery({
    page: 1,
    perPage: 50,
    filters: { type: ['WORKSHOP'] },
  });
  
  const workshops = workshopsData?.events || [];
  const stats = statsData || { total: 0, upcoming: 0, past: 0, byType: {} };

  // Analytics calculations
  const analytics = useMemo(() => {
    const statusBreakdown: Record<string, number> = {};
    let totalRegistrations = 0;
    let totalCapacity = 0;
    
    workshops.forEach((w: Event) => {
      const status = w.status || 'DRAFT';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      totalRegistrations += w.registeredCount || 0;
      totalCapacity += w.capacity || 0;
    });
    
    const pending = workshops.filter((w: Event) => w.status === 'PENDING_APPROVAL');
    const needsEdits = workshops.filter((w: Event) => w.status === 'NEEDS_EDITS');
    const published = workshops.filter((w: Event) => w.status === 'PUBLISHED');
    const upcoming = published.filter((w: Event) => w.startDate && new Date(w.startDate) > new Date());
    
    // Attendance by workshop (top 5)
    const attendanceByWorkshop = workshops
      .filter((w: Event) => (w.registeredCount || 0) > 0)
      .sort((a: Event, b: Event) => (b.registeredCount || 0) - (a.registeredCount || 0))
      .slice(0, 5)
      .map((w: Event, index: number) => ({
        name: w.name.length > 15 ? w.name.substring(0, 15) + '...' : w.name,
        attendees: w.registeredCount || 0,
        fill: BLUE_PALETTE[index % BLUE_PALETTE.length],
      }));
    
    const avgAttendance = workshops.length > 0 
      ? Math.round(totalRegistrations / workshops.length) 
      : 0;
    
    const fillRate = totalCapacity > 0 
      ? Math.round((totalRegistrations / totalCapacity) * 100) 
      : 0;
    
    return {
      statusBreakdown,
      pending,
      needsEdits,
      published,
      upcoming,
      totalRegistrations,
      avgAttendance,
      fillRate,
      attendanceByWorkshop,
      actionRequired: pending.length + needsEdits.length,
    };
  }, [workshops]);

  // Status chart data
  const statusChartData = useMemo(() => {
    const statusColors: Record<string, string> = {
      PUBLISHED: BLUE_PALETTE[0],
      PENDING_APPROVAL: BLUE_PALETTE[1],
      NEEDS_EDITS: BLUE_PALETTE[2],
      DRAFT: BLUE_PALETTE[3],
      REJECTED: BLUE_PALETTE[4],
      COMPLETED: BLUE_PALETTE[0],
    };
    
    return Object.entries(analytics.statusBreakdown)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        status: status.replace('_', ' '),
        count,
        fill: statusColors[status] || BLUE_PALETTE[0],
      }));
  }, [analytics.statusBreakdown]);

  const isLoading = statsLoading || workshopsLoading;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[hsl(220,80%,50%)] via-[hsl(220,80%,55%)] to-[hsl(220,80%,60%)] text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNGMwIDItMiA0LTIgNHMtMi0yLTItNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm text-white/80">Workshop Hub</span>
                  <Sparkles className="h-4 w-4 text-white/60" />
                </div>
                <h1 className="text-xl font-bold">Your Workshops</h1>
                <p className="text-white/70 text-sm">
                  {analytics.upcoming.length > 0 
                    ? `${analytics.upcoming.length} upcoming session${analytics.upcoming.length > 1 ? 's' : ''} scheduled`
                    : "Share your expertise with students"
                  }
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 text-center">
                <div className="text-2xl font-bold"><NumberFlow value={workshops.length} /></div>
                <p className="text-[10px] text-white/70 uppercase">Workshops</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 text-center">
                <div className="text-2xl font-bold"><NumberFlow value={analytics.totalRegistrations} /></div>
                <p className="text-[10px] text-white/70 uppercase">Students</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Total Workshops */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg text-[var(--stat-icon-info-fg)] bg-[var(--stat-icon-info-bg)]">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Workshops</p>
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

        {/* Total Attendees */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[hsl(220,80%,50%)]/10 text-[hsl(220,80%,50%)]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Attendees</p>
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

        {/* Avg. Attendance */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg text-[var(--stat-icon-success-fg)] bg-[var(--stat-icon-success-bg)]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg. Attendance</p>
              {isLoading ? (
                <Skeleton className="h-6 w-12 mt-0.5" />
              ) : (
                <p className="text-xl font-semibold">
                  <NumberFlow value={analytics.avgAttendance} />
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
              <p className="text-xs text-muted-foreground">Needs Attention</p>
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
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[hsl(220,80%,50%)]/20">
                <Clock className="h-5 w-5 text-[hsl(220,80%,50%)]" />
              </div>
              <div>
                <h3 className="font-medium">Action Required</h3>
                <p className="text-sm text-muted-foreground">
                  {analytics.pending.length > 0 && `${analytics.pending.length} pending approval`}
                  {analytics.pending.length > 0 && analytics.needsEdits.length > 0 && ' • '}
                  {analytics.needsEdits.length > 0 && `${analytics.needsEdits.length} need edits`}
                </p>
              </div>
            </div>
            <Button onClick={() => navigate(ROUTES.ADMIN_EVENTS)}>
              Review Workshops
            </Button>
          </div>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Workshop Status Distribution */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Workshop Status</h3>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>
          {statusChartData.length > 0 ? (
            <>
              <ChartContainer
                config={Object.fromEntries(
                  statusChartData.map(item => [item.status, { label: item.status, color: item.fill }])
                )}
                className="h-[180px]"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={statusChartData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={75}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {statusChartData.map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-muted-foreground">{item.status} ({item.count})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No workshop data yet
            </div>
          )}
        </Card>

        {/* Top Workshops by Attendance */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Top Workshops</h3>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          {analytics.attendanceByWorkshop.length > 0 ? (
            <ChartContainer
              config={{
                attendees: { label: 'Attendees', color: 'hsl(220, 80%, 50%)' }
              }}
              className="h-[220px]"
            >
              <BarChart 
                data={analytics.attendanceByWorkshop} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="attendees" radius={[0, 4, 4, 0]}>
                  {analytics.attendanceByWorkshop.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground">
              No attendance data yet
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Workshops */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent Workshops</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.ADMIN_EVENTS)}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button size="sm" onClick={() => navigate(ROUTES.ADMIN_EVENTS)}>
                <Plus className="h-4 w-4 mr-1" /> New
              </Button>
            </div>
          </div>
          
          {workshopsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-16 w-full" />
                </Card>
              ))}
            </div>
          ) : workshops.length > 0 ? (
            <div className="space-y-3">
              {workshops.slice(0, 5).map((workshop: Event) => {
                const isPending = workshop.status === 'PENDING_APPROVAL';
                const needsEdits = workshop.status === 'NEEDS_EDITS';
                
                return (
                  <Card 
                    key={workshop.id} 
                    className={cn(
                      "p-4 cursor-pointer hover:shadow-md transition-all",
                      (isPending || needsEdits) && "border-[hsl(220,80%,60%)]/30"
                    )}
                    onClick={() => navigate(`/events/${workshop.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-white",
                        workshop.status === 'PUBLISHED' ? 'bg-[hsl(220,80%,50%)]' :
                        workshop.status === 'PENDING_APPROVAL' ? 'bg-[hsl(220,80%,60%)]' :
                        workshop.status === 'NEEDS_EDITS' ? 'bg-[hsl(220,80%,70%)]' :
                        'bg-[hsl(220,80%,40%)]'
                      )}>
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {workshop.status?.replace('_', ' ')}
                          </Badge>
                          {(isPending || needsEdits) && (
                            <Badge className="text-xs bg-[hsl(220,80%,50%)]">
                              Action Required
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium truncate">{workshop.name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {workshop.startDate ? formatDate(workshop.startDate) : 'TBD'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {workshop.registeredCount || 0} / {workshop.capacity || '∞'}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h4 className="font-medium mb-1">No workshops yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first workshop to share knowledge!
              </p>
              <Button onClick={() => navigate(ROUTES.ADMIN_EVENTS)}>
                <Plus className="h-4 w-4 mr-2" /> Create Workshop
              </Button>
            </Card>
          )}
        </div>

        {/* Quick Stats Sidebar */}
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
                <span className="text-sm font-medium flex-1">Create Workshop</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
            
            <Card 
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => navigate(ROUTES.ADMIN_EVENTS)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[hsl(220,80%,60%)]/10 flex items-center justify-center text-[hsl(220,80%,60%)]">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium flex-1">My Workshops</span>
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
