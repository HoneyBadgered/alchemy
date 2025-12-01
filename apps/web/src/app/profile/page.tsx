'use client';

/**
 * User Profile Dashboard Page
 * 
 * The main hub for the user's alchemical journey, featuring a dark-fairytale
 * aesthetic with mystical elements and atmospheric UI.
 */

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { catalogApi } from '@/lib/catalog-api';
import { orderApi } from '@/lib/order-api';
import BottomNavigation from '@/components/BottomNavigation';

// Profile section navigation items with dark-fairytale theming
const profileSections = [
  { 
    href: '/profile/account', 
    label: 'Account Information', 
    icon: '📜', 
    description: 'Manage your arcane credentials',
    lore: 'Your identity in the realm of alchemy'
  },
  { 
    href: '/profile/orders', 
    label: 'Order History', 
    icon: '📦', 
    description: 'View past concoctions',
    lore: 'Chronicles of your alchemical acquisitions'
  },
  { 
    href: '/profile/addresses', 
    label: 'Addresses', 
    icon: '🏠', 
    description: 'Manage delivery locations',
    lore: 'Where your potions shall arrive'
  },
  { 
    href: '/profile/payments', 
    label: 'Payment Methods', 
    icon: '💎', 
    description: 'Manage payment options',
    lore: 'Your treasury connections'
  },
  { 
    href: '/wishlist', 
    label: 'Wishlist', 
    icon: '✨', 
    description: 'Items you desire',
    lore: 'Dreams of future brews'
  },
  { 
    href: '/profile/rewards', 
    label: 'Rewards & Loyalty', 
    icon: '🏆', 
    description: 'Points and tier status',
    lore: 'Your standing among the alchemists'
  },
  { 
    href: '/profile/subscriptions', 
    label: 'Subscriptions', 
    icon: '🔮', 
    description: 'Manage recurring orders',
    lore: 'Enchantments that persist'
  },
  { 
    href: '/profile/notifications', 
    label: 'Notifications', 
    icon: '🔔', 
    description: 'Preference settings',
    lore: 'How whispers reach you'
  },
  { 
    href: '/profile/flavor', 
    label: 'Flavor Profile', 
    icon: '🧪', 
    description: 'Personalization settings',
    lore: 'Your taste in the arcane arts'
  },
  { 
    href: '/profile/apothecary', 
    label: 'Your Apothecary Shelf', 
    icon: '🫙', 
    description: 'View your collection',
    lore: 'A cabinet of past wonders'
  },
  { 
    href: '/profile/achievements', 
    label: 'Achievements', 
    icon: '🎖️', 
    description: 'Badges and milestones',
    lore: 'Marks of your mastery'
  },
];

// Tier definitions for the loyalty program
const loyaltyTiers = [
  { name: 'Novice', minPoints: 0, icon: '🌱', color: 'from-gray-600 to-gray-800' },
  { name: 'Adept', minPoints: 500, icon: '⚗️', color: 'from-green-700 to-green-900' },
  { name: 'Alchemist', minPoints: 2000, icon: '🧙', color: 'from-purple-700 to-purple-900' },
  { name: 'Grand Master', minPoints: 5000, icon: '👑', color: 'from-amber-600 to-amber-800' },
];

