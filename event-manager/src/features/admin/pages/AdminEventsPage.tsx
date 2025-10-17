/**
 * Admin Events Page - Complete tablecn Implementation
 * 
 * Professional admin interface for managing all events
 * Features:
 * - Global search with URL state
 * - Multi-field sorting with URL state
 * - Faceted filters with URL state (type, status, location)
 * - Server-side pagination
 * - Inline editing for event details
 * - Column visibility toggle
 * - Shareable URLs (all state in URL params)
 * - Export to CSV
 * - Event creation and editing
 * - View full details with registrations
 */

import type { Event } from '@event-manager/shared';
import { Download, Plus, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { useMemo, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useQueryState, parseAsInteger, parseAsString, parseAsArrayOf, parseAsJson } from 'nuqs';

import { PageHeader, ConfirmDialog } from '@/components/generic';
import { Button } from '@/components/ui/button';
import { exportToCSV, formatDate } from '@/lib/design-system';
import { trpc } from '@/lib/trpc';
import { EventsTable } from '../components/events-table';
import { CreateEventSheet } from '../../events/components/CreateEventSheet';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { useSyntheticListeners } from '@dnd-kit/core/dist/hooks/utilities';

export function AdminEventsPage() {
  const utils = trpc.useUtils();
  const navigate = useNavigate();
  
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

  // Read URL state for pagination, sorting, filters, and search
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(20));
  const [search] = useQueryState('search', parseAsString.withDefault(''));
  const [sortState] = useQueryState('sort', parseAsJson<Array<{id: string; desc: boolean}>>([] as any).withDefault([]));
  
  // Read simple filters from URL - these are managed by DataTableFacetedFilter (advanced mode)
  const [typeFilter] = useQueryState('type', parseAsArrayOf(parseAsString, ',').withDefault([]));
  const [statusFilter] = useQueryState('status', parseAsArrayOf(parseAsString, ',').withDefault([]));
  const [locationFilter] = useQueryState('location', parseAsArrayOf(parseAsString, ',').withDefault([]));

  // Read extended filters from URL - these are managed by DataTableFilterMenu (command mode)
  const [extendedFiltersState] = useQueryState('filters', parseAsJson<Array<any>>([] as any).withDefault([]));
  
  // Read join operator for extended filters (and/or)
  const [joinOperator] = useQueryState('joinOperator', parseAsString.withDefault('and'));

  // Build simple filters object for backend (advanced mode)
  const filters = useMemo(() => {
    const result: Record<string, string[]> = {};
    if (typeFilter.length > 0) result.type = typeFilter;
    if (statusFilter.length > 0) result.status = statusFilter;
    if (locationFilter.length > 0) result.location = locationFilter;
    return result;
  }, [typeFilter, statusFilter, locationFilter]);

  // Parse extended filters (command mode)
  const extendedFilters = useMemo(() => {
    try {
      if (Array.isArray(extendedFiltersState) && extendedFiltersState.length > 0) {
        return extendedFiltersState;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }, [extendedFiltersState]);

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
  });

  const archiveEventMutation = trpc.events.archive.useMutation({
    onSuccess: () => {
      toast.success('Event archived successfully');
      utils.events.getAllEvents.invalidate();
      utils.events.getEventStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to archive event');
    },
  });

  const approveWorkshopMutation = trpc.events.approveWorkshop.useMutation({
    onSuccess: () =>{
      toast.success('Workshop Approved Successfully');
      utils.events.getAllEvents.invalidate();
      utils.events.getEventStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to approve workshop');
    },
  });

  const needsEditsWorkshopMutation = trpc.events.workshopNeedsEdits.useMutation({
    onSuccess: () =>{
      toast.success('Workshop Needs Edits Successfully');
      utils.events.getAllEvents.invalidate();
      utils.events.getEventStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to approve workshop');
    },
  });

  const  rejectWorkshopMutation = trpc.events.rejectWorkshop.useMutation({
    onSuccess: () =>{
      toast.success('Workshop Rejected Successfully');
      utils.events.getAllEvents.invalidate();
      utils.events.getEventStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to approve workshop');
    },
  });

  const deleteEventMutation = trpc.events.delete.useMutation({
    onSuccess: () => {
      toast.success('Event deleted successfully');
      utils.events.getAllEvents.invalidate();
      utils.events.getEventStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete event');
    },
  });

  // Handlers - wrapped in useCallback for performance
  const handleUpdateEvent = useCallback(async (eventId: string, field: string, value: string) => {
    const updates: any = {};
    updates[field] = value;
    
    try {
      await updateEventMutation.mutateAsync({ 
        id: eventId,
        data: updates 
      });
    } catch (error: any) {
      // Extract user-friendly error message
      let errorMessage = 'Failed to update event';
      
      if (error?.data?.zodError?.fieldErrors) {
        const fieldErrors = error.data.zodError.fieldErrors;
        const firstFieldErrors = Object.values(fieldErrors)[0];
        if (Array.isArray(firstFieldErrors) && firstFieldErrors.length > 0) {
          errorMessage = firstFieldErrors[0];
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [updateEventMutation]);

  const handleViewDetails = useCallback((eventId: string) => {
    // Navigate to event details page
    navigate(`${ROUTES.EVENTS}/${eventId}`);
  }, [navigate]);

  const handleEditEvent = useCallback((eventId: string) => {
    // Navigate to edit page based on event type
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Check edit constraints based on requirements
    const now = new Date();
    
    switch (event.type) {
      case 'WORKSHOP':
        // Workshops can be edited by professors, or by events office if in approval workflow
        navigate(`/events/workshops/${eventId}/edit`);
        break;
      case 'TRIP':
        // Requirement #34: Only if trip start date hasn't passed yet
        if (event.startDate && new Date(event.startDate) < now) {
          toast.error('Cannot edit trip - start date has already passed');
          return;
        }
        navigate(`/events/trips/${eventId}/edit`);
        break;
      case 'BAZAAR':
        // Requirement #32: Only if the bazaar hasn't started yet
        if (event.startDate && new Date(event.startDate) < now) {
          toast.error('Cannot edit bazaar - event has already started');
          return;
        }
        navigate(`/events/bazaars/${eventId}/edit`);
        break;
      case 'CONFERENCE':
        navigate(`/events/conferences/${eventId}/edit`);
        break;
      case 'GYM_SESSION':
        navigate(`/gym/manage?editSession=${eventId}`);
        break;
      default:
        toast.error('Edit not supported for this event type');
    }
  }, [navigate, events]);

  const handleArchiveEvent = useCallback((eventId: string) => {
    setArchiveDialog({
      open: true,
      eventId,
    });
  }, []);

  const confirmArchive = useCallback(() => {
    archiveEventMutation.mutate({ id: archiveDialog.eventId });
    setArchiveDialog({ open: false, eventId: '' });
  }, [archiveDialog.eventId, archiveEventMutation]);

  const handleDeleteEvent = useCallback((eventId: string) => {
    setDeleteDialog({ open: true, eventId });
  }, []);

  const handleWorkshopApproval = useCallback((eventId: string) => {
    approveWorkshopMutation.mutate({ eventId: eventId });
  }, [approveWorkshopMutation]);

  const handleWorkshopRejection = useCallback((eventId: string, rejectionReason: string) => {
    rejectWorkshopMutation.mutate({ eventId: eventId, rejectionReason: rejectionReason });
  }, [rejectWorkshopMutation]);

   const handleWorkshopNeedsEdits = useCallback((eventId: string) => {
    approveWorkshopMutation.mutate({ eventId: eventId });
  }, [approveWorkshopMutation]);

  const confirmDelete = useCallback(() => {
    deleteEventMutation.mutate({ id: deleteDialog.eventId });
    setDeleteDialog({ open: false, eventId: '' });
  }, [deleteDialog.eventId, deleteEventMutation]);

  const handleExport = useCallback(async () => {
    try {
      // Export with current filters, sort, and search applied
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

  return (
    <>
      {/* Page Header */}
      <PageHeader
        title="Events Management"
        description="Manage all events including workshops, trips, bazaars, conferences, and gym sessions"
        stats={stats}
        actions={
          <>
            <Button variant="outline" onClick={handleExport} className="gap-2" disabled={isLoading}>
              <Download className="h-4 w-4" />
              Export {search || Object.keys(filters).length > 0 ? 'Filtered' : 'All'}
            </Button>
            <Button onClick={handleCreateEvent} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </>
        }
      />

      {/* Events Table with full tablecn integration */}
      <div className="mt-6">
        <EventsTable
          data={events}
          pageCount={pageCount}
          typeCounts={typeCounts}
          statusCounts={statusCounts}
          isSearching={isLoading}
          onUpdateEvent={handleUpdateEvent}
          onViewDetails={handleViewDetails}
          onEditEvent={handleEditEvent}
          onArchiveEvent={handleArchiveEvent}
          onDeleteEvent={handleDeleteEvent}
          onApproveWorkshop={handleWorkshopApproval}
          onRejectWorkshop={handleWorkshopRejection}
          onNeedsEdits={handleWorkshopNeedsEdits}
        />
      </div>

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        open={archiveDialog.open}
        onOpenChange={(open) => setArchiveDialog({ ...archiveDialog, open })}
        title="Archive Event"
        description="Are you sure you want to archive this event? Archived events won't appear in public listings but can be restored later."
        confirmLabel="Archive"
        onConfirm={confirmArchive}
        variant="default"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Event"
        description="This action cannot be undone. Are you sure you want to permanently delete this event? This is only allowed if no one has registered."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        variant="destructive"
      />

      {/* Create Event Sheet */}
      <CreateEventSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        onSuccess={() => {
          utils.events.getAllEvents.invalidate();
          utils.events.getEventStats.invalidate();
        }}
      />
    </>
  );
}
