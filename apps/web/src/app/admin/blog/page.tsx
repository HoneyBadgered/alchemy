'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { AlchemyClient } from '@alchemy/sdk';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AdminBlogListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessToken = useAuthStore((state) => state.accessToken);
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  
  useEffect(() => {
    async function fetchPosts() {
      if (!accessToken) return;
      
      try {
        setLoading(true);
        const client = new AlchemyClient({ baseURL: API_BASE_URL, accessToken });
        
        const filters: any = { page, perPage: 20 };
        if (type) filters.type = type;
        if (status) filters.status = status;
        
        const result = await client.blog.getAdminPosts(filters);
        setPosts(result.posts);
        setPagination(result.pagination);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPosts();
  }, [accessToken, type, status, page]);
  
  const handleDelete = async (postId: string) => {
    if (!accessToken || !confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const client = new AlchemyClient({ baseURL: API_BASE_URL, accessToken });
      await client.blog.deletePost(postId);
      // Refresh posts
      window.location.reload();
    } catch (err: any) {
      alert('Failed to delete post: ' + err.message);
    }
  };
  
  const handleToggleFeatured = async (postId: string) => {
    if (!accessToken) return;
    
    try {
      const client = new AlchemyClient({ baseURL: API_BASE_URL, accessToken });
      await client.blog.toggleFeatured(postId);
      // Refresh posts
      window.location.reload();
    } catch (err: any) {
      alert('Failed to toggle featured: ' + err.message);
    }
  };
  
  const handlePublish = async (postId: string) => {
    if (!accessToken) return;
    
    try {
      const client = new AlchemyClient({ baseURL: API_BASE_URL, accessToken });
      await client.blog.publishPost(postId);
      // Refresh posts
      window.location.reload();
    } catch (err: any) {
      alert('Failed to publish post: ' + err.message);
    }
  };
  
  const handleUnpublish = async (postId: string) => {
    if (!accessToken) return;
    
    try {
      const client = new AlchemyClient({ baseURL: API_BASE_URL, accessToken });
      await client.blog.unpublishPost(postId);
      // Refresh posts
      window.location.reload();
    } catch (err: any) {
      alert('Failed to unpublish post: ' + err.message);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error: {error}
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {type === 'log' ? 'Log Book' : type === 'grimoire' ? 'Grimoire' : 'All Posts'}
        </h1>
        <div className="flex gap-2">
          <Link
            href="/admin/blog/new?type=log"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            + New Log
          </Link>
          <Link
            href="/admin/blog/new?type=grimoire"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
          >
            + New Grimoire
          </Link>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-4">
          <select
            value={type || ''}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) {
                params.set('type', e.target.value);
              } else {
                params.delete('type');
              }
              params.set('page', '1');
              router.push(`/admin/blog?${params.toString()}`);
            }}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">All Types</option>
            <option value="log">Log</option>
            <option value="grimoire">Grimoire</option>
          </select>
          
          <select
            value={status || ''}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) {
                params.set('status', e.target.value);
              } else {
                params.delete('status');
              }
              params.set('page', '1');
              router.push(`/admin/blog?${params.toString()}`);
            }}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>
      
      {/* Posts Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Published
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {posts.map((post) => (
              <tr key={post.id} className={post.deletedAt ? 'bg-gray-50' : ''}>
                <td className="px-6 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{post.title}</span>
                      {post.isFeatured && (
                        <span className="text-yellow-500" title="Featured">
                          ⭐
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{post.slug}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      post.type === 'log'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {post.type === 'log' ? 'Log' : 'Grimoire'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      post.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {post.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {post.category || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/blog/${post.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </Link>
                    {post.status === 'draft' ? (
                      <button
                        onClick={() => handlePublish(post.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnpublish(post.id)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        Unpublish
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleFeatured(post.id)}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      {post.isFeatured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {posts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No posts found. Create your first post!
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', pageNum.toString());
                router.push(`/admin/blog?${params.toString()}`);
              }}
              className={`px-4 py-2 rounded-lg ${
                pageNum === page
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
