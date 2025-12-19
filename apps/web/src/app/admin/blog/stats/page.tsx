'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { AlchemyClient } from '@alchemy/sdk';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function BlogStatsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchStats() {
      if (!accessToken) return;
      
      try {
        setLoading(true);
        const client = new AlchemyClient({ baseURL: API_BASE_URL, accessToken });
        const result = await client.blog.getStats();
        setStats(result);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, [accessToken]);
  
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
  
  if (!stats) return null;
  
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/blog"
          className="text-purple-600 hover:text-purple-800 text-sm"
        >
          ← Back to Posts
        </Link>
      </div>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Blog Statistics</h1>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Total Posts</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalPosts}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Published Posts</div>
          <div className="text-3xl font-bold text-green-600">{stats.publishedPosts}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Draft Posts</div>
          <div className="text-3xl font-bold text-yellow-600">{stats.draftPosts}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Featured Posts</div>
          <div className="text-3xl font-bold text-purple-600">{stats.featuredPosts}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Deleted Posts</div>
          <div className="text-3xl font-bold text-red-600">{stats.deletedPosts}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Total Tags</div>
          <div className="text-3xl font-bold text-blue-600">{stats.totalTags}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Log Entries</div>
          <div className="text-3xl font-bold text-blue-600">{stats.postsByType.log}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Grimoire Articles</div>
          <div className="text-3xl font-bold text-purple-600">{stats.postsByType.grimoire}</div>
        </div>
      </div>
      
      {/* Posts by Category */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Posts by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stats.postsByCategory).map(([category, count]) => (
            <div key={category} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">{category}</span>
              <span className="text-xl font-bold text-purple-600">{count as number}</span>
            </div>
          ))}
          
          {Object.keys(stats.postsByCategory).length === 0 && (
            <div className="text-gray-500 col-span-3">No posts with categories yet</div>
          )}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8 flex gap-4">
        <Link
          href="/admin/blog/new?type=log"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
        >
          + Create Log Entry
        </Link>
        <Link
          href="/admin/blog/new?type=grimoire"
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
        >
          + Create Grimoire Article
        </Link>
        <Link
          href="/admin/blog/tags"
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition"
        >
          Manage Tags
        </Link>
      </div>
    </div>
  );
}
