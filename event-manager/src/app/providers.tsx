/**
 * App Providers
 * 
 * Wraps the app with necessary providers (tRPC, TanStack Query, Router, Toast, Theme)
 * 
 * @module app/providers
 */

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { trpc, trpcClient } from '../lib/trpc';
import { NuqsProvider } from '../components/providers/nuqs-provider';
import { ThemeProvider, useTheme } from '../hooks/useTheme';

interface ProvidersProps {
  children: React.ReactNode;
}

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 16px',
          maxWidth: '500px',
          whiteSpace: 'pre-line',
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f9fafb' : '#111827',
          boxShadow: isDark 
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)'
            : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
        },
        success: {
          style: {
            background: isDark ? '#065f46' : '#10b981',
            color: '#fff',
            border: isDark ? '1px solid #047857' : 'none',
          },
          iconTheme: {
            primary: '#fff',
            secondary: isDark ? '#065f46' : '#10b981',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: isDark ? '#991b1b' : '#ef4444',
            color: '#fff',
            maxWidth: '500px',
            border: isDark ? '1px solid #b91c1c' : 'none',
          },
          iconTheme: {
            primary: '#fff',
            secondary: isDark ? '#991b1b' : '#ef4444',
          },
        },
        loading: {
          style: {
            background: isDark ? '#1e40af' : '#3b82f6',
            color: '#fff',
            border: isDark ? '1px solid #2563eb' : 'none',
          },
        },
      }}
    />
  );
}

function InnerProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ThemedToaster />
    </>
  );
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <NuqsProvider>
            <InnerProviders>
              {children}
            </InnerProviders>
          </NuqsProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ThemeProvider>
  );
}
