/**
 * Agenda View Component
 * List-based view of events
 */

import { useMemo, useState } from 'react';
import { format, parseISO, isSameMonth } from 'date-fns';
import { useCalendar } from '../calendar-context';
import { cn } from '@/lib/utils';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '../../../../../shared';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { CalendarEvent } from '../types';
import { Clock, MapPin, Users, DollarSign, Calendar } from 'lucide-react';
import { sortEventsByDate } from '../helpers';

export function AgendaView() {
  const { currentDate, events, setSelectedEvent } = useCalendar();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = events.filter(event => {
      const eventDate = new Date(event.startDate || event.date);
      return isSameMonth(eventDate, currentDate);
    });

    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return sortEventsByDate(filtered);
  }, [events, currentDate, searchQuery]);

  // Group by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach(event => {
      const dateKey = format(new Date(event.startDate || event.date), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });
    return groups;
  }, [filteredEvents]);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b">
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Events List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {Object.keys(groupedEvents).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No events found</p>
              <p className="text-sm">
                {searchQuery
                  ? 'Try a different search term'
                  : 'No events scheduled for this month'}
              </p>
            </div>
          ) : (
            Object.entries(groupedEvents).map(([dateKey, dayEvents]) => (
              <div key={dateKey}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-background py-2">
                  {format(parseISO(dateKey), 'EEEE, MMMM d, yyyy')}
                </h3>
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
  const colors = EVENT_TYPE_COLORS[event.type];
  const label = EVENT_TYPE_LABELS[event.type];
  const startDate = new Date(event.startDate || event.date);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const isFree = event.price === 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border cursor-pointer transition-all',
        'hover:shadow-md hover:scale-[1.01]',
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          {/* Title and Type */}
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', colors.dot)} />
            <h4 className={cn('font-semibold', colors.text)}>{event.name}</h4>
            <Badge variant="secondary" className="text-xs">
              {label}
            </Badge>
            {isFree && (
              <Badge variant="outline" className="text-xs">Free</Badge>
            )}
          </div>

          {/* Time */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>
                {format(startDate, 'h:mm a')}
                {endDate && ` - ${format(endDate, 'h:mm a')}`}
              </span>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {event.description}
            </p>
          )}

          {/* Capacity and Price */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {event.capacity && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{event.capacity} spots</span>
              </div>
            )}
            {!isFree && event.price && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                <span>{event.price} EGP</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
