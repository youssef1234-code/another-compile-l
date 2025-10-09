import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, RefreshCcw, Calendar as CalendarIcon, List as ListIcon, Edit3, XCircle, Trash2 } from "lucide-react";
import { useAuthStore } from '@/store/authStore';
import { UserRole, type Event } from '@event-manager/shared';
import EditSessionDialog from "./components/EditSessionDialog";

const GYM_TYPES = [
  "YOGA","PILATES","AEROBICS","ZUMBA","CROSS_CIRCUIT","KICK_BOXING",
  "CROSSFIT","CARDIO","STRENGTH","DANCE","MARTIAL_ARTS","OTHER"
] as const;
type GymType = (typeof GYM_TYPES)[number];

function pad2(n:number){ return String(n).padStart(2,"0"); }
function toYMD(d:Date){ return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function toHM(d:Date){ return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
function monthLabel(y:number,m:number){ return new Date(y,m-1,1).toLocaleString(undefined,{month:"long",year:"numeric"}); }
function monthRangeUTC(y:number,m:number){ return [new Date(Date.UTC(y,m-1,1,0,0,0)), new Date(Date.UTC(y,m,1,0,0,0))] as const; }
function sameDay(a:Date,b:Date){return a.getUTCFullYear()===b.getUTCFullYear() && a.getUTCMonth()===b.getUTCMonth() && a.getUTCDate()===b.getUTCDate();}
function humanizeType(t?: string) {
  return (t ? String(t).replace(/_/g, " ") : "Gym Session");
}
function getSessionType(s: any) {
  return s?.sessionType ?? s?.gymType ?? undefined;
}
function getDurationMin(s: any) {
  return s?.duration ?? s?.durationMinutes ?? null;
}
function asDate(v: any) {
  // handles string | Date
  return v instanceof Date ? v : new Date(String(v));
}

export function GymSchedulePage(){
  const now = new Date();
  const [year,setYear] = useState(now.getFullYear());
  const [month,setMonth] = useState(now.getMonth()+1);
  const [typeFilter,setTypeFilter] = useState<GymType | "ALL">("ALL");
  const [statusFilter,setStatusFilter] = useState<"ALL" | "PUBLISHED" | "CANCELLED">("ALL");
  const [view,setView] = useState<"TABLE"|"CALENDAR">("TABLE");
  const [editing, setEditing] = useState<any|null>(null); // session being edited

  const { user } = useAuthStore();
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.EVENT_OFFICE;

  const [startDate,endDate] = monthRangeUTC(year,month);

  const { data, isLoading, isFetching, refetch } = trpc.events.getEvents.useQuery(
    { page: 1, limit: 100, type: "GYM_SESSION", startDate, endDate },
  );

  const utils = trpc.useUtils();
 
  const deleteM = trpc.events.delete.useMutation({
    onSuccess: () => utils.events.getEvents.invalidate(),
  });

  const rows = useMemo(()=>{
    const items = data?.events ?? [];
    return items
      .filter((e:any)=> typeFilter==="ALL" ? true : (e.sessionType ?? e.gymType) === typeFilter)
      .filter((e:any)=> statusFilter==="ALL" ? true : (e.status ?? "PUBLISHED") === statusFilter)
      .sort((a:any,b:any)=> +new Date(a.startDate) - +new Date(b.startDate));
  }, [data, typeFilter, statusFilter]);

  const goPrev = () => { const d=new Date(year,month-2,1); setYear(d.getFullYear()); setMonth(d.getMonth()+1); };
  const goNext = () => { const d=new Date(year,month,1);   setYear(d.getFullYear()); setMonth(d.getMonth()+1); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Gym Schedule</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev}><ChevronLeft className="h-4 w-4"/></Button>
          <Card className="px-3 py-2"><span className="font-medium">{monthLabel(year,month)}</span></Card>
          <Button variant="outline" size="icon" onClick={goNext}><ChevronRight className="h-4 w-4"/></Button>

          <Select value={String(year)} onValueChange={v=>setYear(Number(v))}>
            <SelectTrigger className="w-[110px]"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>
              {Array.from({length:5},(_,i)=> now.getFullYear()-2+i).map(y=>(
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(month)} onValueChange={v=>setMonth(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Month" /></SelectTrigger>
            <SelectContent>
              {Array.from({length:12},(_,i)=> i+1).map(m=>(
                <SelectItem key={m} value={String(m)}>
                  {new Date(2000,m-1,1).toLocaleString(undefined,{month:"long"})}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant={view==="TABLE" ? "secondary" : "outline"} size="sm" onClick={()=>setView("TABLE")}>
            <ListIcon className="h-4 w-4 mr-2"/> Table
          </Button>
          <Button variant={view==="CALENDAR" ? "secondary" : "outline"} size="sm" onClick={()=>setView("CALENDAR")}>
            <CalendarIcon className="h-4 w-4 mr-2"/> Calendar
          </Button>

          <Button variant="ghost" size="icon" onClick={()=>refetch()} disabled={isFetching}>
            <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={typeFilter} onValueChange={(v)=>setTypeFilter(v as any)}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filter by type"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {GYM_TYPES.map(t=> <SelectItem key={t} value={t}>{t.replaceAll("_"," ")}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v)=>setStatusFilter(v as any)}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filter by status"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {view === "TABLE" ? (
        <Card>
          <CardHeader><CardTitle>Monthly Sessions</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <LoadingTable/> : rows.length===0 ? <EmptyState/> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((s:any)=> {
                    const start = asDate(s.startDate);
const end = asDate(s.endDate);
const duration = getDurationMin(s);
const typeLabel = humanizeType(getSessionType(s));
                    const status = s.status ?? "PUBLISHED";
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="whitespace-nowrap">{toYMD(start)}</TableCell>
                        <TableCell className="whitespace-nowrap">{`${toHM(start)}–${toHM(end)}`}</TableCell>
                        <TableCell className="font-medium">{typeLabel}</TableCell>
                        <TableCell>{duration} min</TableCell>
                        <TableCell>{s.capacity ?? "-"}</TableCell>
                        <TableCell><StatusBadge status={status}/></TableCell>
                        <TableCell>{s.location ?? "Gym"}</TableCell>
                        {isAdmin && (
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={()=> setEditing(s)}>
                              <Edit3 className="h-4 w-4 mr-1"/> Edit
                            </Button>
                            {/* {status !== "CANCELLED" ? (
                              <Button variant="outline" size="sm" onClick={()=> cancelM.mutate({ id: s.id })} disabled={cancelM.isPending}>
                                <XCircle className="h-4 w-4 mr-1"/> Cancel
                              </Button>
                            ) : null} */}
                            <Button variant="destructive" size="sm" onClick={()=> {
                              if (confirm("Delete this session?")) deleteM.mutate({ id: s.id });
                            }} disabled={deleteM.isPending}>
                              <Trash2 className="h-4 w-4 mr-1"/> Delete
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <CalendarView year={year} month={month} sessions={rows}/>
      )}

      {/* Edit dialog */}
      {isAdmin && editing && (
        <EditSessionDialog
          session={editing}
          onOpenChange={(open)=> !open && setEditing(null)}
          onSaved={()=> { setEditing(null); utils.events.getEvents.invalidate(); }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "CANCELLED") return <Badge variant="destructive">Cancelled</Badge>;
  if (status === "PUBLISHED" || status === "ACTIVE") return <Badge>Published</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

function LoadingTable(){
  return (
    <div className="space-y-2">
      {Array.from({length:6}).map((_,i)=>(
        <div key={i} className="grid grid-cols-8 gap-3">
          {Array.from({length:8}).map((__,j)=><Skeleton key={j} className="h-6 w-full"/>)}
        </div>
      ))}
    </div>
  );
}
function EmptyState(){
  return <div className="text-sm text-muted-foreground py-6">No sessions scheduled for this month.</div>;
}

function CalendarView({ year, month, sessions }: { year:number; month:number; sessions:any[] }){
  // Build days for month grid
  const first = new Date(Date.UTC(year, month-1, 1));
  const startWeekDay = first.getUTCDay(); // 0..6
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: { date: Date | null }[] = [];
  // leading blanks
  for (let i=0;i<startWeekDay;i++) cells.push({ date: null });
  for (let d=1; d<=daysInMonth; d++) {
    cells.push({ date: new Date(Date.UTC(year, month-1, d)) });
  }
  // trailing blanks to fill a complete grid
  while (cells.length % 7 !== 0) cells.push({ date: null });

  return (
    <Card>
      <CardHeader><CardTitle>Calendar</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-3">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
            <div key={d} className="text-xs font-semibold text-muted-foreground">{d}</div>
          ))}
          {cells.map((cell, idx)=> {
            const daySessions = (cell.date ? sessions.filter(s => sameDay(new Date(s.startDate), cell.date!)) : []);
            return (
              <div key={idx} className="min-h-[110px] border rounded p-2 space-y-1">
                <div className="text-xs font-medium">{cell.date ? cell.date.getUTCDate() : ""}</div>
                <div className="space-y-1">
                  {daySessions.map((s:any)=> {
                    const start = asDate(s.startDate);
                    const end = asDate(s.endDate);
                    const time = `${toHM(start)}–${toHM(end)}`;
                    const typeLabel = humanizeType(getSessionType(s));
                    const status = s.status ?? "PUBLISHED";
                    return (
                      <div key={s.id} className="text-xs border rounded p-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{time}</span>
<span className="ml-2 px-1 rounded bg-muted">{typeLabel}</span>
                        </div>
                        {status === "CANCELLED" && <div className="text-[10px] text-red-600 mt-1">Cancelled</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

