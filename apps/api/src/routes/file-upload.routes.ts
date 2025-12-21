/**
 * File Upload Routes
 * Handles file uploads for product images and ingredient images
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminMiddleware } from '../middleware/admin.middleware';
import { FileUploadService } from '../services/file-upload.service';

export async function fileUploadRoutes(fastify: FastifyInstance) {
  const productUploadService = new FileUploadService('products');
  const ingredientUploadService = new FileUploadService('ingredients');

  // ===== PRODUCT IMAGE UPLOADS =====
  
  // POST /upload/product-image - Upload a single product image
  fastify.post('/upload/product-image', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ message: 'No file uploaded' });
      }

      const result = await productUploadService.uploadFile(data);
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

      const results = await productUploadService.uploadFiles(files);
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
      await productUploadService.deleteFile(filename);
      return reply.send({ success: true });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // ===== INGREDIENT IMAGE UPLOADS =====
  
  // POST /upload/ingredient-image - Upload a single ingredient image
  fastify.post('/upload/ingredient-image', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ message: 'No file uploaded' });
      }

      const result = await ingredientUploadService.uploadFile(data);
      return reply.send(result);
    } catch (error) {
      return reply.status(400).send({ message: (error as Error).message });
    }
  });

  // POST /upload/ingredient-images - Upload multiple ingredient images
  fastify.post('/upload/ingredient-images', {
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

      const results = await ingredientUploadService.uploadFiles(files);
      return reply.send({ files: results });
    } catch (error) {
      return reply.status(400).send({ message: (error as Error).message });
    }
  });

  // DELETE /upload/ingredient-image/:filename - Delete an ingredient image
  fastify.delete('/upload/ingredient-image/:filename', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { filename } = request.params as { filename: string };
      await ingredientUploadService.deleteFile(filename);
      return reply.send({ success: true });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });
}

