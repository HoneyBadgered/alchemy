'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { AlchemyClient } from '@alchemy/sdk';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function TagsManagementPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  
  const fetchTags = async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      const client = new AlchemyClient({ baseURL: API_BASE_URL, accessToken });
      const result = await client.blog.getAdminTags();
      setTags(result.tags);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTags();
  }, [accessToken]);
  
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessToken || !newTagName.trim()) return;
    
    try {
      const client = new AlchemyClient({ baseURL: API_BASE_URL, accessToken });
      await client.blog.createTag(newTagName.trim());
      setNewTagName('');
      await fetchTags();
    } catch (err: any) {
      alert('Failed to create tag: ' + err.message);
    }
  };
  
  const handleUpdateTag = async (tagId: string) => {
    if (!accessToken || !editingTagName.trim()) return;
    
    try {
      const client = new AlchemyClient({ baseURL: API_BASE_URL, accessToken });
      await client.blog.updateTag(tagId, editingTagName.trim());
      setEditingTagId(null);
      setEditingTagName('');
      await fetchTags();
    } catch (err: any) {
      alert('Failed to update tag: ' + err.message);
    }
  };
  
  const handleDeleteTag = async (tagId: string, postCount: number) => {
    if (!accessToken) return;
    
    if (postCount > 0) {
      alert(`Cannot delete tag. It is used by ${postCount} posts.`);
      return;
    }
    
    if (!confirm('Are you sure you want to delete this tag?')) return;
    
    try {
      const client = new AlchemyClient({ baseURL: API_BASE_URL, accessToken });
      await client.blog.deleteTag(tagId);
      await fetchTags();
    } catch (err: any) {
      alert('Failed to delete tag: ' + err.message);
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
      <div className="mb-6">
        <Link
          href="/admin/blog"
          className="text-purple-600 hover:text-purple-800 text-sm"
        >
          ← Back to Posts
        </Link>
      </div>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tags Management</h1>
      </div>
      
      {/* Add New Tag */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Tag</h2>
        <form onSubmit={handleCreateTag} className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
            placeholder="Enter tag name..."
            maxLength={50}
            pattern="[a-zA-Z0-9\s\-]+"
            title="Only letters, numbers, spaces, and hyphens allowed"
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition"
          >
            Add Tag
          </button>
        </form>
      </div>
      
      {/* Tags Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tag Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Post Count
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tags.map((tag) => (
              <tr key={tag.id}>
                <td className="px-6 py-4">
                  {editingTagId === tag.id ? (
                    <input
                      type="text"
                      value={editingTagName}
                      onChange={(e) => setEditingTagName(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1"
                      maxLength={50}
                    />
                  ) : (
                    <span className="font-medium text-gray-900">{tag.name}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{tag.slug}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{tag.postCount || 0}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(tag.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  {editingTagId === tag.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateTag(tag.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingTagId(null);
                          setEditingTagName('');
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingTagId(tag.id);
                          setEditingTagName(tag.name);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id, tag.postCount || 0)}
                        className="text-red-600 hover:text-red-900"
                        disabled={(tag.postCount || 0) > 0}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {tags.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No tags found. Create your first tag above!
          </div>
        )}
      </div>
    </div>
  );
}
