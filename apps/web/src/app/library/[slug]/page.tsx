'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { use } from 'react';
import { Header, Footer } from '@/components/layout';
import { getArticleBySlug, articles } from '@/data/articles';

/**
 * Article detail page.
 * Displays full article content with related articles.
 */
export default function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Get related articles (same category, excluding current)
  const relatedArticles = articles
    .filter((a) => a.category === article.category && a.slug !== article.slug)
    .slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-to-b from-purple-50 to-white">
        {/* Article Header */}
        <section className="bg-purple-900 py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="text-6xl mb-6" aria-hidden="true">{article.image}</div>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-sm font-semibold text-purple-200 bg-purple-800 px-3 py-1 rounded-full">
                {article.category}
              </span>
              <span className="text-sm text-purple-300">
                {article.readTime}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              {article.title}
            </h1>
            
            <p className="text-lg text-purple-200 mb-6">
              {article.excerpt}
            </p>
            
            <div className="flex items-center justify-center gap-4 text-purple-300 text-sm">
              <span>By {article.author}</span>
              <span>•</span>
              <span>{new Date(article.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</span>
            </div>
          </div>
        </section>

        {/* Breadcrumb */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
            <Link href="/" className="hover:text-purple-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/library" className="hover:text-purple-600">Library</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{article.title}</span>
          </nav>
        </div>

        {/* Article Content */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div 
            className="prose prose-lg prose-purple max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="py-12 md:py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Related Articles
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/library/${related.slug}`}
                    className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    <div className="h-32 bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                      <span className="text-4xl group-hover:scale-110 transition-transform" aria-hidden="true">
                        {related.image}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {related.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {related.readTime}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Back to Library */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Library
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