function ProfileDashboardContent() {
  const { user, logout } = useAuth();
  const { accessToken } = useAuthStore();

  // Fetch wishlist count
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => catalogApi.getWishlist(accessToken!),
    enabled: !!accessToken,
  });

  // Fetch recent orders
  const { data: ordersData } = useQuery({
    queryKey: ['orders', 'recent'],
    queryFn: () => orderApi.getOrders(accessToken!, { perPage: 1 }),
    enabled: !!accessToken,
  });

  // Mock data for rewards (would come from API in production)
  const pointsBalance = 1250;
  const currentTier = loyaltyTiers.find(
    (tier, index) => 
      pointsBalance >= tier.minPoints && 
      (index === loyaltyTiers.length - 1 || pointsBalance < loyaltyTiers[index + 1].minPoints)
  ) || loyaltyTiers[0];
  
  const nextTier = loyaltyTiers.find(tier => tier.minPoints > pointsBalance);
  const progressToNextTier = nextTier 
    ? ((pointsBalance - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  const wishlistCount = wishlistData?.items?.length || 0;
  const recentOrder = ordersData?.orders?.[0];

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Midnight greetings';
    if (hour < 12) return 'Good morrow';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Greetings, night owl';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 pb-20">
      {/* Atmospheric overlay with subtle pattern */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NCAwLTE4IDguMDYtMTggMThzOC4wNiAxOCAxOCAxOCAxOC04LjA2IDE4LTE4LTguMDYtMTgtMTgtMTh6bTAgMzJjLTcuNzMyIDAtMTQtNi4yNjgtMTQtMTRzNi4yNjgtMTQgMTQtMTQgMTQgNi4yNjggMTQgMTQtNi4yNjggMTQtMTQgMTR6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wMiIvPjwvZz48L3N2Zz4=')] opacity-30 pointer-events-none" />
      
      {/* Header with mystical gradient */}
      <div className="relative bg-gradient-to-r from-purple-900/80 via-violet-800/80 to-purple-900/80 border-b border-purple-500/30 shadow-lg shadow-purple-900/50">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar with mystical glow */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-violet-800 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/50 border-2 border-purple-400/50">
                  {user?.profile?.avatarUrl ? (
                    <img 
                      src={user.profile.avatarUrl} 
                      alt={user.username} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>🧙</span>
                  )}
                </div>
                {/* Tier badge */}
                <div className="absolute -bottom-1 -right-1 text-xl" title={`${currentTier.name} Tier`}>
                  {currentTier.icon}
                </div>
              </div>
              <div>
                <p className="text-purple-300 text-sm font-medium">{getGreeting()}</p>
                <h1 className="text-2xl font-bold text-white">
                  {user?.profile?.firstName || user?.username}
                </h1>
                <p className="text-purple-200/70 text-sm">{currentTier.name} Alchemist</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-900/50 text-red-200 rounded-lg font-medium hover:bg-red-800/60 transition-all duration-300 border border-red-700/50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">
        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Recent Order Card */}
          <Link 
            href="/profile/orders"
            className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📦</span>
              <h3 className="text-purple-200 font-semibold">Recent Order</h3>
            </div>
            {recentOrder ? (
              <div className="space-y-2">
                <p className="text-white font-medium text-lg">
                  ${Number(recentOrder.totalAmount).toFixed(2)}
                </p>
                <p className="text-purple-300/70 text-sm">
                  {new Date(recentOrder.createdAt).toLocaleDateString()}
                </p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  recentOrder.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                  recentOrder.status === 'shipped' ? 'bg-purple-900/50 text-purple-300' :
                  'bg-amber-900/50 text-amber-300'
                }`}>
                  {recentOrder.status.charAt(0).toUpperCase() + recentOrder.status.slice(1)}
                </span>
              </div>
            ) : (
              <p className="text-purple-300/50 text-sm italic">No orders yet</p>
            )}
            <p className="text-purple-400 text-sm mt-3 group-hover:text-purple-300 transition-colors">
              View all orders →
            </p>
          </Link>

          {/* Points Balance Card */}
          <Link 
            href="/profile/rewards"
            className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">💎</span>
              <h3 className="text-purple-200 font-semibold">Points Balance</h3>
            </div>
            <p className="text-white font-bold text-2xl mb-2">
              {pointsBalance.toLocaleString()} <span className="text-sm font-normal text-purple-300">pts</span>
            </p>
            {nextTier && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-purple-300/70">
                  <span>{currentTier.icon} {currentTier.name}</span>
                  <span>{nextTier.icon} {nextTier.name}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressToNextTier}%` }}
                  />
                </div>
                <p className="text-purple-300/50 text-xs">
                  {nextTier.minPoints - pointsBalance} pts to {nextTier.name}
                </p>
              </div>
            )}
            <p className="text-purple-400 text-sm mt-3 group-hover:text-purple-300 transition-colors">
              View rewards →
            </p>
          </Link>

          {/* Wishlist Card */}
          <Link 
            href="/wishlist"
            className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">✨</span>
              <h3 className="text-purple-200 font-semibold">Wishlist</h3>
            </div>
            <p className="text-white font-bold text-2xl mb-2">
              {wishlistCount} <span className="text-sm font-normal text-purple-300">items</span>
            </p>
            <p className="text-purple-300/50 text-sm italic">
              {wishlistCount === 0 ? 'No items saved yet' : 'Dreams awaiting'}
            </p>
            <p className="text-purple-400 text-sm mt-3 group-hover:text-purple-300 transition-colors">
              View wishlist →
            </p>
          </Link>
        </div>

        {/* Profile Navigation Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-purple-400">⚗️</span>
            Your Alchemist&apos;s Quarters
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profileSections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-5 border border-purple-500/20 hover:border-purple-400/40 hover:bg-slate-800/60 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    {section.icon}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold group-hover:text-purple-200 transition-colors">
                      {section.label}
                    </h3>
                    <p className="text-purple-300/60 text-sm mt-1">{section.description}</p>
                    <p className="text-purple-500/50 text-xs mt-2 italic">{section.lore}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Email Verification Warning */}
        {!user?.emailVerified && (
          <div className="bg-amber-900/30 border border-amber-600/50 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-amber-200 font-semibold">Verify Your Email</h3>
                <p className="text-amber-300/70 text-sm mt-1">
                  Your email is not yet verified. Complete this step to unlock the full powers of your alchemist account.
                </p>
                <button className="mt-3 text-amber-300 hover:text-amber-100 text-sm font-medium underline underline-offset-2 transition-colors">
                  Resend verification email
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function ProfileDashboardPage() {
  return (
    <ProtectedRoute>
      <ProfileDashboardContent />
    </ProtectedRoute>
  );
}
