import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

// If you have this enum in shared, import its values; otherwise keep this list:
const GYM_TYPES = [
  "YOGA","PILATES","AEROBICS","ZUMBA","CROSS_CIRCUIT","KICK_BOXING",
  "CROSSFIT","CARDIO","STRENGTH","DANCE","MARTIAL_ARTS","OTHER",
] as const;

function toISOFromLocal(dateStr: string, timeStr: string) {
  // Interprets date+time as LOCAL time on the user's machine (Cairo in your case)
  // and returns a proper UTC ISO string for the backend.
  // Example: "2025-10-15" + "18:30" (Cairo, UTC+2) -> "2025-10-15T16:30:00.000Z"
  const d = new Date(`${dateStr}T${timeStr}:00`);
  return d.toISOString();
}

export function CreateGymSessionDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
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

  const createM = trpc.events.createGymSession.useMutation({
    onSuccess: () => {
      toast.success("Session created");
      utils.events.getEvents.invalidate();
      onOpenChange(false);
      if (onCreated) onCreated();
      // reset (optional)
      setName(""); setDescription(""); setSessionType("YOGA"); setDate(""); setTime(""); setDuration(60); setCapacity(20);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create session");
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
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {GYM_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t.replaceAll("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  sessionType: sessionType as any,
                  startDate: startDateISO as any, // send UTC ISO
                  duration,
                  capacity,
                });
              }}
            >
              {createM.isPending ? "Creating..." : "Create"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Note: we convert your selected local date & time to UTC before sending,
            so it stores correctly and displays at the right local time.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
