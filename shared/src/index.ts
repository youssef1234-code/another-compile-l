/**
 * Shared Types and Schemas
 *
 * This file contains all shared types, enums, and Zod schemas
 * used by both frontend and backend to ensure type consistency
 * and avoid duplication.
 */

import { z } from "zod";

// Export avatar utilities
export * from "./avatars";

// ============================================================================
// ENUMS
// ============================================================================

export const UserRole = {
  STUDENT: "STUDENT",
  STAFF: "STAFF",
  TA: "TA",
  PROFESSOR: "PROFESSOR",
  VENDOR: "VENDOR",
  ADMIN: "ADMIN",
  EVENT_OFFICE: "EVENT_OFFICE",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BLOCKED: "BLOCKED",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  PENDING_APPROVAL: "PENDING_APPROVAL", // For vendors awaiting admin approval
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const VendorApprovalStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type VendorApprovalStatus =
  (typeof VendorApprovalStatus)[keyof typeof VendorApprovalStatus];

export const EventType = {
  WORKSHOP: "WORKSHOP",
  TRIP: "TRIP",
  BAZAAR: "BAZAAR",
  CONFERENCE: "CONFERENCE",
  GYM_SESSION: "GYM_SESSION",
  OTHER: "OTHER",
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

export const EventLocation = {
  ON_CAMPUS: "ON_CAMPUS",
  OFF_CAMPUS: "OFF_CAMPUS",
} as const;

export type EventLocation = (typeof EventLocation)[keyof typeof EventLocation];

export const RegistrationStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  ATTENDED: "ATTENDED",
} as const;

export type RegistrationStatus =
  (typeof RegistrationStatus)[keyof typeof RegistrationStatus];

export const PaymentStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const EventStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PUBLISHED: 'PUBLISHED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
  NEEDS_EDITS: 'NEEDS_EDITS',
} as const;

export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

export const FundingSource = {
  STUDENT_UNION: "STUDENT_UNION",
  SPONSORS: "SPONSORS",
  PAID: "PAID",
  FREE: "FREE",
  // Workshop-specific funding sources (Requirement #35)
  GUC: "GUC",
  EXTERNAL: "EXTERNAL",
} as const;

export type FundingSource = (typeof FundingSource)[keyof typeof FundingSource];

export const Faculty = {
  MET: "MET",
  IET: "IET",
  ARTS: "ARTS",
  LAW: "LAW",
  PHARMACY: "PHARMACY",
  BUSINESS: "BUSINESS",
  BIOTECHNOLOGY: "BIOTECHNOLOGY",
  ALL: "ALL",
} as const;

export type Faculty = (typeof Faculty)[keyof typeof Faculty];

export const GymSessionType = {
  YOGA: "YOGA",
  PILATES: "PILATES",
  AEROBICS: "AEROBICS",
  ZUMBA: "ZUMBA",
  CROSS_CIRCUIT: "CROSS_CIRCUIT",
  KICK_BOXING: "KICK_BOXING",
  CROSSFIT: "CROSSFIT",
  CARDIO: "CARDIO",
  STRENGTH: "STRENGTH",
  DANCE: "DANCE",
  MARTIAL_ARTS: "MARTIAL_ARTS",
  OTHER: "OTHER",
} as const;

export type GymSessionType =
  (typeof GymSessionType)[keyof typeof GymSessionType];

