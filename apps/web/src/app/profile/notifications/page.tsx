'use client';

/**
 * Notification & Preference Settings Page
 * 
 * Manage email/SMS preferences with dark-fairytale aesthetic.
 */

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Link from 'next/link';
import BottomNavigation from '@/components/BottomNavigation';

interface NotificationPreference {
  id: string;
  category: string;
  label: string;
  description: string;
  email: boolean;
  sms: boolean;
  icon: string;
}

// Mock notification preferences
const mockPreferences: NotificationPreference[] = [
  {
    id: 'order_updates',
    category: 'Orders',
    label: 'Order Updates',
    description: 'Shipping confirmations and delivery notifications',
    email: true,
    sms: true,
    icon: '📦',
  },
  {
    id: 'back_in_stock',
    category: 'Products',
    label: 'Back in Stock Alerts',
    description: 'Get notified when wishlist items are available',
    email: true,
    sms: false,
    icon: '🔔',
  },
  {
    id: 'new_blends',
    category: 'Products',
    label: 'New Blend Announcements',
    description: 'Be the first to know about new arrivals',
    email: true,
    sms: false,
    icon: '✨',
  },
  {
    id: 'promotions',
    category: 'Marketing',
    label: 'Promotions & Offers',
    description: 'Exclusive discounts and special deals',
    email: true,
    sms: false,
    icon: '🎁',
  },
  {
    id: 'newsletter',
    category: 'Marketing',
    label: 'Newsletter',
    description: 'Monthly alchemist digest and brewing tips',
    email: true,
    sms: false,
    icon: '📜',
  },
  {
    id: 'rewards',
    category: 'Account',
    label: 'Rewards & Points',
    description: 'Points earned, tier changes, and rewards available',
    email: true,
    sms: false,
    icon: '🏆',
  },
  {
    id: 'subscription',
    category: 'Account',
    label: 'Subscription Reminders',
    description: 'Upcoming shipment notifications',
    email: true,
    sms: true,
    icon: '🔮',
  },
  {
    id: 'account_security',
    category: 'Account',
    label: 'Account & Security',
    description: 'Login alerts and password changes',
    email: true,
    sms: true,
    icon: '🔒',
  },
];

function NotificationsContent() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>(mockPreferences);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = (id: string, channel: 'email' | 'sms') => {
    setPreferences(prev => prev.map(pref => 
      pref.id === id 
        ? { ...pref, [channel]: !pref[channel] }
        : pref
    ));
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Your preferences have been saved.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribeAll = () => {
    setPreferences(prev => prev.map(pref => ({
      ...pref,
      email: pref.id === 'account_security' || pref.id === 'order_updates',
      sms: pref.id === 'account_security',
    })));
    setMessage({ type: 'success', text: 'Marketing preferences updated. Essential notifications remain enabled.' });
  };

  // Group preferences by category
  const categories = Array.from(new Set(preferences.map(p => p.category)));

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
            <span className="text-3xl">🔔</span>
            Notifications & Preferences
          </h1>
          <p className="text-purple-200/70 mt-1">How whispers reach you</p>
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

        {/* Preferences by Category */}
        {categories.map((category) => (
          <div key={category} className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-purple-500/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-purple-500/20">
              <h2 className="text-lg font-semibold text-white">{category}</h2>
            </div>
            <div className="divide-y divide-purple-500/10">
              {preferences
                .filter(p => p.category === category)
                .map((pref) => (
                  <div key={pref.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{pref.icon}</span>
                        <div>
                          <h3 className="text-white font-medium">{pref.label}</h3>
                          <p className="text-purple-300/60 text-sm mt-1">{pref.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Email Toggle */}
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => handleToggle(pref.id, 'email')}
                            className={`w-12 h-6 rounded-full transition-colors relative ${
                              pref.email ? 'bg-purple-600' : 'bg-slate-600'
                            }`}
                            aria-label={`Toggle email for ${pref.label}`}
                          >
                            <span
                              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                pref.email ? 'left-7' : 'left-1'
                              }`}
                            />
                          </button>
                          <span className="text-purple-300/60 text-xs">Email</span>
                        </div>
                        {/* SMS Toggle */}
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => handleToggle(pref.id, 'sms')}
                            className={`w-12 h-6 rounded-full transition-colors relative ${
                              pref.sms ? 'bg-purple-600' : 'bg-slate-600'
                            }`}
                            aria-label={`Toggle SMS for ${pref.label}`}
                          >
                            <span
                              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                pref.sms ? 'left-7' : 'left-1'
                              }`}
                            />
                          </button>
                          <span className="text-purple-300/60 text-xs">SMS</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={handleUnsubscribeAll}
            className="text-purple-300 hover:text-purple-100 text-sm transition-colors"
          >
            Unsubscribe from marketing
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {/* SMS Info */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-5 border border-purple-500/10">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <h3 className="text-purple-200 font-medium">SMS Notifications</h3>
              <p className="text-purple-300/60 text-sm mt-1">
                SMS notifications require a verified phone number. Standard message and data rates may apply.
              </p>
              <button className="text-purple-400 hover:text-purple-300 text-sm mt-2 transition-colors">
                Add phone number →
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-5 border border-purple-500/10">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h3 className="text-purple-200 font-medium">Your Privacy</h3>
              <p className="text-purple-300/60 text-sm mt-1">
                We respect your inbox. Essential notifications like order confirmations and security alerts cannot be disabled.
                Read our{' '}
                <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">
                  Privacy Policy
                </Link>
                {' '}for more details.
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  );
}
