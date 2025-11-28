/**
 * Unified Design System
 *
 * Consistent spacing, colors, typography, and component styles
 * to eliminate AI-generated feel and ensure professional appearance
 */

export const designSystem = {
  // Spacing Scale (based on Tailwind)
  spacing: {
    xs: '0.5rem', // 8px
    sm: '0.75rem', // 12px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem', // 64px
  },

  // Typography
  typography: {
    pageTitle: 'text-3xl font-bold tracking-tight',
    sectionTitle: 'text-2xl font-semibold',
    cardTitle: 'text-xl font-semibold',
    subtitle: 'text-muted-foreground text-sm',
    body: 'text-base',
    small: 'text-sm',
  },

  // Card Styles
  card: {
    base: 'rounded-lg border bg-card text-card-foreground shadow-sm',
    hover:
      'transition-all duration-200 hover:shadow-md hover:border-primary/20',
    elevated: 'shadow-md border border-border/50',
    interactive:
      'cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]',
  },

  // Button Variants (using shadcn/ui)
  button: {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline:
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive:
      'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },

  // Status Colors
  status: {
    pending:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    published:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    completed:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },

  // Event Type Colors
  eventTypes: {
    WORKSHOP:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    TRIP: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    BAZAAR:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    CONFERENCE:
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    GYM_SESSION:
      'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },

  // Layout
  layout: {
    maxWidth: 'max-w-7xl mx-auto',
    padding: 'px-4 sm:px-6 lg:px-8',
    section: 'space-y-6',
    grid: {
      two: 'grid grid-cols-1 md:grid-cols-2 gap-6',
      three: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      four: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
    },
  },

  // Animations
  animations: {
    fadeIn: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.2 },
    },
    slideIn: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.3 },
    },
  },

  // Empty States
  emptyState: {
    container: 'flex flex-col items-center justify-center py-16 text-center',
    icon: 'h-16 w-16 text-muted-foreground mb-4',
    title: 'text-xl font-semibold mb-2',
    description: 'text-muted-foreground mb-6',
  },

  // Form Styles
  form: {
    label:
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
    input:
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    error: 'text-sm text-destructive mt-1',
  },
} as const;

// Utility function to get status badge class
export function getStatusBadgeClass(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING_APPROVAL: designSystem.status.pending,
    APPROVED: designSystem.status.approved,
    REJECTED: designSystem.status.rejected,
    DRAFT: designSystem.status.draft,
    PUBLISHED: designSystem.status.published,
    COMPLETED: designSystem.status.completed,
    NEEDS_EDITS: designSystem.status.pending,
    CANCELLED: designSystem.status.rejected,
  };
  return statusMap[status] || designSystem.status.draft;
}

// Utility function to get event type badge class
export function getEventTypeBadgeClass(type: string): string {
  const typeMap: Record<string, string> = {
    WORKSHOP: designSystem.eventTypes.WORKSHOP,
    TRIP: designSystem.eventTypes.TRIP,
    BAZAAR: designSystem.eventTypes.BAZAAR,
    CONFERENCE: designSystem.eventTypes.CONFERENCE,
    GYM_SESSION: designSystem.eventTypes.GYM_SESSION,
    OTHER: designSystem.eventTypes.OTHER,
  };
  return typeMap[type] || designSystem.eventTypes.OTHER;
}

// Utility function to format event type for display
export function formatEventType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

// Utility function to format status for display
export function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
