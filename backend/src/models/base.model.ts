/**
 * Base Model
 * 
 * Base interface and schema options for all models
 * Provides audit fields and soft delete functionality
 * 
 * @module models/base.model
 */

import mongoose, { Document, Schema, type SchemaDefinition, type SchemaOptions } from 'mongoose';

/**
 * Base interface that all model interfaces should extend
 * Provides audit trail and soft delete fields
 */
export interface IBaseDocument extends Document {
  /**
   * Soft delete flag - false means the document is deleted
   */
  isActive: boolean;

  /**
   * User who created this document
   */
  createdBy?: mongoose.Types.ObjectId;

  /**
   * User who last updated this document
   */
  updatedBy?: mongoose.Types.ObjectId;

  /**
   * Timestamp when document was created (managed by Mongoose)
   */
  createdAt: Date;

  /**
   * Timestamp when document was last updated (managed by Mongoose)
   */
  updatedAt: Date;
}

/**
 * Base schema fields that should be added to all schemas
 */
export const baseSchemaFields: SchemaDefinition = {
  isActive: {
    type: Boolean,
    default: true,
    index: true, // Index for efficient filtering
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
};

/**
 * Base schema options that should be used by all schemas
 */
export const baseSchemaOptions: SchemaOptions = {
  timestamps: true, // Automatically manage createdAt and updatedAt
};

/**
 * Adds a pre-find middleware to filter out soft-deleted documents
 * Should be applied to all schemas
 */
export function addSoftDeleteMiddleware(schema: Schema) {
  // Filter out soft-deleted documents in find queries
  schema.pre(/^find/, function (next) {
    // Only add filter if isActive is not already in the query
    const query = (this as any).getQuery();
    if (query.isActive === undefined) {
      (this as any).where({ isActive: { $ne: false } });
    }
    next();
  });

  // Filter out soft-deleted documents in countDocuments
  schema.pre('countDocuments', function (next) {
    const query = (this as any).getQuery();
    if (query.isActive === undefined) {
      (this as any).where({ isActive: { $ne: false } });
    }
    next();
  });

  // Filter out soft-deleted documents in aggregate
  schema.pre('aggregate', function (next) {
    // Add $match stage at the beginning to filter isActive: true
    (this as any).pipeline().unshift({ $match: { isActive: { $ne: false } } });
    next();
  });
}

/**
 * Helper function to create a schema with base fields and middleware
 * 
 * @example
 * ```typescript
 * const userSchema = createBaseSchema<IUser>({
 *   email: { type: String, required: true },
 *   password: { type: String, required: true },
 *   // ... other fields
 * });
 * ```
 */
export function createBaseSchema<T extends IBaseDocument>(
  definition: SchemaDefinition,
  options?: SchemaOptions
): Schema<T> {
  // Merge base fields with custom fields
  const schemaDefinition = {
    ...definition,
    ...baseSchemaFields,
  };

  // Merge base options with custom options
  const schemaOptions = {
    ...baseSchemaOptions,
    ...options,
  };

  const schema = new Schema<T>(schemaDefinition, schemaOptions as any);

  // Add soft delete middleware
  addSoftDeleteMiddleware(schema);

  return schema;
}
