'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Header, Footer } from '@/components/layout';
import { articles, getAllCategories } from '@/data/articles';

/**
 * Library/Grimoire index page.
 * Shows a grid of articles with category filtering.
 */
export default function LibraryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const categories = getAllCategories();
  
  const filteredArticles = selectedCategory
    ? articles.filter((article) => article.category === selectedCategory)
    : articles;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-to-b from-purple-50 to-white">
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

        {/* Category Filter */}
        <section className="py-8 border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === null
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.map((article) => (
                <article key={article.slug}>
                  <Link
                    href={`/library/${article.slug}`}
                    className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    {/* Article Image/Icon */}
                    <div className="h-48 bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                      <span className="text-6xl group-hover:scale-110 transition-transform" aria-hidden="true">
                        {article.image}
                      </span>
                    </div>
                    
                    {/* Article Content */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                          {article.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {article.readTime}
                        </span>
                      </div>
                      
                      <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                        {article.title}
                      </h2>
                      
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                        {article.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          By {article.author}
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

            {filteredArticles.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4" aria-hidden="true">📭</div>
                <p className="text-gray-600">No articles found in this category.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
