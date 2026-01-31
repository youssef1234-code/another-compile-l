/**
 * Event Calendar Component
 * Comprehensive calendar for all events with DnD, filtering, and export
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CalendarProvider, useCalendar } from './calendar-context';
import { DragDropProvider } from './dnd/dnd-context';
import { CalendarHeader } from './calendar-header';
import { CalendarBody } from './calendar-body';
import { EventDetailsDialog } from './dialogs/event-details-dialog';
import { DnDConfirmationDialog } from './dnd/dnd-confirmation-dialog';
import type { CalendarEvent } from './types';
import type { Event, EventType } from '../../../../shared';
import { toast } from 'react-hot-toast';
import { exportCalendarScreenshot, exportCalendarToExcel } from '../../utils/export-calendar';
import { exportEventsToICS } from '@/lib/ics-export';

interface EventCalendarProps {
  events: CalendarEvent[];
  onUpdateEvent?: (eventId: string, newDate: Date) => Promise<void>;
  onCreateEvent?: (date: Date) => void;
  onEditEvent?: (event: CalendarEvent) => void;
  onDeleteEvent?: (eventId: string) => Promise<void>;
  onMonthChange?: (year: number, month: number) => void;
  readOnly?: boolean;
  isLoading?: boolean;
  title?: string;
}

interface EventCalendarContentProps extends Omit<EventCalendarProps, 'events'> {
  pendingDrop: { eventId: string; targetDate: Date } | null;
  showConfirmDialog: boolean;
  onConfirmDialogChange: (open: boolean) => void;
  selectedTypes: EventType[];
  onSelectedTypesChange: (types: EventType[]) => void;
  filteredEvents: CalendarEvent[];
  isLoading?: boolean;
  calendarRef: React.RefObject<HTMLDivElement | null>;
}

// This component must be INSIDE both CalendarProvider and DragDropProvider
function EventCalendarContent({ 
  onUpdateEvent, 
  onCreateEvent, 
  onEditEvent,
  onDeleteEvent,
  onMonthChange, 
  readOnly = false,
  isLoading = false,
  pendingDrop,
  showConfirmDialog,
  onConfirmDialogChange,
  selectedTypes,
  onSelectedTypesChange,
  filteredEvents,
  calendarRef,
  title = 'Event Calendar'
}: EventCalendarContentProps) {
  const { currentDate, selectedEvent, setSelectedEvent } = useCalendar();

  // Handle delete
  const handleDelete = useCallback(async (eventId: string) => {
    if (!onDeleteEvent) return;
    
    try {
      await onDeleteEvent(eventId);
      setSelectedEvent(null);
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('❌ Delete error:', error);
      toast.error('Failed to delete event');
    }
  }, [onDeleteEvent, setSelectedEvent]);

  // Notify parent when month changes
  useEffect(() => {
    if (onMonthChange) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      onMonthChange(year, month);
    }
  }, [currentDate, onMonthChange]);

  const confirmReschedule = useCallback(async (adjustedDate: Date) => {
    if (!pendingDrop || !onUpdateEvent) return;

    try {
      await onUpdateEvent(pendingDrop.eventId, adjustedDate);
      toast.success('Event rescheduled successfully');
      onConfirmDialogChange(false);
    } catch (error) {
      toast.error('Failed to reschedule event');
      console.error('❌ Reschedule error:', error);
    }
  }, [pendingDrop, onUpdateEvent, onConfirmDialogChange]);

  const handleExportPDF = useCallback(async () => {
    if (!calendarRef.current) {
      toast.error('Calendar not ready for export');
      return;
    }
    
    try {
      toast.loading('Generating PDF...', { id: 'pdf-export' });
      await exportCalendarScreenshot({
        element: calendarRef.current,
        month: currentDate,
        title
      });
      toast.success('PDF exported successfully', { id: 'pdf-export' });
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF', { id: 'pdf-export' });
    }
  }, [calendarRef, currentDate, title]);

  const handleExportExcel = useCallback(() => {
    try {
      exportCalendarToExcel({
        events: filteredEvents as Event[],
        month: currentDate,
        title
      });
      toast.success('Excel exported successfully');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export Excel');
    }
  }, [filteredEvents, currentDate, title]);

  const handleExportICS = useCallback(() => {
    try {
      exportEventsToICS(filteredEvents as Event[], title);
      toast.success('Calendar exported successfully');
    } catch (error) {
      console.error('ICS export error:', error);
      toast.error('Failed to export calendar');
    }
  }, [filteredEvents, title]);

  const eventBeingDragged = useMemo(() => {
    if (!pendingDrop) return null;
    return filteredEvents.find(e => e.id === pendingDrop.eventId) || null;
  }, [pendingDrop, filteredEvents]);

  return (
    <>
      <div className="flex flex-col h-full bg-background rounded-lg border shadow-sm">
        <CalendarHeader 
          selectedTypes={selectedTypes}
          onTypesChange={onSelectedTypesChange}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
          onExportICS={handleExportICS}
        />
        <div ref={calendarRef} className="flex-1 overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Loading events...</p>
              </div>
            </div>
          )}
          <CalendarBody onCreateEvent={onCreateEvent} />
        </div>
      </div>

      {/* Event Details Dialog */}
      <EventDetailsDialog
        event={selectedEvent}
        open={selectedEvent !== null}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
        onEdit={onEditEvent}
        onDelete={handleDelete}
        readOnly={readOnly}
      />

      {/* Drag and Drop Confirmation Dialog */}
      {!readOnly && pendingDrop && (
        <DnDConfirmationDialog
          open={showConfirmDialog}
          onOpenChange={onConfirmDialogChange}
          event={eventBeingDragged}
          newDate={pendingDrop.targetDate}
          onConfirm={confirmReschedule}
        />
      )}
    </>
  );
}

