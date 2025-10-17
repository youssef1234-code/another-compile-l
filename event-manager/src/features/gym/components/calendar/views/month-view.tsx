/**
 * Month View Component
 * Displays calendar in monthly grid format with events
 * Supports drag and drop for rescheduling
 */

import { useMemo, useState } from 'react';
import { useCalendar } from '../calendar-context';
import { getCalendarCells, getEventsForDate, getWeekDays, isToday } from '../helpers';
import { cn } from '@/lib/utils';
import { GYM_SESSION_TYPE_LABELS } from '@event-manager/shared';
import type { CalendarEvent } from '../types';
import { DroppableArea } from '../dnd/droppable-area';
import { DraggableEvent } from '../dnd/draggable-event';
import { Plus } from 'lucide-react';

export function MonthView({ onCreateSession }: { onCreateSession?: (date: Date) => void }) {
  const { currentDate, events, setSelectedEvent} = useCalendar();

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
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {cells.map((cell, index) => (
          <DayCell
            key={index}
            cell={cell}
            onEventClick={setSelectedEvent}
            onCreateSession={onCreateSession}
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
  onCreateSession?: (date: Date) => void;
}

function DayCell({ cell, onEventClick, onCreateSession }: DayCellProps) {
  const { readOnly } = useCalendar();
  const [isHovered, setIsHovered] = useState(false);
  const today = isToday(cell.date);
  const hasEvents = cell.events.length > 0;

  // Limit displayed events (show max 3, then "+X more")
  const displayedEvents = cell.events.slice(0, 3);
  const remainingCount = cell.events.length - 3;

  return (
    <DroppableArea
      date={cell.date}
      disabled={readOnly}
      className={cn(
        'border-r border-b p-2 min-h-[120px] relative overflow-hidden transition-all duration-200 group',
        !cell.currentMonth && 'bg-muted/20 text-muted-foreground',
        cell.currentMonth && 'hover:bg-muted/30',
        today && 'bg-primary/5 ring-2 ring-primary ring-inset'
      )}
    >
      <div 
        className="relative h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Day number */}
        <div className="flex items-center justify-between mb-1">
          <div
            className={cn(
              'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
              today && 'bg-primary text-primary-foreground',
              !today && cell.currentMonth && 'text-foreground',
              !today && !cell.currentMonth && 'text-muted-foreground'
            )}
          >
            {cell.day}
          </div>
          
          {/* Add Session Button - Shows on hover */}
          {!readOnly && onCreateSession && cell.currentMonth && isHovered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateSession(cell.date);
              }}
              className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
              title="Create session on this day"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Events list */}
        {hasEvents && (
          <div className="space-y-1">
            {displayedEvents.map((event) => (
              <EventBadge
                key={event.id}
                event={event}
                onClick={() => onEventClick(event)}
                readOnly={readOnly}
              />
            ))}
            {remainingCount > 0 && (
              <div className="text-xs text-muted-foreground font-medium px-1 py-0.5">
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

function EventBadge({ event, onClick, readOnly = false }: EventBadgeProps) {
  const sessionType = event.sessionType || 'OTHER';
  const startTime = event.startDate ? new Date(event.startDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) : '';

  // Get color based on session type using shared constants
  const getColorClass = (type: string) => {
    const colors: Record<string, string> = {
      YOGA: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800/40 border-purple-300 dark:border-purple-700',
      PILATES: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-800/40 border-pink-300 dark:border-pink-700',
      AEROBICS: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-800/40 border-orange-300 dark:border-orange-700',
      ZUMBA: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800/40 border-yellow-300 dark:border-yellow-700',
      CROSS_CIRCUIT: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/40 border-red-300 dark:border-red-700',
      KICK_BOXING: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-800/40 border-rose-300 dark:border-rose-700',
      CROSSFIT: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/40 border-amber-300 dark:border-amber-700',
      CARDIO: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/40 border-blue-300 dark:border-blue-700',
      STRENGTH: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/40 border-slate-300 dark:border-slate-700',
      DANCE: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400 hover:bg-fuchsia-200 dark:hover:bg-fuchsia-800/40 border-fuchsia-300 dark:border-fuchsia-700',
      MARTIAL_ARTS: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800/40 border-gray-300 dark:border-gray-700',
      OTHER: 'bg-neutral-100 dark:bg-neutral-900/30 text-neutral-700 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800/40 border-neutral-300 dark:border-neutral-700',
    };
    return colors[type] || colors.OTHER;
  };

  const badge = (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'px-2 py-1 rounded text-xs font-medium transition-all truncate border',
        getColorClass(sessionType)
      )}
      title={`${event.name} - ${GYM_SESSION_TYPE_LABELS[sessionType as keyof typeof GYM_SESSION_TYPE_LABELS] || sessionType}`}
    >
      <span className="font-semibold">{startTime}</span> {event.name}
    </div>
  );

  // Wrap in DraggableEvent if not readOnly
  if (readOnly) {
    return badge;
  }

  return (
    <DraggableEvent event={event} disabled={readOnly}>
      {badge}
    </DraggableEvent>
  );
}
