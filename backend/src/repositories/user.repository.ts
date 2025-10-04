import { User, type IUser } from '../models/user.model';
import { BaseRepository } from './base.repository';
import type { FilterQuery } from 'mongoose';

/**
 * Repository Pattern for User entity
 * Extends BaseRepository for common CRUD operations
 * Handles all database operations for users
 * Benefits: Centralized data access, easy testing, database independence
 */
export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email } as FilterQuery<IUser>);
  }

  /**
   * Find user by verification token
   */
  async findByVerificationToken(token: string): Promise<IUser | null> {
    return this.findOne({ verificationToken: token } as FilterQuery<IUser>);
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    return this.exists({ email } as FilterQuery<IUser>);
  }

  /**
   * Find users by role
   */
  async findByRole(
    role: string,
    options: {
      skip?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
    } = {}
  ): Promise<IUser[]> {
    return this.findAll({ role } as FilterQuery<IUser>, options);
  }

  /**
   * Check if user exists by student ID
   */
  async existsByStudentId(studentId: string): Promise<boolean> {
    return this.exists({ studentId } as FilterQuery<IUser>);
  }

  /**
   * Find pending academic users (not verified)
   */
  async findPendingAcademic(): Promise<IUser[]> {
    return this.findAll({
      role: { $in: ['Staff', 'TA', 'Professor'] },
      isVerified: false,
      roleVerifiedByAdmin: false
    } as FilterQuery<IUser>);
  }

  /**
   * Block/Unblock user
   */
  async setBlockStatus(id: string, isBlocked: boolean): Promise<IUser | null> {
    return this.update(id, { isBlocked } as any);
  }

  /**
   * Verify user email
   */
  async verifyEmail(id: string): Promise<IUser | null> {
    return this.update(id, {
      isVerified: true,
      verificationToken: null
    } as any);
  }

  /**
   * Set role verification by admin
   */
  async verifyRole(id: string): Promise<IUser | null> {
    return this.update(id, {
      roleVerifiedByAdmin: true
    } as any);
  }

  /**
   * Search users by name or email (for admin)
   */
  async search(query: string, options: {
    skip?: number;
    limit?: number;
  } = {}): Promise<IUser[]> {
    const searchRegex = new RegExp(query, 'i');
    return this.findAll(
      {
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { companyName: searchRegex }
        ]
      } as FilterQuery<IUser>,
      options
    );
  }
}

// Singleton instance
export const userRepository = new UserRepository();
