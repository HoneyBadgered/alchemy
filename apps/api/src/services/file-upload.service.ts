/**
 * File Upload Service
 * Handles file uploads for product images and other assets
 */

import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import crypto from 'crypto';
import type { MultipartFile } from '@fastify/multipart';

export interface UploadResult {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  path: string;
}

export class FileUploadService {
  private uploadDir: string;
  private allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  private maxFileSize = 5 * 1024 * 1024; // 5MB

  constructor(uploadDir = './uploads/products') {
    this.uploadDir = path.resolve(uploadDir);
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: MultipartFile): void {
    if (!file.mimetype || !this.allowedImageTypes.includes(file.mimetype)) {
      throw new Error(
        `Invalid file type. Allowed types: ${this.allowedImageTypes.join(', ')}`
      );
    }

    // Note: Size validation is done during streaming
  }

  /**
   * Generate unique filename
   */
  private generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}-${random}${ext}`;
  }

  /**
   * Upload a single file
   */
  async uploadFile(file: MultipartFile): Promise<UploadResult> {
    this.validateFile(file);

    const filename = this.generateFilename(file.filename);
    const filepath = path.join(this.uploadDir, filename);

    // Stream file to disk
    await pipeline(file.file, fs.createWriteStream(filepath));

    // Check file size after upload
    const stats = fs.statSync(filepath);
    if (stats.size > this.maxFileSize) {
      // Delete file if too large
      fs.unlinkSync(filepath);
      throw new Error(`File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`);
    }

    return {
      filename,
      originalName: file.filename,
      mimetype: file.mimetype,
      size: stats.size,
      url: `/uploads/products/${filename}`,
      path: filepath,
    };
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files: MultipartFile[]): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (const file of files) {
      try {
        const result = await this.uploadFile(file);
        results.push(result);
      } catch (error) {
        // Continue uploading other files even if one fails
        console.error(`Failed to upload ${file.filename}:`, error);
      }
    }

    return results;
  }

  /**
   * Delete a file
   */
  async deleteFile(filename: string): Promise<void> {
    const filepath = path.join(this.uploadDir, filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(filenames: string[]): Promise<void> {
    for (const filename of filenames) {
      try {
        await this.deleteFile(filename);
      } catch (error) {
        console.error(`Failed to delete ${filename}:`, error);
      }
    }
  }

  /**
   * Get file info
   */
  getFileInfo(filename: string): { exists: boolean; size?: number; path?: string } {
    const filepath = path.join(this.uploadDir, filename);
    
    if (!fs.existsSync(filepath)) {
      return { exists: false };
    }

    const stats = fs.statSync(filepath);
    return {
      exists: true,
      size: stats.size,
      path: filepath,
    };
  }
}
