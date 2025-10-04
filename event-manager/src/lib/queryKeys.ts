/**
 * Query Key Factory
 * 
 * Centralized query key management for TanStack Query.
 * This ensures consistent cache keys across the application and makes
 * cache invalidation easier to manage.
 * 
 * Pattern: Feature -> List/Detail -> Filters
 * 
 * Benefits:
 * - Type-safe query keys
 * - Easy cache invalidation
 * - Consistent naming conventions
 * - Automatic partial matching for invalidation
 * 
 * Usage:
 * ```ts
 * // In a component
 * const { data } = trpc.events.getEvents.useQuery(
 *   filters,
 *   { queryKey: queryKeys.events.list(filters) }
 * );
 * 
 * // Invalidate all event queries
 * utils.invalidateQueries({ queryKey: queryKeys.events.all });
 * 
 * // Invalidate specific event list
 * utils.invalidateQueries({ queryKey: queryKeys.events.list(filters) });
 * ```
 */

import type { EventFilterInput } from '@event-manager/shared';

export const queryKeys = {
  // ============================================================================
  // AUTH / USERS
  // ============================================================================
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
    lists: () => [...queryKeys.auth.all, 'list'] as const,
    list: (filters?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) =>
      [...queryKeys.auth.lists(), filters] as const,
    details: () => [...queryKeys.auth.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.auth.details(), id] as const,
    stats: () => [...queryKeys.auth.all, 'stats'] as const,
    pending: () => [...queryKeys.auth.all, 'pending'] as const,
  },

  // ============================================================================
  // EVENTS
  // ============================================================================
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (filters?: EventFilterInput) => [...queryKeys.events.lists(), filters] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.events.details(), id] as const,
    upcoming: () => [...queryKeys.events.all, 'upcoming'] as const,
    search: (query: string) => [...queryKeys.events.all, 'search', query] as const,
    byType: (type: string) => [...queryKeys.events.all, 'type', type] as const,
    byLocation: (location: string) => [...queryKeys.events.all, 'location', location] as const,
    stats: () => [...queryKeys.events.all, 'stats'] as const,
  },

  // ============================================================================
  // REGISTRATIONS
  // ============================================================================
  registrations: {
    all: ['registrations'] as const,
    lists: () => [...queryKeys.registrations.all, 'list'] as const,
    list: (filters?: { page?: number; limit?: number; eventId?: string; status?: string }) =>
      [...queryKeys.registrations.lists(), filters] as const,
    details: () => [...queryKeys.registrations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.registrations.details(), id] as const,
    myRegistrations: () => [...queryKeys.registrations.all, 'my'] as const,
    byEvent: (eventId: string) => [...queryKeys.registrations.all, 'event', eventId] as const,
    stats: (eventId?: string) =>
      eventId
        ? [...queryKeys.registrations.all, 'stats', eventId] as const
        : [...queryKeys.registrations.all, 'stats'] as const,
  },

  // ============================================================================
  // FEEDBACK
  // ============================================================================
  feedback: {
    all: ['feedback'] as const,
    lists: () => [...queryKeys.feedback.all, 'list'] as const,
    list: (filters?: { page?: number; limit?: number; eventId?: string; type?: string }) =>
      [...queryKeys.feedback.lists(), filters] as const,
    details: () => [...queryKeys.feedback.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.feedback.details(), id] as const,
    byEvent: (eventId: string) => [...queryKeys.feedback.all, 'event', eventId] as const,
    ratings: (eventId: string) => [...queryKeys.feedback.all, 'ratings', eventId] as const,
    comments: (eventId: string) => [...queryKeys.feedback.all, 'comments', eventId] as const,
  },

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
      [...queryKeys.notifications.lists(), filters] as const,
    details: () => [...queryKeys.notifications.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.notifications.details(), id] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },

  // ============================================================================
  // DASHBOARD
  // ============================================================================
  dashboard: {
    all: ['dashboard'] as const,
    overview: () => [...queryKeys.dashboard.all, 'overview'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    recentActivity: () => [...queryKeys.dashboard.all, 'recent-activity'] as const,
    upcomingEvents: () => [...queryKeys.dashboard.all, 'upcoming-events'] as const,
  },
} as const;

/**
 * Helper to invalidate all queries for a specific feature
 * 
 * Usage:
 * ```ts
 * // Invalidate all event-related queries
 * utils.invalidateQueries({ queryKey: queryKeys.events.all });
 * 
 * // Invalidate all event lists (but not details)
 * utils.invalidateQueries({ queryKey: queryKeys.events.lists() });
 * 
 * // Invalidate specific event detail
 * utils.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
 * ```
 */

/**
 * Mutation query key patterns
 * 
 * These keys help track mutation states across the application
 */
export const mutationKeys = {
  auth: {
    login: ['auth', 'login'] as const,
    signup: ['auth', 'signup'] as const,
    logout: ['auth', 'logout'] as const,
    verifyEmail: ['auth', 'verify-email'] as const,
    blockUser: ['auth', 'block-user'] as const,
    unblockUser: ['auth', 'unblock-user'] as const,
    verifyRole: ['auth', 'verify-role'] as const,
  },
  events: {
    create: ['events', 'create'] as const,
    update: ['events', 'update'] as const,
    delete: ['events', 'delete'] as const,
    archive: ['events', 'archive'] as const,
  },
  registrations: {
    create: ['registrations', 'create'] as const,
    cancel: ['registrations', 'cancel'] as const,
    updateStatus: ['registrations', 'update-status'] as const,
  },
  feedback: {
    create: ['feedback', 'create'] as const,
    update: ['feedback', 'update'] as const,
    delete: ['feedback', 'delete'] as const,
  },
  notifications: {
    markRead: ['notifications', 'mark-read'] as const,
    markAllRead: ['notifications', 'mark-all-read'] as const,
    delete: ['notifications', 'delete'] as const,
  },
} as const;
