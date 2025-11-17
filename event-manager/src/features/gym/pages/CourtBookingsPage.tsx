import { useMemo, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";
import { CalendarSearch, CalendarIcon, List as ListIcon } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { usePageMeta } from '@/components/layout/page-meta-context';
import { formatValidationErrors } from '@/lib/format-errors';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { GymCalendar } from "../components/calendar";
import { CreateCourtBookingDialog } from "./components/CreateCourtBookingDialog";

const SPORTS = ["ALL", "BASKETBALL", "TENNIS", "FOOTBALL"] as const;
type SportFilter = typeof SPORTS[number];

interface Court {
  id: string;
  name: string;
  sport: string;
  location?: string;
}

interface FreeSlot {
  hour: number;
  startUtc: string;
}

interface Booking {
  id: string;
  hour: number;
  byMe?: boolean;
  studentName?: string;
  studentGucId?: string;
}

interface AvailabilityBlock {
  court: Court;
  freeSlots?: FreeSlot[];
  booked?: Booking[];
}

const OPEN_HOUR = 8;
const CLOSE_HOUR = 22; // last start hour shown is 21:00,
const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);

// A slot is "past" if its end time <= now + 1 minute
function slotIsPastEnd(date: Date, hour: number) {
  const end = new Date(date);
  end.setHours(hour + 1, 0, 0, 0);
  const now = new Date();
  return end.getTime() <= now.getTime() + 60_000;
}

export function CourtBookingsPage() {
  const { setPageMeta } = usePageMeta();
  const todayLocal = new Date();
  todayLocal.setHours(0, 0, 0, 0); // Start of today

  const [sport, setSport] = useState<SportFilter>("ALL");
  const [selectedDate, setSelectedDate] = useState<Date>(todayLocal);
  const [selectedCourtId, setSelectedCourtId] = useState<string | "ALL">("ALL");
  const [view, setView] = useState<"TABLE" | "CALENDAR">("CALENDAR");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [createOpen, setCreateOpen] = useState(false);
  const [createInitialDate, setCreateInitialDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setPageMeta({
      title: 'Court Bookings',
      description: 'View availability and reserve basketball, tennis, or football courts',
    });
  }, [setPageMeta]);

  // courts list (filterable by sport)
