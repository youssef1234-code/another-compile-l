
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { toast } from "react-hot-toast";
import { GymSessionType, GYM_SESSION_TYPE_LABELS } from "@event-manager/shared";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatValidationErrors } from "@/lib/format-errors";


function toISOFromLocal(dateStr: string, timeStr: string) {
  // Interprets date+time as LOCAL time on the user's machine (Cairo in your case)
  // and returns a proper UTC ISO string for the backend.
  // Example: "2025-10-15" + "18:30" (Cairo, UTC+2) -> "2025-10-15T16:30:00.000Z"
  const d = new Date(`${dateStr}T${timeStr}:00`);
  return d.toISOString();
}

function formatDateToInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function CreateGymSessionDialog({
  open,
  onOpenChange,
  onCreated,
  initialDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  initialDate?: Date;
}) {
  const utils = trpc.useUtils();

  // form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sessionType, setSessionType] = useState<string>("YOGA");
  const [date, setDate] = useState<string>("");         // "YYYY-MM-DD"
  const [time, setTime] = useState<string>("");         // "HH:mm"
  const [duration, setDuration] = useState<number>(60); // minutes
  const [capacity, setCapacity] = useState<number>(20);

  // Prefill date when dialog opens with initialDate
  useEffect(() => {
    if (open && initialDate) {
      setDate(formatDateToInput(initialDate));
    }
  }, [open, initialDate]);

  const createM = trpc.events.createGymSession.useMutation({
    onSuccess: () => {
      toast.success("Session created");
      utils.events.getEvents.invalidate();
      utils.events.getAllEvents.invalidate();
      onOpenChange(false);
      if (onCreated) onCreated();
      // reset (optional)
      setName(""); setDescription(""); setSessionType("YOGA"); setDate(""); setTime(""); setDuration(60); setCapacity(20);
    },
    onError: (err) => {
      const errorMessage = formatValidationErrors(err);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  const canSubmit =
    name.trim().length >= 3 &&
    sessionType &&
    date &&
    time &&
    duration > 0 &&
    capacity > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Gym Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs">Name</label>
            <Input
              value={name}
              placeholder="e.g. Evening CROSSFIT"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs">Description (optional)</label>
            <Input
              value={description}
              placeholder="Short description"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs">Type</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between",
                    !sessionType && "text-muted-foreground"
                  )}
                >
                  {sessionType
                    ? GYM_SESSION_TYPE_LABELS[sessionType as keyof typeof GYM_SESSION_TYPE_LABELS]
                    : "Select type"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search session type..." />
                  <CommandList>
                    <CommandEmpty>No session type found.</CommandEmpty>
                    <CommandGroup>
                      {Object.values(GymSessionType).map((type) => (
                        <CommandItem
                          key={type}
                          value={type}
                          onSelect={(currentValue) => {
                            setSessionType(currentValue.toUpperCase());
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              sessionType === type ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {GYM_SESSION_TYPE_LABELS[type as keyof typeof GYM_SESSION_TYPE_LABELS]}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs">Date</label>
              <DatePicker
                value={date ? new Date(date) : null}
                onChange={(d) => setDate(d ? formatDateToInput(d) : '')}
                placeholder="Select date"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs">Start time</label>
              <TimePicker
                value={time}
                onChange={setTime}
                placeholder="Select time"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs">Duration (min)</label>
              <Input
                type="number"
                min={15}
                max={240}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-xs">Capacity</label>
              <Input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              disabled={!canSubmit || createM.isPending}
              onClick={() => {
                if (!canSubmit) return;
                const startDateISO = toISOFromLocal(date, time);
                createM.mutate({
                  name,
                  description: description || undefined,
                  sessionType: sessionType as 'YOGA' | 'PILATES' | 'AEROBICS' | 'ZUMBA' | 'CROSS_CIRCUIT' | 'KICK_BOXING' | 'CROSSFIT' | 'CARDIO' | 'STRENGTH' | 'DANCE' | 'MARTIAL_ARTS' | 'OTHER',
                  startDate: new Date(startDateISO), // send as Date object
                  duration,
                  capacity,
                });
              }}
            >
              {createM.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
