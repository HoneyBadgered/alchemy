/**
 * Zone Routes
 * API endpoints for managing zones
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { adminMiddleware } from '../middleware/admin.middleware';
import { prisma } from '../utils/prisma';
import { ZoneImportService } from '../services/zone-import.service';

const createZoneSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  tagline: z.string().min(1),
  theme: z.string().min(1),
  gradient: z.string().min(1),
  bgGradient: z.string().min(1),
  accentColor: z.string().min(1),
  heroImageUrl: z.string().url().optional().nullable(),
  buttonImageUrl: z.string().url().optional().nullable(),
  defaultFilters: z.object({
    flavorProfile: z.array(z.string()),
    caffeineLevel: z.array(z.string()),
  }),
  subTabs: z.array(z.object({
    id: z.string(),
    label: z.string(),
    bias: z.array(z.string()).nullable(),
  })),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const updateZoneSchema = createZoneSchema.partial().omit({ slug: true });

const bulkImportSchema = z.object({
  format: z.enum(['csv', 'json']),
  data: z.string().optional(),
  zones: z.array(z.any()).optional(),
});

export async function zoneRoutes(fastify: FastifyInstance) {
  const zoneImportService = new ZoneImportService();

  /**
   * Get all zones
   * GET /zones
   */
  fastify.get('/zones', async (request, reply) => {
    try {
      const zones = await prisma.zones.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      return reply.send({ zones });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Get zone options for dropdowns (simplified)
   * GET /zones/options
   */
  fastify.get('/zones/options', async (request, reply) => {
    try {
      const zones = await prisma.zones.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
        },
        orderBy: { sortOrder: 'asc' },
      });
      return reply.send({ options: zones.map(z => ({ value: z.name, label: z.name })) });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Get a specific zone by ID or slug
   * GET /zones/:identifier
   */
  fastify.get('/zones/:identifier', async (request: FastifyRequest<{
    Params: { identifier: string }
  }>, reply) => {
    try {
      const { identifier } = request.params;
      
      // Try to find by slug first, then by ID
      const zone = await prisma.zones.findFirst({
        where: {
          OR: [
            { slug: identifier },
            { id: identifier },
          ],
        },
      });

      if (!zone) {
        return reply.status(404).send({ message: 'Zone not found' });
      }

      return reply.send(zone);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Create a new zone (admin only)
   * POST /admin/zones
   */
  fastify.post('/admin/zones', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const data = createZoneSchema.parse(request.body);

      // Check for duplicate name or slug
      const existing = await prisma.zones.findFirst({
        where: {
          OR: [
            { name: data.name },
            { slug: data.slug },
          ],
        },
      });

      if (existing) {
        return reply.status(400).send({ 
          message: existing.name === data.name 
            ? 'Zone with this name already exists' 
            : 'Zone with this slug already exists' 
        });
      }

      const zone = await prisma.zones.create({
        data,
      });

      return reply.status(201).send(zone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Update a zone (admin only)
   * PUT /admin/zones/:id
   */
  fastify.put('/admin/zones/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply) => {
    try {
      const { id } = request.params;
      const data = updateZoneSchema.parse(request.body);

      // Check if zone exists
      const existing = await prisma.zones.findUnique({
        where: { id },
      });

      if (!existing) {
        return reply.status(404).send({ message: 'Zone not found' });
      }

      // Check for duplicate name if name is being updated
      if (data.name && data.name !== existing.name) {
        const duplicate = await prisma.zones.findFirst({
          where: { 
            name: data.name,
            id: { not: id },
          },
        });

        if (duplicate) {
          return reply.status(400).send({ message: 'Zone with this name already exists' });
        }
      }

      const zone = await prisma.zones.update({
        where: { id },
        data,
      });

      return reply.send(zone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Delete a zone (admin only)
   * DELETE /admin/zones/:id
   */
  fastify.delete('/admin/zones/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply) => {
    try {
      const { id } = request.params;

      // Check if zone exists
      const existing = await prisma.zones.findUnique({
        where: { id },
      });

      if (!existing) {
        return reply.status(404).send({ message: 'Zone not found' });
      }

      await prisma.zones.delete({
        where: { id },
      });

      return reply.send({ message: 'Zone deleted successfully' });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Bulk import zones (admin only)
   * POST /admin/zones/bulk-import
   */
  fastify.post('/admin/zones/bulk-import', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { format, data, zones } = bulkImportSchema.parse(request.body);

      let result;
      if (format === 'csv') {
        if (!data) {
          return reply.status(400).send({ message: 'CSV data is required' });
        }
        result = await zoneImportService.importFromCSV(data);
      } else {
        if (!zones) {
          return reply.status(400).send({ message: 'Zones array is required for JSON import' });
        }
        result = await zoneImportService.importFromJSON(zones);
      }

      return reply.status(result.success ? 200 : 400).send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Download CSV template (admin only)
   * GET /admin/zones/template
   */
  fastify.get('/admin/zones/template', {
    preHandler: adminMiddleware,
  }, async (request, reply) => {
    try {
      const template = zoneImportService.generateTemplate();
      
      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', 'attachment; filename="zones-template.csv"')
        .send(template);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Update zone sort order (admin only)
   * PATCH /admin/zones/reorder
   */
  fastify.patch('/admin/zones/reorder', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest<{
    Body: { zoneIds: string[] }
  }>, reply) => {
    try {
      const { zoneIds } = request.body;

      if (!Array.isArray(zoneIds)) {
        return reply.status(400).send({ message: 'zoneIds must be an array' });
      }

      // Update sort order for each zone
      await Promise.all(
        zoneIds.map((id, index) =>
          prisma.zones.update({
            where: { id },
            data: { sortOrder: index },
          })
        )
      );

      return reply.send({ message: 'Zone order updated successfully' });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });
}
