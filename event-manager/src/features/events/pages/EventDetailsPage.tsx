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

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { User as EventUser, Registration } from "@event-manager/shared";

import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/design-system";
import { formatValidationErrors } from "@/lib/format-errors";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

import { toast } from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventImageCarousel } from "@/components/ui/event-image-carousel";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

import { RegistrationCTA } from "@/components/RegistrationCTA";
import { usePageMeta } from "@/components/layout/page-meta-context";
import { VendorCard } from "@/features/events/components/VendorCard";
import { FeedbackSection } from "@/features/events/components/feedback";

import {
  AlertCircle,
  Award,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Dumbbell,
  Edit,
  GraduationCap,
  Heart,
  Mail,
  MapPin,
  Plane,
  Store,
  User,
  Users,
  XCircle
} from "lucide-react";

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
  const { setPageMeta } = usePageMeta();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const { data: event, isLoading } = trpc.events.getEventById.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  // Update page title when event loads
  useEffect(() => {
    if (event) {
      setPageMeta({
        title: event.name,
        description: `${event.type} - ${event.location || "TBD"}`,
      });
    }
  }, [event, setPageMeta]);

  const { data: isRegisteredData } = trpc.events.isRegistered.useQuery(
    { eventId: id! },
    { enabled: !!id && !!user }
  );

  const { data: isFavorit } = trpc.events.isFavorite.useQuery(
    { eventId: id! },
    { enabled: !!id && !!user }
  );

  // Check if the current user is a professor who owns this workshop
  // createdBy might be populated (object) or just an ID (string)
  const eventCreatorId =
    event && typeof event.createdBy === "object" && event.createdBy !== null
      ? (event.createdBy as EventUser).id
      : event?.createdBy;

  const isProfessorOwned =
    user?.role === "PROFESSOR" &&
    event &&
    event.type === "WORKSHOP" &&
    eventCreatorId === user.id; // Compare user IDs, not names!

  // Debug logging
  if (user?.role === "PROFESSOR" && event?.type === "WORKSHOP") {
    console.log("🔍 Frontend Professor Workshop Check:", {
      eventId: event.id,
      eventType: event.type,
      createdByType: typeof event.createdBy,
      createdByRaw: event.createdBy,
      eventCreatorId: eventCreatorId,
      currentUserId: user.id,
      idsMatch: eventCreatorId === user.id,
      isProfessorOwned,
    });
  }

  // Only EVENT_OFFICE can view registrations, and NOT for conferences (Requirement #49)
  // Professors can see their own workshop participants via the workshop management page
  const canViewRegistrations =
    user &&
    event &&
    event.type !== 'CONFERENCE' &&
    (user.role === "EVENT_OFFICE" || user.role === "ADMIN");

  const { data: registrationsData } =
    trpc.events.getEventRegistrations.useQuery(
      { eventId: id!, page: 1, limit: 100 },
      { enabled: !!id && !!canViewRegistrations }
    );

  const utils = trpc.useUtils();

  // Export registrations mutation
  const exportRegistrationsMutation = trpc.events.exportRegistrations.useMutation({
    onSuccess: (result) => {
      // Convert base64 to blob and download
      const blob = new Blob(
        [Uint8Array.from(atob(result.data), c => c.charCodeAt(0))],
        { type: result.mimeType }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Registrations exported to Excel successfully');
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage);
    },
  });

  const handleExportRegistrations = () => {
    if (!id) return;
    exportRegistrationsMutation.mutate({ eventId: id });
  };

  // Certificate generation mutation
  const generateCertificateMutation = trpc.registrations.generateCertificate.useMutation({
    onSuccess: (result) => {
      // Convert base64 to blob and download
      const blob = new Blob(
        [Uint8Array.from(atob(result.data), c => c.charCodeAt(0))],
        { type: result.mimeType }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Certificate downloaded successfully!');
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage);
    },
  });

  const handleDownloadCertificate = () => {
    if (!isRegisteredData?.registrationId) {
      toast.error('Registration ID not found');
      return;
    }
    generateCertificateMutation.mutate({ registrationId: isRegisteredData.registrationId });
  };

  const favoriteMutation = trpc.events.toggleFavorite.useMutation({
    onSuccess: () => {
      toast.success("Successfully updated favorite status!");
      setIsFavoriting(false);
      // Invalidate queries to refresh favorite status
      utils.events.isFavorite.invalidate({ eventId: id! });
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: "pre-line" } });
      setIsFavoriting(false);
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

  const canEdit =
    (user?.role === "EVENT_OFFICE" && event.type === "BAZAAR") ||
    (user?.role === "PROFESSOR" &&
      event.type === "WORKSHOP" &&
      isProfessorOwned);
  const hasStarted = new Date(event.startDate) <= new Date();
  const hasEnded = new Date(event.endDate) <= new Date();
  const registrationClosed = event.registrationDeadline
    ? new Date(event.registrationDeadline) < new Date()
    : false;
  const isFull = event.capacity && event.registeredCount >= event.capacity;
  const isRegistered = isRegisteredData?.isRegistered || false;
  const isFavorite = isFavorit?.isFavorite || false;

  // Professors should not be able to register for their own workshops
  const canRegister =
    user &&
    ["STUDENT", "STAFF", "TA", "PROFESSOR"].includes(user.role) &&
    !hasStarted &&
    !registrationClosed &&
    !isFull &&
    !isRegistered &&
    !isProfessorOwned; // Professors cannot register for their own workshops

  const capacityPercentage = event.capacity
    ? (event.registeredCount / event.capacity) * 100
    : 0;

  const handleEdit = () => {
    if (event.type === "BAZAAR") {
      navigate(ROUTES.EDIT_BAZAAR.replace(":id", event.id));
    } else if (event.type === "WORKSHOP") {
      navigate(ROUTES.EDIT_WORKSHOP.replace(":id", event.id));
    }
  };

  const handleFavorite = async () => {
    setIsFavoriting(true);
    await favoriteMutation.mutate({ eventId: event.id });
    setIsFavoriting(false);
  };

  const typeConfigMap: Record<
    string,
    { label: string; color: string; icon: typeof GraduationCap }
  > = {
    WORKSHOP: {
      label: "Workshop",
      color: "bg-blue-500 dark:bg-blue-600",
      icon: GraduationCap,
    },
    TRIP: {
      label: "Trip",
      color: "bg-green-500 dark:bg-green-600",
      icon: Plane,
    },
    CONFERENCE: {
      label: "Conference",
      color: "bg-purple-500 dark:bg-purple-600",
      icon: Users,
    },
    BAZAAR: {
      label: "Bazaar",
      color: "bg-orange-500 dark:bg-orange-600",
      icon: Store,
    },
    GYM_SESSION: {
      label: "Gym Session",
      color: "bg-red-500 dark:bg-red-600",
      icon: Dumbbell,
    },
  };
  const typeConfig = typeConfigMap[event.type] || {
    label: event.type,
    color: "bg-gray-500 dark:bg-gray-600",
    icon: Calendar,
  };

  const TypeIcon = typeConfig.icon;

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-background via-background to-muted/20 transition-opacity duration-200",
        isLoading && "opacity-60"
      )}
    >
      {/* Hero Section */}
      <div className="relative h-[400px] bg-gradient-to-r from-primary/10 via-primary/5 to-background overflow-hidden">
        {event.images && event.images.length > 0 ? (
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
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <div className="text-[120px] opacity-20">
              {event.type === "WORKSHOP" && "📚"}
              {event.type === "TRIP" && "✈️"}
              {event.type === "BAZAAR" && "🛍️"}
              {event.type === "CONFERENCE" && "🎤"}
              {event.type === "GYM_SESSION" && "🏋️"}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto h-full flex items-end p-8 pb-6">
          <div className="space-y-3 text-white w-full">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge
                className={cn(
                  typeConfig.color,
                  "text-white shadow-lg backdrop-blur-md border border-white/20"
                )}
              >
                <TypeIcon className="h-3 w-3 mr-1" />
                {typeConfig.label}
              </Badge>
              <Badge 
                variant={hasEnded ? "secondary" : hasStarted ? "default" : "outline"}
                className={cn(
                  "shadow-lg backdrop-blur-md border border-white/20",
                  hasStarted && !hasEnded && "text-white dark:text-white",
                  !hasStarted && !hasEnded && "bg-black/40 text-white border-white/30"
                )}
              >
                {hasEnded ? "Ended" : hasStarted ? "Ongoing" : "Upcoming"}
              </Badge>
              {isProfessorOwned && (
                <Badge className="bg-purple-600 dark:bg-purple-500 text-white shadow-lg backdrop-blur-md border border-purple-400/30 dark:border-purple-500/30">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  Your Workshop
                </Badge>
              )}
              {event.status === "APPROVED" && (
                <Badge
                  variant="default"
                  className="bg-emerald-500 shadow-lg backdrop-blur-md border border-white/20"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              )}
              {event.status === "PENDING" && (
                <Badge
                  variant="secondary"
                  className="shadow-lg backdrop-blur-md border border-white/20"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Approval
                </Badge>
              )}
              {event.status === "REJECTED" && (
                <Badge
                  variant="destructive"
                  className="shadow-lg backdrop-blur-md border border-white/20"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Rejected
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] [text-shadow:_0_2px_8px_rgb(0_0_0_/_80%)]">
              {event.name}
            </h1>

            <div className="flex items-center gap-4 text-sm flex-wrap [text-shadow:_0_2px_4px_rgb(0_0_0_/_60%)]">
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Calendar className="h-4 w-4" />
                {formatDate(new Date(event.startDate))}
              </div>
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">
                  {event.location === "ON_CAMPUS" ? "On Campus" : "Off Campus"}
                </span>
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
                <Badge
                  variant="default"
                  className="bg-emerald-500 shadow-lg backdrop-blur-md border border-white/20"
                >
                  FREE
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleFavorite}
            disabled={isFavoriting}
            className="absolute top-4 right-4 z-20 bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black shadow-lg backdrop-blur-sm border-0"
          >
            <Heart 
              fill={isFavorite ? "red" : "none"} 
              stroke={isFavorite ? "red" : "currentColor"}
              className="h-5 w-5"
            />
          </Button>
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
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-emerald-600" />
                      <div>
                        <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                          You're Registered!
                        </p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">
                          {hasEnded ? 'Thank you for attending!' : 'See you at the event'}
                        </p>
                      </div>
                    </div>
                    {/* Certificate Download - Only for WORKSHOP events that have ended */}
                    {event.type === 'WORKSHOP' && hasEnded && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadCertificate}
                        disabled={generateCertificateMutation.isPending}
                        className="gap-2 border-emerald-500 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                      >
                        {generateCertificateMutation.isPending ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <Award className="h-4 w-4" />
                        )}
                        Download Certificate
                      </Button>
                    )}
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

            {/* Feedback Section - Comments & Ratings */}
            <FeedbackSection 
              eventId={event.id}
              userId={user?.id}
              userRole={user?.role}
              eventStartDate={event.startDate}
              eventEndDate={event.endDate}
            />

            {/* Registered Students (EVENT_OFFICE/ADMIN only) */}
            {registrationsData &&
              registrationsData.registrations.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>
                      Registered Participants ({registrationsData.total})
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportRegistrations}
                      disabled={exportRegistrationsMutation.isPending}
                      className="gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {exportRegistrationsMutation.isPending ? 'Exporting...' : 'Export to Excel'}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(
                        registrationsData.registrations as Array<
                          Registration & { user: EventUser }
                        >
                      ).map((reg) => (
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
                          <Badge
                            variant={
                              reg.status === "CONFIRMED"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {reg.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Vendors (for Bazaars) */}
            {event.type === "BAZAAR" &&
              event.vendors &&
              event.vendors.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Participating Vendors ({event.vendors.length})
                      </CardTitle>
                      {(user?.role === "ADMIN" ||
                        user?.role === "EVENT_OFFICE") && (
                        <div className="flex items-center gap-2">
                          <Switch
                            id="show-participants"
                            checked={showParticipants}
                            onCheckedChange={setShowParticipants}
                          />
                          <Label
                            htmlFor="show-participants"
                            className="text-sm cursor-pointer"
                          >
                            Show Participants
                          </Label>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {event.vendors.map(
                        (vendor: {
                          id: string;
                          companyName: string;
                          email: string;
                          boothSize?: string;
                          names?: string[];
                          emails?: string[];
                        }) => (
                          <VendorCard
                            key={vendor.id}
                            vendor={vendor}
                            showParticipants={
                              user?.role === "ADMIN" ||
                              user?.role === "EVENT_OFFICE"
                                ? showParticipants
                                : false
                            }
                            defaultExpanded={false}
                          />
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Registration CTA - shown for registered users (for refund option) and eligible registrants */}
            {(isRegistered || canRegister) ? (
              <RegistrationCTA event={event} />
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
                      capacityPercentage >= 100 &&
                        "bg-red-100 dark:bg-red-900/30",
                      capacityPercentage >= 80 &&
                        capacityPercentage < 100 &&
                        "bg-orange-100 dark:bg-orange-900/30"
                    )}
                  />
                  {isFull && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
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
                          <p className="text-muted-foreground">
                            {event.professorName}
                          </p>
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
                          <p className="text-muted-foreground">
                            {event.faculty}
                          </p>
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
                            {event.createdBy.firstName}{" "}
                            {event.createdBy.lastName}
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
