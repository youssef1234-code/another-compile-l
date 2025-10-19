/**
 * Error Helper Utilities
 * Consistent error handling across the application
 */

import { toast } from 'react-hot-toast';
import { formatValidationErrors } from './format-errors';

/**
 * Standard error handler for mutations
 * Automatically formats and displays error messages
 */
export function handleMutationError(error: unknown, fallbackMessage?: string) {
  const errorMessage = formatValidationErrors(error);
  toast.error(errorMessage || fallbackMessage || 'An error occurred', {
    duration: 5000,
    style: {
      whiteSpace: 'pre-line', // Allow line breaks for multiple validation errors
    },
  });
}

/**
 * Success handler with consistent styling
 */
export function handleMutationSuccess(message: string) {
  toast.success(message, {
    duration: 3000,
    icon: '✅',
  });
}

/**
 * Create standard mutation callbacks
 */
export function createMutationCallbacks<TData = unknown>(options: {
  onSuccess?: (data: TData) => void;
  onError?: (error: unknown) => void;
  successMessage?: string;
  errorMessage?: string;
}) {
  return {
    onSuccess: (data: TData) => {
      if (options.successMessage) {
        handleMutationSuccess(options.successMessage);
      }
      options.onSuccess?.(data);
    },
    onError: (error: unknown) => {
      handleMutationError(error, options.errorMessage);
      options.onError?.(error);
    },
  };
}
