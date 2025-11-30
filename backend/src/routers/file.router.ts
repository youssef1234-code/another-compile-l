/**
 * File Router
 * 
 * tRPC router for file upload and management
 * 
 * Features:
 * - File upload with security checks
 * - File compression
 * - File retrieval
 * - File deletion
 * 
 * @module routers/file.router
 */

import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, router } from '../trpc/trpc';
import { fileService } from '../services/file.service';
import { z } from 'zod';
import mongoose from 'mongoose';

export const fileRouter = router({
  /**
   * Upload file
   */
  uploadFile: protectedProcedure
    .input(
      z.object({
        file: z.string(), // Base64 encoded file
        filename: z.string(),
        mimeType: z.string(),
        entityType: z.enum(['user', 'event', 'vendor', 'feedback', 'registration', 'other']).optional(),
        entityId: z.string().optional(),
        isPublic: z.boolean().optional(),
        skipCompression: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Decode base64 file
      const fileBuffer = Buffer.from(input.file, 'base64');

      const result = await fileService.uploadFile({
        file: fileBuffer,
        filename: input.filename,
        mimeType: input.mimeType,
        uploadedBy: (ctx.user._id as mongoose.Types.ObjectId).toString(),
        entityType: input.entityType,
        entityId: input.entityId,
        isPublic: input.isPublic,
        skipCompression: input.skipCompression,
      });

      // Return without binary data
      return {
        id: (result._id as any).toString(),
        filename: result.filename,
        originalName: result.originalName,
        mimeType: result.mimeType,
        size: result.size,
        isCompressed: result.isCompressed,
        compressionRatio: result.compressionRatio,
        metadata: result.metadata,
      };
    }),


      uploadUnprotectedFile: publicProcedure
    .input(
      z.object({
        file: z.string(), // Base64 encoded file
        filename: z.string(),
        mimeType: z.string(),
        entityType: z
          .enum([
            "user",
            "event",
            "vendor",
            "feedback",
            "registration",
            "other",
          ])
          .optional(),
        entityId: z.string().optional(),
        isPublic: z.boolean().optional(),
        skipCompression: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Decode base64 file
      const fileBuffer = Buffer.from(input.file, "base64");

      const result = await fileService.uploadFile({
        file: fileBuffer,
        filename: input.filename,
        mimeType: input.mimeType,
        uploadedBy: "",
        entityType: input.entityType,
        entityId: input.entityId,
        isPublic: input.isPublic,
        skipCompression: input.skipCompression,
      });

      // Return without binary data
      return {
        id: (result._id as any).toString(),
        filename: result.filename,
        originalName: result.originalName,
        mimeType: result.mimeType,
        size: result.size,
        isCompressed: result.isCompressed,
        compressionRatio: result.compressionRatio,
        metadata: result.metadata,
      };
    }),

  /**
   * Get file metadata (without binary data)
   */
  getFileMetadata: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const file = await fileService.getFile(input.fileId, (ctx.user._id as mongoose.Types.ObjectId).toString());

      return {
        id: (file._id as mongoose.Types.ObjectId).toString(),
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        uploadedBy: file.uploadedBy.toString(),
        entityType: file.entityType,
        entityId: file.entityId?.toString(),
        isPublic: file.isPublic,
        isCompressed: file.isCompressed,
        compressionRatio: file.compressionRatio,
        metadata: file.metadata,
        createdAt: file.createdAt,
      };
    }),

  /**
   * Download file (get binary data)
   */
  downloadFile: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const file = await fileService.getFile(input.fileId, (ctx.user._id as mongoose.Types.ObjectId).toString());

      return {
        filename: file.originalName,
        mimeType: file.mimeType,
        data: file.data.toString('base64'), // Return as base64
        size: file.size,
      };
    }),

  /**
   * Download public file (no auth required)
   */
  downloadPublicFile: publicProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ input }) => {
      const file = await fileService.getFile(input.fileId);

      if (!file.isPublic) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This file is not public',
        });
      }

      return {
        filename: file.originalName,
        mimeType: file.mimeType,
        data: file.data.toString('base64'),
        size: file.size,
      };
    }),

  /**
   * Delete file
   */
  deleteFile: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      await fileService.deleteFile(input.fileId, (ctx.user._id as mongoose.Types.ObjectId).toString());

      return {
        message: 'File deleted successfully',
      };
    }),

  /**
   * Get user's files
   */
  getUserFiles: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const files = await fileService.getUserFiles((ctx.user._id as mongoose.Types.ObjectId).toString());

      return files.map(file => ({
        id: (file._id as mongoose.Types.ObjectId).toString(),
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        entityType: file.entityType,
        entityId: file.entityId?.toString(),
        isPublic: file.isPublic,
        isCompressed: file.isCompressed,
        compressionRatio: file.compressionRatio,
        metadata: file.metadata,
        createdAt: file.createdAt,
      }));
    }),
});
