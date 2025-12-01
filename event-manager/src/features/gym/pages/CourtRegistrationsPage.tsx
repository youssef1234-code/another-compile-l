/**
 * Court Registrations Page
 * 
 * Shows all court reservations for Event Office and Admin users.
 * Features:
 * - Toggle between Table and Calendar views
 * - Shows student name and GUC ID for each registration
 * - Expandable images
 * - Filtering by sport, court, date range
 */

import { useEffect, useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePageMeta } from '@/components/layout/page-meta-context';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  User,
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  IdCard,
} from 'lucide-react';
import type { CourtSport } from '@event-manager/shared';

const SPORTS = [
  { value: "BASKETBALL", label: "Basketball", icon: "🏀" },
  { value: "TENNIS", label: "Tennis", icon: "🎾" },
  { value: "FOOTBALL", label: "Football", icon: "⚽" },
] as const;

interface Registration {
  id: string;
  courtId: string;
  courtName: string;
  sport: CourtSport;
  location: string;
  studentName: string;
  studentGucId: string;
  startDate: string;
  endDate: string;
  status: string;
}

// Table View Component
function RegistrationsTable({ 
  registrations, 
  isLoading,
}: { 
  registrations: Registration[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="font-semibold mb-2">No Registrations Found</h3>
        <p className="text-sm text-muted-foreground">
          No court registrations match your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Court</TableHead>
            <TableHead>Sport</TableHead>
            <TableHead>Student Name</TableHead>
            <TableHead>GUC ID</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.map((reg) => {
            const sportInfo = SPORTS.find(s => s.value === reg.sport);
            return (
              <TableRow key={reg.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {format(new Date(reg.startDate), 'MMM d, yyyy')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(reg.startDate), 'h:mm a')} - {format(new Date(reg.endDate), 'h:mm a')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{sportInfo?.icon || '🏟️'}</span>
                    <span>{reg.courtName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {sportInfo?.label || reg.sport}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{reg.studentName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <IdCard className="h-4 w-4 text-muted-foreground" />
                    <code className="text-sm bg-muted px-2 py-0.5 rounded">
                      {reg.studentGucId}
                    </code>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="text-sm">{reg.location}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={reg.status === 'BOOKED' ? 'default' : 'secondary'}
                    className={reg.status === 'CANCELLED' ? 'line-through' : ''}
                  >
                    {reg.status}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// Calendar View Component
function RegistrationsCalendar({ 
  registrations,
  selectedMonth,
  onMonthChange,
}: { 
  registrations: Registration[];
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}) {
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const handlePrevMonth = () => {
    onMonthChange(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {format(selectedMonth, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="bg-muted p-2 text-center text-sm font-medium"
            >
              {day}
            </div>
          ))}
          
          {/* Calendar cells */}
          {weeks.map((week, weekIdx) => (
            week.map((day, dayIdx) => {
              const isCurrentMonth = day.getMonth() === selectedMonth.getMonth();
              const isToday = isSameDay(day, new Date());
              const dayRegs = registrations.filter(r => 
                isSameDay(new Date(r.startDate), day)
              );
              
              return (
                <div
                  key={`${weekIdx}-${dayIdx}`}
                  className={cn(
                    "bg-background min-h-[100px] p-1 border-t",
                    !isCurrentMonth && "bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                    isToday && "bg-primary text-primary-foreground",
                    !isCurrentMonth && "text-muted-foreground"
                  )}>
                    {day.getDate()}
                  </div>
                  {dayRegs.length > 0 && (
                    <div className="space-y-0.5">
                      {dayRegs.slice(0, 4).map((reg) => {
                        const sportInfo = SPORTS.find(s => s.value === reg.sport);
                        return (
                          <div
                            key={reg.id}
                            className={cn(
                              "text-[9px] px-1 py-0.5 rounded truncate cursor-default",
                              reg.status === 'BOOKED' 
                                ? 'bg-primary/20 text-primary' 
                                : 'bg-muted text-muted-foreground line-through'
                            )}
                            title={`${reg.studentName} (${reg.studentGucId}) - ${reg.courtName}\n${format(new Date(reg.startDate), 'h:mm a')} - ${format(new Date(reg.endDate), 'h:mm a')}`}
                          >
                            {sportInfo?.icon} {format(new Date(reg.startDate), 'ha')} {reg.studentName.split(' ')[0]}
                          </div>
                        );
                      })}
                      {dayRegs.length > 4 && (
                        <div className="text-[9px] text-muted-foreground text-center">
                          +{dayRegs.length - 4} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/20" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-muted" />
            <span className="line-through">Cancelled</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CourtRegistrationsPage() {
  const { setPageMeta } = usePageMeta();
  const [view, setView] = useState<'TABLE' | 'CALENDAR'>('TABLE');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [sportFilter, setSportFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    setPageMeta({
      title: 'Court Registrations',
      description: 'View all court bookings and registrations',
    });
  }, [setPageMeta]);

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    if (view === 'CALENDAR') {
      return {
        start: startOfMonth(selectedMonth),
        end: endOfMonth(selectedMonth),
      };
    }
    // For table view, show 30 days by default
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30),
    };
  }, [view, selectedMonth]);

  // Fetch all registrations for the date range
  const { data: registrationsData, isLoading } = trpc.courts.getAllRegistrations.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
    sport: sportFilter !== 'ALL' ? sportFilter as CourtSport : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    search: searchQuery || undefined,
  });

  const registrations = registrationsData?.registrations || [];

  // Filter registrations
  const filteredRegistrations = useMemo(() => {
    let filtered = [...registrations];
    
    // Apply local search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.studentName.toLowerCase().includes(query) ||
        r.studentGucId.toLowerCase().includes(query) ||
        r.courtName.toLowerCase().includes(query)
      );
    }
    
    // Sort by date (most recent first for table)
    filtered.sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    
    return filtered;
  }, [registrations, searchQuery]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Court Registrations</h1>
          <p className="text-muted-foreground">
            View and manage all court bookings
          </p>
        </div>
        
        {/* View Toggle */}
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
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search" className="text-sm mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, GUC ID, or court..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Sport Filter */}
            <div className="w-[150px]">
              <Label htmlFor="sport" className="text-sm mb-2 block">Sport</Label>
              <Select value={sportFilter} onValueChange={setSportFilter}>
                <SelectTrigger id="sport">
                  <SelectValue placeholder="All sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Sports</SelectItem>
                  {SPORTS.map((sport) => (
                    <SelectItem key={sport.value} value={sport.value}>
                      <span className="flex items-center gap-2">
                        {sport.icon} {sport.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-[150px]">
              <Label htmlFor="status" className="text-sm mb-2 block">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="BOOKED">Booked</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span>{filteredRegistrations.length} registration(s)</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content based on view */}
      {view === 'TABLE' ? (
        <RegistrationsTable 
          registrations={filteredRegistrations} 
          isLoading={isLoading}
        />
      ) : (
        <RegistrationsCalendar 
          registrations={filteredRegistrations}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      )}
    </div>
  );
}
