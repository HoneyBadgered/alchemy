/**
 * Admin Product Management Routes
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { adminMiddleware } from '../middleware/admin.middleware';
import { AdminProductService } from '../services/admin-product.service';

const productFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'price', 'stock', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  stock: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  stock: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export async function adminProductRoutes(fastify: FastifyInstance) {
  const productService = new AdminProductService();

  // GET /admin/products - List all products with filtering
  fastify.get('/admin/products', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const filters = productFiltersSchema.parse(request.query);
      const result = await productService.getProducts(filters);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /admin/products/categories - Get all product categories
  fastify.get('/admin/products/categories', {
    preHandler: adminMiddleware,
  }, async (_request: FastifyRequest, reply) => {
    try {
      const categories = await productService.getCategories();
      return reply.send({ categories });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /admin/products/low-stock - Get low stock products
  fastify.get('/admin/products/low-stock', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { threshold } = request.query as { threshold?: string };
      const products = await productService.getLowStockProducts(
        threshold ? parseInt(threshold) : 10
      );
      return reply.send({ products });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /admin/products/:id - Get single product
  fastify.get('/admin/products/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const product = await productService.getProduct(id);
      return reply.send(product);
    } catch (error) {
      return reply.status(404).send({ message: (error as Error).message });
    }
  });

  // POST /admin/products - Create new product
  fastify.post('/admin/products', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const data = createProductSchema.parse(request.body);
      const product = await productService.createProduct(data);
      return reply.status(201).send(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // PUT /admin/products/:id - Update product
  fastify.put('/admin/products/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = updateProductSchema.parse(request.body);
      const product = await productService.updateProduct(id, data);
      return reply.send(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // PATCH /admin/products/:id/toggle - Toggle product visibility
  fastify.patch('/admin/products/:id/toggle', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const product = await productService.toggleProductVisibility(id);
      return reply.send(product);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // DELETE /admin/products/:id - Delete product
  fastify.delete('/admin/products/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await productService.deleteProduct(id);
      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });
}
