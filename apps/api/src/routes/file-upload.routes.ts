/**
 * File Upload Routes
 * Handles file uploads for product images
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminMiddleware } from '../middleware/admin.middleware';
import { FileUploadService } from '../services/file-upload.service';

export async function fileUploadRoutes(fastify: FastifyInstance) {
  const uploadService = new FileUploadService();

  // POST /upload/product-image - Upload a single product image
  fastify.post('/upload/product-image', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ message: 'No file uploaded' });
      }

      const result = await uploadService.uploadFile(data);
      return reply.send(result);
    } catch (error) {
      return reply.status(400).send({ message: (error as Error).message });
    }
  });

  // POST /upload/product-images - Upload multiple product images
  fastify.post('/upload/product-images', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parts = request.parts();
      const files = [];
      
      for await (const part of parts) {
        if (part.type === 'file') {
          files.push(part);
        }
      }

      if (files.length === 0) {
        return reply.status(400).send({ message: 'No files uploaded' });
      }

      const results = await uploadService.uploadFiles(files);
      return reply.send({ files: results });
    } catch (error) {
      return reply.status(400).send({ message: (error as Error).message });
    }
  });

  // DELETE /upload/product-image/:filename - Delete a product image
  fastify.delete('/upload/product-image/:filename', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { filename } = request.params as { filename: string };
      await uploadService.deleteFile(filename);
      return reply.send({ success: true });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });
}
