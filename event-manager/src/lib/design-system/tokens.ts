/**
 * Design System Tokens
 * 
 * Based on Pro Design Language principles:
 * - Semantic color roles (purpose-driven, not decorative)
 * - Consistent spacing system (4px base unit)
 * - Clear typography hierarchy
 * - Tactical depth with shadows
 * 
 * Philosophy: Professional tools, not pretty toys
 */

// ============================================================================
// COLOR SYSTEM
// ============================================================================

/**
 * Semantic Color Roles
 * Each color has a specific purpose - never decorative
 */
export const colorRoles = {
  // Success - completed actions, positive outcomes
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Primary success
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Warning - needs attention, incomplete states
  warning: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308', // Primary warning
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },
  
  // Critical - errors, destructive actions, urgent attention
  critical: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Primary critical
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Info - tips, information, neutral highlights
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Primary info
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Brand - primary actions, important elements
  brand: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6', // Primary brand
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
} as const;

/**
 * Neutral Colors - 90% of the interface
 * Monochromatic base makes colored elements stand out
 */
export const neutral = {
  0: '#ffffff',
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
  950: '#0a0a0a',
} as const;

// ============================================================================
// SPACING SYSTEM
// ============================================================================

/**
 * Spacing Scale (4px base unit)
 * Use for padding, margin, gap - maintains consistent rhythm
 */
export const spacing = {
  0: '0',
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px - base unit
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
} as const;

/**
 * Density Presets
 * Different contexts need different information density
 */
export const density = {
  high: {
    padding: spacing[2],      // 8px - data tables, lists
    gap: spacing[2],
    lineHeight: '1.4',
  },
  medium: {
    padding: spacing[4],      // 16px - default pages
    gap: spacing[4],
    lineHeight: '1.5',
  },
  low: {
    padding: spacing[6],      // 24px - forms, focused tasks
    gap: spacing[6],
    lineHeight: '1.6',
  },
} as const;

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

/**
 * Typography Scale
 * Clear hierarchy from page titles to metadata
 */
export const typography = {
  // Display (rarely used - marketing, hero sections)
  display: {
    size: '3rem',           // 48px
    weight: '700',
    lineHeight: '1.1',
    letterSpacing: '-0.02em',
  },
  
  // H1 - Page titles
  h1: {
    size: '1.875rem',       // 30px
    weight: '700',
    lineHeight: '1.2',
    letterSpacing: '-0.01em',
  },
  
  // H2 - Section headers
  h2: {
    size: '1.5rem',         // 24px
    weight: '600',
    lineHeight: '1.3',
    letterSpacing: '-0.01em',
  },
  
  // H3 - Card titles, subsections
  h3: {
    size: '1.125rem',       // 18px
    weight: '600',
    lineHeight: '1.4',
    letterSpacing: '0',
  },
  
  // Body - Default text
  body: {
    size: '0.875rem',       // 14px
    weight: '400',
    lineHeight: '1.5',
    letterSpacing: '0',
  },
  
  // Body Large - Emphasis
  bodyLarge: {
    size: '1rem',           // 16px
    weight: '400',
    lineHeight: '1.5',
    letterSpacing: '0',
  },
  
  // Small - Metadata, hints, timestamps
  small: {
    size: '0.75rem',        // 12px
    weight: '400',
    lineHeight: '1.4',
    letterSpacing: '0',
  },
  
  // Caption - Very small labels
  caption: {
    size: '0.6875rem',      // 11px
    weight: '400',
    lineHeight: '1.3',
    letterSpacing: '0.01em',
  },
} as const;

/**
 * Font Weights
 */
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// ============================================================================
// SHADOWS & DEPTH
// ============================================================================

/**
 * Shadow System
 * Creates depth hierarchy - higher = more important/interactive
 */
export const shadows = {
  none: 'none',
  
  // Subtle - default cards, low emphasis
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  
  // Default - cards, dropdowns
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  
  // Elevated - popovers, date pickers
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  
  // High priority - modals, important dialogs
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  
  // Maximum - sheets, overlays
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  
  // Interactive states
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  
} as const;

/**
 * Border Radius
 */
export const radius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px - default
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
} as const;

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

/**
 * Table Tokens
 */
export const table = {
  rowHeight: {
    compact: '36px',
    default: '44px',
    comfortable: '52px',
  },
  headerHeight: '40px',
  borderColor: neutral[200],
  hoverBackground: neutral[50],
  selectedBackground: colorRoles.brand[50],
} as const;

/**
 * Form Tokens
 */
export const form = {
  inputHeight: {
    sm: '32px',
    md: '40px',
    lg: '48px',
  },
  labelSpacing: spacing[2],
  errorColor: colorRoles.critical[500],
  focusRing: colorRoles.brand[500],
} as const;

/**
 * Button Tokens
 */
export const button = {
  height: {
    sm: '32px',
    md: '40px',
    lg: '48px',
  },
  paddingX: {
    sm: spacing[3],
    md: spacing[4],
    lg: spacing[6],
  },
} as const;

/**
 * Animation Durations
 */
export const animation = {
  instant: '100ms',
  fast: '200ms',
  normal: '300ms',
  slow: '500ms',
  slower: '700ms',
} as const;

/**
 * Z-Index Scale
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type ColorRole = keyof typeof colorRoles;
export type ColorShade = keyof typeof colorRoles.success;
export type Spacing = keyof typeof spacing;
export type Typography = keyof typeof typography;
export type Shadow = keyof typeof shadows;
export type Radius = keyof typeof radius;
