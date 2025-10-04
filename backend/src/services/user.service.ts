/**
 * User Service
 * 
 * Business logic layer for user management
 * Extends BaseService for standard CRUD operations
 * 
 * @module services/user.service
 */

import { BaseService } from './base.service';
import { userRepository } from '../repositories/user.repository';
import type { IUser } from '../models/user.model';
import { TRPCError } from '@trpc/server';
import { hashPassword } from '../utils/auth.util';
import { mailService } from './mail.service';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { config } from '../config/env';

export class UserService extends BaseService<IUser, typeof userRepository> {
  constructor() {
    super(userRepository);
  }

  /**
   * Get entity name for error messages
   */
  protected getEntityName(): string {
    return 'User';
  }

  /**
   * Validation hook before creating a user
   */
  protected async validateCreate(data: Partial<IUser>): Promise<void> {
    // Check if email already exists
    if (data.email) {
      const existingUser = await userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An account with this email already exists'
        });
      }
    }

    // Check if student ID already exists (for academic users)
    if (data.studentId) {
      const existingId = await userRepository.existsByStudentId(data.studentId);
      if (existingId) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This student/staff ID is already registered'
        });
      }
    }
  }

  /**
   * Validation hook before updating a user
   */
  protected async validateUpdate(id: string, data: Partial<IUser>): Promise<void> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    // Check if email is being changed and already exists
    if (data.email && data.email !== user.email) {
      const existingUser = await userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An account with this email already exists'
        });
      }
    }

    // Check if student ID is being changed and already exists
    if (data.studentId && data.studentId !== user.studentId) {
      const existingId = await userRepository.existsByStudentId(data.studentId);
      if (existingId) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This student/staff ID is already registered'
        });
      }
    }
  }

  /**
   * Validation hook before deleting a user
   */
  protected async validateDelete(id: string): Promise<void> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }
  }

  // ==================== CUSTOM USER OPERATIONS ====================

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

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user (validateCreate hook will check for duplicates)
    const user = await this.create({
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
    } as any);

    // Send verification email
    if (data.role === 'STUDENT') {
      const verificationUrl = `${config.clientUrl}/verify-email?token=${verificationToken}`;
      await mailService.sendVerificationEmail(user.email, {
        name: `${user.firstName} ${user.lastName}`,
        verificationUrl,
        expiresIn: '24 hours',
      });
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
    firstName: string;
    lastName: string;
    taxCardImage?: string; // Base64 image - optional for now, will be required in Sprint 2
    logoImage?: string; // Optional base64 image
  }): Promise<{ message: string }> {
    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Generate verification token (still need email verification)
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Store tax card and logo as base64 (in production, use file service)
    // For now, we'll store directly in user record
    const taxCardUrl = data.taxCardImage || undefined; // In production: upload to file service
    const logoUrl = data.logoImage || undefined;

    // Determine status: if no tax card, PENDING_VERIFICATION, else PENDING_APPROVAL
    const status = data.taxCardImage ? 'PENDING_APPROVAL' : 'PENDING_VERIFICATION';
    const vendorApprovalStatus = data.taxCardImage ? 'PENDING' : undefined;

    // Create vendor
    await this.create({
      email: data.email,
      password: hashedPassword,
      companyName: data.companyName,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'VENDOR',
      verificationToken,
      isVerified: false, // Need email verification first
      roleVerifiedByAdmin: !data.taxCardImage, // If no tax card, no approval needed
      isBlocked: false,
      status,
      taxCardUrl,
      logoUrl,
      taxCardVerified: false,
      vendorApprovalStatus,
    } as any);

    // Send verification email
    const verificationUrl = `${config.clientUrl}/verify-email?token=${verificationToken}`;
    await mailService.sendVerificationEmail(data.email, {
      name: data.companyName,
      verificationUrl,
      expiresIn: '24 hours',
    });

    if (data.taxCardImage) {
      return {
        message: 'Registration successful! Please verify your email. Your account will be reviewed by an administrator.'
      };
    } else {
      return {
        message: 'Registration successful! Please check your email to verify your account.'
      };
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await userRepository.findOne({ verificationToken: token } as any);

    if (!user) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid or expired verification token',
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return { message: 'Email already verified. You can log in.' };
    }

    // Verify user
    await this.update((user._id as mongoose.Types.ObjectId).toString(), {
      isVerified: true,
      status: 'ACTIVE',
      verificationToken: undefined,
    } as any);

    // Send welcome email
    const loginUrl = `${config.clientUrl}/login`;
    await mailService.sendWelcomeEmail(user.email, {
      name: `${user.firstName} ${user.lastName}`,
      loginUrl,
    });

    console.log(`✓ Email verified for ${user.email}`);

    return {
      message: 'Email verified successfully! You can now log in.',
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
    await this.update(data.userId, { verificationToken } as any);

    // Send verification email
    const verificationUrl = `${config.clientUrl}/verify-email?token=${verificationToken}`;
    await mailService.sendVerificationEmail(user.email, {
      name: `${user.firstName} ${user.lastName}`,
      verificationUrl,
      expiresIn: '24 hours',
    });

    return {
      message: 'Role verified successfully! Verification email sent to user.'
    };
  }

  /**
   * Request password reset
   * Generates reset token and sends email
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      // Don't reveal if email exists for security
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save reset token
    await this.update((user._id as mongoose.Types.ObjectId).toString(), {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    } as any);

    // Send password reset email
    const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;
    await mailService.sendPasswordResetEmail(user.email, {
      name: `${user.firstName} ${user.lastName}`,
      resetUrl,
      expiresIn: '1 hour',
    });

    console.log(`✓ Password reset email sent to ${email}`);

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  /**
   * Reset password using token
   */
  async resetPassword(data: {
    token: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    const user = await userRepository.findOne({
      passwordResetToken: data.token,
      passwordResetExpires: { $gt: new Date() },
    } as any);

    if (!user) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid or expired password reset token',
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(data.newPassword);

    // Update password and clear reset token
    await this.update((user._id as mongoose.Types.ObjectId).toString(), {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    } as any);

    console.log(`✓ Password reset successful for ${user.email}`);

    return {
      message: 'Password reset successful! You can now log in with your new password.',
    };
  }

  /**
   * Change password (for logged-in users)
   */
  async changePassword(data: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    const user = await userRepository.findById(data.userId);
    
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // Get user with password field
    const userWithPassword = await userRepository.findOne({ _id: user._id } as any, '+password');
    
    if (!userWithPassword) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // Verify current password
    const bcrypt = await import('bcrypt');
    const isValidPassword = await bcrypt.compare(data.currentPassword, userWithPassword.password);
    
    if (!isValidPassword) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(data.newPassword);

    // Update password
    await this.update((user._id as mongoose.Types.ObjectId).toString(), {
      password: hashedPassword,
    } as any);

    console.log(`✓ Password changed for ${user.email}`);

    return {
      message: 'Password changed successfully!',
    };
  }

  /**
   * Update user avatar
   */
  async updateAvatar(data: {
    userId: string;
    avatar: string;
    avatarType: 'upload' | 'preset';
  }): Promise<{ message: string }> {
    await this.update(data.userId, {
      avatar: data.avatar,
      avatarType: data.avatarType,
    } as any);

    console.log(`✓ Avatar updated for user ${data.userId}`);

    return {
      message: 'Avatar updated successfully!',
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
    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create admin/event office account (validateCreate hook will check for duplicates)
    const user = await this.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.name.split(' ')[0] || data.name,
      lastName: data.name.split(' ').slice(1).join(' ') || '',
      role: data.role,
      isVerified: true, // Admin accounts are pre-verified
      roleVerifiedByAdmin: true,
      isBlocked: false,
      status: 'ACTIVE'
    } as any);

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
    await this.delete(data.userId);

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
        populate: []
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

  /**
   * Search users by name or email
   */
  async searchUsers(query: string, options?: { page?: number; limit?: number }): Promise<{
    users: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const users = await userRepository.search(query, { skip, limit });
    const total = (await userRepository.search(query)).length;

    const formattedUsers = users.map(user => ({
      id: (user._id as any).toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyName: user.companyName,
      isBlocked: user.isBlocked
    }));

    return {
      users: formattedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: string, options?: { page?: number; limit?: number }): Promise<{
    users: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const users = await userRepository.findByRole(role, { skip, limit });
    const total = (await userRepository.findByRole(role)).length;

    const formattedUsers = users.map(user => ({
      id: (user._id as any).toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      studentId: user.studentId,
      companyName: user.companyName
    }));

    return {
      users: formattedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get pending vendor approvals
   * Business Rule: Only admins can view pending vendors
   */
  async getPendingVendors(): Promise<any[]> {
    const vendors = await userRepository.findAll({
      role: 'VENDOR',
      vendorApprovalStatus: 'PENDING',
      status: 'PENDING_APPROVAL',
    } as any);

    return vendors.map(vendor => ({
      id: (vendor._id as any).toString(),
      email: vendor.email,
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      companyName: vendor.companyName,
      taxCardUrl: vendor.taxCardUrl,
      logoUrl: vendor.logoUrl,
      createdAt: vendor.createdAt,
      isVerified: vendor.isVerified,
    }));
  }

  /**
   * Approve or reject vendor
   * Business Rule: Admin reviews tax card and approves/rejects vendor
   */
  async processVendorApproval(data: {
    userId: string;
    status: 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    adminId: string;
  }): Promise<{ message: string }> {
    const vendor = await userRepository.findById(data.userId);

    if (!vendor) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Vendor not found',
      });
    }

    if (vendor.role !== 'VENDOR') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User is not a vendor',
      });
    }

    if (vendor.vendorApprovalStatus !== 'PENDING') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Vendor has already been processed',
      });
    }

    const admin = await userRepository.findById(data.adminId);
    if (!admin || admin.role !== 'ADMIN') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can approve/reject vendors',
      });
    }

    if (data.status === 'APPROVED') {
      // Approve vendor
      await this.update(data.userId, {
        vendorApprovalStatus: 'APPROVED',
        taxCardVerified: true,
        roleVerifiedByAdmin: true,
        status: vendor.isVerified ? 'ACTIVE' : 'PENDING_VERIFICATION', // Active if email verified
      } as any);

      // Send approval email
      const loginUrl = `${config.clientUrl}/login`;
      await mailService.sendWelcomeEmail(vendor.email, {
        name: vendor.companyName || `${vendor.firstName} ${vendor.lastName}`,
        loginUrl,
      });

      console.log(`✓ Vendor approved: ${vendor.email} by admin ${admin.email}`);

      return {
        message: 'Vendor approved successfully. Approval email sent.',
      };
    } else {
      // Reject vendor
      await this.update(data.userId, {
        vendorApprovalStatus: 'REJECTED',
        vendorRejectionReason: data.rejectionReason,
        status: 'BLOCKED',
      } as any);

      // Send rejection email (you can create a new template)
      // For now, we'll just log it
      console.log(`✗ Vendor rejected: ${vendor.email} - Reason: ${data.rejectionReason}`);

      return {
        message: 'Vendor rejected successfully.',
      };
    }
  }
}

// Singleton instance
export const userService = new UserService();

