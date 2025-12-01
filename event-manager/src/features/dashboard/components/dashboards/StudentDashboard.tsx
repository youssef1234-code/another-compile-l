/**
 * Student/Staff/TA Dashboard
 * 
 * Dashboard for attendee roles showing:
 * - Upcoming registrations
 * - Wallet balance quick view
 * - Favorite events
 * - Gym session availability
 * - Quick actions
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
  Calendar, 
  Wallet, 
  Heart, 
  Dumbbell, 
  ArrowRight,
  MapPin,
  CalendarDays,
  Ticket,
  Star,
  TrendingUp
} from 'lucide-react';
import { formatDate } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import NumberFlow from '@number-flow/react';
import type { Event, Registration } from '@event-manager/shared';

// Quick Action Card Component
function QuickActionCard({ 
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
  variant?: 'default' | 'primary' | 'success';
}) {
  const navigate = useNavigate();
  
  const variantStyles = {
    default: 'hover:border-primary/50 hover:bg-primary/5',
    primary: 'border-primary/20 bg-primary/5 hover:bg-primary/10',
    success: 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10',
  };
  
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 group",
        variantStyles[variant]
      )}
      onClick={() => navigate(href)}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn(
          "p-3 rounded-xl transition-colors",
          variant === 'primary' ? 'bg-primary/10 text-primary' : 
          variant === 'success' ? 'bg-emerald-500/10 text-emerald-600' :
          'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardContent>
    </Card>
  );
}

// Upcoming Registration Card
function UpcomingRegistrationCard({ registration }: { registration: Registration & { event: Event } }) {
  const navigate = useNavigate();
  const event = registration.event;
  const startDate = event.startDate ? new Date(event.startDate) : new Date();
  const now = new Date();
  const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  const typeColors: Record<string, string> = {
    WORKSHOP: 'bg-blue-500',
    TRIP: 'bg-green-500',
    CONFERENCE: 'bg-purple-500',
    BAZAAR: 'bg-orange-500',
    GYM_SESSION: 'bg-red-500',
  };
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 group overflow-hidden"
      onClick={() => navigate(ROUTES.EVENT_DETAILS.replace(':id', event.id))}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn(typeColors[event.type] || 'bg-gray-500', 'text-white text-xs')}>
                {event.type.replace('_', ' ')}
              </Badge>
              {daysUntil <= 3 && daysUntil >= 0 && (
                <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                  {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                </Badge>
              )}
            </div>
            <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {event.name}
            </h4>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {event.startDate ? formatDate(event.startDate) : 'TBD'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {event.location === 'ON_CAMPUS' ? 'On Campus' : 'Off Campus'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={registration.status === 'CONFIRMED' ? 'default' : 'secondary'} className="text-xs">
              {registration.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Fetch upcoming registrations
  const { data: registrationsData, isLoading: registrationsLoading } = trpc.events.getMyRegistrations.useQuery({
    page: 1,
    limit: 5,
    status: 'upcoming',
  });
  
  // Fetch wallet balance
  const { data: walletData, isLoading: walletLoading } = trpc.payments.myWallet.useQuery({
    page: 1,
    limit: 1,
  });
  
  const upcomingRegistrations = (registrationsData?.registrations || []) as (Registration & { event: Event })[];
  const walletBalance = (walletData?.balance?.balanceMinor || 0) / 100;
  const currency = walletData?.balance?.currency || 'EGP';
  
  return (
    <div className="space-y-6">
      {/* Welcome Section with Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Wallet Balance Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-16 bg-primary/5 rounded-full -mr-8 -mt-8" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {walletLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                <NumberFlow 
                  value={walletBalance} 
                  format={{ style: 'currency', currency, maximumFractionDigits: 0 }} 
                />
              </div>
            )}
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs text-primary"
              onClick={() => navigate(ROUTES.WALLET)}
            >
              Manage Wallet →
            </Button>
          </CardContent>
        </Card>
        
        {/* Upcoming Events Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {registrationsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                <NumberFlow value={upcomingRegistrations.length} />
              </div>
            )}
            <p className="text-xs text-muted-foreground">Registered events</p>
          </CardContent>
        </Card>
        
        {/* Favorites Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Favorites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <NumberFlow value={(user as any)?.favoriteEvents?.length || 0} />
            </div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs text-primary"
              onClick={() => navigate(`${ROUTES.EVENTS}?tab=favorites`)}
            >
              View Favorites →
            </Button>
          </CardContent>
        </Card>
        
        {/* Quick Stats Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <NumberFlow value={registrationsData?.total || 0} />
            </div>
            <p className="text-xs text-muted-foreground">Total registrations</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Registrations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Events
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate(`${ROUTES.EVENTS}?tab=registrations`)}>
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          {registrationsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingRegistrations.length > 0 ? (
            <div className="space-y-3">
              {upcomingRegistrations.slice(0, 4).map((reg: Registration & { event: Event }) => (
                <UpcomingRegistrationCard key={reg.id} registration={reg} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="font-medium mb-1">No upcoming events</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Browse events and register for something exciting!
                </p>
                <Button onClick={() => navigate(ROUTES.EVENTS)}>
                  Browse Events
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Quick Actions Sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Quick Actions
          </h2>
          
          <div className="space-y-3">
            <QuickActionCard
              icon={Calendar}
              title="Browse Events"
              description="Discover upcoming events"
              href={ROUTES.EVENTS}
              variant="primary"
            />
            <QuickActionCard
              icon={Dumbbell}
              title="Gym Schedule"
              description="Book gym sessions"
              href={ROUTES.GYM_SCHEDULE}
            />
            <QuickActionCard
              icon={Ticket}
              title="My Registrations"
              description="View your registered events"
              href={`${ROUTES.EVENTS}?tab=registrations`}
            />
            <QuickActionCard
              icon={Heart}
              title="Favorites"
              description="Your saved events"
              href={`${ROUTES.EVENTS}?tab=favorites`}
            />
            <QuickActionCard
              icon={Wallet}
              title="Wallet"
              description="Manage your balance"
              href={ROUTES.WALLET}
              variant="success"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
