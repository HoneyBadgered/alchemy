/**
 * Promotions Routes
 * API endpoints for coupons and promotions
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PromotionsService } from '../services/promotions.service';

const validateCouponSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().min(0),
});

const getSaleProductsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(50).optional(),
});

export async function promotionsRoutes(fastify: FastifyInstance) {
  const promotionsService = new PromotionsService();

  /**
   * Validate a coupon code
   * POST /coupons/validate
   * Public endpoint
   */
  fastify.post('/coupons/validate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = validateCouponSchema.parse(request.body);

      const result = await promotionsService.validateCoupon(data);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      const message = (error as Error).message;
      return reply.status(400).send({
        valid: false,
        message,
      });
    }
  });

  /**
   * Get products on sale
   * GET /promotions/sale
   * Public endpoint
   */
  fastify.get('/promotions/sale', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = getSaleProductsSchema.parse(request.query);

      const result = await promotionsService.getSaleProducts(params);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Check if a product is on sale
   * GET /promotions/check/:productId
   * Public endpoint
   */
  fastify.get('/promotions/check/:productId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { productId } = request.params as { productId: string };

      const isOnSale = await promotionsService.isProductOnSale(productId);
      return reply.send({ isOnSale });
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });
}
