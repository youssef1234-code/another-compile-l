/**
 * Shared Types - Event Management System
 * 
 * This file contains all shared type definitions used across both
 * frontend and backend for type safety with tRPC.
 * 
 * @module shared/types
 */

import { z } from 'zod';

// ============================================================================
// USER TYPES & SCHEMAS
// ============================================================================

/**
 * User roles in the system
 */
export const UserRole = z.enum([
  'STUDENT',
  'STAFF',
  'TA',
  'PROFESSOR',
  'ADMIN',
  'EVENT_OFFICE',
  'VENDOR'
]);

export type UserRoleType = z.infer<typeof UserRole>;

/**
 * User status
 */
export const UserStatus = z.enum(['ACTIVE', 'BLOCKED', 'PENDING_VERIFICATION']);
export type UserStatusType = z.infer<typeof UserStatus>;

/**
 * Base user schema
 */
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  role: UserRole,
  status: UserStatus,
  isVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Student/Staff user additional fields
 */
export const AcademicUserSchema = UserSchema.extend({
  studentId: z.string().optional(), // For students
  staffId: z.string().optional(), // For staff/TA/professors
  walletBalance: z.number().default(0),
});

export type AcademicUser = z.infer<typeof AcademicUserSchema>;

/**
 * Vendor user additional fields
 */
export const VendorUserSchema = UserSchema.extend({
  companyName: z.string(),
  taxCardUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  taxCardVerified: z.boolean().default(false),
});

export type VendorUser = z.infer<typeof VendorUserSchema>;

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const SignupAcademicSchema = z.object({
  email: z.string().email().refine((email: string) => email.endsWith('@guc.edu.eg'), {
    message: 'Must use GUC email (@guc.edu.eg)',
  }),
  password: z.string().min(8).max(100),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  role: z.enum(['STUDENT', 'STAFF', 'TA', 'PROFESSOR']),
  studentId: z.string().optional(),
  staffId: z.string().optional(),
});

export type SignupAcademicInput = z.infer<typeof SignupAcademicSchema>;

export const SignupVendorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  companyName: z.string().min(2).max(100),
});

export type SignupVendorInput = z.infer<typeof SignupVendorSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema,
  token: z.string(),
  refreshToken: z.string(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// ============================================================================
// EVENT TYPES & SCHEMAS
// ============================================================================

export const EventType = z.enum([
  'WORKSHOP',
  'TRIP',
  'BAZAAR',
  'BOOTH',
  'CONFERENCE',
  'GYM_SESSION'
]);

export type EventTypeType = z.infer<typeof EventType>;

export const EventStatus = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'PUBLISHED',
  'CANCELLED',
  'COMPLETED',
  'ARCHIVED'
]);

export type EventStatusType = z.infer<typeof EventStatus>;

export const FundingSource = z.enum(['EXTERNAL', 'GUC']);
export type FundingSourceType = z.infer<typeof FundingSource>;

export const Faculty = z.enum(['MET', 'IET', 'PHARMACY', 'BIOTECHNOLOGY', 'MANAGEMENT', 'LAW', 'DESIGN']);
export type FacultyType = z.infer<typeof Faculty>;

export const Location = z.enum(['GUC_CAIRO', 'GUC_BERLIN', 'EXTERNAL']);
export type LocationType = z.infer<typeof Location>;

/**
 * Base event schema
 */
