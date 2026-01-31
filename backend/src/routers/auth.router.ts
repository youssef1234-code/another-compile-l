/**
 * Authentication Router
 * 
 * tRPC router for authentication and user management operations
 * 
 * Features:
 * - Public routes: signup, login, email verification
 * - Protected routes: user profile, logout
 * - Admin routes: user management, role verification
 * 
 * @module routers/auth.router
 */

import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, adminProcedure, router } from '../trpc/trpc';
import { userService } from '../services/user.service';
import {
  SignupAcademicSchema,
  SignupVendorSchema,
  LoginSchema,
} from '../shared/index.js';
import { User } from '../models/user.model';
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/auth.util';
import { z } from 'zod';

// ==================== AUTHENTICATION ROUTES ====================

const authRoutes = {
  /**
   * Academic user signup (Student/Staff/TA/Professor)
   */
  signupAcademic: publicProcedure
    .input(SignupAcademicSchema)
    .mutation(async ({ input }) => {
      const result = await userService.signupAcademic({
        email: input.email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        studentId: input.gucId || '', // Use gucId from schema
        role: input.role as any,
      });

      return result;
    }),

  /**
   * Vendor signup
   */
  signupVendor: publicProcedure
    .input(SignupVendorSchema)
    .mutation(async ({ input }) => {
      const result = await userService.signupVendor({
        email: input.email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        companyName: input.companyName,
        taxCardImage: input.taxCardImage,
        logoImage: input.logoImage,
      });

      return result;
    }),

  /**
   * Verify email
   */
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const result = await userService.verifyEmail(input.token);
      return result;
    }),

  /**
   * Resend verification email
   * Business Rule: 5-minute cooldown between requests
   */
  resendVerificationEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const result = await userService.resendVerificationEmail(input.email);
      return result;
    }),

  /**
   * Login
   */
  login: publicProcedure
    .input(LoginSchema)
    .mutation(async ({ input }) => {
      // Find user with password
      const user = await User.findOne({ email: input.email }).select('+password');

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // Check if account is deleted/inactive
      if (user.isActive === false) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This account has been deleted. Please contact the administration for assistance.',
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
          cause: { 
            email: user.email,
            requiresVerification: true 
          },
        });
      }

      // Check if blocked
      if (user.isBlocked || user.status === 'BLOCKED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Your account has been blocked. Please contact the administration for more information.',
        });
      }

      // Check vendor approval status
      if (user.role === 'VENDOR') {
        if (user.vendorApprovalStatus === 'PENDING') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Your vendor account is pending approval. Please wait for the Events Office to review your application.',
          });
        }
        if (user.vendorApprovalStatus === 'REJECTED') {
          const reason = user.vendorRejectionReason 
            ? `Reason: ${user.vendorRejectionReason}` 
            : 'Please contact the Events Office for more information.';
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Your vendor application has been rejected. ${reason}`,
          });
        }
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
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  /**
   * Refresh access token using refresh token
   */
  refreshToken: publicProcedure
    .input(z.object({ 
      refreshToken: z.string().min(1, 'Refresh token is required') 
    }))
    .mutation(async ({ input }) => {
      try {
        // Verify refresh token
        const decoded = verifyRefreshToken(input.refreshToken);
        
        // Get user and check status
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not found',
          });
        }

        // Check if user is blocked
        if (user.isBlocked || user.status === 'BLOCKED') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Your account has been blocked',
          });
        }

        // Check if user is verified
        if (!user.isVerified) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Please verify your email',
          });
        }
        
        // Generate new access token
        const newAccessToken = generateAccessToken(
          (user._id as any).toString(),
          user.role
        );
        
        // Rotate refresh token (security best practice)
        const newRefreshToken = generateRefreshToken((user._id as any).toString());
        
        return {
          token: newAccessToken,
          refreshToken: newRefreshToken,
          message: 'Token refreshed successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired refresh token',
        });
      }
    }),

  /**
   * Logout (client-side token removal)
   */
  logout: protectedProcedure.mutation(() => {
    return { message: 'Logged out successfully' };
  }),

  /**
   * Request password reset
   */
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      return userService.requestPasswordReset(input.email);
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
      })
    )
    .mutation(async ({ input }) => {
      return userService.resetPassword({
        token: input.token,
        newPassword: input.newPassword,
      });
    }),

  /**
   * Change password (authenticated users)
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      return userService.changePassword({
        userId: (ctx.user._id as any).toString(),
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      });
    }),

  /**
   * Update profile avatar
   */
  updateAvatar: protectedProcedure
    .input(
      z.object({
        avatar: z.string(),
        avatarType: z.enum(['upload', 'preset']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      return userService.updateAvatar({
        userId: (ctx.user._id as any).toString(),
        avatar: input.avatar,
        avatarType: input.avatarType,
      });
    }),

  /**
   * Update user interests for personalized recommendations
   */
  updateInterests: protectedProcedure
    .input(
      z.object({
        interests: z.array(z.string().min(1).max(50)).max(10),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      return userService.updateInterests({
        userId: (ctx.user._id as any).toString(),
        interests: input.interests,
      });
    }),
};

// ==================== ADMIN USER MANAGEMENT ROUTES ====================

const adminRoutes = {
  /**
   * Admin: Verify staff/TA/professor role and send verification email
   */
  verifyRole: adminProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await userService.verifyRole({
        userId: input.userId,
        adminId: (ctx.user!._id as any).toString(),
      });

      return result;
    }),

  /**
   * Admin: Create admin or event office account
   */
  createAdminAccount: adminProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string().min(8),
      role: z.enum(['ADMIN', 'EVENT_OFFICE']),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await userService.createAdminAccount({
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role,
        createdBy: (ctx.user!._id as any).toString(),
      });

      return result;
    }),

  /**
   * Admin: Delete admin or event office account
   */
  deleteAdminAccount: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await userService.deleteAdminAccount({
        userId: input.userId,
        adminId: (ctx.user!._id as any).toString(),
      });

      return result;
    }),

  /**
   * Admin: Block user
   */
  blockUser: adminProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await userService.blockUser({
        userId: input.userId,
        adminId: (ctx.user!._id as any).toString(),
      });

      return result;
    }),

  /**
   * Admin: Unblock user
   */
  unblockUser: adminProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await userService.unblockUser({
        userId: input.userId,
        adminId: (ctx.user!._id as any).toString(),
      });

      return result;
    }),

  /**
   * Admin: Update user fields (for inline editing)
   */
  updateUser: adminProcedure
    .input(z.object({
      userId: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await userService.updateUser({
        userId: input.userId,
        updates: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
        },
        adminId: (ctx.user!._id as any).toString(),
      });

      return result;
    }),

  /**
   * Admin: Get all users with filters
   * Supports tablecn data table with:
   * - Global search across email, firstName, lastName
   * - Multi-field sorting
   * - Simple faceted filters (advanced mode): {role: ["ADMIN"], status: ["ACTIVE"]}
   * - Extended filters with operators (command mode): [{id, operator, value, ...}]
   * - Server-side pagination
   */
  getAllUsers: adminProcedure
    .input(z.object({
      // Pagination
      page: z.number().optional().default(1),
      perPage: z.number().optional().default(20),
      
      // Global search
      search: z.string().optional(),
      
      // Multi-field sorting: [{id: "email", desc: false}, {id: "createdAt", desc: true}]
      sort: z.array(z.object({
        id: z.string(),
        desc: z.boolean(),
      })).optional(),
      
      // Simple faceted filters: {role: ["ADMIN", "STUDENT"], status: ["ACTIVE"]}
      filters: z.record(z.array(z.string())).optional(),
      
      // Special filter for pending approvals
      pendingApprovalsOnly: z.boolean().optional(),
      
      // Extended filters with operators (for command mode)
      extendedFilters: z.array(z.object({
        id: z.string(),
        value: z.union([z.string(), z.array(z.string())]),
        operator: z.enum([
          'iLike', 'notILike', 'eq', 'ne', 'isEmpty', 'isNotEmpty',
          'lt', 'lte', 'gt', 'gte', 'isBetween', 
          'inArray', 'notInArray', 'isRelativeToToday'
        ]),
        variant: z.enum(['text', 'number', 'range', 'date', 'dateRange', 'boolean', 'select', 'multiSelect']),
        filterId: z.string(),
      })).optional(),
      
      // Join operator for extended filters (AND/OR logic)
      joinOperator: z.enum(['and', 'or']).optional().default('and'),
    }))
    .query(async ({ input }) => {
      const result = await userService.getAllUsers({
        page: input.page,
        limit: input.perPage,
        search: input.search,
        sort: input.sort,
        filters: input.filters,
        extendedFilters: input.extendedFilters,
        joinOperator: input.joinOperator,
        pendingApprovalsOnly: input.pendingApprovalsOnly,
      });

      return result;
    }),

  /**
   * Admin: Get user statistics
   */
  getUserStats: adminProcedure
    .query(async () => {
      const stats = await userService.getUserStats();
      return stats;
    }),

  /**
   * Admin: Get pending academic users (need role verification)
   */
  getPendingAcademicUsers: adminProcedure
    .query(async () => {
      const result = await userService.getPendingAcademicUsers();
      return result;
    }),

  /**
   * Admin: Search users
   */
  searchUsers: adminProcedure
    .input(z.object({
      query: z.string(),
      page: z.number().optional().default(1),
      limit: z.number().optional().default(20),
    }))
    .query(async ({ input }) => {
      const result = await userService.searchUsers(input.query, {
        page: input.page,
        limit: input.limit,
      });

      return result;
    }),

  /**
   * Admin: Get users by role
   */
  getUsersByRole: adminProcedure
    .input(z.object({
      role: z.string(),
      page: z.number().optional().default(1),
      limit: z.number().optional().default(20),
    }))
    .query(async ({ input }) => {
      const result = await userService.getUsersByRole(input.role, {
        page: input.page,
        limit: input.limit,
      });

      return result;
    }),

  /**
   * Admin: Get pending vendor approvals
   */
  getPendingVendors: adminProcedure
    .query(async () => {
      const vendors = await userService.getPendingVendors();
      return vendors;
    }),

  /**
   * Admin: Approve or reject vendor
   */
  processVendorApproval: adminProcedure
    .input(z.object({
      userId: z.string(),
      status: z.enum(['APPROVED', 'REJECTED']),
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await userService.processVendorApproval({
        userId: input.userId,
        status: input.status,
        rejectionReason: input.rejectionReason,
        adminId: ctx.user!.id, // Non-null assertion - adminProcedure ensures user exists
      });

      return result;
    }),
};

// ==================== EXPORT ROUTER ====================

// Create the auth router with all routes
export const authRouter = router({
  // Authentication routes
  signupAcademic: authRoutes.signupAcademic,
  signupVendor: authRoutes.signupVendor,
  verifyEmail: authRoutes.verifyEmail,
  resendVerificationEmail: authRoutes.resendVerificationEmail,
  login: authRoutes.login,
  me: authRoutes.me,
  refreshToken: authRoutes.refreshToken,
  logout: authRoutes.logout,
  requestPasswordReset: authRoutes.requestPasswordReset,
  resetPassword: authRoutes.resetPassword,
  changePassword: authRoutes.changePassword,
  updateAvatar: authRoutes.updateAvatar,
  updateInterests: authRoutes.updateInterests,
  
  // Admin routes
  verifyRole: adminRoutes.verifyRole,
  createAdminAccount: adminRoutes.createAdminAccount,
  deleteAdminAccount: adminRoutes.deleteAdminAccount,
  updateUser: adminRoutes.updateUser,
  blockUser: adminRoutes.blockUser,
  unblockUser: adminRoutes.unblockUser,
  getAllUsers: adminRoutes.getAllUsers,
  getUserStats: adminRoutes.getUserStats,
  getPendingAcademicUsers: adminRoutes.getPendingAcademicUsers,
  searchUsers: adminRoutes.searchUsers,
  getUsersByRole: adminRoutes.getUsersByRole,
  getPendingVendors: adminRoutes.getPendingVendors,
  processVendorApproval: adminRoutes.processVendorApproval,
});