// Gym session type color mapping for consistent UI across FE & BE
export const GYM_SESSION_TYPE_COLORS: Record<GymSessionType, { bg: string; text: string; border: string }> = {
  YOGA: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  PILATES: { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
  AEROBICS: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  ZUMBA: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
  CROSS_CIRCUIT: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  KICK_BOXING: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200" },
  CROSSFIT: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  CARDIO: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  STRENGTH: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  DANCE: { bg: "bg-fuchsia-100", text: "text-fuchsia-700", border: "border-fuchsia-200" },
  MARTIAL_ARTS: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
  OTHER: { bg: "bg-neutral-100", text: "text-neutral-700", border: "border-neutral-200" },
};

// Gym session type display labels
export const GYM_SESSION_TYPE_LABELS: Record<GymSessionType, string> = {
  YOGA: "Yoga",
  PILATES: "Pilates",
  AEROBICS: "Aerobics",
  ZUMBA: "Zumba",
  CROSS_CIRCUIT: "Cross Circuit",
  KICK_BOXING: "Kick-Boxing",
  CROSSFIT: "CrossFit",
  CARDIO: "Cardio",
  STRENGTH: "Strength Training",
  DANCE: "Dance",
  MARTIAL_ARTS: "Martial Arts",
  OTHER: "Other",
};

export const NotificationType = {
  INFO: "INFO",
  SUCCESS: "SUCCESS",
  WARNING: "WARNING",
  ERROR: "ERROR",
  EVENT_REMINDER: "EVENT_REMINDER",
  REGISTRATION_CONFIRMED: "REGISTRATION_CONFIRMED",
  ROLE_VERIFIED: "ROLE_VERIFIED",
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export declare const BoothSize: {
  readonly TWO_BY_TWO: "TWO_BY_TWO";
  readonly FOUR_BY_FOUR: "FOUR_BY_FOUR: ";
};
export type BoothSize = (typeof BoothSize)[keyof typeof BoothSize];

export declare const ApplicationType: {
  readonly BAZAAR: "BAZAAR";
  readonly PLATFORM: "PLATFORM";
};
export type ApplicationType =
  (typeof ApplicationType)[keyof typeof ApplicationType];

// ============================================================================
// REUSABLE VALIDATION SCHEMAS (Define first to avoid forward references)
// ============================================================================

/**
 * Email validation with GUC domain checking
 * Use this for academic users (students, staff, TAs, professors)
 */
export const GUCEmailSchema = z
  .string()
  .email("Invalid email address")
  .refine(
    (email) =>
      email.endsWith("@guc.edu.eg") || email.endsWith("@student.guc.edu.eg"),
    {
      message:
        "Must use a GUC email address (@guc.edu.eg or @student.guc.edu.eg)",
    },
  );

/**
 * Standard email validation (no domain restriction)
 * Use this for vendors and external users
 */
export const EmailSchema = z.string().email("Invalid email address");

/**
 * Password validation with strength requirements
 * Requires: 8+ chars, uppercase, lowercase, number, special char
 */
export const StrongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

/**
 * Basic password validation (for login, less strict)
 */
export const PasswordSchema = z.string().min(1, "Password is required");

/**
 * GUC ID validation (format: XX-XXXX or XX-XXXXX)
 */
export const GUCIdSchema = z
  .string()
  .regex(/^\d{2}-\d{4,5}$/, "Invalid GUC ID format (e.g., 43-1234)");

/**
 * Phone number validation (Egyptian format)
 */
export const PhoneNumberSchema = z
  .string()
  .regex(/^(\+20)?1[0125]\d{8}$/, "Invalid Egyptian phone number");

/**
 * URL validation
 */
export const URLSchema = z.string().url("Invalid URL format");

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const SignupAcademicSchema = z.object({
  email: GUCEmailSchema, // Use reusable schema
  password: StrongPasswordSchema, // Use reusable schema
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  role: z.enum(["STUDENT", "STAFF", "TA", "PROFESSOR"]),
  gucId: z.string().optional(),
});

export type SignupAcademicInput = z.infer<typeof SignupAcademicSchema>;

export const SignupVendorSchema = z.object({
  email: EmailSchema, // Regular email (not GUC)
  password: StrongPasswordSchema, // Use reusable schema
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  taxCardImage: z.string().optional(), // Base64 image - TODO: Make required in Sprint 2
  logoImage: z.string().optional(), // Base64 image (optional)
});

export type SignupVendorInput = z.infer<typeof SignupVendorSchema>;

export const VendorApprovalSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});

