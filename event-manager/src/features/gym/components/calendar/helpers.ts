/**
 * Calendar Helper Functions
 */

import type { CalendarCell, CalendarEvent } from './types';

/**
 * Get calendar cells for a given month
 */
export function getCalendarCells(year: number, month: number): CalendarCell[] {
  const cells: CalendarCell[] = [];
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    cells.push({
      day,
      currentMonth: false,
      date: new Date(year, month - 1, day),
      events: [],
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      day,
      currentMonth: true,
      date: new Date(year, month, day),
      events: [],
    });
  }

  // Next month days to fill the grid
  const remainingCells = 42 - cells.length; // 6 rows * 7 days
  for (let day = 1; day <= remainingCells; day++) {
    cells.push({
      day,
      currentMonth: false,
      date: new Date(year, month + 1, day),
      events: [],
    });
  }

  return cells;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

/**
 * Filter events for a specific date
 */
export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((event) => {
    if (!event.startDate) return false;
    const eventStart = new Date(event.startDate);
    const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
    
    // Check if date falls within event start and end
    return date >= new Date(eventStart.setHours(0, 0, 0, 0)) && 
           date <= new Date(eventEnd.setHours(23, 59, 59, 999));
  });
}

/**
 * Get week days starting from Sunday
 */
export function getWeekDays(): string[] {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

/**
 * Format month and year for display
 */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Format time from hour and minute
 */
export function formatTime(hour: number, minute: number = 0): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Get hours for day view (0-23)
 */
export function getHoursArray(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}

/**
 * Get days of current week
 */
export function getWeekDates(date: Date): Date[] {
  const week: Date[] = [];
  const first = date.getDate() - date.getDay(); // First day of week (Sunday)
  
  for (let i = 0; i < 7; i++) {
    week.push(new Date(date.getFullYear(), date.getMonth(), first + i));
  }
  
  return week;
}

/**
 * Check if event overlaps with a time slot
 */
export function eventOverlapsWithSlot(
  eventStart: Date,
  eventEnd: Date,
  hour: number
): boolean {
  const slotStartHour = hour;
  const slotEndHour = hour + 1;
  
  const eventStartHour = eventStart.getHours() + eventStart.getMinutes() / 60;
  const eventEndHour = eventEnd.getHours() + eventEnd.getMinutes() / 60;
  
  return eventStartHour < slotEndHour && eventEndHour > slotStartHour;
}
