'use client';

import { useState } from 'react';
import { Header, Footer } from '@/components/layout';
import { faqItems, getAllFAQCategories, searchFAQ } from '@/data/faq';

/**
 * FAQ page with collapsible answers and search functionality.
 * Accessible with proper ARIA attributes for accordion pattern.
 */
export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  
  const categories = getAllFAQCategories();
  
  // Filter FAQ items based on search query
  const displayedItems = searchQuery.trim().length >= 2
    ? searchFAQ(searchQuery)
    : faqItems;

  // Group items by category
  const groupedItems = categories.reduce((acc, category) => {
    acc[category] = displayedItems.filter((item) => item.category === category);
    return acc;
  }, {} as Record<string, typeof faqItems>);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-to-b from-purple-50 to-white">
        {/* Hero Section */}
        <section className="bg-purple-900 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto mb-8">
              Find answers to common questions about our products, orders, and more.
            </p>
            
            {/* Search */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-4 pl-12 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-300"
                  aria-label="Search FAQ"
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {displayedItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4" aria-hidden="true">🔍</div>
                <p className="text-gray-600">No questions found for &quot;{searchQuery}&quot;</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-purple-600 font-semibold hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {categories.map((category) => {
                  const items = groupedItems[category];
                  if (!items || items.length === 0) return null;
                  
                  return (
                    <div key={category}>
                      <h2 className="text-2xl font-bold text-purple-900 mb-4">
                        {category}
                      </h2>
                      
                      <div className="bg-white rounded-xl shadow-md divide-y divide-gray-100 overflow-hidden">
                        {items.map((item) => {
                          const isOpen = openItems.has(item.id);
                          
                          return (
                            <div key={item.id}>
                              <button
                                onClick={() => toggleItem(item.id)}
                                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                                aria-expanded={isOpen}
                                aria-controls={`faq-answer-${item.id}`}
                              >
                                <span className="font-medium text-gray-900 pr-4">
                                  {item.question}
                                </span>
                                <svg
                                  className={`w-5 h-5 text-purple-600 flex-shrink-0 transition-transform ${
                                    isOpen ? 'rotate-180' : ''
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              
                              {isOpen && (
                                <div
                                  id={`faq-answer-${item.id}`}
                                  className="px-6 pb-4 text-gray-600"
                                >
                                  {item.answer}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Still Have Questions */}
        <section className="py-12 md:py-16 bg-purple-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-purple-900 mb-4">
              Still have questions?
            </h2>
            <p className="text-gray-600 mb-6">
              Can&apos;t find what you&apos;re looking for? Our team is here to help.
            </p>
            <a
              href="/contact"
              className="inline-block bg-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-purple-700 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
