import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { CourtSport } from "@event-manager/shared";
import { formatValidationErrors } from "@/lib/format-errors";

function toISOFromLocal(dateStr: string, timeStr: string) {
  const d = new Date(`${dateStr}T${timeStr}:00`);
  return d.toISOString();
}

function formatDateToInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function CreateCourtBookingDialog({
  open,
  onOpenChange,
  onCreated,
  initialDate,
  defaultSport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  initialDate?: Date;
  defaultSport?: keyof typeof CourtSport | "ALL";
}) {
  const utils = trpc.useUtils();

  const [sport, setSport] = useState<keyof typeof CourtSport | "ALL">(defaultSport || "ALL");
  const [courtId, setCourtId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(60);

  // Prefill date when dialog opens
  useEffect(() => {
    if (open && initialDate) {
      setDate(formatDateToInput(initialDate));
    }
  }, [open, initialDate]);

  // Courts list, filtered by sport if not ALL
  const courtsQuery = trpc.courts.list.useQuery(
    sport && sport !== "ALL" ? { sport: sport as any } : {}
  );

  const courtOptions = useMemo(() => {
    const raw = (courtsQuery.data ?? []) as Array<any>;
    const cleaned = raw
      .map((c) => {
        const id = c?.id ?? c?._id;
        if (!id) return null;
        return { id: String(id), name: c?.name ?? "", sport: c?.sport ?? "" };
      })
      .filter(Boolean) as Array<{ id: string; name: string; sport: string }>;
    return cleaned;
  }, [courtsQuery.data]);

  useEffect(() => {
    // Reset court selection when sport changes
    setCourtId("");
  }, [sport]);

  const reserveM = trpc.courts.reserve.useMutation({
    onSuccess: () => {
      toast.success("Reservation successful");
      utils.courts.availability.invalidate();
      utils.courts.reservationsRange.invalidate();
      onOpenChange(false);
      setCourtId(""); setTime(""); setDuration(60);
      if (onCreated) onCreated();
    },
    onError: (e) => {
      const errorMessage = formatValidationErrors(e);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  const canSubmit = Boolean(courtId && date && time && duration > 0) && !reserveM.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book a Court</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs">Sport</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn("w-full justify-between", !sport && "text-muted-foreground")}
                >
                  {sport}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search sport..." />
                  <CommandList>
                    <CommandEmpty>No sport found.</CommandEmpty>
                    <CommandGroup>
                      {["ALL", ...Object.keys(CourtSport)].map((sp) => (
                        <CommandItem key={sp} value={sp} onSelect={(v) => setSport(v.toUpperCase() as any)}>
                          <Check className={cn("mr-2 h-4 w-4", sport === sp ? "opacity-100" : "opacity-0")} />
                          {sp}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-xs">Court</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn("w-full justify-between", !courtId && "text-muted-foreground")}
                >
                  {courtId ? (courtOptions.find((c) => c.id === courtId)?.name || "Select court") : "Select court"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search court..." />
                  <CommandList>
                    <CommandEmpty>No court found.</CommandEmpty>
                    <CommandGroup>
                      {courtOptions.map((c) => (
                        <CommandItem key={c.id} value={c.id} onSelect={(v) => setCourtId(v)}>
                          <Check className={cn("mr-2 h-4 w-4", courtId === c.id ? "opacity-100" : "opacity-0")} />
                          {c.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs">Start time</label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs">Duration (min)</label>
              <Input
                type="number"
                min={30}
                max={180}
                step={30}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              disabled={!canSubmit}
              onClick={() => {
                const iso = toISOFromLocal(date, time);
                reserveM.mutate({ courtId, startDate: new Date(iso), duration });
              }}
            >
              {reserveM.isPending ? "Booking..." : "Book"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
