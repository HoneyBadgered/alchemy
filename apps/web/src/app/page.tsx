'use client';

import Link from 'next/link';
import Image from 'next/image';
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
      <main id="main-content" className="flex-1">
        {/* Hero Section - 75% viewport height with image background */}
        <section 
          className="relative h-screen flex items-center justify-center overflow-hidden"
          aria-label="Hero"
        >
          {/* Background Image */}
          <Image
            src="/images/verdant-library-full-size.png"
            alt=""
            fill
            className="object-cover"
            priority
            quality={75}
          />

          {/* Hero CTAs - positioned at 65% from top, backdrop extends to bottom */}
          <div className="absolute top-[65%] left-0 right-0 bottom-0 px-6 z-10">
            {/* Backdrop for button contrast */}
            <div className="h-full bg-black/40 backdrop-blur-sm rounded-t-2xl p-12 shadow-2xl flex flex-col justify-start">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center max-w-2xl mx-auto">
                <Link
                  href="/shop"
                  className="ornate-button inline-flex items-center justify-center px-10 py-4 text-[#1a1a1a] font-bold text-lg tracking-wide w-full sm:w-auto"
                  style={{ clipPath: 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0% calc(100% - 12px), 0% 12px)' }}
                >
                  Shop Now
                </Link>
                <Link
                  href="/table"
                  className="ornate-button-outline inline-flex items-center justify-center px-10 py-4 text-[#D4AF37] font-bold text-lg tracking-wide w-full sm:w-auto"
                  style={{ clipPath: 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0% calc(100% - 12px), 0% 12px)' }}
                >
                  Create Your Blend
                </Link>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          {/* <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
            <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div> */}
        </section>

        {/* Intro Section - Below Hero */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-surface to-background">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold font-serif text-text-base mb-6">
              The Alchemy Table
            </h1>
            <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
              Craft your perfect blend with magical ingredients. 
              A gamified experience where alchemy meets artisan quality.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-background to-surface/50" aria-labelledby="features-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="features-heading" className="text-3xl md:text-4xl font-bold font-serif text-center text-text-base mb-12">
              Why Choose The Alchemy Table?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl" aria-hidden="true">✨</span>
                </div>
                <h3 className="text-xl font-bold font-serif text-text-base mb-2">
                  Magical Ingredients
                </h3>
                <p className="text-text-muted">
                  Source premium ingredients from around the world, each with unique flavor profiles and properties.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl" aria-hidden="true">🎮</span>
                </div>
                <h3 className="text-xl font-bold font-serif text-text-base mb-2">
                  Gamified Experience
                </h3>
                <p className="text-text-muted">
                  Earn XP, complete quests, and unlock achievements as you master the art of blending.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl" aria-hidden="true">🧙</span>
                </div>
                <h3 className="text-xl font-bold font-serif text-text-base mb-2">
                  Custom Blends
                </h3>
                <p className="text-text-muted">
                  Create your own signature blends at our interactive alchemy table with guided recipes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary to-primary-hover" aria-labelledby="cta-heading">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold font-serif text-white mb-6">
              Ready to Start Your Alchemy Journey?
            </h2>
            <p className="text-xl text-text-base/90 mb-8">
              Join thousands of blend enthusiasts and create something magical today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary font-bold text-lg rounded-full hover:bg-text-base/90 transition-colors shadow-lg"
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
