/**
 * Application Constants
 * 
 * @module lib/constants
 */

export const APP_NAME = 'Event Manager';
export const APP_DESCRIPTION = 'GUC Event Management System';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  SIGNUP_VENDOR: '/signup/vendor',
  VERIFY_EMAIL: '/verify-email',
  DASHBOARD: '/dashboard',
  EVENTS: '/events',
  EVENT_DETAILS: '/events/:id',
  MY_EVENTS: '/my-events',
  FAVORITES: '/favorites',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_EVENTS: '/admin/events',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

export const ROLE_LABELS = {
  STUDENT: 'Student',
  STAFF: 'Staff',
  TA: 'Teaching Assistant',
  PROFESSOR: 'Professor',
  ADMIN: 'Administrator',
  EVENT_OFFICE: 'Event Office',
  VENDOR: 'Vendor',
} as const;

export const EVENT_TYPE_LABELS = {
  WORKSHOP: 'Workshop',
  TRIP: 'Trip',
  BAZAAR: 'Bazaar',
  BOOTH: 'Booth',
  CONFERENCE: 'Conference',
  GYM_SESSION: 'Gym Session',
} as const;

export const STATUS_COLORS = {
  ACTIVE: 'emerald',
  BLOCKED: 'red',
  PENDING_VERIFICATION: 'amber',
} as const;

export const PAYMENT_STATUS_COLORS = {
  PENDING: 'amber',
  COMPLETED: 'emerald',
  REFUNDED: 'blue',
  FAILED: 'red',
} as const;
