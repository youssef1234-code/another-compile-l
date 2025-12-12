/**
 * Calendar Body Component
 * Renders the appropriate view based on current calendar view
 */

import { useCalendar } from './calendar-context';
import { MonthView } from './views/month-view';
import { AgendaView } from './views/agenda-view';
import { WeekView } from './views/week-view';
import { DayView } from './views/day-view';

interface CalendarBodyProps {
  onCreateEvent?: (date: Date) => void;
}

export function CalendarBody({ onCreateEvent }: CalendarBodyProps) {
  const { view } = useCalendar();

  switch (view) {
    case 'month':
      return <MonthView onCreateEvent={onCreateEvent} />;
    case 'week':
      return <WeekView />;
    case 'day':
      return <DayView />;
    case 'agenda':
      return <AgendaView />;
    default:
      return <MonthView onCreateEvent={onCreateEvent} />;
  }
}
