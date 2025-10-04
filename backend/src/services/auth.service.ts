import { userRepository } from '../repositories/user.repository';
import { hashPassword } from '../utils/auth.util';
import { sendVerificationEmail } from '../utils/email.util';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';
import type { IUser } from '../models/user.model';

/**
 * Service Layer for Authentication
 * Implements business logic and use cases
 * Design Pattern: Service Layer + Dependency Injection
 */
export class AuthService {
  /**
   * Signup for Academic users (Student, Staff, TA, Professor)
   * Business Rule: GUC email required, Role verification by admin for Staff/TA/Prof
   */
  async signupAcademic(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    studentId: string;
    role: 'STUDENT' | 'STAFF' | 'TA' | 'PROFESSOR';
  }): Promise<{ message: string; requiresAdminApproval: boolean }> {
    // Validate GUC email
    if (!data.email.endsWith('@guc.edu.eg') && !data.email.endsWith('@student.guc.edu.eg')) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Please use your GUC email address'
      });
    }

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'An account with this email already exists'
      });
    }

    // Check if student ID is already used
    const existingId = await userRepository.existsByStudentId(data.studentId);
    if (existingId) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'This student/staff ID is already registered'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await userRepository.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      studentId: data.studentId,
      role: data.role,
      verificationToken,
      isVerified: data.role === 'STUDENT', // Students auto-verified
      roleVerifiedByAdmin: data.role === 'STUDENT', // Students don't need admin approval
      isBlocked: false,
      status: 'PENDING_VERIFICATION'
    });

    // Send verification email
    if (data.role === 'STUDENT') {
      await sendVerificationEmail(user.email, verificationToken, `${user.firstName} ${user.lastName}`);
      return {
        message: 'Registration successful! Please check your email to verify your account.',
        requiresAdminApproval: false
      };
    } else {
      // Staff/TA/Professor need admin approval first
      return {
        message: 'Registration submitted! Please wait for admin approval. You will receive a verification email once approved.',
        requiresAdminApproval: true
      };
    }
  }

  /**
   * Signup for Vendor users
   * Business Rule: Company email, tax card and logo upload in Sprint 2
   */
  async signupVendor(data: {
    email: string;
    password: string;
    companyName: string;
  }): Promise<{ message: string }> {
    // Check if vendor already exists
    const existingVendor = await userRepository.findByEmail(data.email);
    if (existingVendor) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create vendor
    await userRepository.create({
      email: data.email,
      password: hashedPassword,
      companyName: data.companyName,
      firstName: data.companyName,
      lastName: '',
      role: 'VENDOR',
      verificationToken,
      isVerified: false, // Vendors need email verification
      roleVerifiedByAdmin: true, // Vendors don't need role verification
      isBlocked: false,
      status: 'PENDING_VERIFICATION'
    });

    // Send verification email
    await sendVerificationEmail(data.email, verificationToken, data.companyName);

    return {
      message: 'Registration successful! Please check your email to verify your account.'
    };
  }

  /**
   * Admin verifies role for Staff/TA/Professor
   * Business Rule: Only admins can verify roles, sends verification email after approval
   */
  async verifyRole(data: {
    userId: string;
    adminId: string;
  }): Promise<{ message: string }> {
    // Get user to verify
    const user = await userRepository.findById(data.userId);
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    // Check if user is academic staff
    if (!['STAFF', 'TA', 'PROFESSOR'].includes(user.role)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Only Staff, TA, and Professor roles require verification'
      });
    }

    // Check if already verified
    if (user.roleVerifiedByAdmin) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This user role is already verified'
      });
    }

    // Verify role
    await userRepository.verifyRole(data.userId);

    // Generate new verification token for email
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await userRepository.update(data.userId, { verificationToken });

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken, `${user.firstName} ${user.lastName}`);

    return {
      message: 'Role verified successfully! Verification email sent to user.'
    };
  }

  /**
   * Admin creates other admin or event office accounts
   * Business Rule: Only admins can create admin/event office accounts
   */
  async createAdminAccount(data: {
    name: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'EVENT_OFFICE';
    createdBy: string;
  }): Promise<{ message: string; user: Partial<IUser> }> {
    // Check if account already exists
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create admin/event office account
    const user = await userRepository.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.name.split(' ')[0] || data.name,
      lastName: data.name.split(' ').slice(1).join(' ') || '',
      role: data.role,
      isVerified: true, // Admin accounts are pre-verified
      roleVerifiedByAdmin: true,
      isBlocked: false,
      status: 'ACTIVE'
    });

    return {
      message: `${data.role} account created successfully!`,
      user: {
        id: (user._id as any).toString(),
        email: user.email,
        firstName: user.firstName,
        role: user.role
      }
    };
  }

  /**
   * Admin deletes admin or event office accounts
   * Business Rule: Admins can delete other admin/event office accounts
   */
  async deleteAdminAccount(data: {
    userId: string;
    adminId: string;
  }): Promise<{ message: string }> {
    // Check if deleting self
    if (data.userId === data.adminId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You cannot delete your own account'
      });
    }

    // Get user to delete
    const user = await userRepository.findById(data.userId);
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    // Check if user is admin or event office
    if (!['ADMIN', 'EVENT_OFFICE'].includes(user.role)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Only Admin and Event Office accounts can be deleted through this endpoint'
      });
    }

    // Delete user
    await userRepository.delete(data.userId);

    return {
      message: 'Account deleted successfully!'
    };
  }

  /**
   * Block user
   * Business Rule: Admins can block any user
   */
  async blockUser(data: {
    userId: string;
    adminId: string;
  }): Promise<{ message: string }> {
    // Check if blocking self
    if (data.userId === data.adminId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You cannot block your own account'
      });
    }

    // Get user
    const user = await userRepository.findById(data.userId);
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    // Block user
    await userRepository.setBlockStatus(data.userId, true);

    return {
      message: 'User blocked successfully!'
    };
  }

  /**
   * Unblock user
   * Business Rule: Admins can unblock users
   */
  async unblockUser(data: {
    userId: string;
    adminId: string;
  }): Promise<{ message: string }> {
    // Get user
    const user = await userRepository.findById(data.userId);
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    // Unblock user
    await userRepository.setBlockStatus(data.userId, false);

    return {
      message: 'User unblocked successfully!'
    };
  }

  /**
   * Get all users with filters and pagination (Admin only)
   */
  async getAllUsers(data: {
    page?: number;
    limit?: number;
    role?: string;
    status?: 'active' | 'blocked' | 'all';
    search?: string;
  }): Promise<{
    users: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = data.page || 1;
    const limit = data.limit || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    if (data.role) {
      filter.role = data.role;
    }
    if (data.status === 'active') {
      filter.isBlocked = false;
    } else if (data.status === 'blocked') {
      filter.isBlocked = true;
    }

    // Get users
    let users: IUser[];
    let total: number;

    if (data.search) {
      users = await userRepository.search(data.search, { skip, limit });
      total = (await userRepository.search(data.search)).length;
    } else {
      users = await userRepository.findAll(filter, {
        skip,
        limit,
        sort: { createdAt: -1 },
        select: '-password -verificationToken -refreshToken'
      });
      total = await userRepository.count(filter);
    }

    // Format users
    const formattedUsers = users.map(user => ({
      id: (user._id as any).toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      studentId: user.studentId,
      companyName: user.companyName,
      isVerified: user.isVerified,
      isBlocked: user.isBlocked,
      roleVerifiedByAdmin: user.roleVerifiedByAdmin,
      createdAt: user.createdAt
    }));

    return {
      users: formattedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get pending academic users (need role verification)
   */
  async getPendingAcademicUsers(): Promise<any[]> {
    const users = await userRepository.findPendingAcademic();
    return users.map(user => ({
      id: (user._id as any).toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      studentId: user.studentId,
      createdAt: user.createdAt
    }));
  }
}

// Singleton instance
export const authService = new AuthService();
