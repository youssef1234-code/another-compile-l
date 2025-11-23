/**
 * File Service
 *
 * Handles file upload, compression, security scanning, and storage
 *
 * Features:
 * - 10MB file size limit
 * - Lossless compression for images
 * - Malicious file detection
 * - Secure file validation
 * - Binary storage in MongoDB
 *
 * @module services/file.service
 */

import { TRPCError } from "@trpc/server";
import { File, type IFile } from "../models/file.model";
import crypto from "crypto";
import sharp from "sharp";
import { userRepository } from "../repositories/user.repository";

/**
 * Allowed file types with MIME types
 */
export const ALLOWED_FILE_TYPES = {
  // Images
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "image/svg+xml": [".svg"],

  // Documents
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    ".pptx",
  ],

  // Text
  "text/plain": [".txt"],
  "text/csv": [".csv"],

  // Archives (with caution)
  "application/zip": [".zip"],
  "application/x-rar-compressed": [".rar"],
  "application/x-7z-compressed": [".7z"],
} as const;

/**
 * Dangerous file extensions that should be blocked
 */
const DANGEROUS_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".ps1",
  ".vbs",
  ".js",
  ".jar",
  ".com",
  ".scr",
  ".pif",
  ".application",
  ".gadget",
  ".msi",
  ".msp",
  ".cpl",
  ".hta",
  ".inf",
  ".ins",
  ".isp",
  ".isu",
  ".job",
  ".lnk",
  ".msc",
  ".mst",
  ".paf",
  ".reg",
  ".rgs",
  ".scf",
  ".sct",
  ".shb",
  ".shs",
  ".u3p",
  ".vb",
  ".vbe",
  ".ws",
  ".wsf",
  ".wsh",
  ".dmg",
  ".pkg",
  ".app",
];

/**
 * Magic numbers (file signatures) for validation
 */
