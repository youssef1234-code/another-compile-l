/**
 * Day View Component
 * Displays events for a single day in timeline format
 */

import { useMemo } from 'react';
import { useCalendar } from '../calendar-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@event-manager/shared';
import type { CalendarEvent } from '../types';
import { format } from 'date-fns';

export function DayView() {
  const { currentDate, events, setSelectedEvent } = useCalendar();

  // Generate time slots (6 AM to 10 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(hour);
    }
    return slots;
  }, []);

  // Filter events for the current day
  const dayEvents = useMemo(() => {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter(event => {
      const eventDate = event.startDate ? new Date(event.startDate) : event.date ? new Date(event.date) : null;
      if (!eventDate) return false;
      return eventDate >= dayStart && eventDate <= dayEnd;
    });
  }, [events, currentDate]);

  const isToday = currentDate.toDateString() === new Date().toDateString();

  return (
    <div className="flex flex-col h-full">
      {/* Day header */}
      <div className={cn(
        'border-b bg-muted/30 py-4 px-6',
        isToday && 'bg-primary/5'
      )}>
        <div className="text-sm text-muted-foreground">
          {format(currentDate, 'EEEE')}
        </div>
        <div className={cn(
          'text-3xl font-bold',
          isToday && 'text-primary'
        )}>
          {format(currentDate, 'MMMM d, yyyy')}
        </div>
        {dayEvents.length > 0 && (
          <div className="text-sm text-muted-foreground mt-1">
            {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Timeline */}
      <ScrollArea className="flex-1">
        <div className="flex">
          {/* Time labels */}
          <div className="w-16 border-r">
            {timeSlots.map((hour) => (
              <div key={hour} className="h-16 border-b px-2 py-1 text-xs text-muted-foreground">
                {new Date(0, 0, 0, hour, 0).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}
              </div>
            ))}
          </div>

          {/* Events column */}
          <div className="flex-1">
            {timeSlots.map((hour) => {
              const hourEvents = dayEvents.filter(event => {
                const eventDate = event.startDate ? new Date(event.startDate) : event.date ? new Date(event.date) : null;
                if (!eventDate) return false;
                return eventDate.getHours() === hour;
              });

              return (
                <div
                  key={hour}
                  className="h-20 border-b p-2 hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-1">
                    {hourEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => setSelectedEvent(event)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

interface EventCardProps {
  event: CalendarEvent;
  onClick: () => void;
}

function EventCard({ event, onClick }: EventCardProps) {
  const colors = EVENT_TYPE_COLORS[event.type];
  const startTime = event.startDate ? new Date(event.startDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) : '';
  const endTime = event.endDate ? new Date(event.endDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) : '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all',
        colors.bg,
        colors.text,
        colors.border
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{event.name}</div>
          <div className="text-xs mt-1 opacity-75">
            {EVENT_TYPE_LABELS[event.type]}
          </div>
        </div>
        <div className="text-xs font-medium whitespace-nowrap">
          {startTime}
          {endTime && ` - ${endTime}`}
        </div>
      </div>
      {event.locationDetails && (
        <div className="text-xs mt-2 opacity-75 truncate">
          📍 {event.locationDetails}
        </div>
      )}
    </div>
  );
}
