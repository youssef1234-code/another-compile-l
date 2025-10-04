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
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  
  // Events
  EVENTS: '/events',
  EVENT_DETAILS: '/events/:id',
  MY_EVENTS: '/my-events',
  MY_REGISTRATIONS: '/events/registrations',
  FAVORITES: '/favorites',
  CREATE_WORKSHOP: '/events/create/workshop',
  MY_WORKSHOPS: '/events/workshops',
  CREATE_TRIP: '/events/create/trip',
  CREATE_BAZAAR: '/events/create/bazaar',
  CREATE_CONFERENCE: '/events/create/conference',
  
  // Vendors
  BROWSE_BAZAARS: '/vendors/bazaars',
  VENDOR_APPLICATIONS: '/vendors/applications',
  LOYALTY_PROGRAM: '/vendors/loyalty',
  VENDOR_REQUESTS: '/vendors/requests',
  
  // Gym & Sports
  GYM_SCHEDULE: '/gym/schedule',
  MY_SESSIONS: '/gym/sessions',
  COURT_BOOKINGS: '/gym/courts',
  MANAGE_SESSIONS: '/gym/manage',
  
  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_EVENTS: '/admin/events',
  ADMIN_ROLE_APPROVALS: '/admin/role-approvals',
  ADMIN_VENDOR_APPROVALS: '/admin/vendor-approvals',
  ADMIN_COMMENTS: '/admin/comments',
  ADMIN_MANAGE_ACCOUNTS: '/admin/manage-accounts',
  ADMIN_REPORTS: '/admin/reports',
  
  // Events Office
  WORKSHOP_APPROVALS: '/events-office/workshops',
  VENDOR_POLLS: '/events-office/polls',
  EVENT_OFFICE_REPORTS: '/events-office/reports',
  QR_CODES: '/events-office/qr-codes',
  
  // Other
  WALLET: '/wallet',
  NOTIFICATIONS: '/notifications',
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
