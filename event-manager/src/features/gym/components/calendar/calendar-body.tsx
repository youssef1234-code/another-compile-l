/**
 * Calendar Body Component
 * Orchestrates different calendar views
 */

import { useCalendar } from './calendar-context';
import { MonthView } from './views/month-view';
import { WeekView } from './views/week-view';
import { DayView } from './views/day-view';
import { AgendaView } from './views/agenda-view';

interface CalendarBodyProps {
  onCreateSession?: (date: Date) => void;
}

export function CalendarBody({ onCreateSession }: CalendarBodyProps) {
  const { view } = useCalendar();

  switch (view) {
    case 'month':
      return <MonthView onCreateSession={onCreateSession} />;
    case 'week':
      return <WeekView />;
    case 'day':
      return <DayView />;
    case 'agenda':
      return <AgendaView />;
    default:
      return <MonthView onCreateSession={onCreateSession} />;
  }
}
