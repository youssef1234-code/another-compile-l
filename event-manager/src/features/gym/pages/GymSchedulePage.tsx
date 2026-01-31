
import { ConfirmDialog } from '@/components/generic';
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '../../../shared';
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
import { formatValidationErrors } from '@/lib/format-errors';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';

export function GymSchedulePage(){
  const { setPageMeta } = usePageMeta();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()+1);
  
  const { user } = useAuthStore();
  // Only Events Office can create/edit sessions (Admin excluded)
  const canManage = user?.role === UserRole.EVENT_OFFICE;
  // Only Admin and Events Office can see table view - others get calendar only
  const canSeeTableView = user?.role === UserRole.ADMIN || user?.role === UserRole.EVENT_OFFICE;
  
  // Non-admin/non-event-office users ALWAYS start with calendar view and cannot switch
  const [view, setView] = useState<"TABLE" | "CALENDAR">("CALENDAR");
  
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
  const { data, isLoading, isFetching } = trpc.events.getAllEvents.useQuery(
    {
      page,
      perPage: view === 'CALENDAR' ? 100 : perPage, // Max 100 per page, date filter handles scoping
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

  // Delayed loading state to prevent flash when response is fast
  const showLoading = useDelayedLoading(isFetching && view === 'CALENDAR');

  // Fetch user's registrations to mark registered sessions in calendar
  const { data: registrationsData } = trpc.events.getMyRegistrations.useQuery(
    { page: 1, limit: 100 },
    { enabled: view === 'CALENDAR' }
  );

  // Get set of registered event IDs for quick lookup
  const registeredEventIds = useMemo(() => {
    if (!registrationsData?.registrations) return new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Set((registrationsData.registrations as any[])
      .filter((reg) => reg.event != null) // Filter out registrations with deleted events
      .map((reg) => reg.event.id));
  }, [registrationsData?.registrations]);

  // Mark sessions with isRegistered flag
  const sessions = useMemo(() => {
    const events = data?.events || [];
    if (view !== 'CALENDAR' || registeredEventIds.size === 0) return events;
    
    return events.map(event => ({
      ...event,
      isRegistered: registeredEventIds.has(event.id),
    }));
  }, [data?.events, registeredEventIds, view]);

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
      const errorMessage = formatValidationErrors(e);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  const updateGymSessionMutation = trpc.events.updateGymSession.useMutation({
    onSuccess: () => {
      utils.events.getAllEvents.invalidate();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
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
        {/* View Toggle - Only for Admin and Events Office */}
        {canSeeTableView ? (
          <div className="flex items-center gap-1 rounded-lg p-1 bg-muted/30 border">
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
          </div>
        ) : (
          <div></div>
        )}

        {canManage && (
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
          onEditSession={canManage ? handleEditSession : undefined}
          onDeleteSession={canManage ? handleDeleteSession : undefined}
        />
      ) : (
        <GymCalendar 
          events={sessions as CalendarEvent[]} 
          onUpdateEvent={canManage ? handleUpdateEvent : undefined}
          onCreateSession={canManage ? handleCreateSession : undefined}
          onEditSession={canManage ? handleCalendarEditSession : undefined}
          onDeleteSession={canManage ? handleCalendarDeleteSession : undefined}
          onMonthChange={handleMonthChange}
          readOnly={!canManage}
          isLoading={showLoading}
        />
      )}

      {/* Edit dialog */}
      {canManage && editing && (
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
      {canManage && (
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
