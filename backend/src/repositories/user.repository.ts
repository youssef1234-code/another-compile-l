import { User, type IUser } from "../models/user.model";
import { BaseRepository } from "./base.repository";
import mongoose, { type FilterQuery } from "mongoose";
import { eventRepository } from "./event.repository";

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

  async findById(id: string): Promise<IUser | null> {
    return super.findById(id);
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
      role: { $in: ["Staff", "TA", "Professor"] },
      isVerified: false,
      roleVerifiedByAdmin: false,
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
      verificationToken: null,
    } as any);
  }

  /**
   * Set role verification by admin
   */
  async verifyRole(id: string): Promise<IUser | null> {
    return this.update(id, {
      roleVerifiedByAdmin: true,
    } as any);
  }

  /**
   * Search users by name or email (for admin)
   */
  async search(
    query: string,
    options: {
      skip?: number;
      limit?: number;
    } = {}
  ): Promise<IUser[]> {
    const searchRegex = new RegExp(query, "i");
    return this.findAll(
      {
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { companyName: searchRegex },
        ],
      } as FilterQuery<IUser>,
      options
    );
  }

  async favoriteEvent(userId: string, eventId: string): Promise<IUser | null> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Initialize favoriteEvents array if it doesn't exist
    if (!user.favoriteEvents) {
      user.favoriteEvents = [];
    }

    const eventObjectId = new mongoose.Types.ObjectId(eventId);
    user.favoriteEvents.push(eventObjectId);
    // filter out duplicates
    user.favoriteEvents = Array.from(
      new Set(user.favoriteEvents.map((id) => id.toString()))
    ).map((id) => new mongoose.Types.ObjectId(id));
    await this.update(userId, { favoriteEvents: user.favoriteEvents });
    return user;
  }

  async getFavoriteEvents(
    userId: string,
    _options?: { page?: number; limit?: number }
  ) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const favoriteEventsIds = user.favoriteEvents;
    if (!favoriteEventsIds || favoriteEventsIds.length === 0) {
      return [];
    }

    return eventRepository.findByIds(
      favoriteEventsIds.map((id) => id.toString())
    );
  }

  async removeFavoriteEvent(
    userId: string,
    eventId: string
  ): Promise<IUser | null> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.favoriteEvents || user.favoriteEvents.length === 0) {
      return user;
    }

    const eventObjectId = new mongoose.Types.ObjectId(eventId);
    user.favoriteEvents = user.favoriteEvents.filter(
      (id) => !id.equals(eventObjectId)
    );
    await this.update(userId, { favoriteEvents: user.favoriteEvents });
    return user;
  }

  async isFavorite(userId: string, eventId: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error("User Not Found");
    }

    if (!user.favoriteEvents || user.favoriteEvents.length === 0) {
      return false;
    }

    // Guard against invalid ObjectId input
    if (!mongoose.isValidObjectId(eventId)) {
      return false;
    }

    // Check the user.favoriteEvents array if it contains the eventId
    const eventObjectId = new mongoose.Types.ObjectId(eventId);
    // Use toString() for comparison to handle both ObjectId and string entries
    return user.favoriteEvents.some(
      (id) => id.toString() === eventObjectId.toString()
    );
  }
}

// Singleton instance
export const userRepository = new UserRepository();