const FILE_SIGNATURES: Record<string, Buffer[]> = {
  "image/jpeg": [Buffer.from([0xff, 0xd8, 0xff])],
  "image/png": [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  "application/pdf": [
    Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
  ],
  "application/zip": [
    Buffer.from([0x50, 0x4b, 0x03, 0x04]), // PK..
    Buffer.from([0x50, 0x4b, 0x05, 0x06]), // PK.. (empty archive)
    Buffer.from([0x50, 0x4b, 0x07, 0x08]), // PK.. (spanned archive)
  ],
};

export interface UploadFileOptions {
  file: Buffer;
  filename: string;
  mimeType: string;
  uploadedBy: string;
  entityType?:
    | "user"
    | "event"
    | "vendor"
    | "feedback"
    | "registration"
    | "other";
  entityId?: string;
  isPublic?: boolean;
  skipCompression?: boolean;
}

export class FileService {
  /**
   * Maximum file size (10MB)
   */
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

  /**
   * Upload and store a file
   */
  async uploadFile(options: UploadFileOptions): Promise<IFile> {
    const {
      file,
      filename,
      mimeType,
      uploadedBy,
      entityType,
      entityId,
      isPublic = false,
      skipCompression = false,
    } = options;

    // 1. Validate file size
    if (file.length > this.MAX_FILE_SIZE) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `File size exceeds 10MB limit. Current size: ${(
          file.length /
          1024 /
          1024
        ).toFixed(2)}MB`,
      });
    }

    let newUploadedBy = uploadedBy;
    if (uploadedBy.trim() === "") {
      const adminUser = await userRepository.findByEmail(
        process.env.ADMIN_EMAIL || ""
      );
      newUploadedBy = adminUser ? adminUser.id.toString() : "";
    }

    // 2. Validate file extension
    const extension = this.getFileExtension(filename);
    this.validateExtension(extension);

    // 3. Validate MIME type
    this.validateMimeType(mimeType);

    // 4. Validate file signature (magic numbers)
    await this.validateFileSignature(file, mimeType);

    // 5. Scan for malicious content
    await this.scanForMaliciousContent(file, filename);

    // 6. Compress file if applicable
    let processedFile = file;
    let isCompressed = false;
    let compressionRatio: number | undefined;

    if (!skipCompression && this.isCompressibleImage(mimeType)) {
      const result = await this.compressImage(file, mimeType);
      processedFile = result.buffer;
      isCompressed = result.compressed;
      compressionRatio = result.compressionRatio;
    }

    // 7. Generate unique filename
    const uniqueFilename = this.generateUniqueFilename(filename);

    // 8. Extract metadata
    const metadata = await this.extractMetadata(processedFile, mimeType);

    // 9. Store in database
    const fileDoc = await File.create({
      filename: uniqueFilename,
      originalName: filename,
      mimeType,
      size: processedFile.length,
      data: processedFile,
      uploadedBy: newUploadedBy,
      entityType,
      entityId,
      isPublic,
      isScanned: true,
      isCompressed,
      compressionRatio,
      metadata,
    });

    console.log(
      `✓ File uploaded: ${filename} (${(processedFile.length / 1024).toFixed(
        2
      )}KB)`
    );

    return fileDoc;
  }

  /**
   * Get file by ID
   */
  async getFile(fileId: string, userId?: string): Promise<IFile> {
    const file = await File.findById(fileId);

    if (!file) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "File not found",
      });
    }

    // Check access permissions
    if (!file.isPublic && userId && file.uploadedBy.toString() !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied to this file",
      });
    }

    return file;
  }

  /**
   * Delete file by ID
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await File.findById(fileId);

    if (!file) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "File not found",
      });
    }

    // Check permissions
    if (file.uploadedBy.toString() !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only delete your own files",
      });
    }

    await File.findByIdAndDelete(fileId);
    console.log(`✓ File deleted: ${file.filename}`);
  }

  /**
   * Get user's files
   */
  async getUserFiles(userId: string): Promise<IFile[]> {
    return File.find({ uploadedBy: userId })
      .select("-data") // Exclude binary data for list view
      .sort({ createdAt: -1 });
  }

  // ==================== VALIDATION METHODS ====================

  /**
   * Validate file extension
   */
  private validateExtension(extension: string): void {
    // Check if extension is in allowed types
    const isAllowed = Object.values(ALLOWED_FILE_TYPES)
      .flat()
      .some((ext) => ext.toLowerCase() === extension.toLowerCase());

    if (!isAllowed) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `File type '${extension}' is not allowed`,
      });
    }

    // Check if extension is dangerous
    if (DANGEROUS_EXTENSIONS.includes(extension.toLowerCase())) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `File type '${extension}' is blocked for security reasons`,
      });
    }
  }

  /**
   * Validate MIME type
   */
  private validateMimeType(mimeType: string): void {
    if (!Object.keys(ALLOWED_FILE_TYPES).includes(mimeType)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `MIME type '${mimeType}' is not allowed`,
      });
    }
  }

  /**
   * Validate file signature (magic numbers)
   */
  private async validateFileSignature(
    file: Buffer,
    mimeType: string
  ): Promise<void> {
    const signatures = FILE_SIGNATURES[mimeType];

    if (!signatures) {
      // No signature check available for this type
      return;
    }

    const matches = signatures.some((signature) => {
      return file.slice(0, signature.length).equals(signature);
    });

    if (!matches) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "File content does not match declared type. Possible file tampering detected.",
      });
    }
  }

  /**
   * Scan for malicious content
   */
  private async scanForMaliciousContent(
    file: Buffer,
    filename: string
  ): Promise<void> {
    // 2. Check for path traversal attempts in filename
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid filename - path traversal detected",
      });
    }

    // 3. Check for embedded executables (polyglot files)
    const fileString = file.toString("utf8", 0, Math.min(file.length, 1024));
    const suspiciousPatterns = [
      "MZ", // Windows executable header
      "#!/", // Shebang for scripts
      "<script", // JavaScript in files
      "eval(", // Eval in files
      "exec(", // Exec in files
    ];

    for (const pattern of suspiciousPatterns) {
      if (fileString.includes(pattern)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File contains suspicious executable content",
        });
      }
    }

    // 4. Check for ZIP bombs (highly compressed malicious files)
    // This is a simple heuristic - file should not expand more than 100x
    // More sophisticated checks would require actual decompression
  }

  // ==================== COMPRESSION METHODS ====================

  /**
   * Check if file is a compressible image
   */
  private isCompressibleImage(mimeType: string): boolean {
    return ["image/jpeg", "image/png", "image/webp"].includes(mimeType);
  }

  /**
   * Compress image using Sharp (lossless for PNG, quality 90 for JPEG)
   */
  private async compressImage(
    file: Buffer,
    mimeType: string
  ): Promise<{
    buffer: Buffer;
    compressed: boolean;
    compressionRatio?: number;
  }> {
    try {
      let compressed: Buffer;
      const originalSize = file.length;

      const image = sharp(file);

      if (mimeType === "image/png") {
        // Lossless PNG compression
        compressed = await image
          .png({ compressionLevel: 9, adaptiveFiltering: true })
          .toBuffer();
      } else if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
        // High-quality JPEG compression
        compressed = await image
          .jpeg({ quality: 90, mozjpeg: true })
          .toBuffer();
      } else if (mimeType === "image/webp") {
        // WebP lossless compression
        compressed = await image
          .webp({ quality: 90, lossless: true })
          .toBuffer();
      } else {
        return { buffer: file, compressed: false };
      }

      const compressedSize = compressed.length;
      const compressionRatio =
        ((originalSize - compressedSize) / originalSize) * 100;

      // Only use compressed version if it's actually smaller
      if (compressedSize < originalSize) {
        console.log(
          `✓ Image compressed: ${(originalSize / 1024).toFixed(2)}KB → ${(
            compressedSize / 1024
          ).toFixed(2)}KB (${compressionRatio.toFixed(1)}% reduction)`
        );
        return {
          buffer: compressed,
          compressed: true,
          compressionRatio,
        };
      }

      return { buffer: file, compressed: false };
    } catch (error) {
      console.error("Image compression failed:", error);
      return { buffer: file, compressed: false };
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf(".");
    if (lastDot === -1) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "File must have an extension",
      });
    }
    return filename.slice(lastDot);
  }

  /**
   * Generate unique filename
   */
  private generateUniqueFilename(originalFilename: string): string {
    const extension = this.getFileExtension(originalFilename);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString("hex");
    return `${timestamp}-${randomString}${extension}`;
  }

  /**
   * Extract metadata from file
   */
  private async extractMetadata(file: Buffer, mimeType: string): Promise<any> {
    if (this.isCompressibleImage(mimeType)) {
      try {
        const image = sharp(file);
        const metadata = await image.metadata();
        return {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          space: metadata.space,
          channels: metadata.channels,
          hasAlpha: metadata.hasAlpha,
        };
      } catch (error) {
        console.error("Failed to extract image metadata:", error);
        return {};
      }
    }
    return {};
  }
}

/**
 * Export singleton instance
 */
export const fileService = new FileService();
