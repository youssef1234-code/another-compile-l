/**
 * Production-Ready Event Details Page
 * 
 * Comprehensive event view with:
 * - Hero section with large event image
 * - Full event details and description
 * - Registration functionality (for eligible roles)
 * - Registered students list (for EVENT_OFFICE/ADMIN)
 * - Capacity indicator with progress
 * - Vendor list for bazaars
 * - Related events section
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Edit, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Clock, 
  User,
  Building2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Mail,
  CheckSquare
} from "lucide-react";
import { formatDate } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { EventImageCarousel } from "@/components/ui/event-image-carousel";

function EventDetailsPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="relative h-[400px] bg-muted">
        <Skeleton className="absolute inset-0" />
      </div>
      <div className="max-w-7xl mx-auto p-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);

  const { data: event, isLoading } = trpc.events.getEventById.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const { data: isRegisteredData } = trpc.events.isRegistered.useQuery(
    { eventId: id! },
    { enabled: !!id && !!user }
  );

  const { data: registrationsData } = trpc.events.getEventRegistrations.useQuery(
    { eventId: id!, page: 1, limit: 100 },
    { enabled: !!id && (user?.role === "EVENT_OFFICE" || user?.role === "ADMIN") }
  );

  const utils = trpc.useUtils();
  
  const registerMutation = trpc.events.registerForEvent.useMutation({
    onSuccess: () => {
      toast.success("Successfully registered for event!");
      setIsRegistering(false);
      // Invalidate queries to refresh event data and registration status
      utils.events.getEventById.invalidate({ id: id! });
      utils.events.isRegistered.invalidate({ eventId: id! });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to register for event");
      setIsRegistering(false);
    },
  });

  if (isLoading) {
    return <EventDetailsPageSkeleton />;
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-12 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate(ROUTES.EVENTS)}>
            Browse All Events
          </Button>
        </Card>
      </div>
    );
  }

  const canEdit = user?.role === "EVENT_OFFICE" && event.type === "BAZAAR";
  const hasStarted = new Date(event.startDate) <= new Date();
  const hasEnded = new Date(event.endDate) <= new Date();
  const registrationClosed = event.registrationDeadline 
    ? new Date(event.registrationDeadline) < new Date()
    : false;
  const isFull = event.capacity && event.registeredCount >= event.capacity;
  const isRegistered = isRegisteredData?.isRegistered || false;
  
  const canRegister = user && 
    ['STUDENT', 'STAFF', 'TA', 'PROFESSOR'].includes(user.role) &&
    !hasStarted &&
    !registrationClosed &&
    !isFull &&
    !isRegistered;

  const capacityPercentage = event.capacity 
    ? (event.registeredCount / event.capacity) * 100 
    : 0;

  const handleEdit = () => {
    if (event.type === "BAZAAR") {
      navigate(ROUTES.EDIT_BAZAAR.replace(':id', event.id));
    }
  };

  const handleRegister = async () => {
    if (!canRegister) return;
    setIsRegistering(true);
    registerMutation.mutate({ eventId: event.id });
  };

  const typeConfigMap: Record<string, { label: string; color: string; icon: any }> = {
    WORKSHOP: { label: 'Workshop', color: 'bg-blue-500', icon: Building2 },
    TRIP: { label: 'Trip', color: 'bg-green-500', icon: MapPin },
    CONFERENCE: { label: 'Conference', color: 'bg-purple-500', icon: Users },
    BAZAAR: { label: 'Bazaar', color: 'bg-orange-500', icon: DollarSign },
    GYM_SESSION: { label: 'Gym Session', color: 'bg-red-500', icon: Users },
  };
  const typeConfig = typeConfigMap[event.type] || { label: event.type, color: 'bg-gray-500', icon: Calendar };

  const TypeIcon = typeConfig.icon;

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-background via-background to-muted/20 transition-opacity duration-200",
      isLoading && "opacity-60"
    )}>
      {/* Hero Section */}
      <div className="relative h-[400px] bg-gradient-to-r from-primary/10 via-primary/5 to-background overflow-hidden">
        {(event.images && event.images.length > 0) ? (
          <div className="absolute inset-0">
            <EventImageCarousel images={event.images} alt={event.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          </div>
        ) : event.imageUrl ? (
          <div className="absolute inset-0">
            <img 
              src={event.imageUrl} 
              alt={event.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="relative max-w-7xl mx-auto h-full flex items-end p-8 pb-6">
          <div className="space-y-3 text-white w-full">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={cn(typeConfig.color, "text-white shadow-lg backdrop-blur-md border border-white/20")}>
                <TypeIcon className="h-3 w-3 mr-1" />
                {typeConfig.label}
              </Badge>
              <Badge 
                variant={hasEnded ? "secondary" : hasStarted ? "default" : "outline"} 
                className="shadow-lg backdrop-blur-md bg-background/90 border border-white/20"
              >
                {hasEnded ? "Ended" : hasStarted ? "Ongoing" : "Upcoming"}
              </Badge>
              {event.status === "APPROVED" && (
                <Badge variant="default" className="bg-emerald-500 shadow-lg backdrop-blur-md border border-white/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              )}
              {event.status === "PENDING" && (
                <Badge variant="secondary" className="shadow-lg backdrop-blur-md border border-white/20">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Approval
                </Badge>
              )}
              {event.status === "REJECTED" && (
                <Badge variant="destructive" className="shadow-lg backdrop-blur-md border border-white/20">
                  <XCircle className="h-3 w-3 mr-1" />
                  Rejected
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] [text-shadow:_0_2px_8px_rgb(0_0_0_/_80%)]">{event.name}</h1>
            <div className="flex items-center gap-4 text-sm flex-wrap [text-shadow:_0_2px_4px_rgb(0_0_0_/_60%)]">
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Calendar className="h-4 w-4" />
                {formatDate(new Date(event.startDate))}
              </div>
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">{event.location === 'ON_CAMPUS' ? 'On Campus' : 'Off Campus'}</span>
              </div>
              {event.locationDetails && (
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <span className="text-white/90">{event.locationDetails}</span>
                </div>
              )}
              {event.price && event.price > 0 ? (
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full font-semibold">
                  <DollarSign className="h-4 w-4" />
                  {event.price} EGP
                </div>
              ) : (
                <Badge variant="default" className="bg-emerald-500 shadow-lg backdrop-blur-md border border-white/20">FREE</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Registration Status Card */}
            {isRegistered && (
              <Card className="border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                        You're Registered!
                      </p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        See you at the event
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </CardContent>
            </Card>

            {/* Registered Students (EVENT_OFFICE/ADMIN only) */}
            {registrationsData && registrationsData.registrations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Registered Participants ({registrationsData.total})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {registrationsData.registrations.map((reg: any) => (
                      <div 
                        key={reg.id} 
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {reg.user.firstName} {reg.user.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {reg.user.email}
                            </p>
                          </div>
                        </div>
                        <Badge variant={reg.status === "CONFIRMED" ? "default" : "secondary"}>
                          {reg.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vendors (for Bazaars) */}
            {event.type === "BAZAAR" && event.vendors && event.vendors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Participating Vendors ({event.vendors.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {event.vendors.map((vendor: any) => (
                      <div 
                        key={vendor.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <p className="font-semibold">{vendor.companyName}</p>
                        <p className="text-sm text-muted-foreground">{vendor.email}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Registration CTA */}
            {isRegistered ? (
              <Card className="border-green-500 shadow-lg bg-green-50/50">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckSquare className="h-6 w-6 text-green-600" />
                        <p className="text-2xl font-bold text-green-600">
                          Already Registered
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You're confirmed for this event
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : canRegister ? (
              <Card className="border-primary shadow-lg">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary mb-1">
                        {event.price ? `${event.price} EGP` : 'FREE'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.capacity ? `${event.capacity - event.registeredCount} spots left` : 'Open registration'}
                      </p>
                    </div>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleRegister}
                      disabled={isRegistering}
                    >
                      {isRegistering ? "Registering..." : "Register Now"}
                    </Button>
                    {event.registrationDeadline && (
                      <p className="text-xs text-center text-muted-foreground">
                        Register by {formatDate(new Date(event.registrationDeadline))}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : user && !hasStarted && (
              <Card className="border-muted shadow-lg">
                <CardContent className="pt-6">
                  <div className="space-y-2 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      {isFull ? "Event is full" : registrationClosed ? "Registration closed" : "Registration not available"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Capacity Progress */}
            {event.capacity && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Capacity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Registered</span>
                    <span className="font-semibold">
                      {event.registeredCount} / {event.capacity}
                    </span>
                  </div>
                  <Progress 
                    value={capacityPercentage} 
                    className={cn(
                      "h-2",
                      capacityPercentage >= 100 && "bg-red-100",
                      capacityPercentage >= 80 && capacityPercentage < 100 && "bg-orange-100"
                    )}
                  />
                  {isFull && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      Event is full
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Start Date</p>
                      <p className="text-muted-foreground">
                        {new Date(event.startDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">End Date</p>
                      <p className="text-muted-foreground">
                        {new Date(event.endDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-muted-foreground">{event.location}</p>
                      {event.locationDetails && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {event.locationDetails}
                        </p>
                      )}
                    </div>
                  </div>
                  {event.professorName && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Instructor</p>
                          <p className="text-muted-foreground">{event.professorName}</p>
                        </div>
                      </div>
                    </>
                  )}
                  {event.faculty && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Faculty</p>
                          <p className="text-muted-foreground">{event.faculty}</p>
                        </div>
                      </div>
                    </>
                  )}
                  {event.createdBy && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Organized By</p>
                          <p className="text-muted-foreground">
                            {event.createdBy.firstName} {event.createdBy.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {event.createdBy.role}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {canEdit && (
                  <>
                    <Separator />
                    <Button 
                      onClick={handleEdit}
                      disabled={hasStarted}
                      variant="outline"
                      className="w-full"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {hasStarted ? "Cannot Edit (Started)" : "Edit Event"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