export function EventCalendar({ 
  events, 
  onUpdateEvent, 
  onCreateEvent, 
  onEditEvent,
  onDeleteEvent,
  onMonthChange, 
  readOnly = false,
  isLoading = false,
  title = 'Event Calendar'
}: EventCalendarProps) {
  const [pendingDrop, setPendingDrop] = useState<{ eventId: string; targetDate: Date } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<EventType[]>([]);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Filter events by selected types
  const filteredEvents = useMemo(() => {
    if (selectedTypes.length === 0) return events;
    return events.filter(event => selectedTypes.includes(event.type));
  }, [events, selectedTypes]);
  
  // Handle drop event from dnd-kit
  const handleEventDrop = useCallback((eventId: string, targetDate: Date) => {
    setPendingDrop({ eventId, targetDate });
    setShowConfirmDialog(true);
  }, []);

  const handleDropEvent = useCallback((date: Date) => {
    console.log('📦 Legacy drop callback:', date);
  }, []);

  return (
    <DragDropProvider onEventDrop={readOnly ? undefined : handleEventDrop}>
      <CalendarProvider events={filteredEvents} readOnly={readOnly} onDropEvent={handleDropEvent}>
        <EventCalendarContent 
          onUpdateEvent={onUpdateEvent}
          onCreateEvent={onCreateEvent}
          onEditEvent={onEditEvent}
          onDeleteEvent={onDeleteEvent}
          onMonthChange={onMonthChange}
          readOnly={readOnly}
          isLoading={isLoading}
          pendingDrop={pendingDrop}
          showConfirmDialog={showConfirmDialog}
          onConfirmDialogChange={setShowConfirmDialog}
          selectedTypes={selectedTypes}
          onSelectedTypesChange={setSelectedTypes}
          filteredEvents={filteredEvents}
          calendarRef={calendarRef}
          title={title}
        />
      </CalendarProvider>
    </DragDropProvider>
  );
}