export type VendorApprovalInput = z.infer<typeof VendorApprovalSchema>;

export const LoginSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const UpdateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  companyName: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  phone: PhoneNumberSchema.optional(),
  avatar: URLSchema.optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: PasswordSchema,
  newPassword: StrongPasswordSchema,
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// ============================================================================
// EVENT SCHEMAS
//  ==========================================================================
// Base schema with common fields - used for generic event creation
export const CreateEventSchema = z.object({
  name: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  type: z.enum(['WORKSHOP', 'TRIP', 'BAZAAR', 'CONFERENCE', 'GYM_SESSION', 'OTHER']),
  location: z.enum(['ON_CAMPUS', 'OFF_CAMPUS']),
  locationDetails: z.string().min(5).max(200),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  capacity: z.number().int().positive().min(1).optional(),
  price: z.number().nonnegative().optional(),
  imageUrl: z.string().url().optional(), // Deprecated: use images instead
  images: z.array(z.string()).optional(), // Array of file IDs or URLs
  tags: z.array(z.string()).default([]),
  requirements: z.string().max(500).optional(),
  professorName: z.string().optional(), // For academic events
  registrationDeadline: z.coerce.date().optional(),
  // Workshop-specific fields
  faculty: z.string().optional(),
  fullAgenda: z.string().optional(),
  requiredBudget: z.number().nonnegative().optional(),
  fundingSource: z.string().optional(),
  extraResources: z.string().optional(),
  // Conference-specific fields
  conferenceWebsite: z.string().url().optional(),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;

// Type-specific schemas based on requirements.csv
// Req #31: BAZAAR - name, start/end date/time, location, description, registration deadline
export const CreateBazaarSchema = z.object({
  name: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  type: z.literal('BAZAAR'),
  location: z.enum(['ON_CAMPUS', 'OFF_CAMPUS']),
  locationDetails: z.string().min(5).max(200),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  registrationDeadline: z.coerce.date(),
  images: z.array(z.string()).optional(),
  requirements: z.string().max(500).optional(),
});

export type CreateBazaarInput = z.infer<typeof CreateBazaarSchema>;

// Req #33: TRIP - name, location, price, start/end date/time, description, capacity, registration deadline
export const CreateTripSchema = z.object({
  name: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  type: z.literal('TRIP'),
  location: z.enum(['ON_CAMPUS', 'OFF_CAMPUS']),
  locationDetails: z.string().min(5).max(200),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  capacity: z.number().int().positive().min(1),
  price: z.number().nonnegative(),
  registrationDeadline: z.coerce.date(),
  images: z.array(z.string()).optional(),
  requirements: z.string().max(500).optional(),
});

export type CreateTripInput = z.infer<typeof CreateTripSchema>;

// Req #45: CONFERENCE - name, start/end dates/times, description, full agenda, website link, required budget, funding source, extra resources
export const CreateConferenceSchema = z.object({
  name: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  type: z.literal('CONFERENCE'),
  location: z.enum(['ON_CAMPUS', 'OFF_CAMPUS']),
  locationDetails: z.string().min(5).max(200),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  conferenceWebsite: z.string().url(),
  fullAgenda: z.string().min(20),
  requiredBudget: z.number().nonnegative(),
  fundingSource: z.enum(['UNIVERSITY', 'EXTERNAL_FUNDING']),
  extraResources: z.string().optional(),
  images: z.array(z.string()).optional(),
  requirements: z.string().max(500).optional(),
});

export type CreateConferenceInput = z.infer<typeof CreateConferenceSchema>;

export const UpdateEventSchema = CreateEventSchema.partial().extend({
  id: z.string(),
  isArchived: z.boolean().optional(),
  status: z.enum([
    'DRAFT',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'PUBLISHED',
    'CANCELLED',
    'COMPLETED',
    'ARCHIVED',
    'NEEDS_EDITS',
  ]).optional(), // For approval workflow
  rejectionReason: z.string().optional(),
  revisionNotes: z.string().optional(),
});

export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;

export const EventFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(12),
  search: z.string().optional(),
  type: z
    .enum(["WORKSHOP", "TRIP", "BAZAAR", "CONFERENCE", "GYM_SESSION", "OTHER"])
    .optional(),
  location: z.enum(["ON_CAMPUS", "OFF_CAMPUS"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  onlyUpcoming: z.boolean().default(true),
  isArchived: z.boolean().optional(),
});

export type EventFilterInput = z.infer<typeof EventFilterSchema>;

export const createGymSessionSchema = z.object({
      name: z.string(),
      description: z.string().optional(),
      sessionType: z.nativeEnum(GymSessionType),
      startDate: z.coerce.date(),
      capacity: z.number().int().positive(),
      duration: z.number().int().positive(),
});
export type CreateGymSessionInput = z.infer<typeof createGymSessionSchema>;


export const updateGymSessionSchema = z.object({
      id: z.string(),
      startDate: z.coerce.date().optional(),
      duration: z.number().int().positive().optional(),
      capacity: z.number().int().positive().optional(),
      status: z.nativeEnum(EventStatus).optional(),
      sessionType: z.nativeEnum(GymSessionType).optional(),
}).refine(
  (v) =>
    v.startDate != null ||
    v.duration != null ||
    v.capacity != null ||
    v.status != null ||
    v.sessionType != null,
  { message: 'You need to update at least one field' }
);

export type UpdateGymSessionInput = z.infer<typeof updateGymSessionSchema>;

export const CourtSport = {
  BASKETBALL: "BASKETBALL",
  TENNIS: "TENNIS",
  FOOTBALL: "FOOTBALL",
} as const;
export type CourtSport = (typeof CourtSport)[keyof typeof CourtSport];

export const CourtSchema = z.object({
  id: z.string(),
  name: z.string(),
  sport: z.nativeEnum(CourtSport),
  location: z.string().default("ON_CAMPUS"),
  // optional capacity for team size etc. if needed
});

export const AvailabilityQuerySchema = z.object({
  courtId: z.string().optional(),
  sport: z.nativeEnum(CourtSport).optional(),
  date: z.coerce.date(),                // day to check
  slotMinutes: z.number().int().positive().default(60), // length of slot the user wants
});

export const CourtReservationCreateSchema = z.object({
  courtId: z.string(),
  startDate: z.coerce.date(),
  duration: z.number().int().positive(),           // minutes
});

export const CourtReservationCancelSchema = z.object({
  id: z.string(),
});


// ============================================================================
// WORKSHOP SCHEMAS
// ============================================================================
// Req #35: WORKSHOP - name, location (GUC Cairo/Berlin), start/end dates/times, description, 
// full agenda, faculty, professor(s), required budget, funding source, extra resources, capacity, registration deadline
export const CreateWorkshopSchema = z.object({
  name: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  type: z.literal('WORKSHOP'),
  location: z.enum(['ON_CAMPUS', 'OFF_CAMPUS']),
  locationDetails: z.enum(['GUC Cairo', 'GUC Berlin']), // Requirement #35: GUC Cairo or GUC Berlin
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  fullAgenda: z.string().min(20),
  faculty: z.enum(['MET', 'IET', 'ARTS', 'LAW', 'PHARMACY', 'BUSINESS', 'BIOTECHNOLOGY']), // Requirement #35: MET, IET, etc.
  professors: z.array(z.string()).min(1), // Requirement #35: professor(s) participating - multiple allowed
  requiredBudget: z.number().nonnegative(),
  fundingSource: z.enum(['GUC', 'EXTERNAL']), // Requirement #35: GUC or external funding
  extraResources: z.string().optional(),
  capacity: z.number().int().positive().min(1),
  registrationDeadline: z.coerce.date(), // Required per Requirement #35
  images: z.array(z.string()).optional(),
  requirements: z.string().max(500).optional(),
});

export type CreateWorkshopInput = z.infer<typeof CreateWorkshopSchema>;

// Legacy schema - kept for backwards compatibility but deprecated
export const LegacyCreateWorkshopSchema = z.object({
  id: z.string(),
  data: z.object({
    name: z.string().optional(),
    location: z.enum(['Cairo', 'Berlin']).optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    description: z.string().optional(),
    fullAgenda: z.string().optional(),
    faculty: z.enum(['MET', 'IET', 'PHARMACY', 'BIOTECHNOLOGY', 'MANAGEMENT', 'LAW', 'DESIGN']).optional(),
    professors: z.array(z.string()).optional(),
    requiredBudget: z.number().optional(),
    fundingSource: z.enum(['EXTERNAL', 'GUC']).optional(),
    extraResources: z.string().optional(),
    capacity: z.number().optional(),
    registrationDeadline: z.date().optional(),
  }),
});

export type LegacyCreateWorkshopInput = z.infer<typeof LegacyCreateWorkshopSchema>;

export const UpdateWorkshopSchema = z.object({
  id: z.string(),
  name: z.string().min(5).max(100).optional(),
  description: z.string().min(20).max(2000).optional(),
  location: z.enum(['ON_CAMPUS', 'OFF_CAMPUS']).optional(),
  locationDetails: z.enum(['GUC Cairo', 'GUC Berlin']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  fullAgenda: z.string().min(20).optional(),
  faculty: z.enum(['MET', 'IET', 'ARTS', 'LAW', 'PHARMACY', 'BUSINESS', 'BIOTECHNOLOGY']).optional(),
  professors: z.array(z.string()).min(1).optional(),
  requiredBudget: z.number().nonnegative().optional(),
  fundingSource: z.enum(['GUC', 'EXTERNAL']).optional(),
  extraResources: z.string().optional(),
  capacity: z.number().int().positive().min(1).optional(),
  registrationDeadline: z.coerce.date().optional(),
  images: z.array(z.string()).optional(),
  requirements: z.string().max(500).optional(),
});

export type UpdateWorkshopInput = z.infer<typeof UpdateWorkshopSchema>;

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
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "ATTENDED"]),
  cancellationReason: z.string().max(500).optional(),
});

