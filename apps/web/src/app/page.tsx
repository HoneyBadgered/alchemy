'use client';

import Link from 'next/link';
import { Header, Footer } from '@/components/layout';

/**
 * Homepage component with hero section (75% viewport height),
 * featured products, and call-to-action sections.
 * Design matches the site's alchemy/magical theme.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section - 75% viewport height with blurred text zone */}
        <section 
          className="relative h-[75vh] min-h-[500px] flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600 overflow-hidden"
          aria-label="Hero"
        >
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-float-delayed" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/10 rounded-full blur-3xl" />
          </div>

          {/* Hero content with blurred background zone */}
          <div className="relative z-10 text-center px-4 py-12 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                <span className="block" aria-hidden="true">🧪</span>
                The Alchemy Table
              </h1>
              <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-2xl mx-auto">
                Craft your perfect blend with magical ingredients. 
                A gamified experience where alchemy meets artisan quality.
              </p>
              
              {/* Hero CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-purple-900 font-bold text-lg rounded-full hover:bg-purple-100 transition-colors shadow-lg"
                >
                  <span className="mr-2" aria-hidden="true">🛒</span>
                  Shop Now
                </Link>
                <Link
                  href="/table"
                  className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white font-bold text-lg rounded-full hover:bg-white/10 transition-colors"
                >
                  <span className="mr-2" aria-hidden="true">✨</span>
                  Create Your Blend
                </Link>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
            <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-white" aria-labelledby="features-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-center text-purple-900 mb-12">
              Why Choose The Alchemy Table?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl" aria-hidden="true">✨</span>
                </div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">
                  Magical Ingredients
                </h3>
                <p className="text-gray-600">
                  Source premium ingredients from around the world, each with unique flavor profiles and properties.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl" aria-hidden="true">🎮</span>
                </div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">
                  Gamified Experience
                </h3>
                <p className="text-gray-600">
                  Earn XP, complete quests, and unlock achievements as you master the art of blending.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl" aria-hidden="true">🧙</span>
                </div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">
                  Custom Blends
                </h3>
                <p className="text-gray-600">
                  Create your own signature blends at our interactive alchemy table with guided recipes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-purple-800 to-purple-900" aria-labelledby="cta-heading">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Start Your Alchemy Journey?
            </h2>
            <p className="text-xl text-purple-200 mb-8">
              Join thousands of blend enthusiasts and create something magical today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-purple-900 font-bold text-lg rounded-full hover:bg-purple-100 transition-colors shadow-lg"
              >
                Sign Up Free
              </Link>
              <Link
                href="/library"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white font-bold text-lg rounded-full hover:bg-white/10 transition-colors"
              >
                Explore the Library
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
