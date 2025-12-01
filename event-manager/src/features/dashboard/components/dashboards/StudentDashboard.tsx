/**
 * Student/Staff/TA Dashboard
 * 
 * Enhanced dashboard with welcome message, activity feed, 
 * and smart recommendations based on user preferences
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
  Calendar, 
  Wallet, 
  Heart, 
  Ticket,
  Clock,
  MapPin,
  ArrowRight,
  CreditCard,
  Dumbbell,
  Trophy,
  Sparkles,
  TrendingUp,
  Users,
  Star,
  Zap,
  PartyPopper,
  GraduationCap,
  Building
} from 'lucide-react';
import { formatDate } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import NumberFlow from '@number-flow/react';
import type { Event, Registration } from '@event-manager/shared';

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Fetch all registrations
  const { data: registrationsData, isLoading: registrationsLoading } = trpc.events.getMyRegistrations.useQuery({
    limit: 100,
    status: 'all',
  });
  
  // Fetch wallet data
  const { data: walletData, isLoading: walletLoading } = trpc.payments.myWallet.useQuery({
    page: 1,
    limit: 50,
  });
  
  // Fetch upcoming events for recommendations
  const { data: eventsData } = trpc.events.getEvents.useQuery({
    page: 1,
    limit: 10,
  });

  // Process registrations
  type RegistrationWithEvent = Registration & { event?: Event };
  
  const analytics = useMemo(() => {
    const registrations = (registrationsData?.registrations || []) as RegistrationWithEvent[];
    const now = new Date();
    
    const upcoming = registrations.filter((r) => 
      r.event && r.event.startDate && new Date(r.event.startDate) > now
    );
    
    const past = registrations.filter((r) => 
      r.event && r.event.startDate && new Date(r.event.startDate) <= now
    );
    
    // Get next event
    const sortedUpcoming = [...upcoming].sort((a, b) => {
      const dateA = a.event?.startDate ? new Date(a.event.startDate).getTime() : 0;
      const dateB = b.event?.startDate ? new Date(b.event.startDate).getTime() : 0;
      return dateA - dateB;
    });
    
    const nextEvent = sortedUpcoming[0];
    
    // Calculate days until next event
    let daysUntilNext = null;
    if (nextEvent?.event?.startDate) {
      daysUntilNext = Math.ceil((new Date(nextEvent.event.startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    // Popular event types
    const typeCount: Record<string, number> = {};
    registrations.forEach((r) => {
      if (r.event?.type) {
        typeCount[r.event.type] = (typeCount[r.event.type] || 0) + 1;
      }
    });
    const favoriteType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    
    return {
      total: registrations.length,
      upcoming: upcoming.length,
      past: past.length,
      upcomingRegistrations: sortedUpcoming.slice(0, 4) as (Registration & { event: Event })[],
      nextEvent,
      daysUntilNext,
      favoriteType,
    };
  }, [registrationsData]);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  
  // Get first name
  const firstName = user?.firstName || 'there';

  const isLoading = registrationsLoading || walletLoading;
  
  // Recommended events (not registered)
  const recommendations = useMemo(() => {
    const registeredIds = new Set(
      (registrationsData?.registrations || []).map((r: any) => r.eventId)
    );
    return (eventsData?.events || [])
      .filter((e: Event) => !registeredIds.has(e.id) && e.status === 'PUBLISHED')
      .slice(0, 3);
  }, [eventsData, registrationsData]);

  return (
    <div className="space-y-6">
      {/* Hero Welcome Section */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[hsl(220,80%,50%)] via-[hsl(220,80%,55%)] to-[hsl(220,80%,60%)] text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNGMwIDItMiA0LTIgNHMtMi0yLTItNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 text-white/80" />
                <span className="text-sm text-white/80">{getGreeting()}</span>
              </div>
              <h1 className="text-2xl font-bold mb-1">{firstName}! 👋</h1>
              <p className="text-white/80 text-sm">
                {analytics.upcoming > 0 
                  ? `You have ${analytics.upcoming} upcoming event${analytics.upcoming > 1 ? 's' : ''} to look forward to!`
                  : "Ready to discover amazing events on campus?"
                }
              </p>
            </div>
            
            {/* Next Event Countdown */}
            {analytics.nextEvent && analytics.daysUntilNext !== null && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-xs text-white/70 uppercase tracking-wide mb-1">Next Event</p>
                <p className="font-semibold text-sm mb-2 truncate max-w-[200px]">
                  {analytics.nextEvent.event?.name}
                </p>
                <div className="flex items-center gap-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      <NumberFlow value={analytics.daysUntilNext} />
                    </div>
                    <p className="text-[10px] text-white/70 uppercase">
                      {analytics.daysUntilNext === 1 ? 'Day' : 'Days'}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-white/20" />
                  <div className="text-xs text-white/80">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {analytics.nextEvent.event?.startDate 
                      ? formatDate(analytics.nextEvent.event.startDate)
                      : 'TBD'
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Upcoming Events */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[hsl(220,80%,50%)]/10 text-[hsl(220,80%,50%)]">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
              {isLoading ? (
                <Skeleton className="h-6 w-8 mt-0.5" />
              ) : (
                <p className="text-xl font-semibold">
                  <NumberFlow value={analytics.upcoming} />
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Wallet Balance */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--stat-icon-success-bg)] text-[var(--stat-icon-success-fg)]">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Wallet</p>
              {walletLoading ? (
                <Skeleton className="h-6 w-16 mt-0.5" />
              ) : (
                <p className="text-xl font-semibold">
                  <NumberFlow 
                    value={(walletData?.balance?.balanceMinor || 0) / 100} 
                    format={{ style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }}
                    locales="en-EG"
                  />
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Events Attended */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[hsl(220,80%,60%)]/10 text-[hsl(220,80%,60%)]">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Attended</p>
              {isLoading ? (
                <Skeleton className="h-6 w-8 mt-0.5" />
              ) : (
                <p className="text-xl font-semibold">
                  <NumberFlow value={analytics.past} />
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Favorites */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[hsl(220,80%,70%)]/10 text-[hsl(220,80%,70%)]">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Favorites</p>
              <p className="text-xl font-semibold">
                <NumberFlow value={(user as any)?.favoriteEvents?.length || 0} />
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Upcoming Events List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Your Events */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[hsl(220,80%,50%)]" />
                Your Upcoming Events
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(`${ROUTES.EVENTS}?tab=registrations`)}
                className="text-xs"
              >
                View all <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            
            {registrationsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-3">
                    <Skeleton className="h-14 w-full" />
                  </Card>
                ))}
              </div>
            ) : analytics.upcomingRegistrations.length > 0 ? (
              <div className="space-y-2">
                {analytics.upcomingRegistrations.map((reg, index) => {
                  const event = reg.event;
                  const startDate = event?.startDate ? new Date(event.startDate) : new Date();
                  const daysUntil = Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  
                  const typeIcons: Record<string, typeof Calendar> = {
                    'WORKSHOP': GraduationCap,
                    'TRIP': MapPin,
                    'CONFERENCE': Users,
                    'GYM_SESSION': Dumbbell,
                    'BAZAAR': Building,
                  };
                  const TypeIcon = typeIcons[event?.type || ''] || Calendar;
                  
                  return (
                    <Card 
                      key={reg.id} 
                      className={cn(
                        "p-3 cursor-pointer transition-all hover:shadow-md group",
                        index === 0 && "ring-1 ring-[hsl(220,80%,50%)]/30 bg-[hsl(220,80%,50%)]/5"
                      )}
                      onClick={() => navigate(`/events/${event?.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0",
                          event?.type === 'WORKSHOP' ? 'bg-[hsl(220,80%,50%)]' :
                          event?.type === 'TRIP' ? 'bg-[hsl(220,80%,40%)]' :
                          event?.type === 'CONFERENCE' ? 'bg-[hsl(220,80%,60%)]' :
                          event?.type === 'GYM_SESSION' ? 'bg-[hsl(220,80%,45%)]' :
                          event?.type === 'BAZAAR' ? 'bg-[hsl(220,80%,70%)]' : 'bg-[hsl(220,80%,30%)]'
                        )}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm truncate">{event?.name}</span>
                            {daysUntil === 0 && (
                              <Badge className="bg-[hsl(142,76%,45%)] text-white text-[10px] px-1.5">Today!</Badge>
                            )}
                            {daysUntil === 1 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5">Tomorrow</Badge>
                            )}
                            {daysUntil > 1 && daysUntil <= 7 && (
                              <Badge variant="outline" className="text-[10px] px-1.5">{daysUntil}d</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event?.startDate ? formatDate(event.startDate) : 'TBD'}
                            </span>
                            {event?.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location === 'ON_CAMPUS' ? 'Campus' : 'Off-site'}
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
                <PartyPopper className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="font-medium text-sm mb-1">No upcoming events yet</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Discover amazing events happening on campus!
                </p>
                <Button size="sm" onClick={() => navigate(ROUTES.EVENTS)}>
                  <Sparkles className="h-4 w-4 mr-1" />
                  Explore Events
                </Button>
              </Card>
            )}
          </div>

          {/* Recommended For You */}
          {recommendations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-[hsl(220,80%,60%)]" />
                  Recommended For You
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate(ROUTES.EVENTS)}
                  className="text-xs"
                >
                  Browse all <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {recommendations.map((event: Event) => (
                  <Card 
                    key={event.id}
                    className="p-3 cursor-pointer hover:shadow-md transition-all group"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <Badge variant="outline" className="text-[10px] mb-2">
                      {event.type?.replace('_', ' ')}
                    </Badge>
                    <h4 className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-[hsl(220,80%,50%)]">
                      {event.name}
                    </h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.startDate ? formatDate(event.startDate) : 'TBD'}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Progress Card */}
          <Card className="p-4 bg-gradient-to-br from-[hsl(220,80%,50%)]/5 to-[hsl(220,80%,60%)]/10">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-[hsl(220,80%,50%)]" />
              <span className="text-sm font-medium">Your Activity</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Events this semester</span>
                  <span className="font-medium">{analytics.total}</span>
                </div>
                <Progress value={Math.min(analytics.total * 10, 100)} className="h-1.5" />
              </div>
              {analytics.favoriteType && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">You enjoy</p>
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    {analytics.favoriteType.replace('_', ' ')}s
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground px-1">Quick Actions</h2>
            
            <Card 
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => navigate(ROUTES.EVENTS)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[hsl(220,80%,50%)]/10 flex items-center justify-center text-[hsl(220,80%,50%)]">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium flex-1">Browse Events</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
            
            <Card 
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => navigate(`${ROUTES.EVENTS}?tab=registrations`)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[hsl(220,80%,60%)]/10 flex items-center justify-center text-[hsl(220,80%,60%)]">
                  <Ticket className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium flex-1">My Registrations</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
            
            <Card 
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => navigate(`${ROUTES.EVENTS}?tab=favorites`)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[hsl(220,80%,70%)]/10 flex items-center justify-center text-[hsl(220,80%,70%)]">
                  <Heart className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium flex-1">Favorites</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
            
            <Card 
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => navigate(ROUTES.GYM_SCHEDULE)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[hsl(220,80%,45%)]/10 flex items-center justify-center text-[hsl(220,80%,45%)]">
                  <Dumbbell className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium flex-1">Gym Sessions</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
            
            <Card 
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => navigate(ROUTES.WALLET)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--stat-icon-success-bg)] flex items-center justify-center text-[var(--stat-icon-success-fg)]">
                  <CreditCard className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium flex-1">Wallet</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
            
            <Card 
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => navigate(ROUTES.LOYALTY_PROGRAM)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[hsl(220,80%,55%)]/10 flex items-center justify-center text-[hsl(220,80%,55%)]">
                  <Trophy className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium flex-1">Loyalty Rewards</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
