import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";

const SPORTS = ["BASKETBALL","TENNIS","FOOTBALL"] as const;

export function CourtsSetupPage() {
  const utils = trpc.useUtils();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    sport: "BASKETBALL" as (typeof SPORTS)[number],
    location: "",
    tz: "Africa/Cairo",
    slotMinutes: 60,
    maxConcurrent: 1,
    openHoursJson: '{"mon":[{"start":"08:00","end":"22:00"}],"tue":[],"wed":[],"thu":[],"fri":[],"sat":[],"sun":[]}',
  });

  const courts = trpc.courts.list.useQuery({});

  const createCourt = trpc.courts.createCourt.useMutation({
    onSuccess: () => { toast.success("Court created"); utils.courts.list.invalidate({}); },
    onError: (e) => toast.error(e.message || "Failed")
  });
  const updateCourt = trpc.courts.updateCourt.useMutation({
    onSuccess: () => { toast.success("Court updated"); utils.courts.list.invalidate({}); setEditingId(null); },
    onError: (e) => toast.error(e.message || "Failed")
  });

  const [blackoutForm, setBlackoutForm] = useState({ courtId: "", start: "", end: "", reason: "" });
  const listBlackouts = trpc.courts.listBlackouts.useQuery(
    blackoutForm.courtId && blackoutForm.start && blackoutForm.end
      ? { courtId: blackoutForm.courtId, from: new Date(blackoutForm.start), to: new Date(blackoutForm.end) }
      : undefined as any,
    { enabled: !!(blackoutForm.courtId && blackoutForm.start && blackoutForm.end) }
  );
  const createBlackout = trpc.courts.createBlackout.useMutation({
    onSuccess: () => { toast.success("Blackout created"); listBlackouts.refetch(); },
    onError: (e) => toast.error(e.message || "Failed")
  });
  const deleteBlackout = trpc.courts.deleteBlackout.useMutation({
    onSuccess: () => { toast.success("Blackout deleted"); listBlackouts.refetch(); },
    onError: (e) => toast.error(e.message || "Failed")
  });

  const onSubmit = () => {
    try {
      const openHours = JSON.parse(form.openHoursJson || "{}");
      const payload = { name: form.name, sport: form.sport, location: form.location, tz: form.tz, slotMinutes: Number(form.slotMinutes), maxConcurrent: Number(form.maxConcurrent), openHours } as any;
      if (editingId) {
        updateCourt.mutate({ id: editingId, ...payload });
      } else {
        createCourt.mutate(payload);
      }
    } catch {
      toast.error("Invalid open hours JSON");
    }
  };

  const courtOptions = useMemo(() => (courts.data ?? []).map((c: any) => ({ id: c.id, name: c.name })), [courts.data]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Courts Setup</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            <Label>Sport</Label>
            <Select value={form.sport} onValueChange={(v) => setForm(f => ({ ...f, sport: v as any }))}>
              <SelectTrigger><SelectValue placeholder="Sport"/></SelectTrigger>
              <SelectContent>
                {SPORTS.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
            <Label>Location</Label>
            <Input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} />
            <Label>Timezone</Label>
            <Input value={form.tz} onChange={(e) => setForm(f => ({ ...f, tz: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Slot Minutes</Label>
                <Input type="number" value={form.slotMinutes} onChange={(e) => setForm(f => ({ ...f, slotMinutes: Number(e.target.value||0) }))} />
              </div>
              <div>
                <Label>Max Concurrent</Label>
                <Input type="number" value={form.maxConcurrent} onChange={(e) => setForm(f => ({ ...f, maxConcurrent: Number(e.target.value||0) }))} />
              </div>
            </div>
            <Label>Open Hours JSON</Label>
            <textarea className="w-full h-40 border rounded p-2 text-sm" value={form.openHoursJson} onChange={(e) => setForm(f => ({ ...f, openHoursJson: e.target.value }))} />
            <div className="flex gap-2">
              <Button onClick={onSubmit} disabled={createCourt.isPending || updateCourt.isPending}>{editingId ? "Update" : "Create"}</Button>
              {editingId && (
                <Button variant="outline" onClick={() => { setEditingId(null); setForm({ ...form, name: "", location: "" }); }}>Cancel</Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="font-medium">Existing Courts</div>
            <div className="space-y-2">
              {(courts.data ?? []).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between border rounded p-2">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.sport} • {c.location}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingId(c.id);
                    setForm(f => ({
                      ...f,
                      name: c.name,
                      sport: c.sport,
                      location: c.location ?? "",
                      tz: c.tz ?? "Africa/Cairo",
                      slotMinutes: c.slotMinutes ?? 60,
                      maxConcurrent: c.maxConcurrent ?? 1,
                      openHoursJson: JSON.stringify(c.openHours ?? {}, null, 0),
                    }));
                  }}>Edit</Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blackouts</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Court</Label>
            <Select value={blackoutForm.courtId} onValueChange={(v) => setBlackoutForm(b => ({ ...b, courtId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select court"/></SelectTrigger>
              <SelectContent>
                {courtOptions.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Label>From</Label>
            <Input type="datetime-local" value={blackoutForm.start} onChange={(e) => setBlackoutForm(b => ({ ...b, start: e.target.value }))} />
            <Label>To</Label>
            <Input type="datetime-local" value={blackoutForm.end} onChange={(e) => setBlackoutForm(b => ({ ...b, end: e.target.value }))} />
            <Label>Reason</Label>
            <Input value={blackoutForm.reason} onChange={(e) => setBlackoutForm(b => ({ ...b, reason: e.target.value }))} />
            <Button onClick={() => {
              if (!blackoutForm.courtId || !blackoutForm.start || !blackoutForm.end) { toast.error("Fill all fields"); return; }
              createBlackout.mutate({
                courtId: blackoutForm.courtId,
                start: new Date(blackoutForm.start),
                end: new Date(blackoutForm.end),
                reason: blackoutForm.reason || undefined,
              });
            }}>Add Blackout</Button>
          </div>

          <div className="space-y-3">
            <div className="font-medium">Blackout List</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => listBlackouts.refetch()} disabled={listBlackouts.isFetching}>Refresh</Button>
            </div>
            <div className="space-y-2">
              {(listBlackouts.data ?? []).map((b: any) => (
                <div key={b.id} className="flex items-center justify-between border rounded p-2">
                  <div>
                    <div className="text-sm">{new Date(b.start).toLocaleString()} → {new Date(b.end).toLocaleString()}</div>
                    {b.reason && <div className="text-xs text-muted-foreground">{b.reason}</div>}
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => deleteBlackout.mutate({ id: b.id })}>Delete</Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
