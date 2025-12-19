import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import adminBlogService from '../services/admin-blog.service';
import { PostCategory } from '@alchemy/core/types';

export default async function blogRoutes(fastify: FastifyInstance) {
  // Public endpoints - no authentication required
  
  // GET /blog/posts - Get published posts
  fastify.get('/blog/posts', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { 
        type, 
        category, 
        tag, 
        search,
        page,
        perPage 
      } = request.query as any;
      
      const result = await adminBlogService.getPublishedPosts({
        type,
        category,
        tag,
        search,
        page: page ? parseInt(page) : 1,
        perPage: perPage ? parseInt(perPage) : 12,
      });
      
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // GET /blog/posts/:slug - Get single published post by slug
  fastify.get('/blog/posts/:slug', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { slug } = request.params as any;
      const { type } = request.query as any;
      
      if (!type || (type !== 'log' && type !== 'grimoire')) {
        return reply.status(400).send({ error: 'Type query parameter is required (log or grimoire)' });
      }
      
      const post = await adminBlogService.getPublishedPost(slug, type);
      
      if (!post) {
        return reply.status(404).send({ error: 'Post not found' });
      }
      
      return reply.send(post);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // GET /blog/featured - Get featured posts
  fastify.get('/blog/featured', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { limit } = request.query as any;
      const posts = await adminBlogService.getFeaturedPosts(limit ? parseInt(limit) : 3);
      return reply.send({ posts });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // GET /blog/categories - Get list of all categories
  fastify.get('/blog/categories', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const categories = Object.values(PostCategory);
      return reply.send({ categories });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // GET /blog/tags - Get all tags with post counts
  fastify.get('/blog/tags', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tags = await adminBlogService.getTags();
      // Filter to only tags with published posts
      const tagsWithPosts = tags.filter(tag => tag.postCount > 0);
      return reply.send({ tags: tagsWithPosts });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // GET /blog/tags/:slug/posts - Get published posts for a specific tag
  fastify.get('/blog/tags/:slug/posts', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { slug } = request.params as any;
      const { page, perPage } = request.query as any;
      
      const result = await adminBlogService.getPublishedPosts({
        tag: slug,
        page: page ? parseInt(page) : 1,
        perPage: perPage ? parseInt(perPage) : 12,
      });
      
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // GET /blog/search - Search posts by title/excerpt
  fastify.get('/blog/search', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { q, type, page, perPage } = request.query as any;
      
      if (!q) {
        return reply.status(400).send({ error: 'Query parameter "q" is required' });
      }
      
      const result = await adminBlogService.getPublishedPosts({
        search: q,
        type,
        page: page ? parseInt(page) : 1,
        perPage: perPage ? parseInt(perPage) : 12,
      });
      
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // GET /blog/posts/:id/related - Get related posts
  fastify.get('/blog/posts/:id/related', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { limit } = request.query as any;
      
      const posts = await adminBlogService.getRelatedPosts(id, limit ? parseInt(limit) : 3);
      return reply.send({ posts });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
}
