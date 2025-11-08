/**
 * Application Constants
 *
 * @module lib/constants
 */

import { CheckSquareIcon } from "lucide-react";

export const APP_NAME = "Another Compile L";
export const APP_DESCRIPTION = "Another Compile L Event Management System";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  SIGNUP_VENDOR: "/signup/vendor",
  VERIFY_EMAIL: "/verify-email",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/dashboard",

  // Events
  EVENTS: "/events",
  EVENT_DETAILS: "/events/:id",
  MY_EVENTS: "/my-events",
  MY_REGISTRATIONS: "/events/registrations",
  FAVORITES: "/favorites",
  CREATE_WORKSHOP: "/events/create/workshop",
  MY_WORKSHOPS: "/events/workshops",
  CREATE_TRIP: "/events/create/trip",
  CREATE_BAZAAR: "/events/create/bazaar",
  CREATE_CONFERENCE: "/events/create/conference",
  EDIT_WORKSHOP: "/workshops/edit/:id",
  EDIT_TRIP: "/trips/edit/:id",
  EDIT_CONFERENCE: "/conferences/edit/:id",
  EDIT_BAZAAR: "/events/edit/bazaar/:id",
  EVENT_PAY: "/events/:eventId/pay",          
  EVENT_PAY_CARD: "/events/:eventId/pay/card",
  EVENT_PAY_WALLET: "/events/:eventId/pay/wallet",
  

  // Stripe return URLs (success/failure)
  PAY_SUCCESS: "/payments/success",
  PAY_INSUFFICIENT: "/payments/insufficient",

  CHECKOUT_PAGE: "/checkout/:registrationId",

  // Vendors
  BROWSE_BAZAARS: "/vendors/bazaars",
  VENDOR_APPLICATIONS: "/vendors/applications",
  APPLY_PLATFORM_BOOTH: "/vendors/apply/platform",
  LOYALTY_PROGRAM: "/vendors/loyalty",
  VENDOR_REQUESTS: "/vendors/requests",
  ALL_APPLICATIONS: "/vendors/all",

  // Gym & Sports
  GYM_SCHEDULE: "/gym/schedule",
  MY_SESSIONS: "/gym/sessions",
  COURT_BOOKINGS: "/gym/courts",
  MANAGE_SESSIONS: "/gym/manage",

  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_EVENTS: '/admin/events',
  ADMIN_COMMENTS: '/admin/comments',
  ADMIN_REPORTS: '/admin/reports',
  
  // Events Office
  WORKSHOP_APPROVALS: "/events-office/workshops",
  VENDOR_POLLS: "/events-office/polls",
  EVENT_OFFICE_REPORTS: "/events-office/reports",
  QR_CODES: "/events-office/qr-codes",
  BAZAAR_MANAGEMENT: "/events-office/bazaars",
  PLATFORM_SETUP: "/events-office/platform-setup",

  // Other
  WALLET: "/wallet",
  NOTIFICATIONS: "/notifications",
  PROFILE: "/profile",
  SETTINGS: "/settings",
} as const;

export const ROLE_LABELS = {
  STUDENT: "Student",
  STAFF: "Staff",
  TA: "Teaching Assistant",
  PROFESSOR: "Professor",
  ADMIN: "Administrator",
  EVENT_OFFICE: "Event Office",
  VENDOR: "Vendor",
} as const;

export const EVENT_TYPE_LABELS = {
  WORKSHOP: "Workshop",
  TRIP: "Trip",
  BAZAAR: "Bazaar",
  BOOTH: "Booth",
  CONFERENCE: "Conference",
  GYM_SESSION: "Gym Session",
} as const;

export const STATUS_COLORS = {
  ACTIVE: "emerald",
  BLOCKED: "red",
  PENDING_VERIFICATION: "amber",
} as const;

export const PAYMENT_STATUS_COLORS = {
  PENDING: "amber",
  COMPLETED: "emerald",
  REFUNDED: "blue",
  FAILED: "red",
} as const;

// Utility functions for dynamic routes
export const generateEditWorkshopUrl = (id: string) =>
  ROUTES.EDIT_WORKSHOP.replace(":id", id);
export const generateEditTripUrl = (id: string) =>
  ROUTES.EDIT_TRIP.replace(":id", id);
export const generateEditConferenceUrl = (id: string) =>
  ROUTES.EDIT_CONFERENCE.replace(":id", id);
export const generateEditBazaarUrl = (id: string) =>
  ROUTES.EDIT_BAZAAR.replace(":id", id);
export const generateEventDetailsUrl = (id: string) =>
  ROUTES.EVENT_DETAILS.replace(":id", id);
