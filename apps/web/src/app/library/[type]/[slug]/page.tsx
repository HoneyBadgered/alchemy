'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { AlchemyClient } from '@alchemy/sdk';
import { MarkdownContent } from '@/components/blog/MarkdownContent';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LibraryPostPage() {
  const params = useParams();
  const type = params.type as 'log' | 'grimoire';
  const slug = params.slug as string;
  
  const [post, setPost] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchPost() {
      if (!type || !slug) return;
      
      try {
        setLoading(true);
        const client = new AlchemyClient({ baseURL: API_BASE_URL });
        
        const fetchedPost = await client.blog.getPost(slug, type);
        
        if (!fetchedPost) {
          setError('Post not found');
          setLoading(false);
          return;
        }
        
        setPost(fetchedPost);
        
        // Fetch related posts
        const related = await client.blog.getRelatedPosts(fetchedPost.id, 3);
        setRelatedPosts(related.posts);
        
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPost();
  }, [type, slug]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex justify-center items-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-8">{error || 'The post you are looking for does not exist.'}</p>
            <Link
              href="/library"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              Back to Library
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-white">
        {/* Breadcrumb */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="text-sm">
              <Link href="/" className="text-purple-600 hover:text-purple-800">Home</Link>
              <span className="mx-2 text-gray-400">→</span>
              <Link href="/library" className="text-purple-600 hover:text-purple-800">Library</Link>
              <span className="mx-2 text-gray-400">→</span>
              <Link
                href={`/library?type=${post.type}`}
                className="text-purple-600 hover:text-purple-800"
              >
                {post.type === 'log' ? 'Log Book' : 'Grimoire'}
              </Link>
              <span className="mx-2 text-gray-400">→</span>
              <span className="text-gray-600">{post.title}</span>
            </nav>
          </div>
        </div>
        
        {/* Hero Image */}
        {post.heroImageUrl && (
          <div className="w-full h-96 bg-cover bg-center" style={{ backgroundImage: `url(${post.heroImageUrl})` }} />
        )}
        
        {/* Post Content */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  post.type === 'log'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                {post.type === 'log' ? '📝 Log' : '📖 Grimoire'}
              </span>
              {post.category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {post.category}
                </span>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            
            {post.excerpt && (
              <p className="text-xl text-gray-600 mb-6">{post.excerpt}</p>
            )}
            
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span>By {post.author.username}</span>
              {post.publishedAt && (
                <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              )}
              {post.readTime && <span>{post.readTime}</span>}
            </div>
            
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.tags.map((tag: any) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-50 text-purple-700"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </header>
          
          {/* Body */}
          <div className="prose prose-lg prose-purple max-w-none mb-12">
            <MarkdownContent content={post.body} />
          </div>
        </article>
        
        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">You May Also Like</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedPosts.map((relatedPost) => (
                  <article key={relatedPost.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <Link href={`/library/${relatedPost.type}/${relatedPost.slug}`}>
                      {relatedPost.heroImageUrl ? (
                        <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${relatedPost.heroImageUrl})` }} />
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                          <span className="text-6xl" aria-hidden="true">
                            {relatedPost.type === 'log' ? '📝' : '📖'}
                          </span>
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              relatedPost.type === 'log'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {relatedPost.type === 'log' ? 'Log' : 'Grimoire'}
                          </span>
                          {relatedPost.category && (
                            <span className="text-xs font-semibold bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                              {relatedPost.category}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {relatedPost.excerpt || relatedPost.title}
                        </p>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
