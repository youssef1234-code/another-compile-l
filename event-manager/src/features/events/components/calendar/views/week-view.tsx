/**
 * Week View Component
 * Displays events in a weekly timeline format
 */

import { useMemo } from 'react';
import { useCalendar } from '../calendar-context';
import { getWeekDates } from '../helpers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@event-manager/shared';
import type { CalendarEvent } from '../types';

export function WeekView() {
  const { currentDate, events, setSelectedEvent } = useCalendar();

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  
  // Generate time slots (6 AM to 10 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(hour);
    }
    return slots;
  }, []);

  // Filter events for the current week
  const weekEvents = useMemo(() => {
    const weekStart = weekDates[0];
    const weekEnd = new Date(weekDates[6]);
    weekEnd.setHours(23, 59, 59, 999);

    return events.filter(event => {
      const eventDate = event.startDate ? new Date(event.startDate) : event.date ? new Date(event.date) : null;
      if (!eventDate) return false;
      return eventDate >= weekStart && eventDate <= weekEnd;
    });
  }, [events, weekDates]);

  return (
    <div className="flex flex-col h-full">
      {/* Week header */}
      <div className="flex border-b bg-muted/30 sticky top-0 z-10">
        <div className="w-16 border-r"></div>
        <div className="flex-1 grid grid-cols-7">
          {weekDates.map((date, index) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div
                key={index}
                className={cn(
                  'text-center py-3 border-r',
                  isToday && 'bg-primary/10'
                )}
              >
                <div className="text-xs text-muted-foreground">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={cn(
                  'text-lg font-semibold',
                  isToday && 'text-primary'
                )}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline grid */}
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

          {/* Day columns */}
          <div className="flex-1 grid grid-cols-7">
            {weekDates.map((date, dayIndex) => (
              <div key={dayIndex} className="border-r">
                {timeSlots.map((hour) => {
                  const dayEvents = weekEvents.filter(event => {
                    const eventDate = event.startDate ? new Date(event.startDate) : event.date ? new Date(event.date) : null;
                    if (!eventDate) return false;
                    return (
                      eventDate.toDateString() === date.toDateString() &&
                      eventDate.getHours() === hour
                    );
                  });

                  return (
                    <div
                      key={hour}
                      className="h-16 border-b p-1 hover:bg-muted/30 transition-colors"
                    >
                      {dayEvents.map((event) => (
                        <EventBadge
                          key={event.id}
                          event={event}
                          onClick={() => setSelectedEvent(event)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

interface EventBadgeProps {
  event: CalendarEvent;
  onClick: () => void;
}

function EventBadge({ event, onClick }: EventBadgeProps) {
  const colors = EVENT_TYPE_COLORS[event.type];
  const startTime = event.startDate ? new Date(event.startDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) : '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'px-2 py-1 rounded text-xs font-medium border cursor-pointer mb-1',
        colors.bg,
        colors.text,
        colors.border
      )}
      title={`${event.name} - ${EVENT_TYPE_LABELS[event.type]}`}
    >
      <span className="font-semibold">{startTime}</span> {event.name}
    </div>
  );
}
