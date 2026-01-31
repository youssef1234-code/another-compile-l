/**
 * Event Calendar Types
 * Comprehensive calendar for all event types (except gym sessions)
 */

import type { Event } from '../../../../shared';

export type CalendarView = 'day' | 'week' | 'month' | 'agenda';

export interface CalendarEvent extends Event {
  // Any additional calendar-specific properties
  isRegistered?: boolean;
  isFavorite?: boolean;
}

export interface CalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
  events: CalendarEvent[];
}

export interface CalendarContextType {
  currentDate: Date;
  view: CalendarView;
  events: CalendarEvent[];
  selectedEvent: CalendarEvent | null;
  setCurrentDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
  setSelectedEvent: (event: CalendarEvent | null) => void;
  goToToday: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  onDropEvent?: (date: Date) => void;
  readOnly?: boolean;
}
