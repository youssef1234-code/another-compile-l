/**
 * Court Expanded Row
 * 
 * Expandable row content showing court images, specs, instructions, and reservations schedule
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertCircle, Image as ImageIcon, Calendar, Clock, User, Loader2 } from "lucide-react";
import { trpc } from '@/lib/trpc';
import { Badge } from "@/components/ui/badge";
import * as React from "react";

interface Court {
  id: string;
  name: string;
  sport: string;
  location: string;
  description?: string;
  specs?: string;
  customInstructions?: string;
  images: string[];
}

interface CourtExpandedRowProps {
  court: Court;
}

// Component to load and display a single image thumbnail
function CourtImage({ imageId, alt }: { imageId: string; alt: string }) {
  const { data: fileData, isLoading } = trpc.files.downloadPublicFile.useQuery(
    { fileId: imageId },
    { 
      staleTime: 5 * 60 * 1000,
      retry: 1,
    }
  );

  if (isLoading) {
    return (
      <div className="aspect-video rounded-lg bg-muted animate-pulse" />
    );
  }

  if (!fileData?.data) {
    return (
      <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
        <ImageIcon className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  const imageUrl = `data:${fileData.mimeType};base64,${fileData.data}`;

  return (
    <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
      />
    </div>
  );
}

export function CourtExpandedRow({ court }: CourtExpandedRowProps) {
  const hasImages = court.images && court.images.length > 0;
  const hasDetails = court.specs || court.customInstructions || court.description;

  // Fetch today's reservations for this court
  // Use useMemo to prevent creating new Date on every render
  const today = React.useMemo(() => {
    const date = new Date();
    // Normalize to start of day to ensure consistent query key
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  
  const { data: availability, isLoading: isLoadingReservations } = trpc.courts.availability.useQuery({
    date: today,
    courtId: court.id,
    slotMinutes: 60,
  });

  const courtAvailability = availability?.[0]; // Get the first (and only) court's data
  const bookedSlots = (courtAvailability?.booked || []) as Array<{
    id: string;
    hour: number;
    startUtc: string;
    endUtc: string;
    status: string;
    byMe?: boolean;
    studentName?: string;
    studentGucId?: string;
  }>;

  return (
    <div className="p-6 bg-muted/30">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Reservations Schedule Section */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Reservations Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingReservations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : bookedSlots.length > 0 ? (
              <div className="space-y-2">
                {bookedSlots.map((slot, index) => {
                  const startTime = new Date(slot.startUtc);
                  const endTime = new Date(slot.endUtc);
                  
                  return (
                    <div
                      key={slot.id || index}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            {' - '}
                            {endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                        <Badge
                          variant={slot.status === 'CONFIRMED' ? 'default' : slot.status === 'PENDING' ? 'secondary' : 'destructive'}
                          className="capitalize"
                        >
                          {slot.status.toLowerCase()}
                        </Badge>
                        {slot.byMe ? (
                          <Badge variant="outline" className="bg-primary/10">
                            <User className="h-3 w-3 mr-1" />
                            Your Booking
                          </Badge>
                        ) : (
                          slot.studentName && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{slot.studentName}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No reservations scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Images Section */}
        {hasImages && (
          <Card className={hasDetails ? "lg:col-span-2" : "lg:col-span-3"}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Court Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {court.images.map((imageId, index) => (
                  <CourtImage
                    key={imageId}
                    imageId={imageId}
                    alt={`${court.name} - Image ${index + 1}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Details Section */}
        {hasDetails && (
          <Card className={hasImages ? "" : "lg:col-span-3"}>
            <CardHeader>
              <CardTitle className="text-lg">Court Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Specifications */}
              {court.specs && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Specifications</h4>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-6">
                    {court.specs}
                  </p>
                </div>
              )}

              {/* Custom Instructions */}
              {court.customInstructions && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Booking Instructions</h4>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-6">
                    {court.customInstructions}
                  </p>
                </div>
              )}

              {/* Description */}
              {court.description && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {court.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* No additional details */}
        {!hasImages && !hasDetails && (
          <Card className="lg:col-span-3">
            <CardContent className="text-center py-12 text-muted-foreground">
              No additional details available for this court
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
