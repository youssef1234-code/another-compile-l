/**
 * Base Service
 * 
 * Generic service layer with common business logic operations
 * Extends repository pattern with additional business rules
 */

import type { Document, FilterQuery } from 'mongoose';
import type { BaseRepository, PaginationOptions, PaginatedResult } from '../repositories/base.repository';

export interface ServiceOptions {
  userId?: string;
  role?: string;
  skipValidation?: boolean;
}

/**
 * Base Service Class
 * Extend this class for specific services
 */
export abstract class BaseService<T extends Document, R extends BaseRepository<T>> {
  protected repository: R;

  constructor(repository: R) {
    this.repository = repository;
  }

  /**
   * Find by ID with business logic
   */
  async findById(id: string, populate?: string | string[]): Promise<T | null> {
    const doc = await this.repository.findById(id, populate);
    
    if (!doc) {
      throw new Error(`${this.getEntityName()} not found`);
    }
    
    return doc;
  }

  /**
   * Create with validation
   */
  async create(data: Partial<T>, options?: ServiceOptions): Promise<T> {
    // Validate before create
    if (!options?.skipValidation) {
      await this.validateCreate(data, options);
    }
    
    // Add metadata
    const enrichedData = {
      ...data,
      createdBy: options?.userId,
      createdAt: new Date(),
    };
    
    const doc = await this.repository.create(enrichedData);
    
    // Post-create hook
    await this.afterCreate(doc);
    
    return doc;
  }

  /**
   * Update with validation
   */
  async update(
    id: string,
    updateData: Partial<T>,
    options?: ServiceOptions
  ): Promise<T> {
    // Check if exists
    const existing = await this.findById(id);
    
    if (!existing) {
      throw new Error(`${this.getEntityName()} not found`);
    }
    
    // Validate before update
    if (!options?.skipValidation) {
      await this.validateUpdate(id, updateData, existing);
    }
    
    // Add metadata
    const enrichedData = {
      ...updateData,
      updatedBy: options?.userId,
      updatedAt: new Date(),
    } as any;
    
    const doc = await this.repository.update(id, enrichedData);
    
    if (!doc) {
      throw new Error(`Failed to update ${this.getEntityName()}`);
    }
    
    // Post-update hook
    await this.afterUpdate(doc, existing);
    
    return doc;
  }

  /**
   * Delete with validation (SOFT DELETE - sets isActive to false)
   */
  async delete(id: string, options?: ServiceOptions): Promise<T> {
    // Check if exists
    const existing = await this.findById(id);
    
    if (!existing) {
      throw new Error(`${this.getEntityName()} not found`);
    }
    
    // Validate before delete
    if (!options?.skipValidation) {
      await this.validateDelete(id, existing);
    }
    
    // Soft delete with metadata
    const updateData = {
      isActive: false,
      updatedBy: options?.userId,
      updatedAt: new Date(),
    } as any;
    
    const doc = await this.repository.update(id, updateData);
    
    if (!doc) {
      throw new Error(`Failed to d
        elete ${this.getEntityName()}`);
    }
    
    // Post-delete hook
    await this.afterDelete(doc);
    
    return doc;
  }

  /**
   * Restore a soft-deleted document
   */
  async restore(id: string, options?: ServiceOptions): Promise<T> {
    const updateData = {
      isActive: true,
      updatedBy: options?.userId,
      updatedAt: new Date(),
    } as any;
    
    const doc = await this.repository.update(id, updateData);
    
    if (!doc) {
      throw new Error(`${this.getEntityName()} not found or cannot be restored`);
    }
    
    return doc;
  }

  /**
   * Permanently delete (use with caution!)
   */
  async permanentlyDelete(id: string, options?: ServiceOptions): Promise<T> {
    // Check if exists
    const existing = await this.findById(id);
    
    if (!existing) {
      throw new Error(`${this.getEntityName()} not found`);
    }
    
    // Validate before delete
    if (!options?.skipValidation) {
      await this.validateDelete(id, existing);
    }
    
    const doc = await this.repository.permanentlyDelete(id);
    
    if (!doc) {
      throw new Error(`Failed to permanently delete ${this.getEntityName()}`);
    }
    
    // Post-delete hook
    await this.afterDelete(doc);
    
    return doc;
  }

  /**
   * Find all with filters
   */
  async findAll(
    filter: FilterQuery<T> = {},
    options: {
      skip?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
      populate?: string | string[];
    } = {}
  ): Promise<T[]> {
    return this.repository.findAll(filter, options);
  }

  /**
   * Find with pagination
   */
  async findWithPagination(
    filter: FilterQuery<T> = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    return this.repository.findWithPagination(filter, options);
  }

  /**
   * Count documents
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.repository.count(filter);
  }

  /**
   * Check if exists
   */
  async exists(filter: FilterQuery<T>): Promise<boolean> {
    return this.repository.exists(filter);
  }

  // ===== Validation Hooks (Override in subclasses) =====

