/**
 * Authentication Router
 * 
 * tRPC router for authentication operations
 * 
 * @module routers/auth.router
 */

import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc/trpc.js';
import {
  SignupAcademicSchema,
  SignupVendorSchema,
  LoginSchema,
  UserRole,
} from '../shared/types.js';
import { User } from '../models/user.model.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
} from '../utils/auth.util.js';
import { sendVerificationEmail } from '../utils/email.util.js';
import { z } from 'zod';

export const authRouter = router({
  /**
   * Academic user signup (Student/Staff/TA/Professor)
   */
  signupAcademic: publicProcedure
    .input(SignupAcademicSchema)
    .mutation(async (opts: any) => {
      const { input } = opts;
      // Check if user exists
      const existingUser = await User.findOne({ email: input.email });
      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(input.password);

      // Generate verification token
      const verificationToken = generateVerificationToken();
      const verificationTokenExpires = new Date();
      verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);

      // Create user with PENDING_VERIFICATION status
      // Admins will verify staff/TA/professor roles
      const status = input.role === 'STUDENT' ? 'PENDING_VERIFICATION' : 'PENDING_VERIFICATION';

      const user = await User.create({
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        status,
        studentId: input.studentId,
        staffId: input.staffId,
        verificationToken,
        verificationTokenExpires,
        isVerified: false,
      });

      // Send verification email (for students)
      if (input.role === 'STUDENT') {
        await sendVerificationEmail(user.email, user.firstName, verificationToken);
      }

      return {
        message: input.role === 'STUDENT' 
          ? 'Registration successful! Please check your email to verify your account.'
          : 'Registration submitted! An admin will verify your role and send you a verification email.',
        userId: (user._id as any).toString(),
      };
    }),

  /**
   * Vendor signup
   */
  signupVendor: publicProcedure
    .input(SignupVendorSchema)
    .mutation(async (opts) => {
      const { input } = opts;
      // Check if user exists
      const existingUser = await User.findOne({ email: input.email });
      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(input.password);

      // Generate verification token
      const verificationToken = generateVerificationToken();
      const verificationTokenExpires = new Date();
      verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);

      // Create vendor user
      const user = await User.create({
        email: input.email,
        password: hashedPassword,
        firstName: input.companyName.split(' ')[0] || 'Vendor',
        lastName: 'Account',
        role: 'VENDOR',
        companyName: input.companyName,
        status: 'PENDING_VERIFICATION',
        verificationToken,
        verificationTokenExpires,
        isVerified: false,
      });

      // Send verification email
      await sendVerificationEmail(user.email, user.companyName || 'Vendor', verificationToken);

      return {
        message: 'Registration successful! Please check your email to verify your account.',
        userId: (user._id as any).toString(),
      };
    }),

  /**
   * Verify email
   */
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async (opts) => {
      const { input } = opts;
      const user = await User.findOne({
        verificationToken: input.token,
        verificationTokenExpires: { $gt: new Date() },
      });

      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid or expired verification token',
        });
      }

      user.isVerified = true;
      user.status = 'ACTIVE';
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      await user.save();

      return {
        message: 'Email verified successfully! You can now log in.',
      };
    }),

  /**
   * Login
   */
  login: publicProcedure
    .input(LoginSchema)
    .mutation(async (opts) => {
      const { input } = opts;
      // Find user with password
      const user = await User.findOne({ email: input.email }).select('+password');

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // Check password
      const isPasswordValid = await comparePassword(input.password, user.password);
      if (!isPasswordValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // Check if verified
      if (!user.isVerified) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Please verify your email before logging in',
        });
      }

      // Check if blocked
      if (user.status === 'BLOCKED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Your account has been blocked',
        });
      }

      // Generate tokens
      const token = generateAccessToken((user._id as any).toString(), user.role);
      const refreshToken = generateRefreshToken((user._id as any).toString());

      // Return user without password
      const userWithoutPassword = user.toJSON();

      return {
        user: userWithoutPassword,
        token,
        refreshToken,
      };
    }),

  /**
   * Get current user
   */
  me: protectedProcedure.query(async (opts) => {
    return opts.ctx.user;
  }),

  /**
   * Logout (client-side token removal)
   */
  logout: protectedProcedure.mutation(() => {
    return { message: 'Logged out successfully' };
  }),

  /**
   * Admin: Verify staff/TA/professor role and send verification email
   */
  adminVerifyRole: adminProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(['STAFF', 'TA', 'PROFESSOR']),
    }))
    .mutation(async (opts) => {
      const { input } = opts;
      const user = await User.findById(input.userId);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      if (user.role !== input.role) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Role mismatch',
        });
      }

      // Generate new verification token
      const verificationToken = generateVerificationToken();
      const verificationTokenExpires = new Date();
      verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);

      user.verificationToken = verificationToken;
      user.verificationTokenExpires = verificationTokenExpires;
      await user.save();

      // Send verification email
      await sendVerificationEmail(user.email, user.firstName, verificationToken);

      return {
        message: 'Verification email sent successfully',
      };
    }),

  /**
   * Admin: Create admin or event office account
   */
  adminCreateAccount: adminProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string(),
      lastName: z.string(),
      role: z.enum(['ADMIN', 'EVENT_OFFICE']),
    }))
    .mutation(async (opts) => {
      const { input } = opts;
      // Check if user exists
      const existingUser = await User.findOne({ email: input.email });
      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(input.password);

      // Create user (already active and verified)
      const user = await User.create({
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        status: 'ACTIVE',
        isVerified: true,
      });

      return {
        message: 'Account created successfully',
        user: user.toJSON(),
      };
    }),

  /**
   * Admin: Delete admin or event office account
   */
  adminDeleteAccount: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async (opts) => {
      const { input, ctx } = opts;
      const user = await User.findById(input.userId);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Prevent deleting yourself
      if ((user._id as any).toString() === (ctx.user!._id as any).toString()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot delete your own account',
        });
      }

      // Only allow deleting admin/event office accounts
      if (!['ADMIN', 'EVENT_OFFICE'].includes(user.role)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only delete admin or event office accounts',
        });
      }

      await User.findByIdAndDelete(input.userId);

      return {
        message: 'Account deleted successfully',
      };
    }),

  /**
   * Admin: Block user
   */
  adminBlockUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async (opts) => {
      const { input } = opts;
      const user = await User.findById(input.userId);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      user.status = 'BLOCKED';
      await user.save();

      return {
        message: 'User blocked successfully',
      };
    }),

  /**
   * Admin: Unblock user
   */
  adminUnblockUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async (opts) => {
      const { input } = opts;
      const user = await User.findById(input.userId);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      user.status = 'ACTIVE';
      await user.save();

      return {
        message: 'User unblocked successfully',
      };
    }),

  /**
   * Admin: Get all users
   */
  adminGetUsers: adminProcedure
    .input(z.object({
      role: UserRole.optional(),
      status: z.enum(['ACTIVE', 'BLOCKED', 'PENDING_VERIFICATION']).optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async (opts) => {
      const { input } = opts;
      const filter: any = {};
      
      if (input.role) filter.role = input.role;
      if (input.status) filter.status = input.status;

      const skip = (input.page - 1) * input.limit;

      const [users, total] = await Promise.all([
        User.find(filter).skip(skip).limit(input.limit).sort({ createdAt: -1 }),
        User.countDocuments(filter),
      ]);

      return {
        users,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),
});
