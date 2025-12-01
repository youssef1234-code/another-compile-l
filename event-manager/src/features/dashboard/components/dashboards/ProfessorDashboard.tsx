/**
 * Professor Dashboard
 * 
 * Dashboard for professors showing:
 * - Workshop statistics
 * - Pending approval workshops
 * - Recent workshop activity
 * - Workshop registrations overview
 */

import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowRight,
  Plus,
  Calendar,
  TrendingUp,
  FileText,
  BarChart3
} from 'lucide-react';
import { formatDate } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import NumberFlow from '@number-flow/react';
import type { Event } from '@event-manager/shared';
import { DonutChart } from '../charts/DonutChart';

// Workshop Status Card
function WorkshopStatusCard({ 
  workshop, 
  onViewDetails 
}: { 
  workshop: Event; 
  onViewDetails: (id: string) => void;
}) {
  const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    DRAFT: { color: 'bg-gray-500', icon: FileText, label: 'Draft' },
    PENDING_APPROVAL: { color: 'bg-yellow-500', icon: Clock, label: 'Pending' },
    APPROVED: { color: 'bg-blue-500', icon: CheckCircle, label: 'Approved' },
    NEEDS_EDITS: { color: 'bg-orange-500', icon: AlertCircle, label: 'Needs Edits' },
    REJECTED: { color: 'bg-red-500', icon: XCircle, label: 'Rejected' },
    PUBLISHED: { color: 'bg-green-500', icon: CheckCircle, label: 'Published' },
    CANCELLED: { color: 'bg-gray-500', icon: XCircle, label: 'Cancelled' },
    COMPLETED: { color: 'bg-emerald-500', icon: CheckCircle, label: 'Completed' },
  };
  
  const status = workshop.status || 'DRAFT';
  const config = statusConfig[status] || statusConfig.DRAFT;
  const StatusIcon = config.icon;
  const startDate = workshop.startDate ? new Date(workshop.startDate) : new Date();
  const isPast = startDate < new Date();
  
  return (
    <Card className="hover:shadow-md transition-all duration-200 group cursor-pointer" onClick={() => onViewDetails(workshop.id)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn(config.color, 'text-white text-xs')}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
              {isPast && workshop.status === 'PUBLISHED' && (
                <Badge variant="outline" className="text-xs">Past</Badge>
              )}
            </div>
            <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {workshop.name}
            </h4>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
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
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfessorDashboard() {
  const navigate = useNavigate();
  
  // Fetch workshop statistics
  const { data: statsData, isLoading: statsLoading } = trpc.events.getEventStats.useQuery();
  
  // Fetch professor's workshops
  const { data: workshopsData, isLoading: workshopsLoading } = trpc.events.getAllEvents.useQuery({
    page: 1,
    perPage: 20,
    filters: { type: ['WORKSHOP'] },
  });
  
  const workshops = workshopsData?.events || [];
  const stats = statsData || { total: 0, upcoming: 0, past: 0, byType: {} };
  
  // Calculate workshop status breakdown
  const statusBreakdown = workshops.reduce((acc: Record<string, number>, w: Event) => {
    const status = w.status || 'DRAFT';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  const pendingWorkshops = workshops.filter((w: Event) => w.status === 'PENDING_APPROVAL');
  const needsEditsWorkshops = workshops.filter((w: Event) => w.status === 'NEEDS_EDITS');
  const publishedWorkshops = workshops.filter((w: Event) => w.status === 'PUBLISHED');
  const upcomingWorkshops = publishedWorkshops.filter((w: Event) => w.startDate && new Date(w.startDate) > new Date());
  
  // Chart data for workshop status
  const statusChartData = [
    { name: 'Published', value: statusBreakdown['PUBLISHED'] || 0, fill: 'hsl(142, 76%, 36%)' },
    { name: 'Pending', value: statusBreakdown['PENDING_APPROVAL'] || 0, fill: 'hsl(45, 93%, 47%)' },
    { name: 'Needs Edits', value: statusBreakdown['NEEDS_EDITS'] || 0, fill: 'hsl(24, 95%, 53%)' },
    { name: 'Draft', value: statusBreakdown['DRAFT'] || 0, fill: 'hsl(215, 14%, 34%)' },
    { name: 'Rejected', value: statusBreakdown['REJECTED'] || 0, fill: 'hsl(0, 84%, 60%)' },
  ].filter(d => d.value > 0);
  
  const statusChartConfig = {
    Published: { label: 'Published', color: 'hsl(142, 76%, 36%)' },
    Pending: { label: 'Pending', color: 'hsl(45, 93%, 47%)' },
    'Needs Edits': { label: 'Needs Edits', color: 'hsl(24, 95%, 53%)' },
    Draft: { label: 'Draft', color: 'hsl(215, 14%, 34%)' },
    Rejected: { label: 'Rejected', color: 'hsl(0, 84%, 60%)' },
  };
  
  // Calculate total registrations across all workshops
  const totalRegistrations = workshops.reduce((sum: number, w: Event) => sum + (w.registeredCount || 0), 0);
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Total Workshops
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                <NumberFlow value={stats.total} />
              </div>
            )}
            <p className="text-xs text-muted-foreground">Created by you</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workshopsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                <NumberFlow value={upcomingWorkshops.length} />
              </div>
            )}
            <p className="text-xs text-muted-foreground">Scheduled workshops</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Attendees
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workshopsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                <NumberFlow value={totalRegistrations} />
              </div>
            )}
            <p className="text-xs text-muted-foreground">Across all workshops</p>
          </CardContent>
        </Card>
        
        <Card className={cn(
          pendingWorkshops.length > 0 || needsEditsWorkshops.length > 0 
            ? 'border-yellow-500/50 bg-yellow-500/5' 
            : ''
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workshopsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                <NumberFlow value={pendingWorkshops.length + needsEditsWorkshops.length} />
              </div>
            )}
            <p className="text-xs text-muted-foreground">Pending or needs edits</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Action Banner for Pending Items */}
      {(pendingWorkshops.length > 0 || needsEditsWorkshops.length > 0) && (
        <Card className="border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-500/20">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-medium">Action Required</h3>
                  <p className="text-sm text-muted-foreground">
                    {pendingWorkshops.length > 0 && `${pendingWorkshops.length} workshop(s) pending approval`}
                    {pendingWorkshops.length > 0 && needsEditsWorkshops.length > 0 && ' • '}
                    {needsEditsWorkshops.length > 0 && `${needsEditsWorkshops.length} workshop(s) need edits`}
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate(ROUTES.ADMIN_EVENTS)}>
                Review Workshops
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Workshops */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Your Workshops
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.ADMIN_EVENTS)}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button size="sm" onClick={() => navigate(ROUTES.ADMIN_EVENTS)}>
                <Plus className="h-4 w-4 mr-1" /> New Workshop
              </Button>
            </div>
          </div>
          
          {workshopsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : workshops.length > 0 ? (
            <div className="space-y-3">
              {workshops.slice(0, 6).map((workshop: Event) => (
                <WorkshopStatusCard 
                  key={workshop.id} 
                  workshop={workshop}
                  onViewDetails={(id) => navigate(ROUTES.EVENT_DETAILS.replace(':id', id))}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="font-medium mb-1">No workshops yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first workshop to share knowledge with students!
                </p>
                <Button onClick={() => navigate(ROUTES.ADMIN_EVENTS)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workshop
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Sidebar with Chart and Quick Actions */}
        <div className="space-y-4">
          {/* Workshop Status Chart */}
          {statusChartData.length > 0 && (
            <DonutChart
              title="Workshop Status"
              description="Distribution by status"
              data={statusChartData}
              config={statusChartConfig}
              centerLabel="Workshops"
            />
          )}
          
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Published</span>
                <span className="font-medium">{statusBreakdown['PUBLISHED'] || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending Approval</span>
                <span className="font-medium text-yellow-600">{statusBreakdown['PENDING_APPROVAL'] || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Needs Edits</span>
                <span className="font-medium text-orange-600">{statusBreakdown['NEEDS_EDITS'] || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium text-emerald-600">{statusBreakdown['COMPLETED'] || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Drafts</span>
                <span className="font-medium">{statusBreakdown['DRAFT'] || 0}</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Action */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Workshop Analytics</h3>
                  <p className="text-xs text-muted-foreground">Track your workshop performance</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate(ROUTES.ADMIN_EVENTS)}>
                View Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