  /**
   * Validate before create
   */

  protected async validateCreate(_data: Partial<T>): Promise<void>;
  protected async validateCreate(_data: Partial<T>, _options?: ServiceOptions): Promise<void>;

  protected async validateCreate(_data: Partial<T>): Promise<void> {
    // Override in subclass
  }


  /**
   * Validate before update
   */
  protected async validateUpdate(
    _id: string,
    _updateData: Partial<T>,
    _existing: T
  ): Promise<void> {
    // Override in subclass
  }

  /**
   * Validate before delete
   */
  protected async validateDelete(_id: string, _existing: T): Promise<void> {
    // Override in subclass
  }

  // ===== Lifecycle Hooks (Override in subclasses) =====

  /**
   * After create hook
   */
  protected async afterCreate(_doc: T): Promise<void> {
    // Override in subclass for post-create actions
  }

  /**
   * After update hook
   */
  protected async afterUpdate(_doc: T, _previous: T): Promise<void> {
    // Override in subclass for post-update actions
  }

  /**
   * After delete hook
   */
  protected async afterDelete(_doc: T): Promise<void> {
    // Override in subclass for post-delete actions
  }

  // ===== Helper Methods =====

  /**
   * Get entity name for error messages
   */
  protected abstract getEntityName(): string;

  /**
   * Find one document
   */
  async findOne(
    filter: FilterQuery<T>,
    populate?: string | string[]
  ): Promise<T | null> {
    return this.repository.findOne(filter, populate);
  }

  /**
   * Bulk create documents
   */
  async bulkCreate(
    data: Partial<T>[],
    options?: ServiceOptions
  ): Promise<T[]> {
    // Validate all items before bulk create
    if (!options?.skipValidation) {
      for (const item of data) {
        await this.validateCreate(item);
      }
    }

    return this.repository.bulkCreate(data);
  }

  /**
   * Bulk update documents
   */
  async bulkUpdate(
    filter: FilterQuery<T>,
    updateData: Partial<T>,
    options?: ServiceOptions
  ): Promise<{ modifiedCount: number }> {
    if (!options?.skipValidation) {
      // Custom validation hook for bulk operations
      await this.validateBulkUpdate(filter, updateData);
    }

    return this.repository.bulkUpdate(filter, updateData as any);
  }

  /**
   * Bulk delete documents (SOFT DELETE - sets isActive to false)
   */
  async bulkDelete(
    filter: FilterQuery<T>,
    options?: ServiceOptions
  ): Promise<{ deletedCount: number }> {
    if (!options?.skipValidation) {
      // Custom validation hook for bulk operations
      await this.validateBulkDelete(filter);
    }

    return this.repository.bulkDelete(filter);
  }

  /**
   * Bulk restore documents
   */
  async bulkRestore(
    filter: FilterQuery<T>
  ): Promise<{ restoredCount: number }> {
    return this.repository.bulkRestore(filter);
  }

  /**
   * Bulk permanently delete (use with caution!)
   */
  async bulkPermanentlyDelete(
    filter: FilterQuery<T>,
    options?: ServiceOptions
  ): Promise<{ deletedCount: number }> {
    if (!options?.skipValidation) {
      await this.validateBulkDelete(filter);
    }

    return this.repository.bulkPermanentlyDelete(filter);
  }

  /**
   * Aggregate query with service layer
   */
  async aggregate<R = any>(pipeline: any[]): Promise<R[]> {
    return this.repository.aggregate<R>(pipeline);
  }

  /**
   * Find or create document
   */
  async findOrCreate(
    filter: FilterQuery<T>,
    createData: Partial<T>,
    options?: ServiceOptions
  ): Promise<{ doc: T; created: boolean }> {
    const existing = await this.repository.findOne(filter);
    
    if (existing) {
      return { doc: existing, created: false };
    }

    const doc = await this.create(createData, options);
    return { doc, created: true };
  }

  /**
   * Update or create document (upsert)
   */
  async upsert(
    filter: FilterQuery<T>,
    updateData: Partial<T>
  ): Promise<T> {
    const doc = await this.repository.findOneAndUpdate(
      filter,
      updateData as any,
      { upsert: true }
    );

    if (!doc) {
      throw new Error(`Failed to upsert ${this.getEntityName()}`);
    }

    return doc;
  }

  /**
   * Get distinct values for a field
   */
  async getDistinct(
    field: string,
    filter: FilterQuery<T> = {}
  ): Promise<any[]> {
    return this.repository.distinct(field, filter);
  }

  // ===== Additional Validation Hooks =====

  /**
   * Validate before bulk update
   */
  protected async validateBulkUpdate(
    _filter: FilterQuery<T>,
    _updateData: Partial<T>
  ): Promise<void> {
    // Override in subclass
  }

  /**
   * Validate before bulk delete
   */
  protected async validateBulkDelete(_filter: FilterQuery<T>): Promise<void> {
    // Override in subclass
  }
}
