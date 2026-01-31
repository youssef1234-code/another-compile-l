/**
 * Week View Component
 * Displays gym sessions in a weekly timeline format
 */


import { useMemo } from 'react';
import { useCalendar } from '../calendar-context';
import { getWeekDates, formatTime, eventOverlapsWithSlot } from '../helpers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { GYM_SESSION_TYPE_LABELS } from '../../../../../shared';
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
      if (!event.startDate) return false;
      const eventStart = new Date(event.startDate);
      return eventStart >= weekStart && eventStart <= weekEnd;
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
                  'p-2 text-center border-r last:border-r-0',
                  isToday && 'bg-primary/10'
                )}
              >
                <div className="text-xs text-muted-foreground">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div
                  className={cn(
                    'text-lg font-semibold',
                    isToday && 'text-primary'
                  )}
                >
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline grid */}
      <ScrollArea className="flex-1 h-[600px]">
        <div className="relative">
          {timeSlots.map((hour) => (
            <div key={hour} className="flex border-b h-20">
              {/* Time label */}
              <div className="w-16 border-r p-2 text-xs text-muted-foreground text-right">
                {formatTime(hour, 0)}
              </div>

              {/* Day columns */}
              <div className="flex-1 grid grid-cols-7">
                {weekDates.map((date, dayIndex) => (
                  <DaySlot
                    key={dayIndex}
                    date={date}
                    hour={hour}
                    events={weekEvents}
                    onEventClick={setSelectedEvent}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface DaySlotProps {
  date: Date;
  hour: number;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

function DaySlot({ date, hour, events, onEventClick }: DaySlotProps) {
  // Find events that overlap with this time slot
  const slotEvents = useMemo(() => {
    return events.filter(event => {
      if (!event.startDate || !event.endDate) return false;
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      // Check if event is on this day
      if (
        eventStart.getFullYear() !== date.getFullYear() ||
        eventStart.getMonth() !== date.getMonth() ||
        eventStart.getDate() !== date.getDate()
      ) {
        return false;
      }

      // Check if event overlaps with this hour slot
      return eventOverlapsWithSlot(eventStart, eventEnd, hour);
    });
  }, [events, date, hour]);

  return (
    <div className="relative border-r last:border-r-0 p-1 min-h-[80px]">
      {slotEvents.map((event) => {
        if (!event.startDate || !event.endDate) return null;
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        const duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60); // minutes
        const height = Math.max((duration / 60) * 80, 40); // 80px per hour, min 40px
        
        return (
          <WeekEventCard
            key={event.id}
            event={event}
            height={height}
            onClick={() => onEventClick(event)}
          />
        );
      })}
    </div>
  );
}

interface WeekEventCardProps {
  event: CalendarEvent;
  height: number;
  onClick: () => void;
}

function WeekEventCard({ event, height, onClick }: WeekEventCardProps) {
  const sessionType = event.sessionType || 'OTHER';
  
  if (!event.startDate) return null;
  
  const startTime = formatTime(
    new Date(event.startDate).getHours(),
    new Date(event.startDate).getMinutes()
  );

  // Get color based on session type (green if registered)
  const getColorClass = (type: string, isRegistered?: boolean) => {
    // Green color for registered sessions
    if (isRegistered) {
      return 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300 ring-2 ring-green-500/30';
    }
    
    const colors: Record<string, string> = {
      YOGA: 'bg-purple-100 border-purple-400 text-purple-800 dark:bg-purple-900/30 dark:border-purple-600 dark:text-purple-300',
      PILATES: 'bg-pink-100 border-pink-400 text-pink-800 dark:bg-pink-900/30 dark:border-pink-600 dark:text-pink-300',
      AEROBICS: 'bg-orange-100 border-orange-400 text-orange-800 dark:bg-orange-900/30 dark:border-orange-600 dark:text-orange-300',
      ZUMBA: 'bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-300',
      CROSS_CIRCUIT: 'bg-red-100 border-red-400 text-red-800 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300',
      KICK_BOXING: 'bg-rose-100 border-rose-400 text-rose-800 dark:bg-rose-900/30 dark:border-rose-600 dark:text-rose-300',
      CROSSFIT: 'bg-amber-100 border-amber-400 text-amber-800 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300',
      CARDIO: 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300',
      STRENGTH: 'bg-slate-100 border-slate-400 text-slate-800 dark:bg-slate-900/30 dark:border-slate-600 dark:text-slate-300',
      DANCE: 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:border-fuchsia-600 dark:text-fuchsia-300',
      MARTIAL_ARTS: 'bg-gray-100 border-gray-400 text-gray-800 dark:bg-gray-900/30 dark:border-gray-600 dark:text-gray-300',
      OTHER: 'bg-neutral-100 border-neutral-400 text-neutral-800 dark:bg-neutral-900/30 dark:border-neutral-600 dark:text-neutral-300',
    };
    return colors[type] || colors.OTHER;
  };

  return (
    <div
      onClick={onClick}
      style={{ height: `${height}px` }}
      className={cn(
        'absolute inset-x-1 rounded border-l-4 p-1 cursor-pointer overflow-hidden',
        'hover:shadow-md transition-shadow text-xs',
        getColorClass(sessionType, event.isRegistered)
      )}
    >
      <div className="font-semibold truncate">{startTime}</div>
      <div className="truncate">{event.name}</div>
      <div className="text-[10px] opacity-75 truncate">
        {event.isRegistered ? '✓ Registered - ' : ''}{GYM_SESSION_TYPE_LABELS[sessionType as keyof typeof GYM_SESSION_TYPE_LABELS]}
      </div>
    </div>
  );
}