export type UpdateRegistrationStatusInput = z.infer<
  typeof UpdateRegistrationStatusSchema
>;
// ============================================================================
// VENDOR APPLICATION SCHEMAS
// ============================================================================

export const CreateApplicationSchema = z.object({
  names: z.array(z.string()).min(1).max(5),
  emails: z.array(z.string().email()).min(1).max(5),

  type: z.enum(["BAZAAR", "PLATFORM"]),
  boothSize: z.enum(["TWO_BY_TWO", "FOUR_BY_FOUR"]),

  bazaarId: z.string().optional(),
  bazaarName: z.string().optional(),
  location: z.number().optional(),
  duration: z.number().min(1).max(4).optional(),
  startDate: z.coerce.date().optional(),

  status: z.enum(["APPROVED", "REJECTED", "PENDING"]),
});
export type CreateApplicationSchema = z.infer<typeof CreateApplicationSchema>;

export const UpdateApplicationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PENDING"]),
});
export type UpdateApplicationSchema = z.infer<typeof UpdateApplicationSchema>;

export const ApplicationFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(12),
  search: z.string().optional(),

  type: z.enum(["BAZAAR", "PLATFORM"]).optional(),
  boothSize: z.enum(["TWO_BY_TWO", "FOUR_BY_FOUR"]).optional(),

  bazaarId: z.string().optional(),
  location: z.number().optional(),
  duration: z.number().min(1).max(4).optional(),
  startDate: z.coerce.date().optional(),

  isApproved: z.boolean().optional(),
  status: z.enum(["APPROVED", "REJECTED", "PENDING"]).optional(),
});
export type ApplicationFilterSchema = z.infer<typeof ApplicationFilterSchema>;
// ============================================================================
// ADMIN SCHEMAS
// ============================================================================

