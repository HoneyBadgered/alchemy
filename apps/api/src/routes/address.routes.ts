/**
 * Address Routes
 * API endpoints for user address book management
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AddressService } from '../services/address.service';
import { authMiddleware } from '../middleware/auth';

const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  addressLine1: z.string().min(1).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  zipCode: z.string().min(1).max(20),
  country: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  isDefault: z.boolean().optional(),
});

const updateAddressSchema = z.object({
  label: z.string().max(50).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  addressLine1: z.string().min(1).max(200).optional(),
  addressLine2: z.string().max(200).optional().nullable(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  zipCode: z.string().min(1).max(20).optional(),
  country: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  isDefault: z.boolean().optional(),
});

export async function addressRoutes(fastify: FastifyInstance) {
  const addressService = new AddressService();

  /**
   * Get all addresses
   * GET /addresses
   * Requires authentication
   */
  fastify.get('/addresses', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const addresses = await addressService.getAddresses(userId);
      return reply.send({ addresses });
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Get a single address
   * GET /addresses/:id
   * Requires authentication
   */
  fastify.get('/addresses/:id', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const address = await addressService.getAddress(userId, id);
      return reply.send(address);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(500).send({ message });
    }
  });

  /**
   * Add a new address
   * POST /addresses
   * Requires authentication
   */
  fastify.post('/addresses', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const data = createAddressSchema.parse(request.body);
      const address = await addressService.addAddress(userId, data);
      return reply.status(201).send(address);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      return reply.status(400).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Update an address
   * PUT /addresses/:id
   * Requires authentication
   */
  fastify.put('/addresses/:id', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const data = updateAddressSchema.parse(request.body);
      const address = await addressService.updateAddress(userId, id, data);
      return reply.send(address);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });

  /**
   * Delete an address
   * DELETE /addresses/:id
   * Requires authentication
   */
  fastify.delete('/addresses/:id', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const result = await addressService.deleteAddress(userId, id);
      return reply.send(result);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });

  /**
   * Set an address as default
   * POST /addresses/:id/default
   * Requires authentication
   */
  fastify.post('/addresses/:id/default', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const address = await addressService.setDefaultAddress(userId, id);
      return reply.send(address);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });

  /**
   * Get default address
   * GET /addresses/default
   * Requires authentication
   */
  fastify.get('/addresses/default', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const address = await addressService.getDefaultAddress(userId);
      if (!address) {
        return reply.status(404).send({ message: 'No default address found' });
      }
      return reply.send(address);
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });
}
