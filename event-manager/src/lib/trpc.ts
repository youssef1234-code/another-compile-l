/**
 * tRPC Client Configuration
 * 
 * Setup tRPC client with HTTP links, automatic token refresh, and React Query integration
 * 
 * @module lib/trpc
 */

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../backend/src/routers/app.router';
import { useAuthStore } from '@/store/authStore';
import { isTokenExpired } from './jwtHelpers';

// Create tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Track if refresh is in progress to avoid multiple simultaneous refreshes
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh the access token using refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  // If refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const store = useAuthStore.getState();
      const { refreshToken, user } = store;

      if (!refreshToken || !user) {
        console.warn('No refresh token available');
        store.logout();
        return null;
      }

      console.log('Refreshing access token...');

      // Call refresh endpoint
      const response = await fetch(`${API_URL}/trpc/auth.refreshToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      const result = data.result?.data;

      if (!result || !result.token || !result.refreshToken) {
        throw new Error('Invalid refresh response');
      }

      // Update store with new tokens
      store.setAuth(user, result.token, result.refreshToken);

      console.log('Token refreshed successfully');
      return result.token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Logout user on refresh failure
      useAuthStore.getState().logout();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Create tRPC client with automatic token refresh
 */
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      headers: async () => {
        // Get token from Zustand store (single source of truth)
        let token = useAuthStore.getState().token;

        // Check if token is expired or about to expire
        if (token && isTokenExpired(token)) {
          console.log('Token expired, attempting refresh...');
          const newToken = await refreshAccessToken();
          token = newToken || token;
        }

        return {
          authorization: token ? `Bearer ${token}` : '',
        };
      },
      // Handle 401 errors by attempting token refresh
      fetch: async (url, options) => {
        const response = await fetch(url, options);

        // If unauthorized, try to refresh token once
        if (response.status === 401) {
          console.log('Received 401, attempting token refresh...');
          const newToken = await refreshAccessToken();

          if (newToken && options) {
            // Retry request with new token
            const retryOptions = {
              ...options,
              headers: {
                ...options.headers,
                authorization: `Bearer ${newToken}`,
              },
            };
            return fetch(url, retryOptions);
          }
        }

        return response;
      },
    }),
  ],
});
