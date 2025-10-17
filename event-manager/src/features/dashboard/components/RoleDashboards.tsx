/**
 * Role-Specific Dashboard Components
 * 
 * Different dashboard views for each user role with relevant metrics and actions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import {
  Calendar,
  TrendingUp,
  Users,
  Award,
  BookOpen,
  MapPin,
  ShoppingBag,
  Dumbbell,
  BarChart3,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import type { Event } from '@event-manager/shared';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: string;
  className?: string;
}

function StatCard({ title, value, description, icon, trend, className }: StatCardProps) {
  return (
    <motion.div variants={cardVariants}>
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="h-4 w-4 text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Student Dashboard
export function StudentDashboard() {
  const { data: registrationsData } = trpc.events.getMyRegistrations.useQuery({
    page: 1,
    limit: 10,
    status: 'upcoming',
  });

  const { data: eventsData } = trpc.events.getEvents.useQuery({
    page: 1,
    limit: 5,
    onlyUpcoming: true,
  });

  const registrations = registrationsData?.registrations || [];
  const upcomingEvents = (eventsData?.events || []) as Event[];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-6"
    >
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Registrations"
          value={registrations.length}
          description="Active event registrations"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          title="Upcoming Events"
          value={upcomingEvents.length}
          description="Available to register"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          title="Points Earned"
          value="0"
          description="Attendance points"
          icon={<Award className="h-4 w-4" />}
        />
        <StatCard
          title="Court Bookings"
          value="0"
          description="Active reservations"
          icon={<Dumbbell className="h-4 w-4" />}
        />
      </div>

      {/* Quick Actions */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>What would you like to do today?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link to={ROUTES.EVENTS}>
                  <Calendar className="h-5 w-5" />
                  <span>Browse Events</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link to={`${ROUTES.EVENTS}?tab=registrations`}>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>My Registrations</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link to={ROUTES.COURT_BOOKINGS}>
                  <Dumbbell className="h-5 w-5" />
                  <span>Book Courts</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link to={ROUTES.GYM_SCHEDULE}>
                  <Calendar className="h-5 w-5" />
                  <span>Gym Schedule</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming Events */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events you might be interested in</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <h3 className="font-medium">{event.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleDateString()} • {event.location}
                      </p>
                    </div>
                    <Button asChild size="sm">
                      <Link to={`${ROUTES.EVENTS}/${event.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No upcoming events available
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Professor Dashboard
export function ProfessorDashboard() {
  const { data: eventsData } = trpc.events.getEvents.useQuery({
    page: 1,
    limit: 100,
    type: 'WORKSHOP',
  });

  const allEvents = (eventsData?.events || []) as Event[];
  const myWorkshops = allEvents; // Filter by createdBy on backend
  const pendingWorkshops = myWorkshops.filter((w: any) => w.status === 'PENDING_APPROVAL');

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-6"
    >
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Workshops"
          value={myWorkshops.length}
          description="Total workshops created"
          icon={<BookOpen className="h-4 w-4" />}
        />
        <StatCard
          title="Pending Approval"
          value={pendingWorkshops.length}
          description="Awaiting review"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          title="Published"
          value={myWorkshops.filter((w: any) => w.status === 'PUBLISHED').length}
          description="Active workshops"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          title="Total Participants"
          value={myWorkshops.reduce((acc: number, w: any) => acc + (w.registeredCount || 0), 0)}
          description="Across all workshops"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* Quick Actions */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your workshops</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button asChild variant="default" className="h-20 flex-col gap-2">
                <Link to={ROUTES.CREATE_WORKSHOP}>
                  <Plus className="h-5 w-5" />
                  <span>Create Workshop</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link to={ROUTES.MY_WORKSHOPS}>
                  <BookOpen className="h-5 w-5" />
                  <span>My Workshops</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link to={ROUTES.EVENTS}>
                  <Calendar className="h-5 w-5" />
                  <span>Browse Events</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Workshops */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle>My Recent Workshops</CardTitle>
            <CardDescription>Your workshop submissions and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {myWorkshops.length > 0 ? (
              <div className="space-y-4">
                {myWorkshops.slice(0, 5).map((workshop: any) => (
                  <div
                    key={workshop.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <h3 className="font-medium">{workshop.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(workshop.date).toLocaleDateString()} • {workshop.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          workshop.status === 'PUBLISHED'
                            ? 'default'
                            : workshop.status === 'PENDING_APPROVAL'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {workshop.status}
                      </Badge>
                      <Button asChild size="sm">
                        <Link to={`${ROUTES.EVENTS}/${workshop.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <p className="text-muted-foreground">You haven't created any workshops yet</p>
                <Button asChild>
                  <Link to={ROUTES.CREATE_WORKSHOP}>Create Your First Workshop</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Events Office Dashboard
export function EventsOfficeDashboard() {
  const { data: eventsData } = trpc.events.getEvents.useQuery({
    page: 1,
    limit: 50,
  });

  const allEvents = (eventsData?.events || []) as Event[];
  const pendingWorkshops = allEvents.filter(
    (e) => e.type === 'WORKSHOP' && e.status === 'PENDING_APPROVAL'
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-6"
    >
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Events"
          value={allEvents.length}
          description="All platform events"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          title="Pending Approvals"
          value={pendingWorkshops.length}
          description="Workshops to review"
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <StatCard
          title="Vendor Requests"
          value="0"
          description="Awaiting response"
          icon={<ShoppingBag className="h-4 w-4" />}
        />
        <StatCard
          title="Gym Sessions"
          value="0"
          description="Scheduled sessions"
          icon={<Dumbbell className="h-4 w-4" />}
        />
      </div>

      {/* Quick Actions */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage events and approvals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button asChild variant="default" className="h-20 flex-col gap-2">
                <Link to={ROUTES.WORKSHOP_APPROVALS}>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Workshop Approvals</span>
                  {pendingWorkshops.length > 0 && (
                    <Badge variant="destructive" className="absolute top-2 right-2">
                      {pendingWorkshops.length}
                    </Badge>
                  )}
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link to={ROUTES.CREATE_TRIP}>
                  <MapPin className="h-5 w-5" />
                  <span>Create Trip</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link to={ROUTES.CREATE_BAZAAR}>
                  <ShoppingBag className="h-5 w-5" />
                  <span>Create Bazaar</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link to={ROUTES.MANAGE_SESSIONS}>
                  <Dumbbell className="h-5 w-5" />
                  <span>Manage Gym</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pending Workshops */}
      {pendingWorkshops.length > 0 && (
        <motion.div variants={cardVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Pending Workshop Approvals
                <Badge variant="destructive">{pendingWorkshops.length}</Badge>
              </CardTitle>
              <CardDescription>Review and approve workshop submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingWorkshops.slice(0, 3).map((workshop) => (
                  <div
                    key={workshop.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <h3 className="font-medium">{workshop.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Submitted • {new Date(workshop.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Button asChild size="sm">
                      <Link to={ROUTES.WORKSHOP_APPROVALS}>Review</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Event Statistics */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Event Distribution</CardTitle>
            <CardDescription>Overview of all events by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">
                  {allEvents.filter((e) => e.type === 'WORKSHOP').length}
                </div>
                <p className="text-sm text-muted-foreground">Workshops</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">
                  {allEvents.filter((e) => e.type === 'TRIP').length}
                </div>
                <p className="text-sm text-muted-foreground">Trips</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">
                  {allEvents.filter((e) => e.type === 'BAZAAR').length}
                </div>
                <p className="text-sm text-muted-foreground">Bazaars</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">
                  {allEvents.filter((e) => e.type === 'CONFERENCE').length}
                </div>
                <p className="text-sm text-muted-foreground">Conferences</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Admin Dashboard
export function AdminDashboard() {
  // Similar structure to Events Office but with more administrative features
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-6"
    >
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value="0"
          description="Registered users"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Total Events"
          value="0"
          description="All events"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          title="Role Approvals"
          value="0"
          description="Pending approvals"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          title="Reports"
          value="0"
          description="System reports"
          icon={<BarChart3 className="h-4 w-4" />}
        />
      </div>

      {/* Quick Actions */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Admin Tools</CardTitle>
            <CardDescription>System management and oversight</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link to={ROUTES.ADMIN_USERS}>
                  <Users className="h-5 w-5" />
                  <span>Manage Users</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link to={ROUTES.ADMIN_REPORTS}>
                  <BarChart3 className="h-5 w-5" />
                  <span>View Reports</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Vendor Dashboard
export function VendorDashboard() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-6"
    >
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Applications"
          value="0"
          description="Total applications"
          icon={<ShoppingBag className="h-4 w-4" />}
        />
        <StatCard
          title="Approved"
          value="0"
          description="Accepted applications"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          title="Pending"
          value="0"
          description="Under review"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          title="Loyalty Points"
          value="0"
          description="Rewards earned"
          icon={<Award className="h-4 w-4" />}
        />
      </div>

      {/* Quick Actions */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your vendor applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button asChild variant="default" className="h-20 flex-col gap-2">
                <Link to={ROUTES.BROWSE_BAZAARS}>
                  <ShoppingBag className="h-5 w-5" />
                  <span>Browse Bazaars</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link to={ROUTES.VENDOR_APPLICATIONS}>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>My Applications</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link to={ROUTES.LOYALTY_PROGRAM}>
                  <Award className="h-5 w-5" />
                  <span>Loyalty Program</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
