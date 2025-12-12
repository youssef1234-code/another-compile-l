/**
 * Event Calendar Helper Functions
 */

import type { CalendarEvent } from './types';

/**
 * Get calendar cells for a month grid (6 weeks)
 */
export function getCalendarCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const cells = [];

  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const date = new Date(year, month - 1, day);
    cells.push({ day, currentMonth: false, date, events: [] });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    cells.push({ day, currentMonth: true, date, events: [] });
  }

  // Next month days to complete the grid (6 weeks = 42 cells)
  const remainingCells = 42 - cells.length;
  for (let day = 1; day <= remainingCells; day++) {
    const date = new Date(year, month + 1, day);
    cells.push({ day, currentMonth: false, date, events: [] });
  }

  return cells;
}

/**
 * Get events for a specific date
 */
export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = new Date(event.startDate || event.date);
    return (
      eventStart.getFullYear() === date.getFullYear() &&
      eventStart.getMonth() === date.getMonth() &&
      eventStart.getDate() === date.getDate()
    );
  });
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Format month and year for display
 */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Get week days (Sun-Sat)
 */
export function getWeekDays(): string[] {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

/**
 * Get dates for a week view
 */
export function getWeekDates(currentDate: Date): Date[] {
  const dates: Date[] = [];
  const dayOfWeek = currentDate.getDay();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - dayOfWeek);

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    dates.push(date);
  }

  return dates;
}

/**
 * Format time (HH:MM AM/PM)
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Check if event overlaps with a time slot
 */
export function eventOverlapsWithSlot(
  event: CalendarEvent,
  date: Date,
  hour: number
): boolean {
  const eventStart = new Date(event.startDate || event.date);
  const eventEnd = event.endDate ? new Date(event.endDate) : new Date(eventStart.getTime() + 2 * 60 * 60 * 1000);

  const slotStart = new Date(date);
  slotStart.setHours(hour, 0, 0, 0);
  const slotEnd = new Date(slotStart);
  slotEnd.setHours(hour + 1, 0, 0, 0);

  return eventStart < slotEnd && eventEnd > slotStart;
}

/**
 * Calculate event height based on duration
 */
export function calculateEventHeight(event: CalendarEvent): number {
  const start = new Date(event.startDate || event.date);
  const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const durationMs = end.getTime() - start.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  return Math.max(durationHours * 60, 40); // Minimum 40px
}

/**
 * Get month names
 */
export function getMonthNames(): string[] {
  return [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
}

/**
 * Sort events by start date
 */
export function sortEventsByDate(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.startDate || a.date).getTime();
    const dateB = new Date(b.startDate || b.date).getTime();
    return dateA - dateB;
  });
}
