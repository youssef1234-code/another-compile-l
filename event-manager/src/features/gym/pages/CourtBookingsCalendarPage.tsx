/**
 * Court Bookings Calendar Page
 * 
 * Calendar-based view for court bookings with:
 * - Calendar visualization of court availability
 * - Court details popup with images, specs, and instructions
 * - Hourly slot booking
 * - Sport filtering
 */

import { useMemo, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "react-hot-toast";
import { CalendarIcon, Info, MapPin, Clock, XCircle, Image as ImageIcon } from "lucide-react";
import { usePageMeta } from '@/components/layout/page-meta-context';
import { formatValidationErrors } from '@/lib/format-errors';
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const SPORTS = ["ALL", "BASKETBALL", "TENNIS", "FOOTBALL"] as const;
type SportFilter = typeof SPORTS[number];

const OPEN_HOUR = 8;
const CLOSE_HOUR = 22;
const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);

interface Court {
  id: string;
  name: string;
  sport: string;
  location?: string;
  description?: string;
  specs?: string;
  customInstructions?: string;
  images?: string[];
}

interface FreeSlot {
  hour: number;
  startUtc: string;
}

interface Booking {
  id: string;
  hour: number;
  byMe?: boolean;
}

interface AvailabilityBlock {
  court: Court;
  freeSlots?: FreeSlot[];
  booked?: Booking[];
}

function slotIsPastEnd(date: Date, hour: number) {
  const end = new Date(date);
  end.setHours(hour + 1, 0, 0, 0);
  const now = new Date();
  return end.getTime() <= now.getTime() + 60_000;
}

export function CourtBookingsCalendarPage() {
  const { setPageMeta } = usePageMeta();
  const todayLocal = new Date();
  todayLocal.setHours(0, 0, 0, 0);

  const [sport, setSport] = useState<SportFilter>("ALL");
  const [selectedDate, setSelectedDate] = useState<Date>(todayLocal);
  const [selectedCourtForDetails, setSelectedCourtForDetails] = useState<Court | null>(null);

  useEffect(() => {
    setPageMeta({
      title: 'Court Bookings',
      description: 'View availability and reserve sports courts',
    });
  }, [setPageMeta]);

  const availabilityInput = useMemo(() => {
    const sportFilter = sport === "ALL" ? undefined : sport;
    return { date: selectedDate, sport: sportFilter, slotMinutes: 60 };
  }, [selectedDate, sport]);

  const availability = trpc.courts.availability.useQuery(availabilityInput, {
    enabled: !!selectedDate,
  });

  const utils = trpc.useUtils();

  const reserveM = trpc.courts.reserve.useMutation({
    onSuccess: () => {
      toast.success("Reservation successful");
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

  const getSportColor = (sportType: string) => {
    switch (sportType) {
      case 'BASKETBALL':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'TENNIS':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'FOOTBALL':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Court Bookings</h1>
          <p className="text-muted-foreground mt-1">
            Reserve courts for basketball, tennis, and football
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={sport}
            onValueChange={(v) => setSport(v as SportFilter)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sport" />
            </SelectTrigger>
            <SelectContent>
              {SPORTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Courts Calendar View */}
      {availability.isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : availability.error ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                {availability.error.message || "Failed to load availability"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : !availability.data || availability.data.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No courts available</p>
              <p className="text-sm text-muted-foreground">
                Try selecting a different sport or date
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(availability.data as AvailabilityBlock[]).map((block) => {
            const free = new Map<number, string>();
            (block.freeSlots ?? []).forEach((s) => free.set(s.hour, s.startUtc));
            const booked = new Map<number, Booking>();
            (block.booked ?? []).forEach((b) => booked.set(b.hour, b));

            return (
              <Card key={block.court.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        {block.court.name}
                        <Badge className={getSportColor(block.court.sport)}>
                          {block.court.sport}
                        </Badge>
                      </CardTitle>
                      {block.court.location && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {block.court.location}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCourtForDetails(block.court)}
                    >
                      <Info className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="w-full">
                    <div className="flex gap-2 pb-2">
                      {HOURS.map((h) => {
                        const isPast = slotIsPastEnd(selectedDate, h);
                        const b = booked.get(h);
                        const f = free.get(h);
                        const mine = b?.byMe;

                        return (
                          <div
                            key={h}
                            className={cn(
                              "flex-shrink-0 w-24 p-3 rounded-lg border-2 transition-all",
                              b
                                ? mine
                                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
                                  : "border-gray-300 bg-gray-50 dark:bg-gray-900"
                                : f
                                ? "border-blue-300 bg-blue-50 dark:bg-blue-950 hover:border-blue-500 cursor-pointer"
                                : "border-gray-200 bg-gray-50 dark:bg-gray-900 opacity-50"
                            )}
                          >
                            <div className="text-center">
                              <div className="text-sm font-medium flex items-center justify-center gap-1">
                                <Clock className="h-3 w-3" />
                                {String(h).padStart(2, "0")}:00
                              </div>
                              <div className="mt-2">
                                {b ? (
                                  mine && !isPast ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="w-full h-7 text-xs"
                                      onClick={() => cancelM.mutate({ id: b.id })}
                                    >
                                      Cancel
                                    </Button>
                                  ) : (
                                    <div className="text-xs text-muted-foreground">
                                      {mine ? "Your Booking" : "Booked"}
                                    </div>
                                  )
                                ) : f ? (
                                  <Button
                                    size="sm"
                                    className="w-full h-7 text-xs"
                                    disabled={isPast || reserveM.isPending}
                                    onClick={() =>
                                      reserveM.mutate({
                                        courtId: block.court.id,
                                        startDate: new Date(f),
                                        duration: 60,
                                      })
                                    }
                                  >
                                    Book
                                  </Button>
                                ) : (
                                  <div className="text-xs text-muted-foreground">—</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Court Details Dialog */}
      <Dialog 
        open={!!selectedCourtForDetails} 
        onOpenChange={(open) => !open && setSelectedCourtForDetails(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCourtForDetails?.name}
              {selectedCourtForDetails && (
                <Badge className={getSportColor(selectedCourtForDetails.sport)}>
                  {selectedCourtForDetails.sport}
                </Badge>
              )}
            </DialogTitle>
            {selectedCourtForDetails?.location && (
              <DialogDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {selectedCourtForDetails.location}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedCourtForDetails && (
            <div className="space-y-4">
              {/* Images */}
              {selectedCourtForDetails.images && selectedCourtForDetails.images.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Court Images
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedCourtForDetails.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Court ${idx + 1}`}
                        className="w-full h-40 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedCourtForDetails.description && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedCourtForDetails.description}
                  </p>
                </div>
              )}

              {/* Specifications */}
              {selectedCourtForDetails.specs && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Specifications</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {selectedCourtForDetails.specs}
                  </p>
                </div>
              )}

              {/* Custom Instructions */}
              {selectedCourtForDetails.customInstructions && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Booking Instructions
                  </h4>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
                    <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-line">
                      {selectedCourtForDetails.customInstructions}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
