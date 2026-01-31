/**
 * Agenda View Component
 * List-based view of gym sessions
 */

import { useMemo, useState } from 'react';
import { format, parseISO, isSameMonth } from 'date-fns';
import { useCalendar } from '../calendar-context';
import { cn } from '@/lib/utils';
import { GYM_SESSION_TYPE_LABELS, GYM_SESSION_TYPE_COLORS } from '../../../../../shared';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CalendarEvent } from '../types';
import { Clock, MapPin, Users } from 'lucide-react';

export function AgendaView() {
  const { currentDate, events, setSelectedEvent } = useCalendar();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter events for the current month
  const monthEvents = useMemo(() => {
    return events.filter(event => {
      if (!event.startDate) return false;
      const startDate = typeof event.startDate === 'string' ? parseISO(event.startDate) : event.startDate;
      return isSameMonth(startDate, currentDate);
    });
  }, [events, currentDate]);

  // Search and group events by date
  const groupedEvents = useMemo(() => {
    const filtered = monthEvents.filter(event =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groups: Record<string, CalendarEvent[]> = {};
    filtered.forEach(event => {
      if (!event.startDate) return;
      const startDate = typeof event.startDate === 'string' ? parseISO(event.startDate) : event.startDate;
      const dateKey = format(startDate, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });

    // Sort by date
    return Object.entries(groups).sort((a, b) => 
      new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );
  }, [monthEvents, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-4 border-b">
        <Input
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Events list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {groupedEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No sessions found
            </div>
          ) : (
            groupedEvents.map(([date, dayEvents]) => (
              <div key={date} className="space-y-3">
                {/* Date header */}
                <h3 className="font-semibold text-sm text-muted-foreground sticky top-0 bg-background py-2">
                  {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                </h3>

                {/* Events for this date */}
                <div className="space-y-2">
                  {dayEvents.map(event => (
                    <AgendaEventCard
                      key={event.id}
                      event={event}
                      onClick={() => setSelectedEvent(event)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface AgendaEventCardProps {
  event: CalendarEvent;
  onClick: () => void;
}

function AgendaEventCard({ event, onClick }: AgendaEventCardProps) {
  const sessionType = (event.sessionType || 'OTHER') as string;
  
  if (!event.startDate || !event.endDate) return null;
  
  const startDate = typeof event.startDate === 'string' ? parseISO(event.startDate) : event.startDate;
  const endDate = typeof event.endDate === 'string' ? parseISO(event.endDate) : event.endDate;
  const startTime = format(startDate, 'h:mm a');
  const endTime = format(endDate, 'h:mm a');

  // Get shared colors for session type
  const colors = GYM_SESSION_TYPE_COLORS[sessionType as keyof typeof GYM_SESSION_TYPE_COLORS] || GYM_SESSION_TYPE_COLORS.OTHER;
  
  // Get color based on session type with left border indicator (green if registered)
  const getColorClass = (type: string, isRegistered?: boolean) => {
    // Green color for registered sessions
    if (isRegistered) {
      return 'border-l-green-500 border-l-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 ring-2 ring-green-500/30';
    }
    
    const colorMap: Record<string, string> = {
      YOGA: 'border-l-purple-500 border-l-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30',
      PILATES: 'border-l-pink-500 border-l-4 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30',
      AEROBICS: 'border-l-orange-500 border-l-4 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30',
      ZUMBA: 'border-l-yellow-500 border-l-4 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
      CROSS_CIRCUIT: 'border-l-red-500 border-l-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30',
      KICK_BOXING: 'border-l-rose-500 border-l-4 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30',
      CROSSFIT: 'border-l-amber-500 border-l-4 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30',
      CARDIO: 'border-l-blue-500 border-l-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30',
      STRENGTH: 'border-l-slate-500 border-l-4 bg-slate-50 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-900/30',
      DANCE: 'border-l-fuchsia-500 border-l-4 bg-fuchsia-50 dark:bg-fuchsia-900/20 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30',
      MARTIAL_ARTS: 'border-l-gray-500 border-l-4 bg-gray-50 dark:bg-gray-900/20 hover:bg-gray-100 dark:hover:bg-gray-900/30',
      OTHER: 'border-l-neutral-500 border-l-4 bg-neutral-50 dark:bg-neutral-900/20 hover:bg-neutral-100 dark:hover:bg-neutral-900/30',
    };
    return colorMap[type] || colorMap.OTHER;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'border rounded-lg p-4 cursor-pointer transition-all',
        getColorClass(sessionType, event.isRegistered)
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Event info */}
        <div className="flex-1 space-y-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground">{event.name}</h4>
              {event.isRegistered && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  ✓ Registered
                </span>
              )}
              <div className={cn('w-2 h-2 rounded-full', colors.bg.replace('100', '500'))} />
            </div>
            <div className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium mt-1', colors.bg, colors.text)}>
              {GYM_SESSION_TYPE_LABELS[sessionType as keyof typeof GYM_SESSION_TYPE_LABELS] || sessionType}
            </div>
          </div>

          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {event.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{startTime} - {endTime}</span>
            </div>

            {event.capacity && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{event.capacity} spots</span>
              </div>
            )}

            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Time badge */}
        <div className="text-right shrink-0">
          <div className="text-sm font-medium">{startTime}</div>
          <div className="text-xs text-muted-foreground">
            {event.duration ? `${event.duration} min` : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
