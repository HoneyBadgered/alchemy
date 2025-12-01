'use client';

/**
 * Your Apothecary Shelf Page
 * 
 * A visual display of past purchased teas as "jars" or collectible items
 * with dark-fairytale aesthetic.
 */

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Link from 'next/link';
import BottomNavigation from '@/components/BottomNavigation';

interface ApothecaryItem {
  id: string;
  productId: string;
  name: string;
  category: string;
  purchaseCount: number;
  lastPurchased: string;
  firstPurchased: string;
  imageUrl?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  jarColor: string;
}

// Mock apothecary items
const mockItems: ApothecaryItem[] = [
  {
    id: '1',
    productId: 'p1',
    name: 'Midnight Bloom Tea',
    category: 'Black Tea',
    purchaseCount: 5,
    lastPurchased: '2024-01-15',
    firstPurchased: '2023-06-10',
    rarity: 'rare',
    jarColor: 'from-purple-600 to-indigo-800',
  },
  {
    id: '2',
    productId: 'p2',
    name: 'Dragon Fire Chai',
    category: 'Spiced Tea',
    purchaseCount: 3,
    lastPurchased: '2024-01-10',
    firstPurchased: '2023-09-20',
    rarity: 'uncommon',
    jarColor: 'from-orange-600 to-red-800',
  },
  {
    id: '3',
    productId: 'p3',
    name: 'Enchanted Forest Blend',
    category: 'Green Tea',
    purchaseCount: 8,
    lastPurchased: '2024-01-18',
    firstPurchased: '2023-03-15',
    rarity: 'legendary',
    jarColor: 'from-emerald-600 to-green-900',
  },
  {
    id: '4',
    productId: 'p4',
    name: 'Lavender Dreams',
    category: 'Herbal',
    purchaseCount: 2,
    lastPurchased: '2023-12-20',
    firstPurchased: '2023-11-05',
    rarity: 'common',
    jarColor: 'from-violet-500 to-purple-700',
  },
  {
    id: '5',
    productId: 'p5',
    name: 'Winter Solstice Brew',
    category: 'Seasonal',
    purchaseCount: 1,
    lastPurchased: '2023-12-21',
    firstPurchased: '2023-12-21',
    rarity: 'rare',
    jarColor: 'from-blue-500 to-cyan-800',
  },
  {
    id: '6',
    productId: 'p6',
    name: 'Earl Grey Supreme',
    category: 'Black Tea',
    purchaseCount: 12,
    lastPurchased: '2024-01-20',
    firstPurchased: '2023-01-15',
    rarity: 'legendary',
    jarColor: 'from-slate-600 to-slate-800',
  },
  {
    id: '7',
    productId: 'p7',
    name: 'Rose Petal White',
    category: 'White Tea',
    purchaseCount: 4,
    lastPurchased: '2024-01-05',
    firstPurchased: '2023-08-10',
    rarity: 'uncommon',
    jarColor: 'from-pink-500 to-rose-700',
  },
  {
    id: '8',
    productId: 'p8',
    name: 'Mystic Oolong',
    category: 'Oolong',
    purchaseCount: 2,
    lastPurchased: '2023-11-30',
    firstPurchased: '2023-10-15',
    rarity: 'common',
    jarColor: 'from-amber-600 to-yellow-800',
  },
];

const rarityConfig = {
  common: { label: 'Common', color: 'text-slate-400', glow: '' },
  uncommon: { label: 'Uncommon', color: 'text-green-400', glow: 'shadow-green-500/20' },
  rare: { label: 'Rare', color: 'text-blue-400', glow: 'shadow-blue-500/30' },
  legendary: { label: 'Legendary', color: 'text-amber-400', glow: 'shadow-amber-500/40 animate-pulse' },
};

