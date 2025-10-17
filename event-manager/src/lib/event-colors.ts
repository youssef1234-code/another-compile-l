/**
 * Event Type Colors Configuration
 * 
 * Centralized color mapping for event types to ensure UI consistency
 * across all components (cards, filters, tables, badges, etc.)
 */

export const EVENT_TYPE_COLORS = {
  WORKSHOP: {
    label: 'Workshop',
    bg: 'bg-blue-500',
    text: 'text-blue-500',
    border: 'border-blue-500',
    hover: 'hover:bg-blue-500',
    light: 'bg-blue-50 dark:bg-blue-950',
    ring: 'ring-blue-500',
  },
  TRIP: {
    label: 'Trip',
    bg: 'bg-green-500',
    text: 'text-green-500',
    border: 'border-green-500',
    hover: 'hover:bg-green-500',
    light: 'bg-green-50 dark:bg-green-950',
    ring: 'ring-green-500',
  },
  CONFERENCE: {
    label: 'Conference',
    bg: 'bg-purple-500',
    text: 'text-purple-500',
    border: 'border-purple-500',
    hover: 'hover:bg-purple-500',
    light: 'bg-purple-50 dark:bg-purple-950',
    ring: 'ring-purple-500',
  },
  BAZAAR: {
    label: 'Bazaar',
    bg: 'bg-orange-500',
    text: 'text-orange-500',
    border: 'border-orange-500',
    hover: 'hover:bg-orange-500',
    light: 'bg-orange-50 dark:bg-orange-950',
    ring: 'ring-orange-500',
  },
  GYM_SESSION: {
    label: 'Gym Session',
    bg: 'bg-red-500',
    text: 'text-red-500',
    border: 'border-red-500',
    hover: 'hover:bg-red-500',
    light: 'bg-red-50 dark:bg-red-950',
    ring: 'ring-red-500',
  },
} as const;

export type EventType = keyof typeof EVENT_TYPE_COLORS;

export function getEventTypeConfig(type: string) {
  return EVENT_TYPE_COLORS[type as EventType] || EVENT_TYPE_COLORS.WORKSHOP;
}

/**
 * Event Status Colors
 */
export const EVENT_STATUS_COLORS = {
  UPCOMING: {
    label: 'Upcoming',
    bg: 'bg-blue-500',
    text: 'text-blue-500',
    light: 'bg-blue-50 dark:bg-blue-950',
  },
  ONGOING: {
    label: 'Ongoing',
    bg: 'bg-emerald-500',
    text: 'text-emerald-500',
    light: 'bg-emerald-50 dark:bg-emerald-950',
  },
  ENDED: {
    label: 'Ended',
    bg: 'bg-gray-500',
    text: 'text-gray-500',
    light: 'bg-gray-50 dark:bg-gray-950',
  },
  FULL: {
    label: 'Full',
    bg: 'bg-red-500',
    text: 'text-red-500',
    light: 'bg-red-50 dark:bg-red-950',
  },
  OPEN: {
    label: 'Open',
    bg: 'bg-green-500',
    text: 'text-green-500',
    light: 'bg-green-50 dark:bg-green-950',
  },
} as const;

/**
 * Get event status based on dates and capacity
 */
export function getEventStatus(event: {
  startDate?: Date | string;
  endDate?: Date | string | null;
  registrationDeadline?: Date | string | null;
  capacity?: number | null;
  registeredCount?: number | null;
}) {
  if (!event.startDate) return 'UPCOMING';
  
  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const regDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;

  // Check if ended
  if (endDate && endDate < now) {
    return 'ENDED';
  }
  if (!endDate && startDate < now) {
    return 'ENDED';
  }

  // Check if ongoing
  if (startDate <= now && (!endDate || endDate >= now)) {
    return 'ONGOING';
  }

  // Check if full
  if (event.capacity && event.registeredCount && event.registeredCount >= event.capacity) {
    return 'FULL';
  }

  // Check if registration is closed
  if (regDeadline && regDeadline < now) {
    return 'REGISTRATION_CLOSED';
  }

  // Otherwise upcoming with open registration
  return 'OPEN';
}

/**
 * Check if event has open registration
 */
export function hasOpenRegistration(event: {
  startDate?: Date | string;
  endDate?: Date | string | null;
  registrationDeadline?: Date | string | null;
  capacity?: number | null;
  registeredCount?: number | null;
}) {
  const status = getEventStatus(event);
  // Only include events that are truly open for registration (not ongoing or ended)
  return status === 'OPEN';
}
