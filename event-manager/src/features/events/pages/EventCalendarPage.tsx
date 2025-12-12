/**
 * Event Calendar Page
 * Comprehensive calendar view for all events (except gym sessions)
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { EventCalendar } from '../components/calendar';
import type { CalendarEvent } from '../components/calendar/types';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@event-manager/shared';
import { usePageMeta } from '@/components/layout/page-meta-context';
import { CreateEventSheet } from '../components/CreateEventSheet';

export function EventCalendarPage() {
  const { setPageMeta } = usePageMeta();
  const { user } = useAuthStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Only Events Office and Admin can manage events
  const canManage = user?.role === UserRole.EVENT_OFFICE || user?.role === UserRole.ADMIN;

  useEffect(() => {
    setPageMeta({
      title: 'Event Calendar',
      description: 'View all events in a comprehensive calendar',
    });
  }, [setPageMeta]);

  const utils = trpc.useUtils();

  // Build filters to exclude gym sessions
  const filters = useMemo(() => {
    const result: Record<string, string[]> = {};
    // Exclude gym sessions - get all other event types
    result.type = ['WORKSHOP', 'TRIP', 'BAZAAR', 'CONFERENCE', 'OTHER'];
    return result;
  }, []);

  // Build extended filters for calendar view (date range)
  const extendedFilters = useMemo(() => {
    // Calculate the start and end of the visible calendar month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    
    // Extend to include previous/next month overflow days
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Go back to Sunday
    
    const endDate = new Date(endOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // Go forward to Saturday
    
    return [
      {
        id: 'startDate',
        value: startDate.toISOString(),
        operator: 'gte' as const,
        variant: 'date' as const,
        filterId: 'startDate',
      },
      {
        id: 'endDate',
        value: endDate.toISOString(),
        operator: 'lte' as const,
        variant: 'date' as const,
        filterId: 'endDate',
      },
    ];
  }, [year, month]);

  // Fetch events for the calendar
  const { data: eventsData, isLoading } = trpc.events.getAllEvents.useQuery(
    {
      filters,
      extendedFilters,
      page: 1,
      perPage: 1000, // Get all events in range
    },
    {
      enabled: true,
      refetchOnWindowFocus: false,
    }
  );

  const events = useMemo(() => (eventsData?.events || []) as CalendarEvent[], [eventsData]);

  // Update event date (reschedule)
  const updateEventMutation = trpc.events.update.useMutation();
  
  const handleUpdateEvent = useCallback(async (eventId: string, newDate: Date) => {
    try {
      // Get the event to calculate duration for end date
      const event = events.find(e => e.id === eventId);
      if (!event) throw new Error('Event not found');

      // newDate already includes the adjusted time from the dialog
      const newStartDate = new Date(newDate);

      // Calculate duration if there's an end date
      let newEndDate = undefined;
      if (event.endDate) {
        const oldStartDate = new Date(event.startDate || event.date);
        const oldEndDate = new Date(event.endDate);
        const duration = oldEndDate.getTime() - oldStartDate.getTime();
        newEndDate = new Date(newStartDate.getTime() + duration);
      }

      await updateEventMutation.mutateAsync({
        id: eventId,
        data: {
          startDate: newStartDate,
          ...(newEndDate && { endDate: newEndDate }),
        },
      });

      await utils.events.getAllEvents.invalidate();
      toast.success('Event rescheduled successfully');
    } catch (error: any) {
      console.error('Failed to reschedule event:', error);
      toast.error(error.message || 'Failed to reschedule event');
      throw error;
    }
  }, [events, updateEventMutation, utils]);

  const handleCreateEvent = useCallback((date: Date) => {
    if (!canManage) {
      toast.error('You do not have permission to create events');
      return;
    }
    setSelectedDate(date);
    setCreateOpen(true);
  }, [canManage]);

  const handleMonthChange = useCallback((newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      {/* Calendar */}
      <div className="flex-1 min-h-0">
        <EventCalendar
          events={events}
          onUpdateEvent={canManage ? handleUpdateEvent : undefined}
          onCreateEvent={canManage ? handleCreateEvent : undefined}
          onMonthChange={handleMonthChange}
          readOnly={!canManage}
          isLoading={isLoading}
        />
      </div>

      {/* Create Event Sheet */}
      {canManage && (
        <CreateEventSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          initialDate={selectedDate}
          onSuccess={() => {
            setCreateOpen(false);
            setSelectedDate(undefined);
            toast.success('Event created successfully');
            utils.events.getAllEvents.invalidate();
          }}
        />
      )}
    </div>
  );
}
