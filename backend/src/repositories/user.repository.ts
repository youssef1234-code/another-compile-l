import { User, type IUser } from '../models/user.model';
import type { FilterQuery, UpdateQuery } from 'mongoose';

/**
 * Repository Pattern for User entity
 * Handles all database operations for users
 * Benefits: Centralized data access, easy testing, database independence
 */
export class UserRepository {
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).exec();
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id).exec();
  }

  /**
   * Find user by verification token
   */
  async findByVerificationToken(token: string): Promise<IUser | null> {
    return User.findOne({ verificationToken: token }).exec();
  }

  /**
   * Create a new user
   */
  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return user.save();
  }

  /**
   * Update user by ID
   */
  async update(id: string, updateData: UpdateQuery<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  /**
   * Delete user by ID
   */
  async delete(id: string): Promise<IUser | null> {
    return User.findByIdAndDelete(id).exec();
  }

  /**
   * Find all users with optional filters
   */
  async findAll(
    filter: FilterQuery<IUser> = {},
    options: {
      skip?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
      select?: string;
    } = {}
  ): Promise<IUser[]> {
    let query = User.find(filter);

    if (options.select) {
      query = query.select(options.select);
    }

    if (options.sort) {
      query = query.sort(options.sort);
    }

    if (options.skip) {
      query = query.skip(options.skip);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    return query.exec();
  }

  /**
   * Count users with optional filter
   */
  async count(filter: FilterQuery<IUser> = {}): Promise<number> {
    return User.countDocuments(filter).exec();
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await User.countDocuments({ email }).exec();
    return count > 0;
  }

  /**
   * Check if user exists by student ID
   */
  async existsByStudentId(studentId: string): Promise<boolean> {
    const count = await User.countDocuments({ studentId }).exec();
    return count > 0;
  }

  /**
   * Find users by role
   */
  async findByRole(role: string, options: {
    skip?: number;
    limit?: number;
  } = {}): Promise<IUser[]> {
    return this.findAll({ role }, options);
  }

  /**
   * Find pending academic users (not verified)
   */
  async findPendingAcademic(): Promise<IUser[]> {
    return User.find({
      role: { $in: ['Staff', 'TA', 'Professor'] },
      isVerified: false,
      roleVerifiedByAdmin: false
    }).exec();
  }

  /**
   * Block/Unblock user
   */
  async setBlockStatus(id: string, isBlocked: boolean): Promise<IUser | null> {
    return this.update(id, { isBlocked });
  }

  /**
   * Verify user email
   */
  async verifyEmail(id: string): Promise<IUser | null> {
    return this.update(id, {
      isVerified: true,
      verificationToken: null
    });
  }

  /**
   * Set role verification by admin
   */
  async verifyRole(id: string): Promise<IUser | null> {
    return this.update(id, {
      roleVerifiedByAdmin: true
    });
  }

  /**
   * Bulk operations
   */
  async bulkCreate(users: Partial<IUser>[]): Promise<any[]> {
    return User.insertMany(users) as any;
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
      },
      options
    );
  }
}

// Singleton instance
export const userRepository = new UserRepository();
