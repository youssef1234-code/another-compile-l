/**
 * Month View Component
 * Main calendar grid view for all events
 */

import { useMemo } from 'react';
import { useCalendar } from '../calendar-context';
import { getCalendarCells, getEventsForDate, getWeekDays, isToday } from '../helpers';
import { cn } from '@/lib/utils';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@event-manager/shared';
import type { CalendarEvent } from '../types';
import { DroppableArea } from '../dnd/droppable-area';
import { DraggableEvent } from '../dnd/draggable-event';
import { Plus } from 'lucide-react';

export function MonthView({ onCreateEvent }: { onCreateEvent?: (date: Date) => void }) {
  const { currentDate, events, setSelectedEvent, readOnly } = useCalendar();

  const cells = useMemo(() => {
    const calendarCells = getCalendarCells(currentDate.getFullYear(), currentDate.getMonth());
    
    // Attach events to each cell
    return calendarCells.map(cell => ({
      ...cell,
      events: getEventsForDate(events, cell.date),
    }));
  }, [currentDate, events]);

  const weekDays = getWeekDays();

  return (
    <div className="flex flex-col h-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {weekDays.map((day) => (
          <div
            key={day}
            className="px-2 py-3 text-center text-sm font-semibold text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr border-l border-t">
        {cells.map((cell, index) => (
          <DayCell
            key={index}
            cell={cell}
            onEventClick={setSelectedEvent}
            onCreateEvent={onCreateEvent}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}

interface DayCellProps {
  cell: {
    day: number;
    currentMonth: boolean;
    date: Date;
    events: CalendarEvent[];
  };
  onEventClick: (event: CalendarEvent) => void;
  onCreateEvent?: (date: Date) => void;
  readOnly?: boolean;
}

function DayCell({ cell, onEventClick, onCreateEvent, readOnly }: DayCellProps) {
  const today = isToday(cell.date);
  const hasEvents = cell.events.length > 0;
  const maxDisplayEvents = 3;
  const displayedEvents = cell.events.slice(0, maxDisplayEvents);
  const remainingCount = cell.events.length - maxDisplayEvents;

  return (
    <DroppableArea
      id={`day-${cell.date.toISOString()}`}
      date={cell.date}
      disabled={readOnly}
      className={cn(
        'group min-h-[120px] border-r border-b p-2 overflow-hidden',
        'hover:bg-accent/5 transition-colors',
        !cell.currentMonth && 'bg-muted/20'
      )}
    >
      <div className="flex flex-col h-full gap-1">
        {/* Day number with action button */}
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              'text-sm font-medium',
              today && 'flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground',
              !cell.currentMonth && 'text-muted-foreground',
              cell.currentMonth && !today && 'text-foreground'
            )}
          >
            {cell.day}
          </span>
          
          {/* Create event button - visible on cell hover */}
          {!readOnly && onCreateEvent && cell.currentMonth && (
            <button
              onClick={() => onCreateEvent(cell.date)}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              title="Create event on this day"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Events list */}
        {hasEvents && (
          <div className="space-y-1 flex-1 overflow-hidden">
            {displayedEvents.map((event) => (
              <EventBadge
                key={event.id}
                event={event}
                onClick={() => onEventClick(event)}
                readOnly={readOnly}
              />
            ))}
            {remainingCount > 0 && (
              <div className="text-xs text-muted-foreground font-medium px-1 py-0.5 hover:text-foreground cursor-pointer">
                +{remainingCount} more
              </div>
            )}
          </div>
        )}
      </div>
    </DroppableArea>
  );
}

interface EventBadgeProps {
  event: CalendarEvent;
  onClick: () => void;
  readOnly?: boolean;
}

function EventBadge({ event, onClick, readOnly }: EventBadgeProps) {
  const colors = EVENT_TYPE_COLORS[event.type];
  const label = EVENT_TYPE_LABELS[event.type];
  const startTime = event.startDate ? new Date(event.startDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) : event.date ? new Date(event.date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) : '';
  
  const badge = (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'px-2 py-1 rounded text-xs font-medium transition-all truncate border',
        colors.bg,
        colors.text,
        colors.border
      )}
      title={`${event.name} - ${label}`}
    >
      {startTime && <span className="font-semibold">{startTime}</span>} {event.name}
    </div>
  );

  if (readOnly) {
    return badge;
  }

  return (
    <DraggableEvent event={event} disabled={readOnly}>
      {badge}
    </DraggableEvent>
  );
}
