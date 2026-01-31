/**
 * My Registrations Page (New Modern Version)
 * 
 * Front-office oriented page showing user's event registrations
 * with better UX and visual design
 */


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Registration, Event } from '../../../shared';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatValidationErrors } from '@/lib/format-errors';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users,
  CheckCircle,
  XCircle,
  ArrowRight,
  CalendarClock,
  AlertCircle
} from 'lucide-react';
import { formatDate } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { EventCardImage } from '@/components/ui/event-card-image';
import { usePageMeta } from '@/components/layout/page-meta-context';

function RegistrationCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <Skeleton className="h-48 md:h-auto md:w-64" />
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
    </Card>
  );
}

interface RegistrationCardProps {
  registration: Registration & { event: Event };
  onCancel: (registrationId: string) => void;
  isCancelling: boolean;
}

function RegistrationCard({ registration, onCancel, isCancelling }: RegistrationCardProps) {
  const navigate = useNavigate();
  const event = registration.event;
  
  const now = new Date();
  const startDate = event.startDate ? new Date(event.startDate) : new Date();
  const endDate = event.endDate ? new Date(event.endDate) : null;
  
  const hasStarted = startDate <= now;
  const hasEnded = endDate ? endDate < now : startDate < now;
  
  const typeConfigMap: Record<string, { label: string; color: string }> = {
    WORKSHOP: { label: 'Workshop', color: 'bg-blue-500' },
    TRIP: { label: 'Trip', color: 'bg-green-500' },
    CONFERENCE: { label: 'Conference', color: 'bg-purple-500' },
    BAZAAR: { label: 'Bazaar', color: 'bg-orange-500' },
    GYM_SESSION: { label: 'Gym Session', color: 'bg-red-500' },
  };
  const typeConfig = typeConfigMap[event.type] || { label: event.type, color: 'bg-gray-500' };
  
  const canCancel = registration.status === 'CONFIRMED' && !hasStarted;
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group">
      <div className="flex flex-col md:flex-row">
        {/* Event Image */}
        <div className="relative h-48 md:h-auto md:w-64 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
          {(event.images && event.images.length > 0) ? (
            <EventCardImage imageId={event.images[0]} alt={event.name} />
          ) : event.imageUrl ? (
            <img 
              src={event.imageUrl} 
              alt={event.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          {event.images && event.images.length > 1 && (
            <Badge className="absolute top-2 right-2 bg-black/60 text-white border-none">
              +{event.images.length - 1}
            </Badge>
          )}
        </div>
        
        {/* Event Details */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {event.name}
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className={cn(typeConfig.color, "text-white")}>
                    {typeConfig.label}
                  </Badge>
                  <Badge 
                    variant={hasEnded ? "secondary" : hasStarted ? "default" : "outline"}
                    className={cn(hasStarted && !hasEnded && "text-white dark:text-white")}
                  >
                    {hasEnded ? "Ended" : hasStarted ? "Ongoing" : "Upcoming"}
                  </Badge>
                  <Badge variant={registration.status === 'CONFIRMED' ? 'default' : registration.status === 'CANCELLED' ? 'destructive' : 'secondary'}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {registration.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-4 line-clamp-2">
              {event.description}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                <span>{event.startDate ? formatDate(event.startDate) : 'TBD'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{event.location === 'ON_CAMPUS' ? 'On Campus' : 'Off Campus'}</span>
              </div>
              {event.capacity && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{event.registeredCount || 0} / {event.capacity} registered</span>
                </div>
              )}
              {registration.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Registered {formatDate(registration.createdAt)}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button
              variant="default"
              onClick={() => navigate(ROUTES.EVENT_DETAILS.replace(':id', event.id))}
              className="flex-1"
            >
              View Details
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            {canCancel && (
              <Button
                variant="outline"
                onClick={() => onCancel(registration.id)}
                disabled={isCancelling}
                className="text-destructive hover:text-destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function MyRegistrationsPage() {
  const { user } = useAuthStore();
  const { setPageMeta } = usePageMeta();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  useEffect(() => {
    setPageMeta({
      title: 'My Registrations',
      description: 'View and manage your event registrations',
    });
  }, [setPageMeta]);
  
  const { data: registrationsData, isLoading } = trpc.events.getMyRegistrations.useQuery(
    { page: 1, limit: 100 },
    { enabled: !!user }
  );
  
  const utils = trpc.useUtils();
  
  const cancelMutation = trpc.events.cancelRegistration.useMutation({
    onSuccess: () => {
      toast.success('Registration cancelled successfully');
      setCancellingId(null);
      utils.events.getMyRegistrations.invalidate();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
      setCancellingId(null);
    },
  });
  
  const handleCancel = (registrationId: string) => {
    setCancellingId(registrationId);
    cancelMutation.mutate({ registrationId });
  };
  
  const registrations = (registrationsData?.registrations || []) as Array<Registration & { event: Event }>;
  
  // Filter registrations by status
  const upcomingRegistrations = registrations.filter((r) => {
    const event = r.event;
    const startDate = event.startDate ? new Date(event.startDate) : new Date();
    return r.status === 'CONFIRMED' && startDate > new Date();
  });
  
  const pastRegistrations = registrations.filter((r) => {
    const event = r.event;
    const endDate = event.endDate ? new Date(event.endDate) : (event.startDate ? new Date(event.startDate) : new Date());
    return endDate < new Date();
  });
  
  const cancelledRegistrations = registrations.filter((r) => r.status === 'CANCELLED');
  
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="space-y-4">
          <RegistrationCardSkeleton />
          <RegistrationCardSkeleton />
          <RegistrationCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="upcoming" className="gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming ({upcomingRegistrations.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            <Clock className="h-4 w-4" />
            Past ({pastRegistrations.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="gap-2">
            <XCircle className="h-4 w-4" />
            Cancelled ({cancelledRegistrations.length})
          </TabsTrigger>
        </TabsList>        {/* Upcoming Events */}
        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {upcomingRegistrations.length === 0 ? (
            <Card className="p-12 text-center">
              <CalendarClock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Upcoming Events</h3>
              <p className="text-muted-foreground mb-6">
                You haven't registered for any upcoming events yet.
              </p>
              <Button onClick={() => window.location.href = ROUTES.EVENTS}>
                Browse Events
              </Button>
            </Card>
          ) : (
            upcomingRegistrations.map((registration) => (
              <RegistrationCard
                key={registration.id}
                registration={registration}
                onCancel={handleCancel}
                isCancelling={cancellingId === registration.id}
              />
            ))
          )}
        </TabsContent>
        
        {/* Past Events */}
        <TabsContent value="past" className="space-y-4 mt-6">
          {pastRegistrations.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Past Events</h3>
              <p className="text-muted-foreground">
                You don't have any past event registrations.
              </p>
            </Card>
          ) : (
            pastRegistrations.map((registration) => (
              <RegistrationCard
                key={registration.id}
                registration={registration}
                onCancel={handleCancel}
                isCancelling={cancellingId === registration.id}
              />
            ))
          )}
        </TabsContent>
        
        {/* Cancelled Events */}
        <TabsContent value="cancelled" className="space-y-4 mt-6">
          {cancelledRegistrations.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Cancelled Registrations</h3>
              <p className="text-muted-foreground">
                You haven't cancelled any event registrations.
              </p>
            </Card>
          ) : (
            cancelledRegistrations.map((registration) => (
              <RegistrationCard
                key={registration.id}
                registration={registration}
                onCancel={handleCancel}
                isCancelling={cancellingId === registration.id}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
