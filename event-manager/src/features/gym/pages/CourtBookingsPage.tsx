
import { useMemo, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";
import { CalendarSearch } from "lucide-react";
import { usePageMeta } from '@/components/layout/page-meta-context';
import { formatValidationErrors } from '@/lib/format-errors';
//import type { CourtAvailabilityRow } from "@event-manager/shared";

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
}

interface AvailabilityBlock {
  court: Court;
  freeSlots?: FreeSlot[];
  booked?: Booking[];
}

function toISOFromLocal(dateStr: string, timeStr: string) {
  const d = new Date(`${dateStr}T${timeStr}:00`);
  return d.toISOString();
}

const OPEN_HOUR = 8;
const CLOSE_HOUR = 22; // last start hour shown is 21:00,
const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);

// A slot is "past" if its end time <= now + 1 minute
function slotIsPastEnd(dateStr: string, hour: number) {
  const end = new Date(`${dateStr}T${String(hour + 1).padStart(2, "0")}:00:00`);
  const now = new Date();
  return end.getTime() <= now.getTime() + 60_000;
}

export function CourtBookingsPage() {
  const { setPageMeta } = usePageMeta();
  const todayLocal = new Date();
  const defaultDate = todayLocal.toISOString().slice(0, 10); // YYYY-MM-DD

  const [sport, setSport] = useState<SportFilter>("ALL");
  const [dateStr, setDateStr] = useState<string>(defaultDate);
  const [selectedCourtId, setSelectedCourtId] = useState<string | "ALL">("ALL");

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
  // availability input (date at local midnight pushed as UTC Date)
 const availabilityInput = useMemo(() => {
  const midnightLocalISO = toISOFromLocal(dateStr, "00:00");
  const dateObj = new Date(midnightLocalISO);
  const sportFilter = sport === "ALL" ? undefined : sport;  // ✅

  return selectedCourtId !== "ALL"
    ? { date: dateObj, courtId: selectedCourtId, slotMinutes: 60 }
    : { date: dateObj, sport: sportFilter, slotMinutes: 60 };
}, [dateStr, sport, selectedCourtId]);


  const availability = trpc.courts.availability.useQuery(availabilityInput, {
    enabled: !!dateStr,
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



  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Controls */}
      <div className="flex items-center justify-end gap-2">
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


        <Input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />

        <Button variant="outline" onClick={() => availability.refetch()} disabled={availability.isFetching}>
          <CalendarSearch className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Grid */}
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
            <div className="text-sm text-red-600">{availability.error.message || "Failed to load availability"}</div>
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
                          const isPast = slotIsPastEnd(dateStr, h);
                          const b = booked.get(h);
                          const f = free.get(h);

                          // Booked cell
                          if (b) {
                            const mine = !!b.byMe;
                            return (
                              <TableCell key={h} className="text-center">
                                <div className={`text-xs ${mine ? "text-emerald-600" : "text-muted-foreground"}`}>
                                  {mine ? "Booked by you" : "Booked"}
                                </div>
                                {/* CANCEL only if booked by me AND slot hasn't ended */}
                                {mine && !isPast && b.id && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => cancelM.mutate({ id: b.id })}
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </TableCell>
                            );
                          }

                          // Free cell
                          if (f) {
                            return (
                              <TableCell key={h} className="text-center">
                                <Button
                                  size="sm"
                                  disabled={isPast || reserveM.isPending}
                                  onClick={() =>
                                    reserveM.mutate({
                                      courtId: block.court.id,
                                      startDate: new Date(f), // Convert UTC ISO string to Date
                                      duration: 60,
                                    })
                                  }
                                >
                                  Book
                                </Button>
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
    </div>
  );
}
