'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  type: 'product' | 'article' | 'page';
  title: string;
  description: string;
  url: string;
  image?: string;
}

// Stub search data - in production this would come from an API or search index
const mockSearchData: SearchResult[] = [
  {
    id: '1',
    type: 'product',
    title: 'Morning Sunrise Blend',
    description: 'A bright and energizing coffee blend to start your day',
    url: '/shop/morning-sunrise',
    image: '☕',
  },
  {
    id: '2',
    type: 'product',
    title: 'Mystic Moon Tea',
    description: 'A calming herbal tea for peaceful evenings',
    url: '/shop/mystic-moon',
    image: '🍵',
  },
  {
    id: '3',
    type: 'product',
    title: 'Dragon\'s Breath Espresso',
    description: 'Bold and intense espresso for the adventurous',
    url: '/shop/dragons-breath',
    image: '🐉',
  },
  {
    id: '4',
    type: 'article',
    title: 'The Art of Blending',
    description: 'Learn the fundamentals of creating the perfect blend',
    url: '/library/art-of-blending',
    image: '📚',
  },
  {
    id: '5',
    type: 'article',
    title: 'Coffee Origins Guide',
    description: 'Explore coffee regions from around the world',
    url: '/library/coffee-origins',
    image: '🌍',
  },
  {
    id: '6',
    type: 'page',
    title: 'About Us',
    description: 'Learn about The Alchemy Table and our mission',
    url: '/about',
    image: '✨',
  },
  {
    id: '7',
    type: 'page',
    title: 'Contact',
    description: 'Get in touch with our team',
    url: '/contact',
    image: '📧',
  },
  {
    id: '8',
    type: 'product',
    title: 'Enchanted Forest Blend',
    description: 'A mysterious and complex flavor profile',
    url: '/shop/enchanted-forest',
    image: '🌲',
  },
];

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Search overlay modal component.
 * Shows search input and results from stubbed static data.
 * Accessible with keyboard navigation and proper focus management.
 */
export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(-1);
      // Delay focus to ensure modal is rendered
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Search function - stub that filters local data
  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setSelectedIndex(-1);

    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    // Stub search implementation - filters mockSearchData
    // TODO: Replace with actual API call to /api/search
    const filtered = mockSearchData.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery)
    );
    setResults(filtered);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      navigateToResult(results[selectedIndex]);
    }
  };

  const navigateToResult = (result: SearchResult) => {
    router.push(result.url);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div
        className="max-w-2xl mx-auto mt-20 bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="relative border-b border-gray-200">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="search"
            placeholder="Search products, articles, and more..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-12 pr-4 py-4 text-lg focus:outline-none"
            aria-label="Search query"
            autoComplete="off"
          />
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            aria-label="Close search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {query.length >= 2 && results.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2" aria-hidden="true">🔍</div>
              <p>No results found for &quot;{query}&quot;</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          )}

          {results.length > 0 && (
            <ul className="divide-y divide-gray-100" role="listbox">
              {results.map((result, index) => (
                <li
                  key={result.id}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <Link
                    href={result.url}
                    onClick={onClose}
                    className={`flex items-center gap-4 p-4 hover:bg-purple-50 transition-colors ${
                      index === selectedIndex ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                      {result.image || '📄'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">
                          {result.title}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                          {result.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{result.description}</p>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Quick Links when no search query */}
          {query.length < 2 && (
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-3">Quick links</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/shop"
                  onClick={onClose}
                  className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
                >
                  Shop
                </Link>
                <Link
                  href="/table"
                  onClick={onClose}
                  className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
                >
                  Create a Blend
                </Link>
                <Link
                  href="/library"
                  onClick={onClose}
                  className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
                >
                  Library
                </Link>
                <Link
                  href="/faq"
                  onClick={onClose}
                  className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
                >
                  FAQ
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
