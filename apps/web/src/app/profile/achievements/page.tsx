'use client';

/**
 * Achievements & Badges Page
 * 
 * Display earned badges and progress toward achievements
 * with dark-fairytale aesthetic.
 */

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Link from 'next/link';
import BottomNavigation from '@/components/BottomNavigation';

interface Achievement {
  id: string;
  name: string;
  description: string;
  lore: string;
  icon: string;
  category: 'purchases' | 'exploration' | 'loyalty' | 'seasonal' | 'special';
  progress: number;
  maxProgress: number;
  isEarned: boolean;
  earnedDate?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

// Mock achievements
const mockAchievements: Achievement[] = [
  // Purchases
  {
    id: 'first_brew',
    name: 'First Brew',
    description: 'Make your first purchase',
    lore: 'Every journey begins with a single sip. Welcome to the guild, young alchemist.',
    icon: '🫖',
    category: 'purchases',
    progress: 1,
    maxProgress: 1,
    isEarned: true,
    earnedDate: '2023-06-15',
    rarity: 'common',
  },
  {
    id: 'ten_brews',
    name: 'Dedicated Brewer',
    description: 'Complete 10 orders',
    lore: 'Your cauldron never cools. Ten brews mark your dedication to the craft.',
    icon: '⚗️',
    category: 'purchases',
    progress: 10,
    maxProgress: 10,
    isEarned: true,
    earnedDate: '2023-11-20',
    rarity: 'uncommon',
  },
  {
    id: 'fifty_brews',
    name: 'Master Alchemist',
    description: 'Complete 50 orders',
    lore: 'Fifty potions brewed! The ancient texts now whisper your name.',
    icon: '🧙',
    category: 'purchases',
    progress: 23,
    maxProgress: 50,
    isEarned: false,
    rarity: 'rare',
  },
  {
    id: 'big_spender',
    name: 'Patron of the Arts',
    description: 'Spend over $500 total',
    lore: 'Your generosity fuels the flames of creation. The guild thanks you.',
    icon: '💰',
    category: 'purchases',
    progress: 387,
    maxProgress: 500,
    isEarned: false,
    rarity: 'rare',
  },

  // Exploration
  {
    id: 'try_all_categories',
    name: 'The Curious One',
    description: 'Purchase from all tea categories',
    lore: 'No leaf remains unturned in your quest for knowledge.',
    icon: '🗺️',
    category: 'exploration',
    progress: 4,
    maxProgress: 6,
    isEarned: false,
    rarity: 'uncommon',
  },
  {
    id: 'review_master',
    name: 'Voice of Experience',
    description: 'Leave 10 product reviews',
    lore: 'Your wisdom guides fellow travelers on their alchemical journey.',
    icon: '📝',
    category: 'exploration',
    progress: 10,
    maxProgress: 10,
    isEarned: true,
    earnedDate: '2024-01-05',
    rarity: 'uncommon',
  },
  {
    id: 'wishlist_dreamer',
    name: 'The Dreamer',
    description: 'Add 20 items to your wishlist',
    lore: 'Dreams of future brews fill your thoughts.',
    icon: '✨',
    category: 'exploration',
    progress: 12,
    maxProgress: 20,
    isEarned: false,
    rarity: 'common',
  },

  // Loyalty
  {
    id: 'adept_tier',
    name: 'Adept Initiation',
    description: 'Reach Adept tier',
    lore: 'You have proven your dedication. The inner circle awaits.',
    icon: '🏅',
    category: 'loyalty',
    progress: 1,
    maxProgress: 1,
    isEarned: true,
    earnedDate: '2023-09-01',
    rarity: 'uncommon',
  },
  {
    id: 'alchemist_tier',
    name: 'Alchemist Ascension',
    description: 'Reach Alchemist tier',
    lore: 'The secrets of transmutation are now yours to command.',
    icon: '🎖️',
    category: 'loyalty',
    progress: 1250,
    maxProgress: 2000,
    isEarned: false,
    rarity: 'rare',
  },
  {
    id: 'subscriber',
    name: 'Eternal Flame',
    description: 'Subscribe to any product',
    lore: 'Your commitment burns eternal. The brew flows endlessly.',
    icon: '🔥',
    category: 'loyalty',
    progress: 1,
    maxProgress: 1,
    isEarned: true,
    earnedDate: '2023-10-15',
    rarity: 'common',
  },

  // Seasonal
  {
    id: 'winter_solstice',
    name: 'Winter Solstice',
    description: 'Purchase during the Winter Festival',
    lore: 'In the darkest night, you found the warmest brew.',
    icon: '❄️',
    category: 'seasonal',
    progress: 1,
    maxProgress: 1,
    isEarned: true,
    earnedDate: '2023-12-21',
    rarity: 'rare',
  },
  {
    id: 'spring_awakening',
    name: 'Spring Awakening',
    description: 'Purchase a floral tea in Spring',
    lore: 'As the world blooms, so does your palate.',
    icon: '🌸',
    category: 'seasonal',
    progress: 0,
    maxProgress: 1,
    isEarned: false,
    rarity: 'uncommon',
  },
  {
    id: 'halloween_brew',
    name: 'Midnight Conjurer',
    description: 'Order during Halloween week',
    lore: 'When the veil thins, your magic strengthens.',
    icon: '🎃',
    category: 'seasonal',
    progress: 1,
    maxProgress: 1,
    isEarned: true,
    earnedDate: '2023-10-31',
    rarity: 'uncommon',
  },

  // Special
  {
    id: 'early_adopter',
    name: 'Pioneer',
    description: 'Joined in the first year',
    lore: 'You were there when the first flames were lit. A founding member.',
    icon: '🌟',
    category: 'special',
    progress: 1,
    maxProgress: 1,
    isEarned: true,
    earnedDate: '2023-06-15',
    rarity: 'legendary',
  },
  {
    id: 'collector',
    name: 'Grand Collector',
    description: 'Own 25 unique blends',
    lore: 'Your apothecary shelf rivals the ancient libraries.',
    icon: '👑',
    category: 'special',
    progress: 8,
    maxProgress: 25,
    isEarned: false,
    rarity: 'legendary',
  },
];

const categoryConfig = {
  purchases: { label: 'Purchases', icon: '🛒' },
  exploration: { label: 'Exploration', icon: '🔍' },
  loyalty: { label: 'Loyalty', icon: '💜' },
  seasonal: { label: 'Seasonal', icon: '🗓️' },
  special: { label: 'Special', icon: '⭐' },
};

const rarityConfig = {
  common: { label: 'Common', color: 'text-slate-400', bg: 'bg-slate-700/50', border: 'border-slate-600/50' },
  uncommon: { label: 'Uncommon', color: 'text-green-400', bg: 'bg-green-900/30', border: 'border-green-600/50' },
  rare: { label: 'Rare', color: 'text-blue-400', bg: 'bg-blue-900/30', border: 'border-blue-600/50' },
  legendary: { label: 'Legendary', color: 'text-amber-400', bg: 'bg-amber-900/30', border: 'border-amber-600/50' },
};

function AchievementsContent() {
  const [achievements] = useState<Achievement[]>(mockAchievements);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showEarned, setShowEarned] = useState<'all' | 'earned' | 'in-progress'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const filteredAchievements = achievements.filter(achievement => {
    const categoryMatch = selectedCategory === 'all' || achievement.category === selectedCategory;
    const earnedMatch = showEarned === 'all' || 
                        (showEarned === 'earned' && achievement.isEarned) ||
                        (showEarned === 'in-progress' && !achievement.isEarned);
    return categoryMatch && earnedMatch;
  });

