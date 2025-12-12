/**
 * ICS (iCalendar) Export Utility
 * Generate .ics files for calendar import
 */

import type { Event } from '@event-manager/shared';

/**
 * Escape special characters for iCalendar format
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Format date for iCalendar (YYYYMMDDTHHMMSS or YYYYMMDD)
 */
function formatICSDate(date: Date, includeTime: boolean = true): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  if (!includeTime) {
    return `${year}${month}${day}`;
  }
  
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate ICS content for a single event
 */
export function generateEventICS(event: Event): string {
  const now = new Date();
  const startDate = new Date(event.startDate || event.date);
  const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
  
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Another Compile L//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@another-compile-l.events`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${escapeICS(event.name)}`,
  ];

  // Add description
  if (event.description) {
    icsContent.push(`DESCRIPTION:${escapeICS(event.description)}`);
  }

  // Add location
  if (event.location) {
    icsContent.push(`LOCATION:${escapeICS(event.location)}`);
  }

  // Add categories
  icsContent.push(`CATEGORIES:${event.type}`);

  // Add status
  if (event.status === 'CANCELLED') {
    icsContent.push('STATUS:CANCELLED');
  } else if (event.status === 'PUBLISHED') {
    icsContent.push('STATUS:CONFIRMED');
  } else {
    icsContent.push('STATUS:TENTATIVE');
  }

  // Add URL if available
  const eventUrl = `${window.location.origin}/events/${event.id}`;
  icsContent.push(`URL:${eventUrl}`);

  // Add alarm (1 day before)
  icsContent.push(
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${escapeICS(event.name)} tomorrow`,
    'END:VALARM'
  );

  icsContent.push('END:VEVENT', 'END:VCALENDAR');

  return icsContent.join('\r\n');
}

/**
 * Generate ICS content for multiple events
 */
export function generateCalendarICS(events: Event[], title: string = 'Event Calendar'): string {
  const now = new Date();
  
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Another Compile L//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(title)}`,
    'X-WR-TIMEZONE:UTC',
  ];

  // Add each event
  events.forEach(event => {
    const startDate = new Date(event.startDate || event.date);
    const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@another-compile-l.events`,
      `DTSTAMP:${formatICSDate(now)}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${escapeICS(event.name)}`
    );

    if (event.description) {
      icsContent.push(`DESCRIPTION:${escapeICS(event.description)}`);
    }

    if (event.location) {
      icsContent.push(`LOCATION:${escapeICS(event.location)}`);
    }

    icsContent.push(`CATEGORIES:${event.type}`);

    if (event.status === 'CANCELLED') {
      icsContent.push('STATUS:CANCELLED');
    } else if (event.status === 'PUBLISHED') {
      icsContent.push('STATUS:CONFIRMED');
    } else {
      icsContent.push('STATUS:TENTATIVE');
    }

    const eventUrl = `${window.location.origin}/events/${event.id}`;
    icsContent.push(`URL:${eventUrl}`);

    // Add alarm
    icsContent.push(
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${escapeICS(event.name)} tomorrow`,
      'END:VALARM'
    );

    icsContent.push('END:VEVENT');
  });

  icsContent.push('END:VCALENDAR');

  return icsContent.join('\r\n');
}

/**
 * Download ICS file
 */
export function downloadICS(content: string, filename: string = 'event.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export single event as ICS
 */
export function exportEventToICS(event: Event): void {
  const icsContent = generateEventICS(event);
  const filename = `${event.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
  downloadICS(icsContent, filename);
}

/**
 * Export multiple events as ICS calendar
 */
export function exportEventsToICS(events: Event[], title: string = 'Event Calendar'): void {
  const icsContent = generateCalendarICS(events, title);
  const filename = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
  downloadICS(icsContent, filename);
}

/**
 * Generate ICS content for email attachment
 */
export function generateEventICSForEmail(event: Event): string {
  return generateEventICS(event);
}
