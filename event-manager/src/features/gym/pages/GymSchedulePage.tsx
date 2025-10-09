// event-manager/src/features/gym/pages/GymSchedulePage.tsx
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";

const GYM_TYPES = [
  "YOGA","PILATES","AEROBICS","ZUMBA","CROSS_CIRCUIT","KICK_BOXING",
  "CROSSFIT","CARDIO","STRENGTH","DANCE","MARTIAL_ARTS","OTHER"
] as const;
type GymType = (typeof GYM_TYPES)[number];

function pad2(n:number){ return String(n).padStart(2,"0"); }
function toYMD(d:Date){ return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function toHM(d:Date){ return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
function monthLabel(y:number,m:number){ return new Date(y,m-1,1).toLocaleString(undefined,{month:"long",year:"numeric"}); }
function monthRangeUTC(y:number,m:number){ // [start, end)
  return [new Date(Date.UTC(y,m-1,1,0,0,0)), new Date(Date.UTC(y,m,1,0,0,0))] as const;
}

export function GymSchedulePage(){
  const now = new Date();
  const [year,setYear] = useState(now.getFullYear());
  const [month,setMonth] = useState(now.getMonth()+1);
  const [typeFilter,setTypeFilter] = useState<GymType | "ALL">("ALL");
  const [statusFilter,setStatusFilter] = useState<"ALL" | "PUBLISHED" | "CANCELLED">("ALL");

  const [startDate,endDate] = monthRangeUTC(year,month);

  // ⬇️ Use existing events.getEvents with filters
  const { data, isLoading, isFetching, refetch } = trpc.events.getEvents.useQuery({
    page: 1,
    limit: 100,                // plenty for one month
    type: "GYM_SESSION",
    startDate,                 // your router should coerce to Date
    endDate,
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

          <Button variant="ghost" size="icon" onClick={()=>refetch()} disabled={isFetching}>
            <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s:any)=> {
                  const start = new Date(s.startDate);
                  const end = new Date(s.endDate);
                  const sessionType = s.sessionType ?? s.gymType;
                  const duration = s.duration ?? s.durationMinutes;
                  const status = s.status ?? "PUBLISHED";
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="whitespace-nowrap">{toYMD(start)}</TableCell>
                      <TableCell className="whitespace-nowrap">{`${toHM(start)}–${toHM(end)}`}</TableCell>
                      <TableCell className="font-medium">{String(sessionType).replaceAll("_"," ")}</TableCell>
                      <TableCell>{duration} min</TableCell>
                      <TableCell>{s.capacity ?? "-"}</TableCell>
                      <TableCell><StatusBadge status={status}/></TableCell>
                      <TableCell>{s.location ?? "Gym"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
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
        <div key={i} className="grid grid-cols-7 gap-3">
          {Array.from({length:7}).map((__,j)=><Skeleton key={j} className="h-6 w-full"/>)}
        </div>
      ))}
    </div>
  );
}
function EmptyState(){
  return <div className="text-sm text-muted-foreground py-6">No sessions scheduled for this month.</div>;
}
