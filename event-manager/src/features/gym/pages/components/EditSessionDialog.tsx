

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { CalendarEvent } from "../../components/calendar/types";
import toast from "react-hot-toast";
import { formatValidationErrors } from "@/lib/format-errors";

function toLocalYMD(dt: Date){ const d=new Date(dt); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function toLocalHM(dt: Date){ const d=new Date(dt); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }
function buildDate(dateStr:string, hmStr:string){
  const [y,m,d] = dateStr.split("-").map(Number);
  const [H,MM] = hmStr.split(":").map(Number);
  return new Date(y, m-1, d, H, MM, 0, 0); // local time
}


interface TRPCError {
  message?: string;
}

export default function EditSessionDialog({
  session,
  onOpenChange,
  onSaved,
}: {
  session: CalendarEvent;
  onOpenChange: (open:boolean)=>void;
  onSaved: ()=>void;
}){
  const start = session.startDate ? new Date(session.startDate) : new Date();
  const [date, setDate] = useState(toLocalYMD(start));
  const [time, setTime] = useState(toLocalHM(start));
  const [duration, setDuration] = useState<number>(session.duration ?? 60);
  const [capacity, setCapacity] = useState<number>(session.capacity ?? 20);
  const [status, setStatus] = useState<string>(session.status ?? "PUBLISHED");

  if (!session.startDate) return null;

  const utils = trpc.useUtils();
  const updateM = trpc.events.updateGymSession.useMutation({
    onSuccess: () => { utils.events.getAllEvents.invalidate(); onSaved(); },
    onError: (e: TRPCError) => { 
      const errorMessage = formatValidationErrors(e);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } }); 
    },
  });

  const saving = updateM.isPending;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs">Date</label>
              <DatePicker
                value={date ? new Date(date) : null}
                onChange={(d) => setDate(d ? toLocalYMD(d) : '')}
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

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs">Duration (min)</label>
              <Input type="number" value={duration} min={15} max={240}
                onChange={(e)=> setDuration(Number(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs">Capacity</label>
              <Input type="number" value={capacity} min={1}
                onChange={(e)=> setCapacity(Number(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=> onOpenChange(false)}>Close</Button>
            <Button
              onClick={()=>{
                const startDate = buildDate(date, time);
                const patch: Record<string, unknown> = { startDate, duration, capacity, status };
                // Remove unchanged fields (optional)
                Object.keys(patch).forEach(k => patch[k] === undefined && delete patch[k]);
                updateM.mutate({ id: session.id, ...patch });
              }}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
