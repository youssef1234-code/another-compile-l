import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-hot-toast";
import { CalendarSearch, Dumbbell } from "lucide-react";

const SPORTS = ["BASKETBALL", "TENNIS", "FOOTBALL"] as const;

function toISOFromLocal(dateStr: string, timeStr: string) {
  const d = new Date(`${dateStr}T${timeStr}:00`);
  return d.toISOString();
}

const OPEN_HOUR = 8;
const CLOSE_HOUR = 22; // last start hour shown is 21:00
const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);

// A slot is "past" if its end time <= now + 1 minute
function slotIsPastEnd(dateStr: string, hour: number) {
  const end = new Date(`${dateStr}T${String(hour + 1).padStart(2, "0")}:00:00`);
  const now = new Date();
  return end.getTime() <= now.getTime() + 60_000;
}

function trpcErrMsg(err: any) {
  return (
    err?.message ||
    err?.data?.message ||
    err?.shape?.message ||
    err?.data?.zodError?.formErrors?.join(", ") ||
    "Something went wrong"
  );
}

export function CourtBookingsPage() {
  const todayLocal = new Date();
  const defaultDate = todayLocal.toISOString().slice(0, 10); // YYYY-MM-DD

  const [sport, setSport] = useState<(typeof SPORTS)[number]>("TENNIS");
  const [dateStr, setDateStr] = useState<string>(defaultDate);
  const [selectedCourtId, setSelectedCourtId] = useState<string | "ALL">("ALL");

  // courts list (filterable by sport)
  const courtsQuery = trpc.courts.list.useQuery({ sport });

  // availability input (date at local midnight pushed as UTC Date)
  const availabilityInput = useMemo(() => {
    const midnightLocalISO = toISOFromLocal(dateStr, "00:00");
    const dateObj = new Date(midnightLocalISO);
    return selectedCourtId !== "ALL"
      ? { date: dateObj, courtId: selectedCourtId, slotMinutes: 60 }
      : { date: dateObj, sport, slotMinutes: 60 };
  }, [dateStr, sport, selectedCourtId]);

  const availability = trpc.courts.availability.useQuery(availabilityInput, {
    enabled: !!dateStr,
  });

  const utils = trpc.useUtils();

  const reserveM = trpc.courts.reserve.useMutation({
    onSuccess: () => {
      toast.success("Reservation successful");
      utils.courts.availability.invalidate(availabilityInput as any);
    },
    onError: (e) => toast.error(trpcErrMsg(e)),
  });

  const cancelM = trpc.courts.cancel.useMutation({
    onSuccess: () => {
      toast.success("Reservation cancelled");
      utils.courts.availability.invalidate(availabilityInput as any);
    },
    onError: (e) => toast.error(trpcErrMsg(e)),
  });

  const courtOptions = useMemo(() => {
    const items = courtsQuery.data ?? [];
    return [{ id: "ALL", name: "All courts", sport }, ...items.map((c) => ({ id: c.id, name: c.name, sport: c.sport }))];
  }, [courtsQuery.data, sport]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Dumbbell className="h-7 w-7" />
          <div>
            <h1 className="text-xl font-semibold">Court Bookings</h1>
            <p className="text-muted-foreground text-sm">View availability and reserve basketball, tennis, or football courts</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Select
            value={sport}
            onValueChange={(v) => {
              setSport(v as any);
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
              {courtOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
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
            <div className="text-sm text-red-600">{trpcErrMsg(availability.error)}</div>
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
                  {availability.data.map((block: any) => {
                    // Build lookups for fast cell rendering
                    const free = new Map<number, string>(); // hour -> startUtc
                    (block.freeSlots ?? []).forEach((s: any) => free.set(s.hour, s.startUtc));
                    const booked = new Map<number, any>(); // hour -> booking
                    (block.booked ?? []).forEach((b: any) => booked.set(b.hour, b));

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
                                    onClick={() => cancelM.mutate({ id: b.id } as any)}
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
                                      startDate: f, // UTC ISO from API
                                      duration: 60,
                                    } as any)
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
