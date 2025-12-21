/**
 * Upload Routes
 * 
 * Handles file uploads for products and ingredients.
 * Files are stored locally in the uploads directory.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export async function uploadRoutes(fastify: FastifyInstance) {
  // Ensure upload directories exist
  await ensureUploadDirs();

  /**
   * POST /upload/product-image - Upload a product image
   */
  fastify.post('/upload/product-image', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ message: 'No file uploaded' });
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(data.mimetype)) {
        return reply.status(400).send({ 
          message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.' 
        });
      }

      // Generate unique filename
      const ext = data.filename.split('.').pop();
      const filename = `${crypto.randomUUID()}.${ext}`;
      const filepath = join(UPLOAD_DIR, 'products', filename);

      // Save file
      await pipeline(data.file, createWriteStream(filepath));

      // Return the URL path
      const url = `/uploads/products/${filename}`;
      
      return reply.send({
        url,
        filename,
        mimetype: data.mimetype,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Failed to upload file' });
    }
  });

  /**
   * POST /upload/ingredient-image - Upload an ingredient image
   */
  fastify.post('/upload/ingredient-image', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ message: 'No file uploaded' });
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(data.mimetype)) {
        return reply.status(400).send({ 
          message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.' 
        });
      }

      // Generate unique filename
      const ext = data.filename.split('.').pop();
      const filename = `${crypto.randomUUID()}.${ext}`;
      const filepath = join(UPLOAD_DIR, 'ingredients', filename);

      // Save file
      await pipeline(data.file, createWriteStream(filepath));

      // Return the URL path
      const url = `/uploads/ingredients/${filename}`;
      
      return reply.send({
        url,
        filename,
        mimetype: data.mimetype,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Failed to upload file' });
    }
  });

  /**
   * POST /upload/multiple-product-images - Upload multiple product images
   */
  fastify.post('/upload/multiple-product-images', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const files = request.files();
      const uploadedFiles: Array<{ url: string; filename: string; mimetype: string }> = [];

      for await (const file of files) {
        // Validate file type
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
          continue; // Skip invalid files
        }

        // Generate unique filename
        const ext = file.filename.split('.').pop();
        const filename = `${crypto.randomUUID()}.${ext}`;
        const filepath = join(UPLOAD_DIR, 'products', filename);

        // Save file
        await pipeline(file.file, createWriteStream(filepath));

        uploadedFiles.push({
          url: `/uploads/products/${filename}`,
          filename,
          mimetype: file.mimetype,
        });
      }

      if (uploadedFiles.length === 0) {
        return reply.status(400).send({ message: 'No valid files uploaded' });
      }

      return reply.send({
        files: uploadedFiles,
        count: uploadedFiles.length,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Failed to upload files' });
    }
  });
}

/**
 * Ensure upload directories exist
 */
async function ensureUploadDirs() {
  try {
    await mkdir(join(UPLOAD_DIR, 'products'), { recursive: true });
    await mkdir(join(UPLOAD_DIR, 'ingredients'), { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directories:', error);
  }
}
