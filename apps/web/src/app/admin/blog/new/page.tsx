'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { AlchemyClient } from '@alchemy/sdk';
import { PostCategory } from '@alchemy/core';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function NewPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessToken = useAuthStore((state) => state.accessToken);
  
  const typeParam = searchParams.get('type') as 'log' | 'grimoire' || 'grimoire';
  
  const [formData, setFormData] = useState({
    type: typeParam,
    title: '',
    body: '',
    excerpt: '',
    category: '',
    heroImageUrl: '',
    status: 'draft' as 'draft' | 'published',
    isFeatured: false,
  });
  
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchTags() {
      if (!accessToken) return;
      
      try {
        const client = new AlchemyClient({ baseURL: API_BASE_URL, accessToken });
        const result = await client.blog.getAdminTags();
        setTags(result.tags);
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      }
    }
    
    fetchTags();
  }, [accessToken]);
  
  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault();
    
    if (!accessToken) {
      setError('Not authenticated');
      return;
    }
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!formData.body.trim()) {
      setError('Body is required');
      return;
    }
    
    if (formData.type === 'grimoire' && !formData.category) {
      setError('Category is required for grimoire posts');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const client = new AlchemyClient({ baseURL: API_BASE_URL, accessToken });
      
      const postData = {
        ...formData,
        status: publish ? 'published' as const : 'draft' as const,
        tagIds: selectedTagIds,
        category: formData.category || undefined,
        heroImageUrl: formData.heroImageUrl || undefined,
        excerpt: formData.excerpt || undefined,
      };
      
      const result = await client.blog.createPost(postData);
      
      router.push(`/admin/blog/${result.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
      setSaving(false);
    }
  };
  
  const categories = Object.values(PostCategory);
  
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin/blog"
          className="text-purple-600 hover:text-purple-800 text-sm"
        >
          ← Back to Posts
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Create New {formData.type === 'log' ? 'Log Entry' : 'Grimoire Article'}
          </h1>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
              formData.type === 'log'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-purple-100 text-purple-800'
            }`}
          >
            {formData.type === 'log' ? '📝 Log' : '📖 Grimoire'}
          </span>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={(e) => handleSubmit(e, false)}>
          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Enter post title..."
              maxLength={200}
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.title.length} / 200 characters
            </div>
          </div>
          
          {/* Excerpt */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              rows={2}
              placeholder="Brief description for previews and SEO..."
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.excerpt.length} / 500 characters
            </div>
          </div>
          
          {/* Category */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category {formData.type === 'grimoire' && <span className="text-red-500">*</span>}
              {formData.type === 'log' && <span className="text-gray-400">(optional)</span>}
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              required={formData.type === 'grimoire'}
            >
              <option value="">
                {formData.type === 'log' ? 'None (optional)' : 'Select a category...'}
              </option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          
          {/* Body */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Body (Markdown) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
              rows={15}
              placeholder="Write your content in Markdown format..."
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              Supports Markdown formatting
            </div>
          </div>
          
          {/* Hero Image URL */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hero Image URL <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="url"
              value={formData.heroImageUrl}
              onChange={(e) => setFormData({ ...formData, heroImageUrl: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags <span className="text-gray-400">(optional, max 10)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    if (selectedTagIds.includes(tag.id)) {
                      setSelectedTagIds(selectedTagIds.filter((id) => id !== tag.id));
                    } else if (selectedTagIds.length < 10) {
                      setSelectedTagIds([...selectedTagIds, tag.id]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedTagIds.includes(tag.id)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500">
              {selectedTagIds.length} / 10 tags selected
            </div>
          </div>
          
          {/* Featured */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Feature this post on homepage
              </span>
            </label>
          </div>
          
          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & Publish'}
            </button>
            <Link
              href="/admin/blog"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
