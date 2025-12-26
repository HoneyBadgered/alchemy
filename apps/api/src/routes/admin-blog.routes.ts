import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import adminBlogService from '../services/admin-blog.service';
import { adminMiddleware } from '../middleware/admin.middleware';

export default async function adminBlogRoutes(fastify: FastifyInstance) {
  // All routes require admin middleware
  
  // Post Management
  
  // GET /admin/blog/posts - List all posts with filtering
  fastify.get('/admin/blog/posts', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { 
        type, 
        status, 
        category, 
        search, 
        isFeatured, 
        includeDeleted,
        page,
        perPage 
      } = request.query as any;
      
      const result = await adminBlogService.getPosts({
        type,
        status,
        category,
        search,
        isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
        includeDeleted: includeDeleted === 'true',
        page: page ? parseInt(page) : 1,
        perPage: perPage ? parseInt(perPage) : 20,
      });
      
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // GET /admin/blog/posts/:id - Get single post
  fastify.get('/admin/blog/posts/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const post = await adminBlogService.getPost(id);
      return reply.send(post);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // POST /admin/blog/posts - Create new post
  fastify.post('/admin/blog/posts', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      if (!user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      
      const post = await adminBlogService.createPost(user.id, request.body);
      return reply.status(201).send(post);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
  
  // PATCH /admin/blog/posts/:id - Update post
  fastify.patch('/admin/blog/posts/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const post = await adminBlogService.updatePost(id, request.body);
      return reply.send(post);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
  
  // DELETE /admin/blog/posts/:id - Soft delete post
  fastify.delete('/admin/blog/posts/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const result = await adminBlogService.deletePost(id);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // POST /admin/blog/posts/:id/restore - Restore deleted post
  fastify.post('/admin/blog/posts/:id/restore', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const post = await adminBlogService.restorePost(id);
      return reply.send(post);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // POST /admin/blog/posts/:id/publish - Publish post
  fastify.post('/admin/blog/posts/:id/publish', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const post = await adminBlogService.publishPost(id);
      return reply.send(post);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // POST /admin/blog/posts/:id/unpublish - Unpublish post
  fastify.post('/admin/blog/posts/:id/unpublish', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const post = await adminBlogService.unpublishPost(id);
      return reply.send(post);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // POST /admin/blog/posts/:id/toggle-featured - Toggle featured flag
  fastify.post('/admin/blog/posts/:id/toggle-featured', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const post = await adminBlogService.toggleFeatured(id);
      return reply.send(post);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });
  
  // Tag Management
  
  // GET /admin/blog/tags - List all tags with counts
  fastify.get('/admin/blog/tags', {
    preHandler: adminMiddleware,
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tags = await adminBlogService.getTags();
      return reply.send({ tags });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
  
  // POST /admin/blog/tags - Create tag
  fastify.post('/admin/blog/tags', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { name } = request.body as any;
      const tag = await adminBlogService.createTag(name);
      return reply.status(201).send(tag);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
  
  // PATCH /admin/blog/tags/:id - Update tag
  fastify.patch('/admin/blog/tags/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const { name } = request.body as any;
      const tag = await adminBlogService.updateTag(id, name);
      return reply.send(tag);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
  
  // DELETE /admin/blog/tags/:id - Delete tag
  fastify.delete('/admin/blog/tags/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const result = await adminBlogService.deleteTag(id);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
  
  // Statistics
  
  // GET /admin/blog/stats - Get blog statistics
  fastify.get('/admin/blog/stats', {
    preHandler: adminMiddleware,
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await adminBlogService.getStats();
      return reply.send(stats);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
}
