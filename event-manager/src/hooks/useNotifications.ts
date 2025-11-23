/**
 * Notification Hooks
 * 
 * React hooks for notification management with polling
 * Polls backend every 30 seconds for new notifications
 * 
 * @module hooks/useNotifications
 */

import { useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

const POLLING_INTERVAL = 30000; // 30 seconds

/**
 * Hook for managing notifications with automatic polling
 */
export function useNotifications() {
  // Poll for unread notifications every 30 seconds
  const { data: unreadNotifications = [], refetch: refetchUnread } =
    trpc.notifications.getUnread.useQuery(undefined, {
      refetchInterval: POLLING_INTERVAL,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 25000, // Slightly less than polling interval
    });

  // Get unread count for badge
  const { data: unreadCount = 0, refetch: refetchCount } =
    trpc.notifications.getUnreadCount.useQuery(undefined, {
      refetchInterval: POLLING_INTERVAL,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 25000,
    });

  // Mutations
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetchUnread();
      refetchCount();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchUnread();
      refetchCount();
    },
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      refetchUnread();
      refetchCount();
    },
  });

  const deleteAllMutation = trpc.notifications.deleteAll.useMutation({
    onSuccess: () => {
      refetchUnread();
      refetchCount();
    },
  });

  // Actions
  const markAsRead = useCallback(
    (notificationId: string) => {
      markAsReadMutation.mutate({ notificationId });
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const deleteNotification = useCallback(
    (notificationId: string) => {
      deleteMutation.mutate({ notificationId });
    },
    [deleteMutation]
  );

  const deleteAll = useCallback(() => {
    deleteAllMutation.mutate();
  }, [deleteAllMutation]);

  const refresh = useCallback(() => {
    refetchUnread();
    refetchCount();
  }, [refetchUnread, refetchCount]);

  return {
    unreadNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,
    refresh,
    isLoading:
      markAsReadMutation.isPending ||
      markAllAsReadMutation.isPending ||
      deleteMutation.isPending ||
      deleteAllMutation.isPending,
  };
}

/**
 * Hook for paginated notification history
 */
export function useNotificationHistory(page: number = 1, limit: number = 20) {
  const { data, isLoading, refetch } = trpc.notifications.getAll.useQuery(
    { page, limit },
    {
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: false,
    }
  );

  return {
    notifications: data?.notifications ?? [],
    total: data?.total ?? 0,
    hasMore: data?.hasMore ?? false,
    isLoading,
    refetch,
  };
}

/**
 * Hook to play notification sound
 */
export function useNotificationSound() {
  const playSound = useCallback(() => {
    // Only play if user has interacted with the page
    if (typeof Audio !== 'undefined') {
      try {
        // Use a subtle notification sound
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Silently fail if autoplay is blocked
        });
      } catch (error) {
        // Silently fail if audio not supported
      }
    }
  }, []);

  return { playSound };
}

/**
 * Hook to show browser notifications (requires permission)
 */
export function useBrowserNotifications() {
  useEffect(() => {
    // Request permission on mount if not already granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const showBrowserNotification = useCallback(
    (title: string, message: string) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body: message,
            icon: '/favicon.png',
            badge: '/favicon.png',
            tag: 'guc-event-notification',
            requireInteraction: false,
          });
        } catch (error) {
          // Silently fail if notifications not supported
        }
      }
    },
    []
  );

  return { showBrowserNotification };
}

/**
 * Combined hook with all notification features
 */
export function useNotificationSystem() {
  const notifications = useNotifications();
  const { playSound } = useNotificationSound();
  const { showBrowserNotification } = useBrowserNotifications();

  // Track previous unread count to detect new notifications
  useEffect(() => {
    const prevCount = sessionStorage.getItem('prevUnreadCount');
    const currentCount = notifications.unreadCount;

    if (prevCount !== null && currentCount > parseInt(prevCount, 10)) {
      // New notification arrived
      playSound();
      
      // Show browser notification for the latest one
      if (notifications.unreadNotifications.length > 0) {
        const latest = notifications.unreadNotifications[0];
        showBrowserNotification(latest.title, latest.message);
      }
    }

    sessionStorage.setItem('prevUnreadCount', currentCount.toString());
  }, [
    notifications.unreadCount,
    notifications.unreadNotifications,
    playSound,
    showBrowserNotification,
  ]);

  return notifications;
}
