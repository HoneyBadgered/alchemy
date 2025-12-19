'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Header, Footer } from '@/components/layout';
import { AlchemyClient } from '@alchemy/sdk';
import { PostCategory } from '@alchemy/core';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Library/Grimoire index page.
 * Shows a grid of articles with category filtering.
 */
export default function LibraryPage() {
  const [selectedType, setSelectedType] = useState<'log' | 'grimoire' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const categories = Object.values(PostCategory);
  
  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const client = new AlchemyClient({ baseURL: API_BASE_URL });
        
        const filters: any = { perPage: 12 };
        if (selectedType) filters.type = selectedType;
        if (selectedCategory) filters.category = selectedCategory;
        if (searchQuery) filters.search = searchQuery;
        
        const [postsResult, featuredResult] = await Promise.all([
          client.blog.getPosts(filters),
          !selectedType && !selectedCategory && !searchQuery 
            ? client.blog.getFeaturedPosts(3) 
            : Promise.resolve({ posts: [] })
        ]);
        
        setPosts(postsResult.posts);
        setFeaturedPosts(featuredResult.posts);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPosts();
  }, [selectedType, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main id="main-content" className="flex-1 bg-gradient-to-b from-purple-50 to-white">
        {/* Hero Section */}
        <section className="bg-purple-900 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="mr-3" aria-hidden="true">📚</span>
              The Library
            </h1>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              Explore our collection of guides, tutorials, and wisdom from master alchemists.
              Learn the secrets of creating the perfect blend.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="py-8 border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Type Filter */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <button
                onClick={() => setSelectedType(null)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedType === null
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedType('log')}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedType === 'log'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📝 Log Book
              </button>
              <button
                onClick={() => setSelectedType('grimoire')}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedType === 'grimoire'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📖 Grimoire
              </button>
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === null
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="py-12 md:py-16 bg-gradient-to-br from-purple-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredPosts.map((post) => (
                  <article key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <Link href={`/library/${post.type}/${post.slug}`}>
                      {post.heroImageUrl ? (
                        <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${post.heroImageUrl})` }} />
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                          <span className="text-6xl" aria-hidden="true">⭐</span>
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              post.type === 'log' ? 'text-blue-600 bg-blue-100' : 'text-purple-600 bg-purple-100'
                            }`}
                          >
                            {post.type === 'log' ? 'Log' : 'Grimoire'}
                          </span>
                          {post.category && (
                            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                              {post.category}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">{post.readTime}</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
                        <p className="text-gray-600 text-sm line-clamp-3 mb-4">{post.excerpt}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">By {post.author.username}</span>
                          <span className="text-purple-600 font-medium">Read more →</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Articles Grid */}
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">Error: {error}</div>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.map((post) => (
                    <article key={post.id}>
                      <Link
                        href={`/library/${post.type}/${post.slug}`}
                        className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
                      >
                        {/* Post Image/Icon */}
                        {post.heroImageUrl ? (
                          <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${post.heroImageUrl})` }} />
                        ) : (
                          <div className="h-48 bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                            <span className="text-6xl group-hover:scale-110 transition-transform" aria-hidden="true">
                              {post.type === 'log' ? '📝' : '📖'}
                            </span>
                          </div>
                        )}
                        
                        {/* Post Content */}
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                post.type === 'log' ? 'text-blue-600 bg-blue-100' : 'text-purple-600 bg-purple-100'
                              }`}
                            >
                              {post.type === 'log' ? 'Log' : 'Grimoire'}
                            </span>
                            {post.category && (
                              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                {post.category}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">{post.readTime}</span>
                          </div>
                          
                          <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                            {post.title}
                          </h2>
                          
                          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                            {post.excerpt || post.title}
                          </p>
                          
                          {/* Tags */}
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                              {post.tags.slice(0, 3).map((tag: any) => (
                                <span key={tag.id} className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                  {tag.name}
                                </span>
                              ))}
                              {post.tags.length > 3 && (
                                <span className="text-xs text-gray-500">+{post.tags.length - 3} more</span>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              By {post.author.username}
                            </span>
                            <span className="text-purple-600 font-medium group-hover:underline">
                              Read more →
                            </span>
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>

                {posts.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4" aria-hidden="true">📭</div>
                    <p className="text-gray-600">No posts found matching your criteria.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
