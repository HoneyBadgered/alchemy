/**
 * Blog CMS types for log entries and grimoire articles
 */

export type PostType = 'log' | 'grimoire';
export type PostStatus = 'draft' | 'published';

export enum PostCategory {
  // Grimoire-focused categories
  GUIDES = 'Guides',
  TECHNIQUES = 'Techniques',
  RECIPES = 'Recipes',
  EQUIPMENT = 'Equipment',
  WELLNESS = 'Wellness',
  SEASONAL = 'Seasonal',
  EDUCATION = 'Education',
  
  // Log-friendly categories
  UPDATES = 'Updates',
  ANNOUNCEMENTS = 'Announcements',
  EVENTS = 'Events',
  COMMUNITY = 'Community',
}

export interface BlogPost {
  id: string;
  type: PostType;
  title: string;
  slug: string;
  body: string;
  excerpt?: string;
  category?: string;
  status: PostStatus;
  isFeatured: boolean;
  authorId: string;
  heroImageUrl?: string;
  readTime?: string;
  publishedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostWithRelations extends BlogPost {
  author: {
    id: string;
    username: string;
    email: string;
  };
  tags: Tag[];
}

export interface CreatePostInput {
  type: PostType;
  title: string;
  body: string;
  excerpt?: string;
  category?: string;
  heroImageUrl?: string;
  tagIds?: string[];
  status?: PostStatus;
  isFeatured?: boolean;
}

export interface UpdatePostInput {
  title?: string;
  body?: string;
  excerpt?: string;
  category?: string;
  heroImageUrl?: string;
  tagIds?: string[];
  status?: PostStatus;
  isFeatured?: boolean;
}

export interface PostFilters {
  type?: PostType;
  status?: PostStatus;
  category?: string;
  search?: string;
  tag?: string;
  isFeatured?: boolean;
  includeDeleted?: boolean;
  page?: number;
  perPage?: number;
}

export interface PublicPostFilters {
  type?: PostType;
  category?: string;
  tag?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  deletedPosts: number;
  featuredPosts: number;
  totalTags: number;
  postsByType: {
    log: number;
    grimoire: number;
  };
  postsByCategory: Record<string, number>;
}

export interface PreviewToken {
  token: string;
  postId: string;
  expiresAt: Date;
}
