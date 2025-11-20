/**
 * Admin Settings Routes
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { adminMiddleware } from '../middleware/admin.middleware';
import { AdminSettingsService } from '../services/admin-settings.service';

// Schema definitions
const createSiteSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
});

const updateSiteSettingSchema = z.object({
  value: z.string(),
});

const createShippingMethodSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  estimatedDays: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

const createTaxRateSchema = z.object({
  name: z.string().min(1),
  region: z.string().min(1),
  rate: z.number().nonnegative(),
  isActive: z.boolean().optional(),
});

const createDiscountCodeSchema = z.object({
  code: z.string().min(1),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed_amount']),
  discountValue: z.number().nonnegative(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxUses: z.number().int().positive().optional(),
  validFrom: z.string().transform((str) => new Date(str)),
  validUntil: z.string().transform((str) => new Date(str)).optional(),
  isActive: z.boolean().optional(),
});

const createEmailTemplateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
  bodyText: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function adminSettingsRoutes(fastify: FastifyInstance) {
  const settingsService = new AdminSettingsService();

  // ============================================
  // Site Settings
  // ============================================

  fastify.get('/admin/settings/site', {
    preHandler: adminMiddleware,
  }, async (_request: FastifyRequest, reply) => {
    try {
      const settings = await settingsService.getSiteSettings();
      return reply.send({ settings });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  fastify.get('/admin/settings/site/:key', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { key } = request.params as { key: string };
      const setting = await settingsService.getSiteSetting(key);
      return reply.send(setting);
    } catch (error) {
      return reply.status(404).send({ message: (error as Error).message });
    }
  });

  fastify.post('/admin/settings/site', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const data = createSiteSettingSchema.parse(request.body);
      const setting = await settingsService.createSiteSetting(data);
      return reply.status(201).send(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  fastify.put('/admin/settings/site/:key', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { key } = request.params as { key: string };
      const { value } = updateSiteSettingSchema.parse(request.body);
      const setting = await settingsService.updateSiteSetting(key, value);
      return reply.send(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // ============================================
  // Shipping Methods
  // ============================================

  fastify.get('/admin/settings/shipping', {
    preHandler: adminMiddleware,
  }, async (_request: FastifyRequest, reply) => {
    try {
      const methods = await settingsService.getShippingMethods();
      return reply.send({ methods });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  fastify.post('/admin/settings/shipping', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const data = createShippingMethodSchema.parse(request.body);
      const method = await settingsService.createShippingMethod(data);
      return reply.status(201).send(method);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  fastify.put('/admin/settings/shipping/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = createShippingMethodSchema.partial().parse(request.body);
      const method = await settingsService.updateShippingMethod(id, data);
      return reply.send(method);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  fastify.delete('/admin/settings/shipping/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await settingsService.deleteShippingMethod(id);
      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // ============================================
  // Tax Rates
  // ============================================

  fastify.get('/admin/settings/tax', {
    preHandler: adminMiddleware,
  }, async (_request: FastifyRequest, reply) => {
    try {
      const rates = await settingsService.getTaxRates();
      return reply.send({ rates });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  fastify.post('/admin/settings/tax', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const data = createTaxRateSchema.parse(request.body);
      const rate = await settingsService.createTaxRate(data);
      return reply.status(201).send(rate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  fastify.put('/admin/settings/tax/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = createTaxRateSchema.partial().parse(request.body);
      const rate = await settingsService.updateTaxRate(id, data);
      return reply.send(rate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  fastify.delete('/admin/settings/tax/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await settingsService.deleteTaxRate(id);
      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // ============================================
  // Discount Codes
  // ============================================

  fastify.get('/admin/settings/discounts', {
    preHandler: adminMiddleware,
  }, async (_request: FastifyRequest, reply) => {
    try {
      const codes = await settingsService.getDiscountCodes();
      return reply.send({ codes });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  fastify.post('/admin/settings/discounts', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const data = createDiscountCodeSchema.parse(request.body);
      const code = await settingsService.createDiscountCode(data);
      return reply.status(201).send(code);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  fastify.put('/admin/settings/discounts/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = createDiscountCodeSchema.partial().parse(request.body);
      const code = await settingsService.updateDiscountCode(id, data);
      return reply.send(code);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  fastify.delete('/admin/settings/discounts/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await settingsService.deleteDiscountCode(id);
      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // ============================================
  // Email Templates
  // ============================================

  fastify.get('/admin/settings/email-templates', {
    preHandler: adminMiddleware,
  }, async (_request: FastifyRequest, reply) => {
    try {
      const templates = await settingsService.getEmailTemplates();
      return reply.send({ templates });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  fastify.post('/admin/settings/email-templates', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const data = createEmailTemplateSchema.parse(request.body);
      const template = await settingsService.createEmailTemplate(data);
      return reply.status(201).send(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  fastify.put('/admin/settings/email-templates/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = createEmailTemplateSchema.partial().parse(request.body);
      const template = await settingsService.updateEmailTemplate(id, data);
      return reply.send(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  fastify.delete('/admin/settings/email-templates/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await settingsService.deleteEmailTemplate(id);
      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });
}