function ApothecaryContent() {
  const [items] = useState<ApothecaryItem[]>(mockItems);
  const [selectedItem, setSelectedItem] = useState<ApothecaryItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'common' | 'uncommon' | 'rare' | 'legendary'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'count' | 'name'>('recent');

  const filteredItems = items
    .filter(item => filter === 'all' || item.rarity === filter)
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.lastPurchased).getTime() - new Date(a.lastPurchased).getTime();
      }
      if (sortBy === 'count') {
        return b.purchaseCount - a.purchaseCount;
      }
      return a.name.localeCompare(b.name);
    });

  const stats = {
    total: items.length,
    legendary: items.filter(i => i.rarity === 'legendary').length,
    rare: items.filter(i => i.rarity === 'rare').length,
    totalPurchases: items.reduce((sum, i) => sum + i.purchaseCount, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 pb-20">
      {/* Atmospheric overlay */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NCAwLTE4IDguMDYtMTggMThzOC4wNiAxOCAxOCAxOCAxOC04LjA2IDE4LTE4LTguMDYtMTgtMTgtMTh6bTAgMzJjLTcuNzMyIDAtMTQtNi4yNjgtMTQtMTRzNi4yNjgtMTQgMTQtMTQgMTQgNi4yNjggMTQgMTQtNi4yNjggMTQtMTQgMTR6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wMiIvPjwvZz48L3N2Zz4=')] opacity-30 pointer-events-none" />
      
      {/* Header */}
      <div className="relative bg-gradient-to-r from-purple-900/80 via-violet-800/80 to-purple-900/80 border-b border-purple-500/30">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link 
            href="/profile" 
            className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-100 transition-colors mb-4"
          >
            <span>←</span>
            <span>Back to Profile</span>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">🫙</span>
            Your Apothecary Shelf
          </h1>
          <p className="text-purple-200/70 mt-1">A cabinet of past wonders</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 relative z-10 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20 text-center">
            <p className="text-3xl font-bold text-white">{stats.total}</p>
            <p className="text-purple-300/70 text-sm">Unique Blends</p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20 text-center">
            <p className="text-3xl font-bold text-amber-400">{stats.legendary}</p>
            <p className="text-purple-300/70 text-sm">Legendary</p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20 text-center">
            <p className="text-3xl font-bold text-blue-400">{stats.rare}</p>
            <p className="text-purple-300/70 text-sm">Rare</p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20 text-center">
            <p className="text-3xl font-bold text-purple-400">{stats.totalPurchases}</p>
            <p className="text-purple-300/70 text-sm">Total Brews</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800/60 text-purple-300 hover:bg-slate-700/60 border border-purple-500/20'
              }`}
            >
              All Jars
            </button>
            {(['legendary', 'rare', 'uncommon', 'common'] as const).map((rarity) => (
              <button
                key={rarity}
                onClick={() => setFilter(rarity)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  filter === rarity
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800/60 text-purple-300 hover:bg-slate-700/60 border border-purple-500/20'
                }`}
              >
                <span className={rarityConfig[rarity].color}>{rarityConfig[rarity].label}</span>
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'count' | 'name')}
            className="px-4 py-2 bg-slate-800/60 border border-purple-500/20 rounded-lg text-purple-300 focus:outline-none focus:border-purple-400"
          >
            <option value="recent">Most Recent</option>
            <option value="count">Most Purchased</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>

        {/* Shelf Display */}
        <div className="bg-gradient-to-b from-amber-950/30 to-slate-900/50 rounded-xl p-6 border border-amber-900/30">
          {/* Shelf Header */}
          <div className="text-center mb-6">
            <div className="inline-block px-6 py-2 bg-amber-950/50 rounded-full border border-amber-800/50">
              <span className="text-amber-200/80 text-sm font-medium">✨ Your Collection ✨</span>
            </div>
          </div>

          {/* Jars Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`relative group ${rarityConfig[item.rarity].glow ? `shadow-lg ${rarityConfig[item.rarity].glow}` : ''}`}
              >
                {/* Jar Container */}
                <div className="relative">
                  {/* Jar Body */}
                  <div className={`w-full aspect-[3/4] rounded-t-lg rounded-b-3xl bg-gradient-to-b ${item.jarColor} border-2 border-white/20 shadow-inner overflow-hidden transition-transform group-hover:scale-105`}>
                    {/* Glass Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent" />
                    
                    {/* Contents (Tea Leaves) */}
                    <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-gradient-to-t from-black/40 to-transparent flex items-end justify-center pb-4">
                      <span className="text-4xl group-hover:animate-bounce">🍵</span>
                    </div>

                    {/* Jar Label */}
                    <div className="absolute bottom-4 left-2 right-2 bg-amber-100/90 rounded px-2 py-1">
                      <p className="text-amber-900 text-xs font-medium truncate text-center">
                        {item.name}
                      </p>
                    </div>
                  </div>

                  {/* Jar Lid */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-amber-700 rounded-t-lg border-2 border-amber-800">
                    <div className="w-full h-1 bg-amber-600 rounded-t" />
                  </div>

                  {/* Rarity Glow */}
                  {item.rarity !== 'common' && (
                    <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-t ${item.jarColor} opacity-20 blur-sm -z-10`} />
                  )}
                </div>

                {/* Purchase Count Badge */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs text-white font-bold border-2 border-slate-900">
                  {item.purchaseCount}
                </div>

                {/* Rarity Label */}
                <p className={`text-center mt-2 text-xs font-medium ${rarityConfig[item.rarity].color}`}>
                  {rarityConfig[item.rarity].label}
                </p>
              </button>
            ))}
          </div>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🫙</span>
              <p className="text-purple-300/70">No jars match your filter</p>
            </div>
          )}
        </div>

        {/* Selected Item Modal */}
        {selectedItem && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedItem(null)}
          >
            <div 
              className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-purple-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-20 rounded-t-lg rounded-b-2xl bg-gradient-to-b ${selectedItem.jarColor} flex items-end justify-center pb-2 border border-white/20`}>
                    <span className="text-2xl">🍵</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedItem.name}</h3>
                    <p className="text-purple-300/70 text-sm">{selectedItem.category}</p>
                    <p className={`text-sm font-medium ${rarityConfig[selectedItem.rarity].color}`}>
                      {rarityConfig[selectedItem.rarity].label}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-purple-400 hover:text-purple-200 text-xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-300/60">Times Purchased</span>
                  <span className="text-white font-medium">{selectedItem.purchaseCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-purple-300/60">First Brewed</span>
                  <span className="text-white">{new Date(selectedItem.firstPurchased).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-purple-300/60">Last Purchased</span>
                  <span className="text-white">{new Date(selectedItem.lastPurchased).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/shop/${selectedItem.productId}`}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium text-center transition-colors"
                >
                  View Product
                </Link>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-purple-200 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-5 border border-purple-500/10">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="text-purple-200 font-medium">About Your Shelf</h3>
              <p className="text-purple-300/60 text-sm mt-1">
                Every tea you purchase adds a jar to your shelf. Purchase more of the same blend to increase 
                its rarity! Legendary blends are those you&apos;ve purchased 10+ times.
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function ApothecaryPage() {
  return (
    <ProtectedRoute>
      <ApothecaryContent />
    </ProtectedRoute>
  );
}
