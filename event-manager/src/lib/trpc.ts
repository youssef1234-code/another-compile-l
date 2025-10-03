/**
 * tRPC Client Configuration
 * 
 * Setup tRPC client with HTTP links and React Query integration
 * 
 * @module lib/trpc
 */

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../backend/src/routers/app.router';

// Create tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Create tRPC client
 */
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      headers: () => {
        // Get token from localStorage
        const token = localStorage.getItem('auth-token');
        
        return {
          authorization: token ? `Bearer ${token}` : '',
        };
      },
    }),
  ],
});
