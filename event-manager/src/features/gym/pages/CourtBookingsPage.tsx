import { useMemo, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { LocationPreview } from "@/components/ui/location-picker";
import { 
  CalendarIcon, 
  MapPin, 
  Clock, 
  User, 
  Info,
  Loader2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Grid3x3
} from "lucide-react";
import { usePageMeta } from '@/components/layout/page-meta-context';
import { formatValidationErrors } from '@/lib/format-errors';
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, addWeeks } from "date-fns";

const SPORTS = [
  { value: "BASKETBALL", label: "Basketball", icon: "🏀", color: "orange" },
  { value: "TENNIS", label: "Tennis", icon: "🎾", color: "green" },
  { value: "FOOTBALL", label: "Football", icon: "⚽", color: "blue" },
] as const;

type SportValue = typeof SPORTS[number]["value"];

// Import types from shared package
import type { CourtAvailabilityRow, CourtBookedSlot, Coordinates } from "@event-manager/shared";

// Extend the booking type with student info
interface Booking extends Omit<CourtBookedSlot, 'status'> {
  status: string;
  studentName?: string;
  studentGucId?: string;
}

// Extended court details type (includes coordinates from backend)
interface CourtDetails {
  id?: string;
  name: string;
  sport: string;
  location: string;
  description?: string;
  specs?: string;
  customInstructions?: string;
  images: string[];
  coordinates?: Coordinates;
}

const OPEN_HOUR = 8;
const CLOSE_HOUR = 22;
const TIME_SLOTS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => {
  const hour = OPEN_HOUR + i;
  return {
    hour,
    label: `${String(hour).padStart(2, '0')}:00`,
    displayTime: format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')
  };
});

// Component to load and display court image thumbnail with expand capability
function CourtThumbnail({ 
  imageId, 
  alt,
  onClick,
}: { 
  imageId: string; 
  alt: string;
  onClick?: () => void;
}) {
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
        <ImageIcon className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  const imageUrl = `data:${fileData.mimeType};base64,${fileData.data}`;

  return (
    <div 
      className={cn(
        "aspect-video rounded-lg overflow-hidden border bg-muted relative group",
        onClick && "cursor-pointer hover:ring-2 hover:ring-primary transition-all"
      )}
      onClick={onClick}
    >
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
      />
      {onClick && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
          <div className="opacity-0 group-hover:opacity-100 bg-black/50 text-white text-xs px-2 py-1 rounded">
            Click to expand
          </div>
        </div>
      )}
    </div>
  );
}