  const earnedCount = achievements.filter(a => a.isEarned).length;
  const totalCount = achievements.length;

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
            <span className="text-3xl">🎖️</span>
            Achievements & Badges
          </h1>
          <p className="text-purple-200/70 mt-1">Marks of your mastery</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 relative z-10 space-y-6">
        {/* Progress Overview */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Your Progress</h2>
              <p className="text-purple-300/70">
                {earnedCount} of {totalCount} achievements earned
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-48 h-3 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full"
                  style={{ width: `${(earnedCount / totalCount) * 100}%` }}
                />
              </div>
              <span className="text-purple-400 font-bold">
                {Math.round((earnedCount / totalCount) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                selectedCategory === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800/60 text-purple-300 hover:bg-slate-700/60 border border-purple-500/20'
              }`}
            >
              All
            </button>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${
                  selectedCategory === key
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800/60 text-purple-300 hover:bg-slate-700/60 border border-purple-500/20'
                }`}
              >
                <span>{config.icon}</span>
                <span>{config.label}</span>
              </button>
            ))}
          </div>

          {/* Earned Filter */}
          <div className="flex gap-2">
            {(['all', 'earned', 'in-progress'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setShowEarned(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  showEarned === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800/60 text-purple-300 hover:bg-slate-700/60 border border-purple-500/20'
                }`}
              >
                {status === 'all' ? 'All' : status === 'earned' ? 'Earned' : 'In Progress'}
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement) => (
            <button
              key={achievement.id}
              onClick={() => setSelectedAchievement(achievement)}
              className={`text-left p-5 rounded-xl border transition-all duration-300 ${
                achievement.isEarned
                  ? `${rarityConfig[achievement.rarity].bg} ${rarityConfig[achievement.rarity].border} hover:shadow-lg`
                  : 'bg-slate-800/40 border-slate-700/50 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`text-4xl ${!achievement.isEarned ? 'grayscale opacity-50' : ''}`}>
                  {achievement.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold truncate ${
                      achievement.isEarned ? 'text-white' : 'text-slate-400'
                    }`}>
                      {achievement.name}
                    </h3>
                    {achievement.isEarned && (
                      <span className="text-green-400 text-sm">✓</span>
                    )}
                  </div>
                  <p className="text-purple-300/60 text-sm mb-2">{achievement.description}</p>
                  
                  {/* Progress Bar */}
                  {!achievement.isEarned && (
                    <div className="space-y-1">
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                        />
                      </div>
                      <p className="text-purple-400/60 text-xs">
                        {achievement.progress} / {achievement.maxProgress}
                      </p>
                    </div>
                  )}

                  {achievement.isEarned && achievement.earnedDate && (
                    <p className="text-purple-400/50 text-xs">
                      Earned {new Date(achievement.earnedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-purple-500/10">
                <span className={`text-xs font-medium ${rarityConfig[achievement.rarity].color}`}>
                  {rarityConfig[achievement.rarity].label}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-8 text-center border border-purple-500/20">
            <span className="text-6xl mb-4 block">🎖️</span>
            <p className="text-purple-300/70">No achievements match your filters</p>
          </div>
        )}

        {/* Achievement Detail Modal */}
        {selectedAchievement && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedAchievement(null)}
          >
            <div 
              className={`rounded-2xl p-6 max-w-md w-full border ${
                selectedAchievement.isEarned
                  ? `bg-slate-800 ${rarityConfig[selectedAchievement.rarity].border}`
                  : 'bg-slate-800 border-slate-700'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className={`text-6xl mb-3 ${!selectedAchievement.isEarned ? 'grayscale opacity-50' : ''}`}>
                  {selectedAchievement.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{selectedAchievement.name}</h3>
                <p className={`text-sm font-medium ${rarityConfig[selectedAchievement.rarity].color}`}>
                  {rarityConfig[selectedAchievement.rarity].label}
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                <p className="text-purple-200 italic text-center">&quot;{selectedAchievement.lore}&quot;</p>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-purple-300/70 text-center">{selectedAchievement.description}</p>
                
                {!selectedAchievement.isEarned && (
                  <div className="space-y-2">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full"
                        style={{ width: `${(selectedAchievement.progress / selectedAchievement.maxProgress) * 100}%` }}
                      />
                    </div>
                    <p className="text-center text-purple-300/60 text-sm">
                      {selectedAchievement.progress} / {selectedAchievement.maxProgress}
                    </p>
                  </div>
                )}

                {selectedAchievement.isEarned && selectedAchievement.earnedDate && (
                  <p className="text-center text-green-400">
                    ✓ Earned on {new Date(selectedAchievement.earnedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedAchievement(null)}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function AchievementsPage() {
  return (
    <ProtectedRoute>
      <AchievementsContent />
    </ProtectedRoute>
  );
}
