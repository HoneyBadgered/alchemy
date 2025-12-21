/**
 * Search Routes
 * Handles search requests across products, articles, and pages
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { SearchService } from '../services/search.service';

const searchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  types: z.string().optional().transform((val) => 
    val ? val.split(',') as ('product' | 'article' | 'page')[] : undefined
  ),
});

const suggestionsQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 5)),
});

export default async function searchRoutes(fastify: FastifyInstance) {
  const searchService = new SearchService();

  /**
   * GET /search
   * Search across products, blog posts, and pages
   */
  fastify.get('/search', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { q, limit, types } = searchQuerySchema.parse(request.query);

      const results = await searchService.search({
        query: q,
        limit,
        types,
      });

      reply.send({
        query: q,
        results,
        total: results.length,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({
          error: 'Invalid query parameters',
          details: error.errors,
        });
      } else {
        fastify.log.error(error);
        reply.code(500).send({
          error: 'Search failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });

  /**
   * GET /search/suggestions
   * Get autocomplete suggestions
   */
  fastify.get('/search/suggestions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { q, limit } = suggestionsQuerySchema.parse(request.query);

      const suggestions = await searchService.getSuggestions(q, limit);

      reply.send({
        query: q,
        suggestions,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({
          error: 'Invalid query parameters',
          details: error.errors,
        });
      } else {
        fastify.log.error(error);
        reply.code(500).send({
          error: 'Suggestions failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });
}
