/**
 * Blog Endpoints
 */

import type { HttpClient } from '../client/http';
import type {
  PostType,
  PostWithRelations,
  Tag,
  CreatePostInput,
  UpdatePostInput,
  PostFilters,
  PublicPostFilters,
  Pagination,
  BlogStats,
} from '@alchemy/core';

interface PostsResponse {
  posts: PostWithRelations[];
  pagination: Pagination;
}

interface TagsResponse {
  tags: (Tag & { postCount?: number })[];
}

export class BlogEndpoints {
  constructor(private http: HttpClient) {}

  // Public Endpoints (no auth required)

  async getPosts(filters?: PublicPostFilters): Promise<PostsResponse> {
    const queryParams: Record<string, string> = {};
    if (filters?.type) queryParams.type = filters.type;
    if (filters?.category) queryParams.category = filters.category;
    if (filters?.tag) queryParams.tag = filters.tag;
    if (filters?.search) queryParams.search = filters.search;
    if (filters?.page) queryParams.page = filters.page.toString();
    if (filters?.perPage) queryParams.perPage = filters.perPage.toString();

    return this.http.get<PostsResponse>('/blog/posts', { params: queryParams });
  }

  async getPost(slug: string, type: PostType): Promise<PostWithRelations> {
    return this.http.get<PostWithRelations>(`/blog/posts/${slug}`, { params: { type } });
  }

  async getFeaturedPosts(limit?: number): Promise<{ posts: PostWithRelations[] }> {
    const queryParams: Record<string, string> = {};
    if (limit) queryParams.limit = limit.toString();

    return this.http.get<{ posts: PostWithRelations[] }>('/blog/featured', { params: queryParams });
  }

  async getCategories(): Promise<{ categories: string[] }> {
    return this.http.get<{ categories: string[] }>('/blog/categories');
  }

  async getTags(): Promise<TagsResponse> {
    return this.http.get<TagsResponse>('/blog/tags');
  }

  async getPostsByTag(tagSlug: string, filters?: Omit<PublicPostFilters, 'tag'>): Promise<PostsResponse> {
    const queryParams: Record<string, string> = {};
    if (filters?.type) queryParams.type = filters.type;
    if (filters?.category) queryParams.category = filters.category;
    if (filters?.search) queryParams.search = filters.search;
    if (filters?.page) queryParams.page = filters.page.toString();
    if (filters?.perPage) queryParams.perPage = filters.perPage.toString();

    return this.http.get<PostsResponse>(`/blog/tags/${tagSlug}/posts`, { params: queryParams });
  }

  async searchPosts(query: string, type?: PostType, page?: number, perPage?: number): Promise<PostsResponse> {
    const queryParams: Record<string, string> = { q: query };
    if (type) queryParams.type = type;
    if (page) queryParams.page = page.toString();
    if (perPage) queryParams.perPage = perPage.toString();

    return this.http.get<PostsResponse>('/blog/search', { params: queryParams });
  }

  async getRelatedPosts(postId: string, limit?: number): Promise<{ posts: PostWithRelations[] }> {
    const queryParams: Record<string, string> = {};
    if (limit) queryParams.limit = limit.toString();

    return this.http.get<{ posts: PostWithRelations[] }>(`/blog/posts/${postId}/related`, { params: queryParams });
  }

  // Admin Endpoints (require auth + admin role)

  async getAdminPosts(filters?: PostFilters): Promise<PostsResponse> {
    const queryParams: Record<string, string> = {};
    if (filters?.type) queryParams.type = filters.type;
    if (filters?.status) queryParams.status = filters.status;
    if (filters?.category) queryParams.category = filters.category;
    if (filters?.search) queryParams.search = filters.search;
    if (filters?.tag) queryParams.tag = filters.tag;
    if (filters?.isFeatured !== undefined) queryParams.isFeatured = filters.isFeatured.toString();
    if (filters?.includeDeleted !== undefined) queryParams.includeDeleted = filters.includeDeleted.toString();
    if (filters?.page) queryParams.page = filters.page.toString();
    if (filters?.perPage) queryParams.perPage = filters.perPage.toString();

    return this.http.get<PostsResponse>('/admin/blog/posts', { params: queryParams });
  }

  async getAdminPost(id: string): Promise<PostWithRelations> {
    return this.http.get<PostWithRelations>(`/admin/blog/posts/${id}`);
  }

  async createPost(data: CreatePostInput): Promise<PostWithRelations> {
    return this.http.post<PostWithRelations>('/admin/blog/posts', data);
  }

  async updatePost(id: string, data: UpdatePostInput): Promise<PostWithRelations> {
    return this.http.patch<PostWithRelations>(`/admin/blog/posts/${id}`, data);
  }

  async deletePost(id: string): Promise<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`/admin/blog/posts/${id}`);
  }

  async restorePost(id: string): Promise<PostWithRelations> {
    return this.http.post<PostWithRelations>(`/admin/blog/posts/${id}/restore`);
  }

  async publishPost(id: string): Promise<PostWithRelations> {
    return this.http.post<PostWithRelations>(`/admin/blog/posts/${id}/publish`);
  }

  async unpublishPost(id: string): Promise<PostWithRelations> {
    return this.http.post<PostWithRelations>(`/admin/blog/posts/${id}/unpublish`);
  }

  async toggleFeatured(id: string): Promise<PostWithRelations> {
    return this.http.post<PostWithRelations>(`/admin/blog/posts/${id}/toggle-featured`);
  }

  async getAdminTags(): Promise<TagsResponse> {
    return this.http.get<TagsResponse>('/admin/blog/tags');
  }

  async createTag(name: string): Promise<Tag> {
    return this.http.post<Tag>('/admin/blog/tags', { name });
  }

  async updateTag(id: string, name: string): Promise<Tag> {
    return this.http.patch<Tag>(`/admin/blog/tags/${id}`, { name });
  }

  async deleteTag(id: string): Promise<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`/admin/blog/tags/${id}`);
  }

  async getStats(): Promise<BlogStats> {
    return this.http.get<BlogStats>('/admin/blog/stats');
  }
}