export const BaseEventSchema = z.object({
  id: z.string(),
  name: z.string().min(3).max(200),
  type: EventType,
  description: z.string().min(10).max(2000),
  startDate: z.date(),
  endDate: z.date(),
  location: z.string(),
  status: EventStatus,
  capacity: z.number().int().positive().optional(),
  registeredCount: z.number().int().default(0),
  registrationDeadline: z.date().optional(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  restrictedTo: z.array(UserRole).optional(),
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;

/**
 * Workshop event schema
 */
export const WorkshopEventSchema = BaseEventSchema.extend({
  type: z.literal('WORKSHOP'),
  fullAgenda: z.string(),
  faculty: Faculty,
  professors: z.array(z.string()),
  requiredBudget: z.number().positive(),
  fundingSource: FundingSource,
  extraResources: z.string().optional(),
  price: z.number().default(0),
});

export type WorkshopEvent = z.infer<typeof WorkshopEventSchema>;

/**
 * Trip event schema
 */
export const TripEventSchema = BaseEventSchema.extend({
  type: z.literal('TRIP'),
  price: z.number().positive(),
});

export type TripEvent = z.infer<typeof TripEventSchema>;

/**
 * Bazaar event schema
 */
export const BazaarEventSchema = BaseEventSchema.extend({
  type: z.literal('BAZAAR'),
  vendors: z.array(z.string()).default([]),
});

export type BazaarEvent = z.infer<typeof BazaarEventSchema>;

/**
 * Conference event schema
 */
export const ConferenceEventSchema = BaseEventSchema.extend({
  type: z.literal('CONFERENCE'),
  fullAgenda: z.string(),
  websiteUrl: z.string().url(),
  requiredBudget: z.number().positive(),
  fundingSource: FundingSource,
  extraResources: z.string().optional(),
});

export type ConferenceEvent = z.infer<typeof ConferenceEventSchema>;

/**
 * Gym Session event schema
 */
export const GymSessionType = z.enum(['YOGA', 'PILATES', 'AEROBICS', 'ZUMBA', 'CROSS_CIRCUIT', 'KICK_BOXING']);
export type GymSessionTypeType = z.infer<typeof GymSessionType>;

export const GymSessionEventSchema = BaseEventSchema.extend({
  type: z.literal('GYM_SESSION'),
  sessionType: GymSessionType,
  duration: z.number().positive(), // in minutes
});

export type GymSessionEvent = z.infer<typeof GymSessionEventSchema>;

// ============================================================================
// EVENT REGISTRATION SCHEMAS
// ============================================================================

export const EventRegistrationSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  userId: z.string(),
  registeredAt: z.date(),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'REFUNDED', 'FAILED']),
  paymentAmount: z.number().default(0),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'WALLET']).optional(),
  certificateIssued: z.boolean().default(false),
  attended: z.boolean().default(false),
});

export type EventRegistration = z.infer<typeof EventRegistrationSchema>;

// ============================================================================
// RATING & COMMENT SCHEMAS
// ============================================================================

export const RatingSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  userId: z.string(),
  rating: z.number().int().min(1).max(5),
  createdAt: z.date(),
});

export type Rating = z.infer<typeof RatingSchema>;

export const CommentSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  userId: z.string(),
  userName: z.string(),
  content: z.string().min(1).max(1000),
  isDeleted: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Comment = z.infer<typeof CommentSchema>;

// ============================================================================
// VENDOR PARTICIPATION SCHEMAS
// ============================================================================

export const BoothSize = z.enum(['2X2', '4X4']);
export type BoothSizeType = z.infer<typeof BoothSize>;

export const ParticipationRequestSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  eventId: z.string(), // Bazaar or Booth event
  eventType: z.enum(['BAZAAR', 'BOOTH']),
  attendees: z.array(z.object({
    name: z.string(),
    email: z.string().email(),
  })).min(1).max(5),
  boothSize: BoothSize,
  duration: z.number().int().min(1).max(4).optional(), // weeks, for booths
  platformLocation: z.string().optional(), // for booths
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED']),
  participationFee: z.number().positive(),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED']),
  idsUploaded: z.boolean().default(false),
  qrCodeUrl: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ParticipationRequest = z.infer<typeof ParticipationRequestSchema>;

// ============================================================================
// LOYALTY PROGRAM SCHEMAS
// ============================================================================

