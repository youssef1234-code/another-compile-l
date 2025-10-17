/**
 * Gym Calendar Types
 * Based on full-calendar implementation
 */

import type { Event, GymSessionType } from '@event-manager/shared';

export type CalendarView = 'day' | 'week' | 'month' | 'year' | 'agenda';

export interface CalendarEvent extends Event {
  // Gym session specific fields (stored in Event but not typed)
  sessionType?: string;
  duration?: number;
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

// Session type to color mapping
export const SESSION_TYPE_COLORS: Record<GymSessionType, string> = {
  YOGA: 'purple',
  PILATES: 'pink',
  AEROBICS: 'orange',
  ZUMBA: 'yellow',
  CROSS_CIRCUIT: 'red',
  KICK_BOXING: 'rose',
  CROSSFIT: 'amber',
  CARDIO: 'blue',
  STRENGTH: 'slate',
  DANCE: 'fuchsia',
  MARTIAL_ARTS: 'gray',
  OTHER: 'neutral',
};
