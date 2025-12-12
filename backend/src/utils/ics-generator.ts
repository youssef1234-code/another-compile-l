/**
 * ICS (iCalendar) Generator Utility
 * Backend utility for generating .ics calendar files
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
 * Format date for iCalendar (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate ICS content for a single event
 */
export function generateEventICS(event: Event, baseUrl: string = ''): string {
  const now = new Date();
  const startDate = new Date(event.startDate || event.date);
  const endDate = event.endDate 
    ? new Date(event.endDate) 
    : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
  
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Another Compile L//Event Management//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST', // Changed to REQUEST for better compatibility
    'X-WR-CALNAME:' + escapeICS(event.name),
    'X-WR-TIMEZONE:UTC',
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
  if (baseUrl) {
    const eventUrl = `${baseUrl}/events/${event.id}`;
    icsContent.push(`URL:${eventUrl}`);
  }

  // Add organizer
  icsContent.push(`ORGANIZER:mailto:noreply@another-compile-l.events`);

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
 * Generate ICS attachment as Buffer
 */
export function generateICSAttachment(event: Event, baseUrl: string = ''): Buffer {
  const icsContent = generateEventICS(event, baseUrl);
  return Buffer.from(icsContent, 'utf-8');
}

/**
 * Get ICS filename for an event
 */
export function getICSFilename(event: Event): string {
  const sanitizedName = event.name
    .replace(/[^a-z0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 50);
  
  return `${sanitizedName}-${event.id}.ics`;
}
