/**
 * Back Office Events Page - Role-Based Event Management
 * 
 * This page is accessible to:
 * - ADMIN: Full access to all events
 * - EVENT_OFFICE: Full access to all events
 * - PROFESSOR: Access only to their own workshops
 * 
 * Features role-based non-deletable filters for professors
 */


import type { Event } from '@event-manager/shared';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';

type ExtendedFilter = {
  id: string;
  value: string | string[];
  operator: "isEmpty" | "isNotEmpty" | "iLike" | "notILike" | "eq" | "ne" | "inArray" | "notInArray" | "lt" | "lte" | "gt" | "gte" | "isBetween" | "isRelativeToToday";
  variant: "number" | "date" | "text" | "select" | "multiSelect" | "boolean" | "range" | "dateRange";
  filterId: string;
};
import { useMemo, useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useQueryState, parseAsInteger, parseAsString, parseAsArrayOf, parseAsJson } from 'nuqs';

import { ConfirmDialog } from '@/components/generic';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { exportToCSV, formatDate } from '@/lib/design-system';
import { trpc } from '@/lib/trpc';
import { formatValidationErrors } from '@/lib/format-errors';
import { EventsTable } from '@/features/admin/components/events-table';
import { CreateEventSheet } from '@/features/events/components/CreateEventSheet';
import { useNavigate } from 'react-router-dom';
import { 
  ROUTES,
  generateEditWorkshopUrl,
  generateEditTripUrl,
  generateEditConferenceUrl,
  generateEditBazaarUrl
} from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';
import { usePageMeta } from '@/components/layout/page-meta-context';

