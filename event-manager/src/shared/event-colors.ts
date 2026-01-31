/**
 * Event Type Color System
 * Consistent color scheme for all event types across the application
 */

import { EventType } from './index';

export const EVENT_TYPE_COLORS: Record<
  EventType,
  { bg: string; text: string; border: string; dot: string }
> = {
    WORKSHOP: {
        bg: "bg-fuchsia-100 dark:bg-fuchsia-900/30",
        text: "text-fuchsia-700 dark:text-fuchsia-300",
        border: "border-fuchsia-200 dark:border-fuchsia-800",
        dot: "bg-fuchsia-500"
    },
  TRIP: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500"
  },
  BAZAAR: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500"
  },
  CONFERENCE: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500"
  },
  GYM_SESSION: {
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500"
  },
  OTHER: {
    bg: "bg-gray-100 dark:bg-gray-900/30",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-800",
    dot: "bg-gray-500"
  },
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  WORKSHOP: "Workshop",
  TRIP: "Trip",
  BAZAAR: "Bazaar",
  CONFERENCE: "Conference",
  GYM_SESSION: "Gym Session",
  OTHER: "Other",
};
