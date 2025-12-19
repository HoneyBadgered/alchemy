import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { PostCategory } from '@alchemy/core/types';

const prisma = new PrismaClient();

// Zod validation schemas
export const createPostSchema = z.object({
  type: z.enum(['log', 'grimoire']),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(100000),
  excerpt: z.string().max(500).optional(),
  category: z.nativeEnum(PostCategory).optional(),
  heroImageUrl: z.string().url().or(z.literal('')).optional(),
  tagIds: z.array(z.string()).max(10).optional().default([]),
  status: z.enum(['draft', 'published']).default('draft'),
  isFeatured: z.boolean().default(false),
}).refine(
  (data) => {
    // Category required for grimoire, optional for log
    if (data.type === 'grimoire' && !data.category) {
      return false;
    }
    return true;
  },
  {
    message: 'Category is required for grimoire posts',
    path: ['category'],
  }
);

export const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(100000).optional(),
  excerpt: z.string().max(500).optional(),
  category: z.nativeEnum(PostCategory).optional(),
  heroImageUrl: z.string().url().or(z.literal('')).optional(),
  tagIds: z.array(z.string()).max(10).optional(),
  status: z.enum(['draft', 'published']).optional(),
  isFeatured: z.boolean().optional(),
});

export const createTagSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9\s\-]+$/, {
    message: 'Only letters, numbers, spaces, and hyphens allowed',
  }),
});

// Helper functions
export function generateSlug(title: string, existingSlugs: string[]): string {
  // Convert to lowercase
  let slug = title.toLowerCase();
  
  // Trim whitespace
  slug = slug.trim();
  
  // Remove special characters (keep only a-z, 0-9, spaces, hyphens)
  slug = slug.replace(/[^a-z0-9\s\-]/g, '');
  
  // Replace spaces with hyphens
  slug = slug.replace(/\s+/g, '-');
  
  // Collapse multiple hyphens
  slug = slug.replace(/-+/g, '-');
  
  // Trim leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');
  
  // Handle collisions
  if (existingSlugs.includes(slug)) {
    let counter = 2;
    while (existingSlugs.includes(`${slug}-${counter}`)) {
      counter++;
    }
    slug = `${slug}-${counter}`;
  }
  
  return slug;
}