export function BackOfficeEventsPage() {
  const { setPageMeta } = usePageMeta();
  const utils = trpc.useUtils();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Sheet and dialog state
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [archiveDialog, setArchiveDialog] = useState<{ open: boolean; eventId: string }>({
    open: false,
    eventId: '',
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; eventId: string }>({
    open: false,
    eventId: '',
  });
  const [approveWorkshopDialog, setApproveWorkshopDialog] = useState<{ open: boolean; eventId: string }>({
    open: false,
    eventId: '',
  });
  const [rejectWorkshopDialog, setRejectWorkshopDialog] = useState<{ open: boolean; eventId: string; reason: string }>({
    open: false,
    eventId: '',
    reason: '',
  });
  const [needsEditsDialog, setNeedsEditsDialog] = useState<{ open: boolean; eventId: string }>({
    open: false,
    eventId: '',
  });

  // Read URL state for pagination, sorting, filters, and search
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [search] = useQueryState('search', parseAsString.withDefault(''));
  const [sortState] = useQueryState('sort', parseAsJson<Array<{id: string; desc: boolean}>>((v) => {
    if (!v) return null;
    if (typeof v === 'string') {
      try {
        return JSON.parse(v) as Array<{id: string; desc: boolean}>;
      } catch {
        return null;
      }
    }
    return v as Array<{id: string; desc: boolean}>;
  }).withDefault([]));
  
  // Read simple filters from URL - these are managed by DataTableFacetedFilter (advanced mode)
  const [typeFilter, setTypeFilter] = useQueryState('type', parseAsArrayOf(parseAsString, ',').withDefault([]));
  const [statusFilter] = useQueryState('status', parseAsArrayOf(parseAsString, ',').withDefault([]));
  const [locationFilter] = useQueryState('location', parseAsArrayOf(parseAsString, ',').withDefault([]));
  const [facultyFilter] = useQueryState('faculty', parseAsArrayOf(parseAsString, ',').withDefault([]));

  // Read extended filters from URL - these are managed by DataTableFilterMenu (command mode)
  const [extendedFiltersState] = useQueryState('filters', parseAsJson<ExtendedFilter[]>((v) => {
    if (!v) return null;
    if (typeof v === 'string') {
      try {
        return JSON.parse(v) as ExtendedFilter[];
      } catch {
        return null;
      }
    }
    return v as ExtendedFilter[];
  }).withDefault([]));
  
  // Read join operator for extended filters (and/or)
  const [joinOperator] = useQueryState('joinOperator', parseAsString.withDefault('and'));

  // Apply role-based filter for professors (non-deletable)
  useEffect(() => {
    if (user?.role === 'PROFESSOR') {
      // Professors can only see workshops
      if (!typeFilter.includes('WORKSHOP') || typeFilter.length !== 1) {
        setTypeFilter(['WORKSHOP']);
      }
    }
  }, [user?.role, typeFilter, setTypeFilter]);

  // Build simple filters object for backend (advanced mode)
  const filters = useMemo(() => {
    const result: Record<string, string[]> = {};
    if (typeFilter.length > 0) result.type = typeFilter;
    if (statusFilter.length > 0) result.status = statusFilter;
    if (locationFilter.length > 0) result.location = locationFilter;
    if (facultyFilter.length > 0) result.faculty = facultyFilter;
    return result;
  }, [typeFilter, statusFilter, locationFilter, facultyFilter]);

  // Parse extended filters (command mode) with role-based additions
  const extendedFilters = useMemo(() => {
    try {
      const parsedFilters = Array.isArray(extendedFiltersState) && extendedFiltersState.length > 0
        ? [...extendedFiltersState]
        : [];

      // Add professor-specific filter for workshops created by them
      if (user?.role === 'PROFESSOR' && user?.id) {
        const hasCreatorFilter = parsedFilters.some((f) => f.id === 'createdBy');
        if (!hasCreatorFilter) {
          parsedFilters.push({ 
            id: 'createdBy', 
            filterId: 'createdBy',
            variant: 'text' as const,
            operator: 'eq', 
            value: user.id 
          });
        }
      }

      return parsedFilters.length > 0 ? parsedFilters : undefined;
    } catch {
      return undefined;
    }
  }, [extendedFiltersState, user?.role, user?.id]);

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

  // Fetch event stats for header
  const { data: statsData } = trpc.events.getEventStats.useQuery(undefined, {
    staleTime: 60000,
  });

  // Fetch events with ALL URL parameters
  const { data, isLoading } = trpc.events.getAllEvents.useQuery(
    {
      page,
      perPage,
      search: search || undefined,
      sort: parsedSort.length > 0 ? parsedSort : undefined,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      extendedFilters: extendedFilters,
      joinOperator: (joinOperator === 'or' ? 'or' : 'and') as 'and' | 'or',
    },
    {
      placeholderData: (previousData) => previousData,
      staleTime: 5000,
    }
  );

  const events = useMemo(() => {
    return data?.events || [];
  }, [data?.events]);

  const pageCount = useMemo(() => {
    return data?.totalPages || 0;
  }, [data?.totalPages]);

  // Calculate type counts from stats
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      WORKSHOP: 0,
      TRIP: 0,
      BAZAAR: 0,
      CONFERENCE: 0,
      BOOTH: 0,
      GYM_SESSION: 0,
    };
    
    if (statsData?.byType) {
      Object.entries(statsData.byType).forEach(([type, count]) => {
        counts[type] = count as number;
      });
    }
    
    return counts;
  }, [statsData]);

  // Calculate status counts from current page data
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      PUBLISHED: 0,
      DRAFT: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      NEEDS_EDITS: 0,
    };
    
    // Count from current events data
    events.forEach(event => {
      if (event.status && counts[event.status] !== undefined) {
        counts[event.status]++;
      }
    });
    
    return counts;
  }, [events]);

  // Stats for page header
  const stats = useMemo(() => {
    if (!statsData) {
      return [
        { label: 'Total Events', value: data?.total || 0, icon: Calendar, colorRole: 'info' as const },
      ];
    }

    return [
      { label: 'Total Events', value: statsData.total, icon: Calendar, colorRole: 'info' as const },
      { label: 'Upcoming', value: statsData.upcoming, icon: CheckCircle2, colorRole: 'success' as const },
      { label: 'Past', value: statsData.past, icon: Clock, colorRole: 'warning' as const },
    ];
  }, [statsData, data?.total]);

  // Mutations
  const updateEventMutation = trpc.events.update.useMutation({
    onSuccess: () => {
      toast.success('Event updated successfully');
      utils.events.getAllEvents.invalidate();
      utils.events.getEventStats.invalidate();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  const editWorkshopMutation = trpc.events.editWorkshop.useMutation({
    onSuccess: () => {
      toast.success('Workshop updated successfully');
      utils.events.getAllEvents.invalidate();
      utils.events.getEventStats.invalidate();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  const archiveEventMutation = trpc.events.archive.useMutation({
    onSuccess: () => {
      toast.success('Event archived successfully');
      utils.events.getAllEvents.invalidate();
      utils.events.getEventStats.invalidate();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  const archiveWorkshopMutation = trpc.events.archiveWorkshop.useMutation({
    onSuccess: () => {
      toast.success('Workshop archived successfully');
      utils.events.getAllEvents.invalidate();
      utils.events.getEventStats.invalidate();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  const deleteEventMutation = trpc.events.delete.useMutation({
    onSuccess: () => {
      toast.success('Event deleted successfully');
      utils.events.getAllEvents.invalidate();
      utils.events.getEventStats.invalidate();
      utils.events.getEvents.invalidate();
      utils.events.getUpcoming.invalidate();
      utils.events.search.invalidate();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  const deleteWorkshopMutation = trpc.events.deleteWorkshop.useMutation({
    onSuccess: () => {
      toast.success('Workshop deleted successfully');
      utils.events.getAllEvents.invalidate();
      utils.events.getEvents.invalidate();
      utils.events.getUpcoming.invalidate();
      utils.events.search.invalidate();
      utils.events.getEventStats.invalidate();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  const publishEventMutation = trpc.events.publishEvent.useMutation({
    onSuccess: () => {
      toast.success('Event published successfully');
      utils.events.getAllEvents.invalidate();
      utils.events.getEventStats.invalidate();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  const approveWorkshopMutation = trpc.events.approveWorkshop.useMutation({
    onSuccess: () => {
      toast.success('Workshop approved and published successfully');
      utils.events.getAllEvents.invalidate();
      utils.events.getEventStats.invalidate();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  const rejectWorkshopMutation = trpc.events.rejectWorkshop.useMutation({
    onSuccess: () => {
      toast.success('Workshop rejected');
      utils.events.getAllEvents.invalidate();
      utils.events.getEventStats.invalidate();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  const needsEditsWorkshopMutation = trpc.events.workshopNeedsEdits.useMutation({
    onSuccess: () => {
      toast.success('Workshop marked as needs edits');
      utils.events.getAllEvents.invalidate();
      utils.events.getEventStats.invalidate();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { duration: 5000 });
    },
  });

  // Handlers
  const handleUpdateEvent = useCallback(async (eventId: string, field: string, value: string) => {
    // Find the event to determine its type
    const event = events.find(e => e.id === eventId);
    if (!event) {
      toast.error('Event not found');
      throw new Error('Event not found');
    }

    const updates: Record<string, string> = {};
    updates[field] = value;
    
    try {
      // Use editWorkshop for workshops, update for other events
      if (event.type === 'WORKSHOP') {
        await editWorkshopMutation.mutateAsync({ 
          id: eventId,
          ...updates 
        });
      } else {
        await updateEventMutation.mutateAsync({ 
          id: eventId,
          data: updates 
        });
      }
    } catch (error: unknown) {
      // Use universal error formatter
      const errorMessage = formatValidationErrors(error);
      
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
      throw new Error(errorMessage);
    }
  }, [events, editWorkshopMutation, updateEventMutation]);

  const handleViewDetails = useCallback((eventId: string) => {
    navigate(`${ROUTES.EVENTS}/${eventId}`);
  }, [navigate]);

  const handleEditEvent = useCallback((eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const now = new Date();
    
    switch (event.type) {
      case 'WORKSHOP':
        // Prevent editing rejected workshops
        if (event.status === 'REJECTED') {
          toast.error('Cannot edit rejected workshops. The workshop has been rejected and cannot be modified.');
          return;
        }
        // Requirement #36: Events Office can edit workshops anytime (professors can edit their own)
        navigate(generateEditWorkshopUrl(eventId));
        break;
      case 'TRIP':
        // Requirement #34: Only if trip start date hasn't passed yet
        if (event.startDate && new Date(event.startDate) < now) {
          toast.error('Cannot edit trip - start date has already passed (Requirement #34)');
          return;
        }
        navigate(generateEditTripUrl(eventId));
        break;
      case 'BAZAAR':
        // Requirement #32: Only if the bazaar hasn't started yet
        if (event.startDate && new Date(event.startDate) < now) {
          toast.error('Cannot edit bazaar - event has already started (Requirement #32)');
          return;
        }
        navigate(generateEditBazaarUrl(eventId));
        break;
      case 'CONFERENCE':
        // Requirement #46: Events Office can edit conference details
        navigate(generateEditConferenceUrl(eventId));
        break;
      case 'GYM_SESSION':
        navigate(`/gym/manage?editSession=${eventId}`);
        break;
      default:
        toast.error('Edit not supported for this event type');
    }
  }, [navigate, events]);

  const handleArchiveEvent = useCallback((eventId: string) => {
    setArchiveDialog({ open: true, eventId });
  }, []);

  const confirmArchive = useCallback(() => {
    // Check if it's a workshop and user is a professor
    const event = events.find(e => e.id === archiveDialog.eventId);
    const isProfessor = user?.role === 'PROFESSOR';
    if (event?.type === 'WORKSHOP' && isProfessor) {
      archiveWorkshopMutation.mutate({ id: archiveDialog.eventId });
    } else {
      archiveEventMutation.mutate({ id: archiveDialog.eventId });
    }
    setArchiveDialog({ open: false, eventId: '' });
  }, [archiveDialog.eventId, archiveEventMutation, archiveWorkshopMutation, events, user?.role]);

  const handleDeleteEvent = useCallback((eventId: string) => {
    setDeleteDialog({ open: true, eventId });
  }, []);

  const confirmDelete = useCallback(() => {
    // Check if it's a workshop and user is a professor
    const event = events.find(e => e.id === deleteDialog.eventId);
    const isProfessor = user?.role === 'PROFESSOR';
    if (event?.type === 'WORKSHOP' && isProfessor) {
      deleteWorkshopMutation.mutate({ id: deleteDialog.eventId });
    } else {
      deleteEventMutation.mutate({ id: deleteDialog.eventId });
    }
    setDeleteDialog({ open: false, eventId: '' });
  }, [deleteDialog.eventId, deleteEventMutation, deleteWorkshopMutation, events, user?.role]);

  const handleApproveWorkshop = useCallback((eventId: string) => {
    setApproveWorkshopDialog({ open: true, eventId });
  }, []);

  const confirmApproveWorkshop = useCallback(() => {
    approveWorkshopMutation.mutate({ eventId: approveWorkshopDialog.eventId });
    setApproveWorkshopDialog({ open: false, eventId: '' });
  }, [approveWorkshopDialog.eventId, approveWorkshopMutation]);

  const handleRejectWorkshop = useCallback((eventId: string) => {
    setRejectWorkshopDialog({ open: true, eventId, reason: '' });
  }, []);

  const confirmRejectWorkshop = useCallback(() => {
    if (!rejectWorkshopDialog.reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    rejectWorkshopMutation.mutate({ 
      eventId: rejectWorkshopDialog.eventId, 
      rejectionReason: rejectWorkshopDialog.reason 
    });
    setRejectWorkshopDialog({ open: false, eventId: '', reason: '' });
  }, [rejectWorkshopDialog, rejectWorkshopMutation]);

  const handleNeedsEdits = useCallback((eventId: string) => {
    setNeedsEditsDialog({ open: true, eventId });
  }, []);

  const confirmNeedsEdits = useCallback(() => {
    needsEditsWorkshopMutation.mutate({ eventId: needsEditsDialog.eventId });
    setNeedsEditsDialog({ open: false, eventId: '' });
  }, [needsEditsDialog.eventId, needsEditsWorkshopMutation]);

  const handlePublishEvent = useCallback((eventId: string) => {
    publishEventMutation.mutate({ eventId });
  }, [publishEventMutation]);

  const handleExport = useCallback(async () => {
    try {
      const allEventsResponse = await utils.events.getAllEvents.fetch({
        page: 1,
        perPage: 999999,
        search: search || undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        extendedFilters: extendedFilters,
        joinOperator: (joinOperator === 'or' ? 'or' : 'and') as 'and' | 'or',
        sort: parsedSort.length > 0 ? parsedSort : undefined,
      });

      const allEvents = allEventsResponse.events;

      const exportData = allEvents.map((event: Event) => ({
        Name: event.name,
        Type: event.type,
        Status: event.status || 'N/A',
        'Start Date': event.startDate ? formatDate(new Date(event.startDate)) : 'N/A',
        'End Date': event.endDate ? formatDate(new Date(event.endDate)) : 'N/A',
        Location: event.locationDetails || 'N/A',
        Capacity: event.capacity,
        Registrations: event.registeredCount || 0,
        Price: event.price > 0 ? `${event.price} EGP` : 'Free',
        'Created At': formatDate(event.createdAt),
      }));
      
      exportToCSV(exportData, `events-export-${Date.now()}`);
      toast.success(`Exported ${allEvents.length} events successfully`);
    } catch (error) {
      toast.error('Failed to export events');
      console.error('Export error:', error);
    }
  }, [utils, search, filters, extendedFilters, joinOperator, parsedSort]);

  const handleCreateEvent = useCallback(() => {
    setCreateSheetOpen(true);
  }, []);

  const isProfessor = user?.role === 'PROFESSOR';
  const pageTitle = isProfessor ? 'My Workshops' : 'Events Management';
  const pageDescription = isProfessor
    ? 'Manage your workshops and academic events'
    : 'Manage all events including workshops, trips, bazaars, conferences, and gym sessions';
  const createButtonText = isProfessor ? 'Create Workshop' : 'Create Event';

  useEffect(() => {
    setPageMeta({
      title: pageTitle,
      description: pageDescription,
    });
  }, [setPageMeta, pageTitle, pageDescription]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Stats Cards */}
      {stats && stats.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              success: 'text-green-600 bg-green-50 border-green-200',
              warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
              critical: 'text-red-600 bg-red-50 border-red-200',
              info: 'text-blue-600 bg-blue-50 border-blue-200',
              brand: 'text-purple-600 bg-purple-50 border-purple-200',
            };
            const colorRole = stat.colorRole || 'info';
            
            return (
              <div key={index} className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-card">
                {Icon && (
                  <div className={`p-2 rounded-md ${colorClasses[colorRole]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <EventsTable
        data={events}
        pageCount={pageCount}
        typeCounts={typeCounts}
        statusCounts={statusCounts}
        userRole={user?.role}
        isSearching={isLoading}
        onUpdateEvent={handleUpdateEvent}
        onViewDetails={handleViewDetails}
        onEditEvent={handleEditEvent}
        // Professors CAN archive and delete their own workshops
        onArchiveEvent={handleArchiveEvent}
        onDeleteEvent={handleDeleteEvent}
        onPublishEvent={isProfessor ? undefined : handlePublishEvent}
        // Workshop approval actions for admin/event office only
        onApproveWorkshop={!isProfessor ? handleApproveWorkshop : undefined}
        onRejectWorkshop={!isProfessor ? handleRejectWorkshop : undefined}
        onNeedsEdits={!isProfessor ? handleNeedsEdits : undefined}
        // Action buttons
        onExport={handleExport}
        onCreate={handleCreateEvent}
        exportDisabled={isLoading}
        exportLabel={`Export ${search || Object.keys(filters).length > 0 ? 'Filtered' : 'All'}`}
        createLabel={createButtonText}
      />

      <ConfirmDialog
        open={archiveDialog.open}
        onOpenChange={(open) => setArchiveDialog({ ...archiveDialog, open })}
        title="Archive Event"
        description="Are you sure you want to archive this event? Archived events won't appear in public listings but can be restored later."
        confirmLabel="Archive"
        onConfirm={confirmArchive}
        variant="default"
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Event"
        description="This action cannot be undone. Are you sure you want to permanently delete this event? This is only allowed if no one has registered."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        variant="destructive"
      />

      {/* Workshop Approval Dialogs */}
      <ConfirmDialog
        open={approveWorkshopDialog.open}
        onOpenChange={(open) => setApproveWorkshopDialog({ ...approveWorkshopDialog, open })}
        title="Approve Workshop"
        description="Are you sure you want to approve this workshop? It will be published and visible to students."
        confirmLabel="Approve"
        onConfirm={confirmApproveWorkshop}
        variant="default"
      />

      <Dialog 
        open={rejectWorkshopDialog.open} 
        onOpenChange={(open) => setRejectWorkshopDialog({ ...rejectWorkshopDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Workshop</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this workshop. The professor will see this feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explain why this workshop is being rejected..."
              value={rejectWorkshopDialog.reason}
              onChange={(e) => setRejectWorkshopDialog({ ...rejectWorkshopDialog, reason: e.target.value })}
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRejectWorkshopDialog({ open: false, eventId: '', reason: '' })}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmRejectWorkshop}
            >
              Reject Workshop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={needsEditsDialog.open}
        onOpenChange={(open) => setNeedsEditsDialog({ ...needsEditsDialog, open })}
        title="Request Edits"
        description="Mark this workshop as needing edits? The professor will be able to revise and resubmit it."
        confirmLabel="Request Edits"
        onConfirm={confirmNeedsEdits}
        variant="default"
      />

      <CreateEventSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        initialType={isProfessor ? 'WORKSHOP' : undefined}
        skipTypeSelection={isProfessor}
        onSuccess={() => {
          utils.events.getAllEvents.invalidate();
          utils.events.getEventStats.invalidate();
          utils.events.getEvents.invalidate();
          utils.events.getUpcoming.invalidate();
          utils.events.search.invalidate();
        }}
      />
    </div>
  );
}