export const AdminUserFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  role: z
    .enum([
      "STUDENT",
      "STAFF",
      "TA",
      "PROFESSOR",
      "VENDOR",
      "ADMIN",
      "EVENT_OFFICE",
    ])
    .optional(),
  status: z
    .enum(["ACTIVE", "INACTIVE", "BLOCKED", "PENDING_VERIFICATION"])
    .optional(),
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
  role: z.enum(["ADMIN", "EVENT_OFFICE"]),
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

export type MarkNotificationReadInput = z.infer<
  typeof MarkNotificationReadSchema
>;

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
  studentId?: string;
  staffId?: string;
  companyName?: string;
  bio?: string;
  phone?: string;
  avatar?: string;
  avatarType?: "upload" | "preset";
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  name: string;
  description?: string; // Optional for gym sessions
  type: EventType;
  location: EventLocation;
  locationDetails: string;
  date: Date;
  endDate?: Date;
  startDate?: Date;
  registrationDeadline?: Date;
  capacity: number;
  registeredCount: number;
  price: number;
  imageUrl?: string; // Deprecated: use images instead
  images?: string[]; // Array of file IDs or URLs
  tags: string[];
  requirements?: string;
  professorName?: string;
  isArchived: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  // Workshop-specific fields
  fullAgenda?: string;
  faculty?: string;
  professors?: string[]; // Array of professor names participating in the workshop
  professorParticipants?: string[]; // Deprecated: use professors instead
  requiredBudget?: number;
  fundingSource?: string;
  extraResources?: string;
  // Conference-specific fields
  conferenceWebsite?: string;
  // Gym session-specific fields
  sessionType?: string;
  duration?: number;
  // Status for approval workflow
  status?: string;
  rejectionReason?: string;
  revisionNotes?: string;
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
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
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

