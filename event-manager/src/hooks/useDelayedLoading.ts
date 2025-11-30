/**
 * useDelayedLoading Hook
 * 
 * Prevents loading state flash by ensuring a minimum loading duration.
 * This provides a smoother UX when responses are very fast.
 */

import { useState, useEffect, useRef } from 'react';

const MIN_LOADING_DURATION = 300; // ms

/**
 * Returns a loading state that stays true for at least MIN_LOADING_DURATION ms
 * to prevent jarring flash when responses are fast.
 * 
 * @param isLoading - The actual loading state from a query
 * @returns A smoothed loading state
 */
export function useDelayedLoading(isLoading: boolean): boolean {
  const [showLoading, setShowLoading] = useState(false);
  const loadingStartTime = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Start loading and record start time
      loadingStartTime.current = Date.now();
      setShowLoading(true);
    } else if (!isLoading && showLoading) {
      // Calculate remaining time to meet minimum duration
      const elapsed = loadingStartTime.current 
        ? Date.now() - loadingStartTime.current 
        : MIN_LOADING_DURATION;
      const remaining = Math.max(0, MIN_LOADING_DURATION - elapsed);

      // Delay hiding the loading state
      const timer = setTimeout(() => {
        setShowLoading(false);
        loadingStartTime.current = null;
      }, remaining);

      return () => clearTimeout(timer);
    }
  }, [isLoading, showLoading]);

  return showLoading;
}