// Time slot component for booking
function TimeSlotButton({ 
  slot, 
  booking, 
  freeStartUtc,
  isPast,
  onBook,
  onCancel,
  isBooking,
  isCancelling
}: {
  slot: { hour: number; label: string; displayTime: string };
  booking?: Booking;
  freeStartUtc?: string;
  isPast: boolean;
  onBook: () => void;
  onCancel: () => void;
  isBooking: boolean;
  isCancelling: boolean;
}) {
  // Booked by someone
  if (booking) {
    const isMine = !!booking.byMe;
    
    return (
      <div className="flex flex-col h-full">
        <div 
          className={cn(
            "relative p-3 rounded-lg border flex-1 flex flex-col justify-between",
            isMine
              ? "bg-primary/10 border-primary"
              : "bg-muted border-border"
          )}
        >
          <div>
            <div className="font-semibold text-sm mb-1">{slot.displayTime}</div>
            {isMine ? (
              <Badge variant="default" className="text-[10px] h-5">
                <User className="h-2.5 w-2.5 mr-1" />
                Your Booking
              </Badge>
            ) : booking.studentName ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <User className="h-2.5 w-2.5" />
                  <span className="truncate">{booking.studentName}</span>
                </div>
                {booking.studentGucId && (
                  <div className="text-[9px] text-muted-foreground/70 pl-3.5">
                    {booking.studentGucId}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground">Booked</div>
            )}
          </div>
        </div>
        
        {isMine && !isPast && (
          <Button
            size="sm"
            variant="ghost"
            className="w-full text-[10px] h-6 mt-1"
            disabled={isCancelling}
            onClick={onCancel}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel'}
          </Button>
        )}
      </div>
    );
  }

  // Available slot
  if (freeStartUtc && !isPast) {
    return (
      <Button
        variant="outline"
        className="w-full h-full p-3 rounded-lg border-2 border-dashed border-green-500/50 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all"
        disabled={isBooking}
        onClick={onBook}
      >
        <div className="flex flex-col items-center gap-1 w-full">
          <span className="font-semibold text-sm">{slot.displayTime}</span>
          <Badge variant="outline" className="text-[10px] border-green-500 text-green-600 dark:text-green-400 h-5">
            Available
          </Badge>
        </div>
      </Button>
    );
  }

  // Past or unavailable
  return (
    <div className="p-3 rounded-lg border border-dashed bg-muted/30 opacity-50 h-full flex flex-col justify-center">
      <div className="font-medium text-sm text-muted-foreground text-center">{slot.displayTime}</div>
      <div className="text-[10px] text-muted-foreground text-center mt-1">
        {isPast ? 'Past' : 'Unavailable'}
      </div>
    </div>
  );
}

// Court detail card with time slots
function CourtDetailCard({ 
  court, 
  selectedDate,
  onReserve,
  onCancel,
  isReserving,
  isCancelling
}: {
  court: CourtAvailabilityRow;
  selectedDate: Date;
  onReserve: (courtId: string, startUtc: string) => void;
  onCancel: (id: string) => void;
  isReserving: boolean;
  isCancelling: boolean;
}) {
  const { freeSlots = [], booked = [] } = court;
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showInlineDetails, setShowInlineDetails] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showMapDialog, setShowMapDialog] = useState(false);
  
  // Fetch full court details when expanded
  const courtDetails = trpc.courts.getById.useQuery(
    { id: court.court.id },
    { enabled: showInlineDetails || showDetailsDialog }
  );
  
  // Prefetch image data for lightbox
  const imageUrls = useMemo(() => {
    const images = courtDetails.data?.images || [];
    return images;
  }, [courtDetails.data?.images]);
  
  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageLightbox(true);
  };
  
  const freeMap = new Map<number, string>();
  freeSlots.forEach(s => freeMap.set(s.hour, s.startUtc));
  const bookedMap = new Map<number, Booking>();
  booked.forEach(b => bookedMap.set(b.hour, b));

  const slotIsPast = (hour: number) => {
    const end = new Date(selectedDate);
    end.setHours(hour + 1, 0, 0, 0);
    return end.getTime() <= Date.now() + 60_000;
  };

  const details = courtDetails.data as CourtDetails | undefined;
  const sportInfo = SPORTS.find(s => s.value === court.court.sport);
  // Always show expand button - details will be loaded on demand
  const hasDetails = true;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{sportInfo?.icon || '🏟️'}</span>
              <div>
                <CardTitle className="text-base">{court.court.name}</CardTitle>
                {court.court.location && (
                  <CardDescription className="flex items-center gap-1 text-xs mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {court.court.location}
                  </CardDescription>
                )}
              </div>
            </div>
            
            {hasDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInlineDetails(!showInlineDetails)}
              >
                {showInlineDetails ? (
                  <>
                    <ChevronRight className="h-4 w-4 mr-1 rotate-90" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Show Details
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Inline expandable details */}
          {showInlineDetails && (
            <div className="mt-3 pt-3 border-t space-y-3">
              {courtDetails.isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : details ? (
                <>
                  {/* Images */}
                  {details.images?.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {details.images.slice(0, 2).map((imageId, idx) => (
                        <CourtThumbnail 
                          key={imageId}
                          imageId={imageId} 
                          alt={`${court.court.name} - Image ${idx + 1}`}
                          onClick={() => handleImageClick(idx)}
                        />
                      ))}
                    </div>
                  )}

                  {details.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {details.description}
                    </p>
                  )}
                  
                  {details.specs && (
                    <div className="flex gap-2 text-xs">
                      <Info className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{details.specs}</span>
                    </div>
                  )}
                  
                  {details.customInstructions && (
                    <div className="flex gap-2 text-xs">
                      <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-amber-600 dark:text-amber-500">
                        {details.customInstructions}
                      </span>
                    </div>
                  )}

                  {/* Map Location */}
                  {details.coordinates && (
                    <div className="pt-2">
                      <div className="flex gap-2 text-xs mb-2">
                        <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="text-muted-foreground font-medium">Map Location</span>
                      </div>
                      <div 
                        className="cursor-pointer hover:ring-2 hover:ring-primary rounded-lg transition-all"
                        onClick={() => setShowMapDialog(true)}
                      >
                        <LocationPreview
                          location={{
                            lat: details.coordinates.lat,
                            lng: details.coordinates.lng,
                            address: details.location,
                          }}
                          height="120px"
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">No additional details available</p>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <h4 className="font-medium text-xs text-muted-foreground">Time Slots</h4>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
              {TIME_SLOTS.map(slot => {
                const booking = bookedMap.get(slot.hour);
                const freeStartUtc = freeMap.get(slot.hour);
                const isPast = slotIsPast(slot.hour);

                return (
                  <TimeSlotButton
                    key={slot.hour}
                    slot={slot}
                    booking={booking}
                    freeStartUtc={freeStartUtc}
                    isPast={isPast}
                    onBook={() => onReserve(court.court.id, freeStartUtc!)}
                    onCancel={() => booking?.id && onCancel(booking.id)}
                    isBooking={isReserving}
                    isCancelling={isCancelling}
                  />
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{sportInfo?.icon}</span>
              {court.court.name}
            </DialogTitle>
          </DialogHeader>
          
          {courtDetails.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : details ? (
            <div className="space-y-4 mt-4">
              {/* Images */}
              {details.images?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Court Images
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {details.images.map((imageId, idx) => (
                      <CourtThumbnail 
                        key={imageId}
                        imageId={imageId} 
                        alt={`${court.court.name} - Image ${idx + 1}`}
                        onClick={() => handleImageClick(idx)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              {details.location && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </h4>
                  <p className="text-sm text-muted-foreground pl-6">{details.location}</p>
                  {/* Show map if coordinates exist */}
                  {details.coordinates && (
                    <div 
                      className="pl-6 pt-2 cursor-pointer hover:ring-2 hover:ring-primary rounded-lg transition-all"
                      onClick={() => {
                        setShowDetailsDialog(false);
                        setShowMapDialog(true);
                      }}
                    >
                      <LocationPreview
                        location={{
                          lat: details.coordinates.lat,
                          lng: details.coordinates.lng,
                          address: details.location,
                        }}
                        height="150px"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {details.description && (
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {details.description}
                  </p>
                </div>
              )}
              
              {/* Specs */}
              {details.specs && (
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    Specifications
                  </h4>
                  <p className="text-sm text-muted-foreground pl-6">
                    {details.specs}
                  </p>
                </div>
              )}
              
              {/* Custom Instructions */}
              {details.customInstructions && (
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Booking Instructions
                  </h4>
                  <p className="text-sm text-amber-600 dark:text-amber-500 pl-6">
                    {details.customInstructions}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No additional details available</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      {showImageLightbox && imageUrls.length > 0 && (
        <ImageLightboxComponent
          images={imageUrls}
          initialIndex={selectedImageIndex}
          courtName={court.court.name}
          onClose={() => setShowImageLightbox(false)}
        />
      )}

      {/* Map Dialog */}
      {details?.coordinates && (
        <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
          <DialogContent className="max-w-4xl z-[9999]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {court.court.name} - Location
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{details.location}</p>
              <div className="h-[400px] rounded-lg overflow-hidden border">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${details.coordinates.lng - 0.005}%2C${details.coordinates.lat - 0.003}%2C${details.coordinates.lng + 0.005}%2C${details.coordinates.lat + 0.003}&layer=mapnik&marker=${details.coordinates.lat}%2C${details.coordinates.lng}`}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Coordinates: {details.coordinates.lat.toFixed(6)}, {details.coordinates.lng.toFixed(6)}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// Lightbox component for viewing images fullscreen
function ImageLightboxComponent({
  images,
  initialIndex,
  courtName,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  courtName: string;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  
  // Fetch current image
  const { data: fileData, isLoading } = trpc.files.downloadPublicFile.useQuery(
    { fileId: images[currentIndex] },
    { staleTime: 5 * 60 * 1000 }
  );

  const imageUrl = fileData?.data 
    ? `data:${fileData.mimeType};base64,${fileData.data}`
    : null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none z-[100]"
        onKeyDown={handleKeyDown}
      >
        <div className="relative w-full h-[90vh] flex flex-col">
          {/* Controls */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
              disabled={zoom <= 0.5}
            >
              <span className="text-lg">−</span>
            </Button>
            <span className="text-white text-sm min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
              disabled={zoom >= 3}
            >
              <span className="text-lg">+</span>
            </Button>
          </div>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 z-50 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Image */}
          <div className="flex-1 flex items-center justify-center overflow-hidden p-8">
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={`${courtName} - Image ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
                draggable={false}
              />
            ) : (
              <div className="text-white">Failed to load image</div>
            )}
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 text-white hover:bg-white/20 rounded-full"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 text-white hover:bg-white/20 rounded-full"
                onClick={handleNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CourtBookingsPage() {
  const { setPageMeta } = usePageMeta();
  const todayLocal = new Date();
  todayLocal.setHours(0, 0, 0, 0);

  const [selectedSport, setSelectedSport] = useState<SportValue>(SPORTS[0].value);
  const [selectedDate, setSelectedDate] = useState<Date>(todayLocal);
  const [weekOffset, setWeekOffset] = useState(0); // Track which week we're viewing

  useEffect(() => {
    setPageMeta({
      title: 'Court Bookings',
      description: 'Reserve courts for basketball, tennis, and football',
    });
  }, [setPageMeta]);

  const availabilityInput = useMemo(() => ({
    date: selectedDate,
    sport: selectedSport,
    slotMinutes: 60
  }), [selectedDate, selectedSport]);

  const availability = trpc.courts.availability.useQuery(availabilityInput, {
    enabled: !!selectedDate,
  });

  const utils = trpc.useUtils();

  const reserveM = trpc.courts.reserve.useMutation({
    onSuccess: () => {
      toast.success("🎉 Court reserved successfully!");
      utils.courts.availability.invalidate(availabilityInput);
    },
    onError: (e) => {
      const errorMessage = formatValidationErrors(e);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  const cancelM = trpc.courts.cancel.useMutation({
    onSuccess: () => {
      toast.success("Reservation cancelled");
      utils.courts.availability.invalidate(availabilityInput);
    },
    onError: (e) => {
      const errorMessage = formatValidationErrors(e);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  const handleReserve = (courtId: string, startUtc: string) => {
    reserveM.mutate({
      courtId,
      startDate: new Date(startUtc),
      duration: 60,
    });
  };

  const handleCancel = (id: string) => {
    cancelM.mutate({ id });
  };

  const currentSport = SPORTS.find(s => s.value === selectedSport);
  const courts = availability.data || [];

  // Calculate week dates based on offset
  const weekStart = addWeeks(startOfWeek(todayLocal, { weekStartsOn: 0 }), weekOffset);
  const quickDates = Array.from({ length: 15 }, (_, i) => {
    const date = addDays(weekStart, i);
    const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    const isToday = format(date, 'yyyy-MM-dd') === format(todayLocal, 'yyyy-MM-dd');
    return {
      date,
      dayName: format(date, 'EEE').toUpperCase(),
      dayNumber: format(date, 'd'),
      monthName: format(date, 'MMM'),
      isToday,
      isSelected,
      isPast: date < todayLocal,
    };
  });

  const handlePrevWeek = () => {
    // Don't allow going to past weeks
    if (weekOffset > 0) return;
    setWeekOffset(weekOffset - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset(weekOffset + 1);
  };

  return (
    <div className="container max-w-7xl px-4 py-6">
      <div className="flex gap-2">
        {/* Left sidebar with date selection */}
        <div className="w-80 shrink-0 space-y-4">
          {/* Sport Selection Radio Group */}
          <Card>
            <CardContent>
              <RadioGroup value={selectedSport} onValueChange={(v) => setSelectedSport(v as SportValue)}>
                <div className="space-y-2">
                  {SPORTS.map(sport => (
                    <div key={sport.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={sport.value} id={sport.value} />
                      <Label htmlFor={sport.value} className="flex items-center gap-2 cursor-pointer font-normal">
                        <span className="text-base">{sport.icon}</span>
                        <span className="text-sm">{sport.label}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    // Reset week offset when selecting from calendar
                    setWeekOffset(0);
                  }
                }}
                disabled={(date) => date < todayLocal}
                className="rounded-md border-0"
              />
            </CardContent>
          </Card>
        </div>

        {/* Main content area */}
        <div className="flex-1 space-y-6">
          {/* Week Navigation */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevWeek}
                  disabled={weekOffset <= 0}
                  className="shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex-1 flex justify-center gap-2 overflow-x-auto">
                  {quickDates.map((qd, idx) => (
                    <Button
                      key={idx}
                      variant={qd.isSelected ? 'default' : 'outline'}
                      size="sm"
                      disabled={qd.isPast}
                      className={cn(
                        "shrink-0 flex flex-col gap-0.5 h-auto py-2 px-3 min-w-[65px]",
                        qd.isSelected && "shadow-sm"
                      )}
                      onClick={() => setSelectedDate(qd.date)}
                    >
                      <span className="text-[9px] font-semibold opacity-70 uppercase">
                        {qd.isToday ? 'TODAY' : qd.dayName}
                      </span>
                      <span className="text-xl font-bold leading-none">{qd.dayNumber}</span>
                      <span className="text-[9px] opacity-60 uppercase">{qd.monthName}</span>
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextWeek}
                  className="shrink-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Court Availability */}
          {availability.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-40 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : availability.error ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <AlertCircle className="h-10 w-10 mx-auto mb-3 text-destructive" />
                  <h3 className="font-semibold mb-2">Failed to Load Courts</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {availability.error.message || "Something went wrong"}
                  </p>
                  <Button size="sm" onClick={() => availability.refetch()}>
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : courts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Grid3x3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-2">No Courts Available</h3>
                  <p className="text-sm text-muted-foreground">
                    No {currentSport?.label.toLowerCase()} courts available for {format(selectedDate, 'MMMM d, yyyy')}.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex items-center justify-between px-1">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  Available Courts
                  <Badge variant="secondary" className="text-xs">
                    {courts.length}
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>

              {/* Court Cards */}
              {courts.map(court => (
                <CourtDetailCard
                  key={court.court.id}
                  court={court}
                  selectedDate={selectedDate}
                  onReserve={handleReserve}
                  onCancel={handleCancel}
                  isReserving={reserveM.isPending}
                  isCancelling={cancelM.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