const courtsQuery = trpc.courts.list.useQuery(
  sport === "ALL" ? {} : { sport }     // ✅ omit sport when ALL
);
  // availability input (use Date object directly) for TABLE view
  const availabilityInput = useMemo(() => {
    const sportFilter = sport === "ALL" ? undefined : sport;
    return selectedCourtId !== "ALL"
      ? { date: selectedDate, courtId: selectedCourtId, slotMinutes: 60 }
      : { date: selectedDate, sport: sportFilter, slotMinutes: 60 };
  }, [selectedDate, sport, selectedCourtId]);


  const availability = trpc.courts.availability.useQuery(availabilityInput, {
    enabled: !!selectedDate && view === "TABLE",
  });
  //const rows: CourtAvailabilityRow[] = availability.data ?? [];


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

  const courtOptions = useMemo(() => {
    const raw = (courtsQuery.data ?? []) as Array<any>;
    const cleaned = raw
      .map(c => {
        const id = c?.id ?? c?._id;                 
        if (!id) return null;
        return { id: String(id), name: c?.name ?? "", sport: c?.sport ?? "" };
      })
      .filter(Boolean) as Array<{ id: string; name: string; sport: string }>;

    const unique = Array.from(new Map(cleaned.map(c => [c.id, c])).values());
    return [{ id: "ALL", name: "All courts", sport: "ALL" as const }, ...unique];
  }, [courtsQuery.data]);

  // Month range for calendar view
  const { from: monthFrom, to: monthTo } = useMemo(() => {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59, 999);
    return { from, to };
  }, [year, month]);

  // Reservations for calendar view
  const reservationsRange = trpc.courts.reservationsRange.useQuery(
    {
      from: monthFrom,
      to: monthTo,
      sport: sport === "ALL" ? undefined : (sport as any),
      courtId: selectedCourtId === "ALL" ? undefined : selectedCourtId,
    },
    { placeholderData: (prev) => prev }
  );

  const calendarEvents = useMemo(() => {
    const rows = (reservationsRange.data ?? []) as Array<any>;
    return rows.map((r) => {
      const labelParts: string[] = [r.courtName || "Court"];
      if (r.studentName) labelParts.push(`- ${r.studentName}`);
      if (r.studentGucId) labelParts.push(`(${r.studentGucId})`);
      return {
        id: r.id,
        name: labelParts.join(" "),
        startDate: r.startDate,
        endDate: r.endDate,
        sessionType: "OTHER",
      } as any; // cast to CalendarEvent
    });
  }, [reservationsRange.data]);

  const handleCreateOnDate = (date: Date) => {
    setCreateInitialDate(date);
    setCreateOpen(true);
  };

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg p-1 bg-muted/30 border">
          <Button 
            variant="ghost"
            size="sm" 
            onClick={() => setView("TABLE")}
            className={cn(
              'gap-2 transition-all',
              view === "TABLE"
                ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' 
                : 'hover:bg-muted text-muted-foreground'
            )}
          >
            <ListIcon className="h-4 w-4"/> Table
          </Button>
          <Button 
            variant="ghost"
            size="sm" 
            onClick={() => setView("CALENDAR")}
            className={cn(
              'gap-2 transition-all',
              view === "CALENDAR"
                ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' 
                : 'hover:bg-muted text-muted-foreground'
            )}
          >
            <CalendarIcon className="h-4 w-4"/> Calendar
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => (view === 'TABLE' ? availability.refetch() : reservationsRange.refetch())} 
            disabled={view === 'TABLE' ? availability.isFetching : reservationsRange.isFetching}
          >
            <CalendarSearch className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-end gap-2 flex-wrap">
        <Select
          value={sport}
          onValueChange={(v) => {
            setSport(v as SportFilter);
            setSelectedCourtId("ALL");
          }}
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

  <Select value={selectedCourtId} onValueChange={setSelectedCourtId}>
  <SelectTrigger className="w-48">
    <SelectValue placeholder="Court" />
  </SelectTrigger>
  <SelectContent>
    {courtOptions.map((c, idx) => (
      <SelectItem key={`court-${c.id}-${idx}`} value={c.id}>
        {c.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
        {view === 'TABLE' && (
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
        )}
      </div>

      {/* Content */}
      {view === 'CALENDAR' ? (
        <div className="min-h-[600px]">
          {reservationsRange.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading calendar...</div>
          ) : (
            <GymCalendar 
              events={calendarEvents as any}
              onCreateSession={handleCreateOnDate}
              onMonthChange={handleMonthChange}
              readOnly
            />
          )}
        </div>
      ) : (
      <Card>
        <CardHeader className="pb-2">
          <div className="text-sm font-medium">Day grid</div>
        </CardHeader>
        <CardContent>
          {availability.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : availability.error ? (
            <div className="text-sm text-red-600 dark:text-red-400">{availability.error.message || "Failed to load availability"}</div>
          ) : !availability.data || availability.data.length === 0 ? (
            <div className="text-sm text-muted-foreground">No courts or availability found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Court</TableHead>
                    {HOURS.map((h) => (
                      <TableHead key={h} className="text-center">
                        {String(h).padStart(2, "0")}:00
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(availability.data as AvailabilityBlock[]).map((block) => {
                    // Build lookups for fast cell rendering
                    const free = new Map<number, string>(); // hour -> startUtc
                    (block.freeSlots ?? []).forEach((s) => free.set(s.hour, s.startUtc));
                    const booked = new Map<number, Booking>(); // hour -> booking
                    (block.booked ?? []).forEach((b) => booked.set(b.hour, b));

                    return (
                      <TableRow key={block.court.id}>
                        <TableCell className="font-medium">
                          {block.court.name}
                          <div className="text-xs text-muted-foreground">{block.court.location || block.court.sport}</div>
                        </TableCell>

                        {HOURS.map((h) => {
                          const isPast = slotIsPastEnd(selectedDate, h);
                          const b = booked.get(h);
                          const f = free.get(h);

                          // Booked cell
                          if (b) {
                            const mine = !!b.byMe;
                            return (
                              <TableCell key={h} className="text-center p-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className={`rounded px-2 py-1 text-xs select-none ${mine ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                                        {mine ? "Booked by you" : "Booked"}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-xs">
                                        {b.studentName ? b.studentName : "Student"}
                                        {b.studentGucId ? ` • ${b.studentGucId}` : ""}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                {mine && !isPast && b.id && (
                                  <div className="mt-1">
                                    <Button size="sm" variant="ghost" onClick={() => cancelM.mutate({ id: b.id })}>
                                      Cancel
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            );
                          }

                          // Free cell
                          if (f) {
                            const disabled = isPast || reserveM.isPending;
                            return (
                              <TableCell key={h} className="text-center p-1">
                                <div
                                  className={`rounded px-2 py-1 text-xs cursor-pointer select-none ${disabled ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
                                  onClick={() => {
                                    if (disabled) return;
                                    reserveM.mutate({
                                      courtId: block.court.id,
                                      startDate: new Date(f),
                                      duration: 60,
                                    });
                                  }}
                                >
                                  Available
                                </div>
                              </TableCell>
                            );
                          }

                          // Outside working window / gap
                          return (
                            <TableCell key={h} className="text-center text-muted-foreground">
                              —
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Create booking dialog */}
      <CreateCourtBookingDialog 
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setCreateInitialDate(undefined);
        }}
        onCreated={() => {
          reservationsRange.refetch();
          utils.courts.availability.invalidate();
        }}
        initialDate={createInitialDate}
        defaultSport={sport as any}
      />
    </div>
  );
}
