/**
 * Base Repository
 * 
 * Generic repository with CRUD operations for any Mongoose model
 * Implements Repository Pattern with full type safety
 */

import type { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  populate?: string | string[];
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Base Repository Class
 * Extend this class for specific repositories
 */
export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  /**
   * Find document by ID
   */
  async findById(id: string, populate?: string | string[]): Promise<T | null> {
    let query = this.model.findById(id);
    
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(path => {
          query = query.populate(path);
        });
      } else {
        query = query.populate(populate);
      }
    }
    
    return query.exec();
  }

  /**
   * Create a new document
   */
  async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    return document.save();
  }

  /**
   * Update document by ID
   */
  async update(
    id: string,
    updateData: UpdateQuery<T>,
    options?: QueryOptions
  ): Promise<T | null> {
    return this.model.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true, ...options }
    ).exec();
  }

  /**
   * Delete document by ID (SOFT DELETE - sets isActive to false)
   * Hard delete is not available to prevent accidental data loss
   */
  async delete(id: string): Promise<T | null> {
    // Soft delete: set isActive to false
    return this.model.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() } as any,
      { new: true }
    ).exec();
  }

  /**
   * Restore a soft-deleted document (set isActive back to true)
   */
  async restore(id: string): Promise<T | null> {
    return this.model.findByIdAndUpdate(
      id,
      { isActive: true, updatedAt: new Date() } as any,
      { new: true }
    ).exec();
  }

  /**
   * Permanently delete a document (use with caution!)
   * This is a hard delete and should only be used in specific cases
   */
  async permanentlyDelete(id: string): Promise<T | null> {
    // Override the middleware to allow hard delete
    return this.model.findByIdAndDelete(id).exec();
  }

    /**
     * Find all documents with filtering
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
      let query = this.model.find(filter);

      if (options.populate) {
        if (Array.isArray(options.populate)) {
          options.populate.forEach(path => {
            query = query.populate(path);
          });
        } else {
          query = query.populate(options.populate);
        }
      }

      if (options.sort) {
        query = query.sort(options.sort);
      }

      if (options.skip !== undefined) {
        query = query.skip(options.skip);
      }

      if (options.limit !== undefined) {
        query = query.limit(options.limit);
      }

      return query.exec();
    }

  /**
   * Find with pagination
   */
  async findWithPagination(
    filter: FilterQuery<T> = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.findAll(filter, {
        skip,
        limit,
        sort: options.sort,
        populate: options.populate,
      }),
      this.count(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  /**
   * Find one document
   */
  async findOne(
    filter: FilterQuery<T>,
    populate?: string | string[]
  ): Promise<T | null> {
    let query = this.model.findOne(filter);
    
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(path => {
          query = query.populate(path);
        });
      } else {
        query = query.populate(populate);
      }
    }
    
    return query.exec();
  }

  /**
   * Count documents
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  /**
   * Check if document exists
   */
  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const count = await this.count(filter);
    return count > 0;
  }

  /**
   * Bulk create documents
   */
  async bulkCreate(data: Partial<T>[]): Promise<T[]> {
    return this.model.insertMany(data) as any;
  }

  /**
   * Bulk update documents
   */
  async bulkUpdate(
    filter: FilterQuery<T>,
    updateData: UpdateQuery<T>
  ): Promise<{ modifiedCount: number }> {
    const result = await this.model.updateMany(filter, updateData).exec();
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Bulk delete documents (SOFT DELETE - sets isActive to false for all matching)
   */
  async bulkDelete(filter: FilterQuery<T>): Promise<{ deletedCount: number }> {
    // Soft delete all matching documents
    const result = await this.model.updateMany(
      filter,
      { isActive: false, updatedAt: new Date() } as any
    ).exec();
    return { deletedCount: result.modifiedCount };
  }

  /**
   * Bulk restore (set isActive back to true for all matching documents)
   */
  async bulkRestore(filter: FilterQuery<T>): Promise<{ restoredCount: number }> {
    const result = await this.model.updateMany(
      filter,
      { isActive: true, updatedAt: new Date() } as any
    ).exec();
    return { restoredCount: result.modifiedCount };
  }

  /**
   * Bulk permanently delete (use with extreme caution!)
   */
  async bulkPermanentlyDelete(filter: FilterQuery<T>): Promise<{ deletedCount: number }> {
    const result = await this.model.deleteMany(filter).exec();
    return { deletedCount: result.deletedCount || 0 };
  }

  /**
   * Aggregate query
   */
  async aggregate<R = any>(pipeline: any[]): Promise<R[]> {
    return this.model.aggregate(pipeline).exec();
  }

  /**
   * Find one and update (upsert support)
   */
  async findOneAndUpdate(
    filter: FilterQuery<T>,
    updateData: UpdateQuery<T>,
    options?: QueryOptions & { upsert?: boolean }
  ): Promise<T | null> {
    return this.model.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true, ...options }
    ).exec();
  }

  /**
   * Update many documents
   */
  async updateMany(
    filter: FilterQuery<T>,
    updateData: UpdateQuery<T>
  ): Promise<{ modifiedCount: number; matchedCount: number }> {
    const result = await this.model.updateMany(filter, updateData).exec();
    return {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    };
  }

  /**
   * Distinct values for a field
   */
  async distinct(
    field: string,
    filter: FilterQuery<T> = {}
  ): Promise<any[]> {
    return this.model.distinct(field, filter).exec();
  }

  /**
   * Search with text index
   */
  async textSearch(
    searchText: string,
    filter: FilterQuery<T> = {},
    options: {
      skip?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
    } = {}
  ): Promise<T[]> {
    const searchFilter = {
      ...filter,
      $text: { $search: searchText },
    } as FilterQuery<T>;

    return this.findAll(searchFilter, options);
  }

  /**
   * Count documents with text search
   */
  async countTextSearch(
    searchText: string,
    filter: FilterQuery<T> = {}
  ): Promise<number> {
    const searchFilter = {
      ...filter,
      $text: { $search: searchText },
    } as FilterQuery<T>;

    return this.count(searchFilter);
  }

  /**
   * Find by IDs
   */
  async findByIds(
    ids: string[],
    populate?: string | string[]
  ): Promise<T[]> {
    let query = this.model.find({ _id: { $in: ids } } as FilterQuery<T>);
    
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(path => {
          query = query.populate(path);
        });
      } else {
        query = query.populate(populate);
      }
    }
    
    return query.exec();
  }

  /**
   * Check if any documents match filter
   */
  async existsOne(filter: FilterQuery<T>): Promise<boolean> {
    const doc = await this.model.findOne(filter).select('_id').lean().exec();
    return !!doc;
  }
}
