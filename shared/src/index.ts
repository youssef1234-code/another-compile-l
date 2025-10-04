/**
 * Shared Types and Schemas
 * 
 * This file contains all shared types, enums, and Zod schemas
 * used by both frontend and backend to ensure type consistency
 * and avoid duplication.
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const UserRole = {
  STUDENT: 'STUDENT',
  STAFF: 'STAFF',
  TA: 'TA',
  PROFESSOR: 'PROFESSOR',
  VENDOR: 'VENDOR',
  ADMIN: 'ADMIN',
  EVENT_OFFICE: 'EVENT_OFFICE',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BLOCKED: 'BLOCKED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const EventType = {
  WORKSHOP: 'WORKSHOP',
  TRIP: 'TRIP',
  BAZAAR: 'BAZAAR',
  CONFERENCE: 'CONFERENCE',
  GYM_SESSION: 'GYM_SESSION',
  OTHER: 'OTHER',
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

export const EventLocation = {
  ON_CAMPUS: 'ON_CAMPUS',
  OFF_CAMPUS: 'OFF_CAMPUS',
} as const;

export type EventLocation = (typeof EventLocation)[keyof typeof EventLocation];

export const RegistrationStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  ATTENDED: 'ATTENDED',
} as const;

export type RegistrationStatus = (typeof RegistrationStatus)[keyof typeof RegistrationStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const EventStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;

export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

export const FundingSource = {
  STUDENT_UNION: 'STUDENT_UNION',
  SPONSORS: 'SPONSORS',
  PAID: 'PAID',
  FREE: 'FREE',
} as const;

export type FundingSource = (typeof FundingSource)[keyof typeof FundingSource];

export const Faculty = {
  IET: 'IET',
  BUSINESS: 'BUSINESS',
  PHARMACY: 'PHARMACY',
  BIOTECHNOLOGY: 'BIOTECHNOLOGY',
  APPLIED_ARTS: 'APPLIED_ARTS',
  ALL: 'ALL',
} as const;

export type Faculty = (typeof Faculty)[keyof typeof Faculty];

export const GymSessionType = {
  CROSSFIT: 'CROSSFIT',
  YOGA: 'YOGA',
  PILATES: 'PILATES',
  CARDIO: 'CARDIO',
  STRENGTH: 'STRENGTH',
  DANCE: 'DANCE',
  MARTIAL_ARTS: 'MARTIAL_ARTS',
  OTHER: 'OTHER',
} as const;

export type GymSessionType = (typeof GymSessionType)[keyof typeof GymSessionType];

export const NotificationType = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  EVENT_REMINDER: 'EVENT_REMINDER',
  REGISTRATION_CONFIRMED: 'REGISTRATION_CONFIRMED',
  ROLE_VERIFIED: 'ROLE_VERIFIED',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const SignupAcademicSchema = z.object({
  email: z.string().email('Invalid email address')
    .refine(
      (email: string) => email.endsWith('@guc.edu.eg') || email.endsWith('@student.guc.edu.eg'),
      'Must be a valid GUC email address'
    ),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['STUDENT', 'STAFF', 'TA', 'PROFESSOR']),
  gucId: z.string().optional(),
});

export type SignupAcademicInput = z.infer<typeof SignupAcademicSchema>;

export const SignupVendorSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
});

export type SignupVendorInput = z.infer<typeof SignupVendorSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const UpdateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  companyName: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// ============================================================================
// EVENT SCHEMAS
// ============================================================================

export const CreateEventSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  type: z.enum(['WORKSHOP', 'TRIP', 'BAZAAR', 'CONFERENCE', 'GYM_SESSION', 'OTHER']),
  location: z.enum(['ON_CAMPUS', 'OFF_CAMPUS']),
  locationDetails: z.string().min(5).max(200),
  date: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  capacity: z.number().int().positive().min(1),
  price: z.number().nonnegative().default(0),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  requirements: z.string().max(500).optional(),
  professorName: z.string().optional(), // For academic events
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;

export const UpdateEventSchema = CreateEventSchema.partial().extend({
  id: z.string(),
  isArchived: z.boolean().optional(),
});

export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;

export const EventFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(12),
  search: z.string().optional(),
  type: z.enum(['WORKSHOP', 'TRIP', 'BAZAAR', 'CONFERENCE', 'GYM_SESSION', 'OTHER']).optional(),
  location: z.enum(['ON_CAMPUS', 'OFF_CAMPUS']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  onlyUpcoming: z.boolean().default(true),
  isArchived: z.boolean().optional(),
});

export type EventFilterInput = z.infer<typeof EventFilterSchema>;

// ============================================================================
// REGISTRATION SCHEMAS
// ============================================================================

export const CreateRegistrationSchema = z.object({
  eventId: z.string(),
  attendees: z.number().int().positive().default(1),
  specialRequests: z.string().max(500).optional(),
});

export type CreateRegistrationInput = z.infer<typeof CreateRegistrationSchema>;

export const UpdateRegistrationStatusSchema = z.object({
  registrationId: z.string(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'ATTENDED']),
  cancellationReason: z.string().max(500).optional(),
});

export type UpdateRegistrationStatusInput = z.infer<typeof UpdateRegistrationStatusSchema>;

// ============================================================================
// ADMIN SCHEMAS
// ============================================================================

export const AdminUserFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['STUDENT', 'STAFF', 'TA', 'PROFESSOR', 'VENDOR', 'ADMIN', 'EVENT_OFFICE']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING_VERIFICATION']).optional(),
  isBlocked: z.boolean().optional(),
  roleVerifiedByAdmin: z.boolean().optional(),
});

export type AdminUserFilterInput = z.infer<typeof AdminUserFilterSchema>;

export const BlockUserSchema = z.object({
  userId: z.string(),
  reason: z.string().max(500).optional(),
});

export type BlockUserInput = z.infer<typeof BlockUserSchema>;

export const UnblockUserSchema = z.object({
  userId: z.string(),
});

export type UnblockUserInput = z.infer<typeof UnblockUserSchema>;

export const VerifyRoleSchema = z.object({
  userId: z.string(),
});

export type VerifyRoleInput = z.infer<typeof VerifyRoleSchema>;

export const CreateAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: z.enum(['ADMIN', 'EVENT_OFFICE']),
});

export type CreateAdminInput = z.infer<typeof CreateAdminSchema>;

export const DeleteAdminSchema = z.object({
  userId: z.string(),
});

export type DeleteAdminInput = z.infer<typeof DeleteAdminSchema>;

// ============================================================================
// FEEDBACK SCHEMAS
// ============================================================================

export const CreateFeedbackSchema = z.object({
  eventId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  isAnonymous: z.boolean().default(false),
});

export type CreateFeedbackInput = z.infer<typeof CreateFeedbackSchema>;

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const NotificationFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  isRead: z.boolean().optional(),
});

export type NotificationFilterInput = z.infer<typeof NotificationFilterSchema>;

export const MarkNotificationReadSchema = z.object({
  notificationId: z.string(),
});

export type MarkNotificationReadInput = z.infer<typeof MarkNotificationReadSchema>;

// ============================================================================
// RESPONSE TYPES (for frontend)
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  isBlocked: boolean;
  roleVerifiedByAdmin: boolean;
  isVerified: boolean;
  gucId?: string;
  companyName?: string;
  bio?: string;
  phone?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  location: EventLocation;
  locationDetails: string;
  date: Date;
  endDate?: Date;
  capacity: number;
  registeredCount: number;
  price: number;
  imageUrl?: string;
  tags: string[];
  requirements?: string;
  professorName?: string;
  isArchived: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  attendees: number;
  specialRequests?: string;
  cancellationReason?: string;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

export interface Feedback {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  comment?: string;
  isAnonymous: boolean;
  createdAt: Date;
}

// ============================================================================
// PAGINATED RESPONSE TYPE
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface MessageResponse {
  message: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
