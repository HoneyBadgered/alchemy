'use client';

/**
 * Rewards & Loyalty Page
 * 
 * Display points balance, tier status, earned rewards, and redemption
 * with dark-fairytale aesthetic.
 */

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Link from 'next/link';
import BottomNavigation from '@/components/BottomNavigation';

// Tier definitions
const tiers = [
  { 
    name: 'Novice', 
    minPoints: 0, 
    icon: '🌱', 
    color: 'from-gray-600 to-gray-800',
    benefits: ['5% off first order', 'Birthday surprise'],
    lore: 'Every alchemist begins their journey here, eager to learn the ancient arts.'
  },
  { 
    name: 'Adept', 
    minPoints: 500, 
    icon: '⚗️', 
    color: 'from-green-700 to-green-900',
    benefits: ['10% off all orders', 'Early access to new blends', 'Free shipping over $50'],
    lore: 'Having proven your dedication, you now walk among the skilled practitioners.'
  },
  { 
    name: 'Alchemist', 
    minPoints: 2000, 
    icon: '🧙', 
    color: 'from-purple-700 to-purple-900',
    benefits: ['15% off all orders', 'Exclusive blends', 'Free expedited shipping', 'Priority support'],
    lore: 'A master of transmutation, you command respect in the halls of the guild.'
  },
  { 
    name: 'Grand Master', 
    minPoints: 5000, 
    icon: '👑', 
    color: 'from-amber-600 to-amber-800',
    benefits: ['20% off all orders', 'First access to limited editions', 'Personal alchemist concierge', 'Exclusive events'],
    lore: 'The highest honor bestowed upon those who have achieved legendary status.'
  },
];

// Mock rewards data
const rewards = [
  { id: '1', name: 'Free Shipping', points: 200, icon: '📦', description: 'Free shipping on your next order' },
  { id: '2', name: '$5 Off', points: 300, icon: '💰', description: '$5 discount on any order' },
  { id: '3', name: '$10 Off', points: 500, icon: '💎', description: '$10 discount on any order' },
  { id: '4', name: 'Mystery Sample', points: 400, icon: '🎁', description: 'A surprise blend sample with your order' },
  { id: '5', name: 'Double Points Day', points: 750, icon: '✨', description: 'Earn double points on your next order' },
  { id: '6', name: '$25 Off', points: 1200, icon: '🏆', description: '$25 discount on any order' },
];

// Mock activity history
const activityHistory = [
  { id: '1', type: 'earned', points: 150, description: 'Order #12345', date: '2024-01-15' },
  { id: '2', type: 'redeemed', points: -200, description: 'Free Shipping Reward', date: '2024-01-10' },
  { id: '3', type: 'earned', points: 100, description: 'Order #12344', date: '2024-01-05' },
  { id: '4', type: 'bonus', points: 50, description: 'Birthday Bonus', date: '2024-01-01' },
  { id: '5', type: 'earned', points: 200, description: 'Order #12343', date: '2023-12-20' },
];

