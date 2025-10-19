
import { ConfirmDialog } from '@/components/generic';
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@event-manager/shared';
import { Calendar as CalendarIcon, List as ListIcon, Plus } from "lucide-react";
import { parseAsArrayOf, parseAsInteger, parseAsJson, parseAsString, useQueryState } from 'nuqs';
import { useCallback, useMemo, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { GymCalendar } from '../components/calendar';
import { GymScheduleTable } from "../components/gym-schedule-table";
import { CreateGymSessionDialog } from "./components/CreateGymSessionDialog";
import EditSessionDialog from "./components/EditSessionDialog";
import type { CalendarEvent } from '../components/calendar/types';
import { cn } from '@/lib/utils';
import { usePageMeta } from '@/components/layout/page-meta-context';

export function GymSchedulePage(){
  const { setPageMeta } = usePageMeta();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()+1);
  const [view, setView] = useState<"TABLE" | "CALENDAR">("TABLE");
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createInitialDate, setCreateInitialDate] = useState<Date | undefined>(undefined);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; sessionId: string }>({
    open: false,
    sessionId: '',
  });

  useEffect(() => {
    setPageMeta({
      title: 'Gym Schedule',
      description: 'Manage and view gym sessions',
    });
  }, [setPageMeta]);

  const { user } = useAuthStore();
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.EVENT_OFFICE;

  const utils = trpc.useUtils();

  // Read URL state for pagination, sorting, filters, and search
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [search] = useQueryState('search', parseAsString.withDefault(''));
  const [sortState] = useQueryState('sort', parseAsJson<Array<{id: string; desc: boolean}>>((v) => {
    if (!v || typeof v !== 'string') return [];
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }).withDefault([]));
  
  // Read simple filters from URL
  const [typeFilter] = useQueryState('sessionType', parseAsArrayOf(parseAsString, ',').withDefault([]));
  const [statusFilter] = useQueryState('status', parseAsArrayOf(parseAsString, ',').withDefault([]));

  // Build simple filters object for backend
  const filters = useMemo(() => {
    const result: Record<string, string[]> = {
      type: ['GYM_SESSION'], // Always filter to gym sessions
    };
    if (typeFilter.length > 0) result.sessionType = typeFilter;
    if (statusFilter.length > 0) result.status = statusFilter;
    return result;
  }, [typeFilter, statusFilter]);

  // Build extended filters for calendar view (date range)
  const extendedFilters = useMemo(() => {
    if (view !== 'CALENDAR') return undefined;
    
    // Get first and last day of the current month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    
    return [
      {
        id: 'startDate',
        value: [startOfMonth.toISOString(), endOfMonth.toISOString()],
        operator: 'isBetween' as const,
        variant: 'dateRange' as const,
        filterId: 'startDate-range'
      }
    ];
  }, [view, year, month]);

  // Parse sort state
  const parsedSort = useMemo(() => {
    try {
      if (Array.isArray(sortState)) {
        return sortState as Array<{id: string; desc: boolean}>;
      }
      return [];
    } catch {
      return [];
    }
  }, [sortState]);

  // Fetch gym sessions with pagination and filtering
  const { data, isLoading } = trpc.events.getAllEvents.useQuery(
    {
      page,
      perPage: view === 'CALENDAR' ? 1000 : perPage, // Get more events for calendar view
      search: search || undefined,
      sort: parsedSort.length > 0 ? parsedSort : undefined,
      filters,
      extendedFilters,
      joinOperator: 'and' as const,
    },
    {
      placeholderData: (previousData) => previousData,
      staleTime: 5000,
    }
  );

  const sessions = useMemo(() => {
    return data?.events || [];
  }, [data?.events]);

  const pageCount = useMemo(() => {
    return data?.totalPages || 0;
  }, [data?.totalPages]);

  // Calculate type and status counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach(session => {
      const type = session.sessionType || 'OTHER';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [sessions]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach(session => {
      const status = session.status || 'PUBLISHED';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [sessions]);

  // Mutations
  const deleteM = trpc.events.delete.useMutation({
    onSuccess: () => {
      toast.success("Session deleted successfully");
      utils.events.getAllEvents.invalidate();
    },
    onError: (e) => {
      toast.error(e.message || "Failed to delete session");
    },
  });

  const updateGymSessionMutation = trpc.events.updateGymSession.useMutation({
    onSuccess: () => {
      utils.events.getAllEvents.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update session');
      throw error; // Re-throw so the calendar can handle it
    },
  });

  // Handlers
  const handleEditSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setEditing(session);
    }
  }, [sessions]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    setDeleteDialog({ open: true, sessionId });
  }, []);

  const confirmDelete = useCallback(async () => {
    await deleteM.mutateAsync({ id: deleteDialog.sessionId });
    setDeleteDialog({ open: false, sessionId: '' });
  }, [deleteDialog.sessionId, deleteM]);

  const handleUpdateEvent = useCallback(async (eventId: string, newDate: Date) => {
    await updateGymSessionMutation.mutateAsync({
      id: eventId,
      startDate: newDate,
    });
  }, [updateGymSessionMutation]);

  // Wrapper for calendar edit - receives event object
  const handleCalendarEditSession = useCallback((event: CalendarEvent) => {
    handleEditSession(event.id);
  }, [handleEditSession]);

  // Wrapper for calendar delete - directly performs deletion with confirmation in dialog
  const handleCalendarDeleteSession = useCallback(async (eventId: string) => {
    // The EventDetailsDialog already shows confirmation
    await deleteM.mutateAsync({ id: eventId });
  }, [deleteM]);

  const handleCreateSession = useCallback((date: Date) => {
    setCreateInitialDate(date);
    setCreateOpen(true);
  }, []);

  const handleMonthChange = useCallback((newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* View Toggle and Action Buttons */}
      <div className="flex items-center justify-between">
        {/* View Toggle - Matching calendar header style */}
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

        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Session
          </Button>
        )}
      </div>

      {/* Table or Calendar View */}
      {view === "TABLE" ? (
        <GymScheduleTable
          data={sessions}
          pageCount={pageCount}
          typeCounts={typeCounts}
          statusCounts={statusCounts}
          isSearching={isLoading}
          onEditSession={isAdmin ? handleEditSession : undefined}
          onDeleteSession={isAdmin ? handleDeleteSession : undefined}
        />
      ) : (
        <GymCalendar 
          events={sessions as CalendarEvent[]} 
          onUpdateEvent={isAdmin ? handleUpdateEvent : undefined}
          onCreateSession={isAdmin ? handleCreateSession : undefined}
          onEditSession={isAdmin ? handleCalendarEditSession : undefined}
          onDeleteSession={isAdmin ? handleCalendarDeleteSession : undefined}
          onMonthChange={handleMonthChange}
          readOnly={!isAdmin}
        />
      )}

      {/* Edit dialog */}
      {isAdmin && editing && (
        <EditSessionDialog
          session={editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={() => {
            setEditing(null);
            toast.success("Session updated");
            utils.events.getAllEvents.invalidate();
          }}
        />
      )}

      {/* Create dialog */}
      {isAdmin && (
        <CreateGymSessionDialog
          open={createOpen}
          onOpenChange={(o) => {
            setCreateOpen(o);
            if (!o) setCreateInitialDate(undefined); // Clear initial date when closing
          }}
          onCreated={() => {
            setCreateOpen(false);
            setCreateInitialDate(undefined);
            toast.success("Session created");
            utils.events.getAllEvents.invalidate();
          }}
          initialDate={createInitialDate}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Session"
        description="Are you sure you want to delete this gym session? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
