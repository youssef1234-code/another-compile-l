/**
 * Day View Component
 * Displays gym sessions for a single day in hourly slots
 */

import { useMemo } from 'react';
import { useCalendar } from '../calendar-context';
import { formatTime, eventOverlapsWithSlot } from '../helpers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { GYM_SESSION_TYPE_LABELS } from '@event-manager/shared';
import type { CalendarEvent } from '../types';
import { Calendar } from 'lucide-react';

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
    return events.filter(event => {
      if (!event.startDate) return false;
      const eventStart = new Date(event.startDate);
      return (
        eventStart.getFullYear() === currentDate.getFullYear() &&
        eventStart.getMonth() === currentDate.getMonth() &&
        eventStart.getDate() === currentDate.getDate()
      );
    });
  }, [events, currentDate]);

  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col h-full">
      {/* Day header */}
      <div className="p-4 border-b bg-muted/30 sticky top-0 z-10">
        <h2 className="text-lg font-semibold">{formattedDate}</h2>
        <p className="text-sm text-muted-foreground">{dayEvents.length} session{dayEvents.length !== 1 ? 's' : ''} scheduled</p>
      </div>

      {dayEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
          <Calendar className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No sessions scheduled</p>
          <p className="text-sm">No gym sessions for this day</p>
        </div>
      ) : (
        <ScrollArea className="flex-1 h-[600px]">
          <div className="relative">
            {timeSlots.map((hour) => (
              <div key={hour} className="flex border-b h-20">
                {/* Time label */}
                <div className="w-20 border-r p-2 text-sm text-muted-foreground text-right">
                  {formatTime(hour, 0)}
                </div>

                {/* Time slot */}
                <TimeSlot
                  hour={hour}
                  events={dayEvents}
                  onEventClick={setSelectedEvent}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

interface TimeSlotProps {
  hour: number;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

function TimeSlot({ hour, events, onEventClick }: TimeSlotProps) {
  // Find events that overlap with this time slot
  const slotEvents = useMemo(() => {
    return events.filter(event => {
      if (!event.startDate || !event.endDate) return false;
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return eventOverlapsWithSlot(eventStart, eventEnd, hour);
    });
  }, [events, hour]);

  return (
    <div className="relative flex-1 p-2">
      {slotEvents.map((event) => {
        if (!event.startDate || !event.endDate) return null;
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        const duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60); // minutes
        const height = Math.max((duration / 60) * 80, 60); // 80px per hour, min 60px

        return (
          <DayEventCard
            key={event.id}
            event={event}
            height={height}
            onEventClick={() => onEventClick(event)}
          />
        );
      })}
    </div>
  );
}

interface DayEventCardProps {
  event: CalendarEvent;
  height: number;
  onEventClick: () => void;
}

function DayEventCard({ event, height, onEventClick }: DayEventCardProps) {
  const sessionType = (event as any).sessionType || 'OTHER';
  const duration = (event as any).duration || 60;

  if (!event.startDate) return null;

  const startTime = formatTime(
    new Date(event.startDate).getHours(),
    new Date(event.startDate).getMinutes()
  );

  // Get color based on session type
  const getColorClass = (type: string) => {
    const colors: Record<string, string> = {
      YOGA: 'bg-purple-100 border-purple-400 text-purple-900',
      PILATES: 'bg-pink-100 border-pink-400 text-pink-900',
      AEROBICS: 'bg-orange-100 border-orange-400 text-orange-900',
      ZUMBA: 'bg-yellow-100 border-yellow-400 text-yellow-900',
      CROSS_CIRCUIT: 'bg-red-100 border-red-400 text-red-900',
      KICK_BOXING: 'bg-rose-100 border-rose-400 text-rose-900',
      CROSSFIT: 'bg-amber-100 border-amber-400 text-amber-900',
      CARDIO: 'bg-blue-100 border-blue-400 text-blue-900',
      STRENGTH: 'bg-slate-100 border-slate-400 text-slate-900',
      DANCE: 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-900',
      MARTIAL_ARTS: 'bg-gray-100 border-gray-400 text-gray-900',
      OTHER: 'bg-neutral-100 border-neutral-400 text-neutral-900',
    };
    return colors[type] || colors.OTHER;
  };

  return (
    <div
      onClick={onEventClick}
      style={{ height: `${height}px` }}
      className={cn(
        'mb-2 p-3 rounded-lg border-l-4 cursor-pointer transition-all shadow-sm hover:shadow-md',
        getColorClass(sessionType)
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="font-semibold text-sm">{startTime}</div>
          <h4 className="font-bold text-base mt-1">{event.name}</h4>
        </div>
        <div className="text-xs opacity-75 whitespace-nowrap ml-2">
          {duration} min
        </div>
      </div>

      <div className="text-sm font-medium opacity-90 mb-1">
        {GYM_SESSION_TYPE_LABELS[sessionType as keyof typeof GYM_SESSION_TYPE_LABELS]}
      </div>

      {event.capacity && (
        <div className="text-xs opacity-75">
          Capacity: {event.capacity} people
        </div>
      )}

      {event.location && (
        <div className="text-xs opacity-75 mt-1">
          📍 {event.location}
        </div>
      )}

      {event.description && height > 100 && (
        <div className="text-xs opacity-75 mt-2 line-clamp-2">
          {event.description}
        </div>
      )}
    </div>
  );
}
