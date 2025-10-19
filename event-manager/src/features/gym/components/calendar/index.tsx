/**
 * Gym Calendar Component
 * Main calendar wrapper for gym schedule with drag-drop support
 */


import { useState, useCallback, useMemo, useEffect } from 'react';
import { CalendarProvider, useCalendar } from './calendar-context';
import { DragDropProvider } from './dnd/dnd-context';
import { CalendarHeader } from './calendar-header';
import { CalendarBody } from './calendar-body';
import { EventDetailsDialog } from './dialogs/event-details-dialog';
import { DnDConfirmationDialog } from './dnd/dnd-confirmation-dialog';
import type { CalendarEvent } from './types';
import type { Event } from '@event-manager/shared';
import { toast } from 'react-hot-toast';
import { exportCalendarToPDF } from '../../utils/export-calendar-pdf';

interface GymCalendarProps {
  events: CalendarEvent[];
  onUpdateEvent?: (eventId: string, newDate: Date) => Promise<void>;
  onCreateSession?: (date: Date) => void;
  onEditSession?: (event: CalendarEvent) => void;
  onDeleteSession?: (eventId: string) => Promise<void>;
  onMonthChange?: (year: number, month: number) => void;
  readOnly?: boolean;
}

interface GymCalendarContentProps extends Omit<GymCalendarProps, 'events'> {
  pendingDrop: { eventId: string; targetDate: Date } | null;
  showConfirmDialog: boolean;
  onConfirmDialogChange: (open: boolean) => void;
  selectedTypes: string[];
  onSelectedTypesChange: (types: string[]) => void;
  filteredEvents: CalendarEvent[];
}

// This component must be INSIDE both CalendarProvider and DragDropProvider
function GymCalendarContent({ 
  onUpdateEvent, 
  onCreateSession, 
  onEditSession,
  onDeleteSession,
  onMonthChange, 
  readOnly = false,
  pendingDrop,
  showConfirmDialog,
  onConfirmDialogChange,
  selectedTypes,
  onSelectedTypesChange,
  filteredEvents
}: GymCalendarContentProps) {
  // Now these hooks are safe because we're inside the providers
  const { currentDate, selectedEvent, setSelectedEvent } = useCalendar();

  // Handle delete with optimistic update
  const handleDelete = useCallback(async (eventId: string) => {
    if (!onDeleteSession) return;
    
    try {
      await onDeleteSession(eventId);
      toast.success('Session deleted successfully');
      setSelectedEvent(null);
    } catch (error) {
      console.error('❌ Delete error:', error);
      toast.error('Failed to delete session');
    }
  }, [onDeleteSession, setSelectedEvent]);

  // Notify parent when month changes
  useEffect(() => {
    if (onMonthChange) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      onMonthChange(year, month);
    }
  }, [currentDate, onMonthChange]);

  const confirmReschedule = useCallback(async () => {
    if (!pendingDrop || !onUpdateEvent) return;

    try {
      console.log('🚀 Rescheduling:', { eventId: pendingDrop.eventId, newDate: pendingDrop.targetDate });
      await onUpdateEvent(pendingDrop.eventId, pendingDrop.targetDate);
      toast.success('Session rescheduled successfully');
      onConfirmDialogChange(false);
    } catch (error) {
      toast.error('Failed to reschedule session');
      console.error('❌ Reschedule error:', error);
    }
  }, [pendingDrop, onUpdateEvent, onConfirmDialogChange]);

  const handleExportPDF = useCallback(() => {
    try {
      exportCalendarToPDF({
        events: filteredEvents as Event[],
        month: currentDate,
        title: 'Gym Schedule'
      });
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  }, [filteredEvents, currentDate]);

  // Find the event being dragged from filtered events
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
        />
        <div className="flex-1 overflow-hidden">
          <CalendarBody onCreateSession={onCreateSession} />
        </div>
      </div>

      {/* Event Details Dialog */}
      <EventDetailsDialog
        event={selectedEvent}
        open={selectedEvent !== null}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
        onEdit={onEditSession}
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

export function GymCalendar({ 
  events, 
  onUpdateEvent, 
  onCreateSession, 
  onEditSession,
  onDeleteSession,
  onMonthChange, 
  readOnly = false 
}: GymCalendarProps) {
  const [pendingDrop, setPendingDrop] = useState<{ eventId: string; targetDate: Date } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  // Filter events by selected types at the top level
  const filteredEvents = useMemo(() => {
    if (selectedTypes.length === 0) return events;
    return events.filter(event => 
      event.sessionType && selectedTypes.includes(event.sessionType)
    );
  }, [events, selectedTypes]);
  
  // Handle drop event from dnd-kit
  const handleEventDrop = useCallback((eventId: string, targetDate: Date) => {
    console.log('📦 Event drop:', { eventId, targetDate });
    setPendingDrop({ eventId, targetDate });
    setShowConfirmDialog(true);
  }, []);

  // Dummy callback for CalendarProvider (legacy support)
  const handleDropEvent = useCallback((date: Date) => {
    console.log('📦 Legacy drop callback:', date);
  }, []);

  return (
    <DragDropProvider onEventDrop={readOnly ? undefined : handleEventDrop}>
      <CalendarProvider events={filteredEvents} readOnly={readOnly} onDropEvent={handleDropEvent}>
        <GymCalendarContent 
          onUpdateEvent={onUpdateEvent}
          onCreateSession={onCreateSession}
          onEditSession={onEditSession}
          onDeleteSession={onDeleteSession}
          onMonthChange={onMonthChange}
          readOnly={readOnly}
          pendingDrop={pendingDrop}
          showConfirmDialog={showConfirmDialog}
          onConfirmDialogChange={setShowConfirmDialog}
          selectedTypes={selectedTypes}
          onSelectedTypesChange={setSelectedTypes}
          filteredEvents={filteredEvents}
        />
      </CalendarProvider>
    </DragDropProvider>
  );
}