// ============================================================================
// VALIDATION HELPERS & COMMON PATTERNS
// ============================================================================

// Date range validation helper
export const createDateRangeSchema = (fieldName = "date") =>
  z
    .object({
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
    })
    .refine((data) => data.endDate > data.startDate, {
      message: `End ${fieldName} must be after start ${fieldName}`,
      path: ["endDate"],
    });

// Price range validation helper
export const createPriceRangeSchema = () =>
  z
    .object({
      minPrice: z.number().nonnegative("Price cannot be negative").optional(),
      maxPrice: z.number().nonnegative("Price cannot be negative").optional(),
    })
    .refine(
      (data) => {
        if (data.minPrice !== undefined && data.maxPrice !== undefined) {
          return data.maxPrice >= data.minPrice;
        }
        return true;
      },
      {
        message: "Maximum price must be greater than or equal to minimum price",
        path: ["maxPrice"],
      },
    );

// Pagination params schema (reusable)
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// Sort params schema (reusable)
export const SortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Search params schema (reusable)
export const SearchSchema = z.object({
  search: z.string().trim().optional(),
});

// ID param schema (reusable)
export const IdSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

// Bulk IDs schema (reusable)
export const BulkIdsSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
});

// ============================================================================
// VALIDATION ERROR FORMATTING
// ============================================================================

/**
 * Format Zod validation errors into a user-friendly format
 */
export function formatZodError(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join(".");
    formatted[path] = err.message;
  });

  return formatted;
}

/**
 * Validate data against a schema and return formatted errors
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
):
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: formatZodError(result.error) };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isGUCEmail(email: string): boolean {
  return email.endsWith("@guc.edu.eg") || email.endsWith("@student.guc.edu.eg");
}

export function isStudentEmail(email: string): boolean {
  return email.endsWith("@student.guc.edu.eg");
}

export function isStaffEmail(email: string): boolean {
  return email.endsWith("@guc.edu.eg");
}

export function isValidGUCId(id: string): boolean {
  return /^\d{2}-\d{4,5}$/.test(id);
}

export function isEgyptianPhone(phone: string): boolean {
  return /^(\+20)?1[0125]\d{8}$/.test(phone);
}
