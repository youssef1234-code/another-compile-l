/**
 * Unit Tests for AuthService
 * 
 * Tests business logic in isolation using mocked repositories
 * Design Pattern: AAA (Arrange-Act-Assert)
 */

import { AuthService } from '../../services/auth.service';
import { userRepository } from '../../repositories/user.repository';
import { sendVerificationEmail } from '../../utils/email.util';
import { hashPassword } from '../../utils/auth.util';
import { TRPCError } from '@trpc/server';

// Mock dependencies
jest.mock('../../repositories/user.repository');
jest.mock('../../utils/email.util');
jest.mock('../../utils/auth.util');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('signupAcademic', () => {
    const mockStudentData = {
      email: 'john.doe@student.guc.edu.eg',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      studentId: '12345',
      role: 'STUDENT' as const
    };

    it('should successfully register a student', async () => {
      // Arrange
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.existsByStudentId as jest.Mock).mockResolvedValue(false);
      (hashPassword as jest.Mock).mockResolvedValue('hashedPassword123');
      (userRepository.create as jest.Mock).mockResolvedValue({
        ...mockStudentData,
        password: 'hashedPassword123',
        _id: 'user123',
        isVerified: true
      });
      (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await authService.signupAcademic(mockStudentData);

      // Assert
      expect(result).toEqual({
        message: 'Registration successful! Please check your email to verify your account.',
        requiresAdminApproval: false
      });
      expect(userRepository.findByEmail).toHaveBeenCalledWith(mockStudentData.email);
      expect(userRepository.create).toHaveBeenCalled();
      expect(sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw error for non-GUC email', async () => {
      // Arrange
      const invalidData = { ...mockStudentData, email: 'john@gmail.com' };

      // Act & Assert
      await expect(authService.signupAcademic(invalidData)).rejects.toThrow(TRPCError);
      await expect(authService.signupAcademic(invalidData)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Please use your GUC email address'
      });
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({ id: 'existing' });

      // Act & Assert
      await expect(authService.signupAcademic(mockStudentData)).rejects.toThrow(TRPCError);
      await expect(authService.signupAcademic(mockStudentData)).rejects.toMatchObject({
        code: 'CONFLICT',
        message: 'An account with this email already exists'
      });
    });

    it('should require admin approval for Staff/TA/Professor', async () => {
      // Arrange
      const staffData = { ...mockStudentData, role: 'STAFF' as const };
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.existsByStudentId as jest.Mock).mockResolvedValue(false);
      (hashPassword as jest.Mock).mockResolvedValue('hashedPassword123');
      (userRepository.create as jest.Mock).mockResolvedValue({
        ...staffData,
        password: 'hashedPassword123',
        _id: 'user123'
      });

      // Act
      const result = await authService.signupAcademic(staffData);

      // Assert
      expect(result.requiresAdminApproval).toBe(true);
      expect(result.message).toContain('admin approval');
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('signupVendor', () => {
    const mockVendorData = {
      email: 'vendor@company.com',
      password: 'SecurePass123!',
      companyName: 'Tech Corp'
    };

    it('should successfully register a vendor', async () => {
      // Arrange
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashedPassword123');
      (userRepository.create as jest.Mock).mockResolvedValue({
        ...mockVendorData,
        password: 'hashedPassword123',
        _id: 'vendor123'
      });
      (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await authService.signupVendor(mockVendorData);

      // Assert
      expect(result.message).toContain('check your email');
      expect(sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({ id: 'existing' });

      // Act & Assert
      await expect(authService.signupVendor(mockVendorData)).rejects.toThrow(TRPCError);
    });
  });

  describe('verifyRole', () => {
    it('should verify staff role and send email', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        email: 'staff@guc.edu.eg',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'STAFF',
        roleVerifiedByAdmin: false
      };
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.verifyRole as jest.Mock).mockResolvedValue(undefined);
      (userRepository.update as jest.Mock).mockResolvedValue(undefined);
      (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await authService.verifyRole({
        userId: 'user123',
        adminId: 'admin123'
      });

      // Assert
      expect(result.message).toContain('verified successfully');
      expect(userRepository.verifyRole).toHaveBeenCalledWith('user123');
      expect(sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw error for student role', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        role: 'STUDENT',
        roleVerifiedByAdmin: true
      };
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        authService.verifyRole({ userId: 'user123', adminId: 'admin123' })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('createAdminAccount', () => {
    const mockAdminData = {
      name: 'Admin User',
      email: 'admin@guc.edu.eg',
      password: 'SecurePass123!',
      role: 'ADMIN' as const,
      createdBy: 'superadmin123'
    };

    it('should successfully create admin account', async () => {
      // Arrange
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashedPassword123');
      (userRepository.create as jest.Mock).mockResolvedValue({
        _id: 'newadmin123',
        email: mockAdminData.email,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN'
      });

      // Act
      const result = await authService.createAdminAccount(mockAdminData);

      // Assert
      expect(result.message).toContain('created successfully');
      expect(result.user).toHaveProperty('id');
      expect(result.user.role).toBe('ADMIN');
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({ id: 'existing' });

      // Act & Assert
      await expect(authService.createAdminAccount(mockAdminData)).rejects.toThrow(TRPCError);
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users list', async () => {
      // Arrange
      const mockUsers = [
        { _id: 'user1', email: 'user1@guc.edu.eg', role: 'STUDENT', isBlocked: false },
        { _id: 'user2', email: 'user2@guc.edu.eg', role: 'STAFF', isBlocked: false }
      ];
      (userRepository.findAll as jest.Mock).mockResolvedValue(mockUsers);
      (userRepository.count as jest.Mock).mockResolvedValue(2);

      // Act
      const result = await authService.getAllUsers({ page: 1, limit: 10 });

      // Assert
      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter users by role', async () => {
      // Arrange
      (userRepository.findAll as jest.Mock).mockResolvedValue([]);
      (userRepository.count as jest.Mock).mockResolvedValue(0);

      // Act
      await authService.getAllUsers({ role: 'STUDENT' });

      // Assert
      expect(userRepository.findAll).toHaveBeenCalledWith(
        { role: 'STUDENT' },
        expect.any(Object)
      );
    });

    it('should search users by query', async () => {
      // Arrange
      (userRepository.search as jest.Mock).mockResolvedValue([]);

      // Act
      await authService.getAllUsers({ search: 'john' });

      // Assert
      expect(userRepository.search).toHaveBeenCalledWith('john', expect.any(Object));
    });
  });

  describe('blockUser', () => {
    it('should block user successfully', async () => {
      // Arrange
      const mockUser = { _id: 'user123', isBlocked: false };
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.setBlockStatus as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await authService.blockUser({
        userId: 'user123',
        adminId: 'admin123'
      });

      // Assert
      expect(result.message).toContain('blocked successfully');
      expect(userRepository.setBlockStatus).toHaveBeenCalledWith('user123', true);
    });

    it('should prevent admin from blocking themselves', async () => {
      // Act & Assert
      await expect(
        authService.blockUser({ userId: 'admin123', adminId: 'admin123' })
      ).rejects.toThrow(TRPCError);
    });
  });
});