function RewardsContent() {
  const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Mock user data
  const pointsBalance = 1250;

  const currentTier = tiers.find(
    (tier, index) => 
      pointsBalance >= tier.minPoints && 
      (index === tiers.length - 1 || pointsBalance < tiers[index + 1].minPoints)
  ) || tiers[0];
  
  const currentTierIndex = tiers.indexOf(currentTier);
  const nextTier = tiers[currentTierIndex + 1];
  const progressToNextTier = nextTier 
    ? ((pointsBalance - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  const handleRedeem = async (rewardId: string, rewardPoints: number) => {
    if (pointsBalance < rewardPoints) {
      setMessage({ type: 'error', text: 'Insufficient points for this reward.' });
      return;
    }

    setRedeeming(rewardId);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Reward redeemed successfully! Check your email for details.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to redeem reward. Please try again.' });
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 pb-20">
      {/* Atmospheric overlay */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NCAwLTE4IDguMDYtMTggMThzOC4wNiAxOCAxOCAxOCAxOC04LjA2IDE4LTE4LTguMDYtMTgtMTgtMTh6bTAgMzJjLTcuNzMyIDAtMTQtNi4yNjgtMTQtMTRzNi4yNjgtMTQgMTQtMTQgMTQgNi4yNjggMTQgMTQtNi4yNjggMTQtMTQgMTR6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wMiIvPjwvZz48L3N2Zz4=')] opacity-30 pointer-events-none" />
      
      {/* Header */}
      <div className="relative bg-gradient-to-r from-purple-900/80 via-violet-800/80 to-purple-900/80 border-b border-purple-500/30">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link 
            href="/profile" 
            className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-100 transition-colors mb-4"
          >
            <span>←</span>
            <span>Back to Profile</span>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            Rewards & Loyalty
          </h1>
          <p className="text-purple-200/70 mt-1">Your standing among the alchemists</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 relative z-10 space-y-6">
        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-900/30 border border-green-600/50 text-green-300' 
              : 'bg-red-900/30 border border-red-600/50 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Points & Tier Overview */}
        <div className={`bg-gradient-to-br ${currentTier.color} rounded-xl p-6 border border-purple-500/30 shadow-xl`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="text-6xl">{currentTier.icon}</div>
              <div>
                <p className="text-white/70 text-sm">Current Tier</p>
                <h2 className="text-3xl font-bold text-white">{currentTier.name}</h2>
                <p className="text-white/60 text-sm mt-1 italic">{currentTier.lore}</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-white/70 text-sm">Points Balance</p>
              <p className="text-4xl font-bold text-white">{pointsBalance.toLocaleString()}</p>
              <p className="text-white/60 text-sm">alchemist points</p>
            </div>
          </div>

          {/* Progress to next tier */}
          {nextTier && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex justify-between text-sm text-white/70 mb-2">
                <span>{currentTier.icon} {currentTier.name}</span>
                <span>{nextTier.icon} {nextTier.name}</span>
              </div>
              <div className="h-3 bg-black/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-white/50 to-white/80 rounded-full transition-all duration-500"
                  style={{ width: `${progressToNextTier}%` }}
                />
              </div>
              <p className="text-center text-white/60 text-sm mt-2">
                {nextTier.minPoints - pointsBalance} more points to {nextTier.name}
              </p>
            </div>
          )}
        </div>

        {/* Tier Benefits */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Your {currentTier.name} Benefits</h3>
          <ul className="space-y-3">
            {currentTier.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-3 text-purple-200">
                <span className="text-green-400">✓</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* All Tiers Overview */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Guild Hierarchy</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tiers.map((tier, index) => (
              <div 
                key={tier.name}
                className={`p-4 rounded-lg border text-center transition-all duration-300 ${
                  index <= currentTierIndex 
                    ? 'bg-purple-900/30 border-purple-400/50' 
                    : 'bg-slate-700/30 border-purple-500/20 opacity-60'
                }`}
              >
                <div className="text-3xl mb-2">{tier.icon}</div>
                <h4 className="text-white font-medium">{tier.name}</h4>
                <p className="text-purple-300/60 text-xs mt-1">{tier.minPoints.toLocaleString()} pts</p>
                {index <= currentTierIndex && (
                  <span className="text-green-400 text-xs">✓ Unlocked</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'rewards'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800/60 text-purple-300 hover:bg-slate-700/60 border border-purple-500/20'
            }`}
          >
            Redeem Rewards
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800/60 text-purple-300 hover:bg-slate-700/60 border border-purple-500/20'
            }`}
          >
            Points History
          </button>
        </div>

        {/* Rewards Grid */}
        {activeTab === 'rewards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => {
              const canAfford = pointsBalance >= reward.points;
              return (
                <div
                  key={reward.id}
                  className={`bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border transition-all duration-300 ${
                    canAfford 
                      ? 'border-purple-500/20 hover:border-purple-400/40' 
                      : 'border-purple-500/10 opacity-60'
                  }`}
                >
                  <div className="text-4xl mb-3">{reward.icon}</div>
                  <h4 className="text-white font-semibold mb-1">{reward.name}</h4>
                  <p className="text-purple-300/60 text-sm mb-3">{reward.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400 font-bold">{reward.points} pts</span>
                    <button
                      onClick={() => handleRedeem(reward.id, reward.points)}
                      disabled={!canAfford || redeeming === reward.id}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        canAfford
                          ? 'bg-purple-600 hover:bg-purple-500 text-white'
                          : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {redeeming === reward.id ? 'Redeeming...' : 'Redeem'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Points History */}
        {activeTab === 'history' && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-purple-500/20 overflow-hidden">
            <div className="divide-y divide-purple-500/10">
              {activityHistory.map((activity) => (
                <div key={activity.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xl ${
                      activity.type === 'earned' ? '⬆️' :
                      activity.type === 'redeemed' ? '⬇️' : '🎁'
                    }`}>
                      {activity.type === 'earned' ? '⬆️' :
                       activity.type === 'redeemed' ? '⬇️' : '🎁'}
                    </span>
                    <div>
                      <p className="text-white font-medium">{activity.description}</p>
                      <p className="text-purple-300/60 text-sm">
                        {new Date(activity.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold ${
                    activity.points > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {activity.points > 0 ? '+' : ''}{activity.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How to Earn Points */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-5 border border-purple-500/10">
          <h3 className="text-purple-200 font-medium mb-3">How to Earn Points</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-purple-300/70">
              <span>🛒</span>
              <span>1 point per $1 spent</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300/70">
              <span>📝</span>
              <span>25 points per review</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300/70">
              <span>🎂</span>
              <span>50 bonus points on birthday</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function RewardsPage() {
  return (
    <ProtectedRoute>
      <RewardsContent />
    </ProtectedRoute>
  );
}