export function calculateReadTime(body: string): string {
  const wordsPerMinute = 200;
  const words = body.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function generateTagSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s\-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

class AdminBlogService {
  // Post Management
  
  async getPosts(filters: any = {}) {
    const {
      type,
      status,
      category,
      search,
      isFeatured,
      includeDeleted = false,
      page = 1,
      perPage = 20,
    } = filters;
    
    const where: any = {};
    
    if (type) where.type = type;
    if (status) where.status = status;
    if (category) where.category = category;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    const skip = (page - 1) * perPage;
    
    const [posts, total] = await Promise.all([
      prisma.blog_posts.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          blog_post_tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.blog_posts.count({ where }),
    ]);
    
    const postsWithTags = posts.map(post => ({
      ...post,
      tags: post.blog_post_tags.map(bpt => bpt.tag),
      blog_post_tags: undefined,
    }));
    
    return {
      posts: postsWithTags,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }
  
  async getPost(id: string) {
    const post = await prisma.blog_posts.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        blog_post_tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    return {
      ...post,
      tags: post.blog_post_tags.map(bpt => bpt.tag),
      blog_post_tags: undefined,
    };
  }
  
  async getPostBySlug(slug: string, type: 'log' | 'grimoire') {
    const post = await prisma.blog_posts.findFirst({
      where: {
        slug,
        type,
        status: 'published',
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        blog_post_tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    
    if (!post) {
      return null;
    }
    
    return {
      ...post,
      tags: post.blog_post_tags.map(bpt => bpt.tag),
      blog_post_tags: undefined,
    };
  }
  
  async createPost(authorId: string, data: any) {
    // Validate input
    const validated = createPostSchema.parse(data);
    
    // Get existing slugs to avoid collisions
    const existingPosts = await prisma.blog_posts.findMany({
      select: { slug: true },
    });
    const existingSlugs = existingPosts.map(p => p.slug);
    
    // Generate slug
    const slug = generateSlug(validated.title, existingSlugs);
    
    // Calculate read time
    const readTime = calculateReadTime(validated.body);
    
    // Create post
    const post = await prisma.blog_posts.create({
      data: {
        id: randomUUID(),
        type: validated.type,
        title: validated.title,
        slug,
        body: validated.body,
        excerpt: validated.excerpt || null,
        category: validated.category || null,
        status: validated.status,
        isFeatured: validated.isFeatured,
        authorId,
        heroImageUrl: validated.heroImageUrl || null,
        readTime,
        publishedAt: validated.status === 'published' ? new Date() : null,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
    
    // Add tags if provided
    if (validated.tagIds && validated.tagIds.length > 0) {
      await Promise.all(
        validated.tagIds.map(tagId =>
          prisma.blog_post_tags.create({
            data: {
              id: randomUUID(),
              postId: post.id,
              tagId,
            },
          })
        )
      );
    }
    
    // Fetch and return post with tags
    return this.getPost(post.id);
  }
  
  async updatePost(id: string, data: any) {
    // Validate input
    const validated = updatePostSchema.parse(data);
    
    // Get existing post
    const existingPost = await prisma.blog_posts.findUnique({
      where: { id },
    });
    
    if (!existingPost) {
      throw new Error('Post not found');
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.body !== undefined) {
      updateData.body = validated.body;
      updateData.readTime = calculateReadTime(validated.body);
    }
    if (validated.excerpt !== undefined) updateData.excerpt = validated.excerpt;
    if (validated.category !== undefined) updateData.category = validated.category;
    if (validated.heroImageUrl !== undefined) updateData.heroImageUrl = validated.heroImageUrl || null;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.isFeatured !== undefined) updateData.isFeatured = validated.isFeatured;
    
    updateData.updatedAt = new Date();
    
    // Update post
    await prisma.blog_posts.update({
      where: { id },
      data: updateData,
    });
    
    // Handle tag updates
    if (validated.tagIds !== undefined) {
      // Remove existing tags
      await prisma.blog_post_tags.deleteMany({
        where: { postId: id },
      });
      
      // Add new tags
      if (validated.tagIds.length > 0) {
        await Promise.all(
          validated.tagIds.map(tagId =>
            prisma.blog_post_tags.create({
              data: {
                id: randomUUID(),
                postId: id,
                tagId,
              },
            })
          )
        );
      }
    }
    
    return this.getPost(id);
  }
  
  async deletePost(id: string) {
    const post = await prisma.blog_posts.findUnique({ where: { id } });
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    await prisma.blog_posts.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    return { success: true, message: 'Post deleted successfully' };
  }
  
  async restorePost(id: string) {
    const post = await prisma.blog_posts.findUnique({ where: { id } });
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    await prisma.blog_posts.update({
      where: { id },
      data: {
        deletedAt: null,
        updatedAt: new Date(),
      },
    });
    
    return this.getPost(id);
  }
  
  async publishPost(id: string) {
    const post = await prisma.blog_posts.findUnique({ where: { id } });
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    await prisma.blog_posts.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: post.publishedAt || new Date(),
        updatedAt: new Date(),
      },
    });
    
    return this.getPost(id);
  }
  
  async unpublishPost(id: string) {
    const post = await prisma.blog_posts.findUnique({ where: { id } });
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    await prisma.blog_posts.update({
      where: { id },
      data: {
        status: 'draft',
        updatedAt: new Date(),
      },
    });
    
    return this.getPost(id);
  }
  
  async toggleFeatured(id: string) {
    const post = await prisma.blog_posts.findUnique({ where: { id } });
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    await prisma.blog_posts.update({
      where: { id },
      data: {
        isFeatured: !post.isFeatured,
        updatedAt: new Date(),
      },
    });
    
    return this.getPost(id);
  }
  
  // Tag Management
  
  async getTags() {
    const tags = await prisma.tags.findMany({
      include: {
        blog_post_tags: {
          include: {
            post: {
              select: {
                status: true,
                deletedAt: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    
    return tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      postCount: tag.blog_post_tags.filter(
        bpt => bpt.post.status === 'published' && !bpt.post.deletedAt
      ).length,
    }));
  }
  
  async createTag(name: string) {
    // Validate input
    const validated = createTagSchema.parse({ name });
    
    // Normalize name
    const normalizedName = normalizeTagName(validated.name);
    
    // Check for duplicate (case-insensitive)
    const existing = await prisma.tags.findFirst({
      where: {
        name: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
    });
    
    if (existing) {
      return existing;
    }
    
    // Generate slug
    const slug = generateTagSlug(normalizedName);
    
    // Create tag
    const tag = await prisma.tags.create({
      data: {
        id: randomUUID(),
        name: normalizedName,
        slug,
        updatedAt: new Date(),
      },
    });
    
    return tag;
  }
  
  async updateTag(id: string, name: string) {
    const tag = await prisma.tags.findUnique({ where: { id } });
    
    if (!tag) {
      throw new Error('Tag not found');
    }
    
    // Validate input
    const validated = createTagSchema.parse({ name });
    
    // Normalize name
    const normalizedName = normalizeTagName(validated.name);
    
    // Check for duplicate (case-insensitive)
    const existing = await prisma.tags.findFirst({
      where: {
        name: {
          equals: normalizedName,
          mode: 'insensitive',
        },
        id: {
          not: id,
        },
      },
    });
    
    if (existing) {
      throw new Error('Tag with this name already exists');
    }
    
    // Regenerate slug
    const slug = generateTagSlug(normalizedName);
    
    // Update tag
    const updated = await prisma.tags.update({
      where: { id },
      data: {
        name: normalizedName,
        slug,
        updatedAt: new Date(),
      },
    });
    
    return updated;
  }
  
  async deleteTag(id: string) {
    const tag = await prisma.tags.findUnique({
      where: { id },
      include: {
        blog_post_tags: true,
      },
    });
    
    if (!tag) {
      throw new Error('Tag not found');
    }
    
    if (tag.blog_post_tags.length > 0) {
      throw new Error(`Cannot delete tag. Used by ${tag.blog_post_tags.length} posts.`);
    }
    
    await prisma.tags.delete({
      where: { id },
    });
    
    return { success: true, message: 'Tag deleted successfully' };
  }
  
  // Statistics
  
  async getStats() {
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      deletedPosts,
      featuredPosts,
      totalTags,
      logPosts,
      grimoirePosts,
    ] = await Promise.all([
      prisma.blog_posts.count({ where: { deletedAt: null } }),
      prisma.blog_posts.count({ where: { status: 'published', deletedAt: null } }),
      prisma.blog_posts.count({ where: { status: 'draft', deletedAt: null } }),
      prisma.blog_posts.count({ where: { deletedAt: { not: null } } }),
      prisma.blog_posts.count({ where: { isFeatured: true, deletedAt: null } }),
      prisma.tags.count(),
      prisma.blog_posts.count({ where: { type: 'log', deletedAt: null } }),
      prisma.blog_posts.count({ where: { type: 'grimoire', deletedAt: null } }),
    ]);
    
    // Get posts by category
    const allPosts = await prisma.blog_posts.findMany({
      where: { deletedAt: null },
      select: { category: true },
    });
    
    const postsByCategory: Record<string, number> = {};
    allPosts.forEach(post => {
      if (post.category) {
        postsByCategory[post.category] = (postsByCategory[post.category] || 0) + 1;
      }
    });
    
    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      deletedPosts,
      featuredPosts,
      totalTags,
      postsByType: {
        log: logPosts,
        grimoire: grimoirePosts,
      },
      postsByCategory,
    };
  }
  
  // Public Endpoints
  
  async getPublishedPosts(filters: any = {}) {
    const {
      type,
      category,
      tag,
      search,
      page = 1,
      perPage = 12,
    } = filters;
    
    const where: any = {
      status: 'published',
      deletedAt: null,
    };
    
    if (type) where.type = type;
    if (category) where.category = category;
    
    if (tag) {
      where.blog_post_tags = {
        some: {
          tag: {
            slug: tag,
          },
        },
      };
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    const skip = (page - 1) * perPage;
    
    const [posts, total] = await Promise.all([
      prisma.blog_posts.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          blog_post_tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { publishedAt: 'desc' },
        ],
        skip,
        take: perPage,
      }),
      prisma.blog_posts.count({ where }),
    ]);
    
    const postsWithTags = posts.map(post => ({
      ...post,
      tags: post.blog_post_tags.map(bpt => bpt.tag),
      blog_post_tags: undefined,
    }));
    
    return {
      posts: postsWithTags,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }
  
  async getPublishedPost(slug: string, type: 'log' | 'grimoire') {
    return this.getPostBySlug(slug, type);
  }
  
  async getFeaturedPosts(limit = 3) {
    const posts = await prisma.blog_posts.findMany({
      where: {
        status: 'published',
        deletedAt: null,
        isFeatured: true,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        blog_post_tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
    
    return posts.map(post => ({
      ...post,
      tags: post.blog_post_tags.map(bpt => bpt.tag),
      blog_post_tags: undefined,
    }));
  }
  
  async getRelatedPosts(postId: string, limit = 3) {
    const post = await prisma.blog_posts.findUnique({
      where: { id: postId },
      include: {
        blog_post_tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    
    if (!post) {
      return [];
    }
    
    const tagIds = post.blog_post_tags.map(bpt => bpt.tagId);
    
    const relatedPosts = await prisma.blog_posts.findMany({
      where: {
        status: 'published',
        deletedAt: null,
        id: { not: postId },
        OR: [
          {
            blog_post_tags: {
              some: {
                tagId: {
                  in: tagIds,
                },
              },
            },
          },
          {
            category: post.category,
          },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        blog_post_tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
    
    return relatedPosts.map(p => ({
      ...p,
      tags: p.blog_post_tags.map(bpt => bpt.tag),
      blog_post_tags: undefined,
    }));
  }
}

export default new AdminBlogService();