export const LoyaltyProgramSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  vendorName: z.string(),
  discountRate: z.number().min(0).max(100),
  promoCode: z.string(),
  termsAndConditions: z.string(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LoyaltyProgram = z.infer<typeof LoyaltyProgramSchema>;

// ============================================================================
// COURT RESERVATION SCHEMAS
// ============================================================================

export const CourtType = z.enum(['BASKETBALL', 'TENNIS', 'FOOTBALL']);
export type CourtTypeType = z.infer<typeof CourtType>;

export const CourtReservationSchema = z.object({
  id: z.string(),
  courtType: CourtType,
  courtNumber: z.number().int().positive(),
  studentId: z.string(),
  studentName: z.string(),
  date: z.date(),
  startTime: z.string(), // HH:mm format
  endTime: z.string(), // HH:mm format
  createdAt: z.date(),
});

export type CourtReservation = z.infer<typeof CourtReservationSchema>;

// ============================================================================
// NOTIFICATION SCHEMAS
// ============================================================================

export const NotificationType = z.enum([
  'NEW_EVENT',
  'EVENT_REMINDER',
  'WORKSHOP_STATUS_UPDATE',
  'VENDOR_REQUEST_UPDATE',
  'COMMENT_DELETED_WARNING',
  'GYM_SESSION_UPDATE',
  'NEW_LOYALTY_PARTNER',
  'GENERAL'
]);

export type NotificationTypeType = z.infer<typeof NotificationType>;

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationType,
  title: z.string(),
  message: z.string(),
  isRead: z.boolean().default(false),
  createdAt: z.date(),
  relatedEntityId: z.string().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

// ============================================================================
// API INPUT SCHEMAS
// ============================================================================

// Event creation inputs
export const CreateWorkshopInputSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  startDate: z.date(),
  endDate: z.date(),
  location: Location,
  fullAgenda: z.string(),
  faculty: Faculty,
  professors: z.array(z.string()).min(1),
  requiredBudget: z.number().positive(),
  fundingSource: FundingSource,
  extraResources: z.string().optional(),
  capacity: z.number().int().positive(),
  registrationDeadline: z.date(),
  price: z.number().default(0),
});

export type CreateWorkshopInput = z.infer<typeof CreateWorkshopInputSchema>;

export const CreateTripInputSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  startDate: z.date(),
  endDate: z.date(),
  location: z.string(),
  price: z.number().positive(),
  capacity: z.number().int().positive(),
  registrationDeadline: z.date(),
});

export type CreateTripInput = z.infer<typeof CreateTripInputSchema>;

export const CreateBazaarInputSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  startDate: z.date(),
  endDate: z.date(),
  location: z.string(),
  registrationDeadline: z.date(),
});

export type CreateBazaarInput = z.infer<typeof CreateBazaarInputSchema>;

export const CreateConferenceInputSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  startDate: z.date(),
  endDate: z.date(),
  location: z.string(),
  fullAgenda: z.string(),
  websiteUrl: z.string().url(),
  requiredBudget: z.number().positive(),
  fundingSource: FundingSource,
  extraResources: z.string().optional(),
});

export type CreateConferenceInput = z.infer<typeof CreateConferenceInputSchema>;

export const CreateGymSessionInputSchema = z.object({
  name: z.string(),
  date: z.date(),
  startTime: z.string(),
  duration: z.number().positive(),
  sessionType: GymSessionType,
  capacity: z.number().int().positive(),
});

export type CreateGymSessionInput = z.infer<typeof CreateGymSessionInputSchema>;

// Filtering and search
export const EventFilterSchema = z.object({
  type: EventType.optional(),
  location: z.string().optional(),
  date: z.date().optional(),
  professorName: z.string().optional(),
  searchQuery: z.string().optional(),
  sortBy: z.enum(['date', 'name', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type EventFilter = z.infer<typeof EventFilterSchema>;

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type Pagination = z.infer<typeof PaginationSchema>;
