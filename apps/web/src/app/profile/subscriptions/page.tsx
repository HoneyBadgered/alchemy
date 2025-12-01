'use client';

/**
 * Subscriptions Page
 * 
 * Manage recurring orders and subscription settings with dark-fairytale aesthetic.
 */

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Link from 'next/link';
import BottomNavigation from '@/components/BottomNavigation';

interface Subscription {
  id: string;
  productName: string;
  productImage?: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'bimonthly';
  price: number;
  nextShipmentDate: string;
  status: 'active' | 'paused' | 'cancelled';
  quantity: number;
}

// Mock subscriptions for demonstration
const mockSubscriptions: Subscription[] = [
  {
    id: '1',
    productName: 'Midnight Brew Monthly Box',
    frequency: 'monthly',
    price: 29.99,
    nextShipmentDate: '2024-02-15',
    status: 'active',
    quantity: 1,
  },
  {
    id: '2',
    productName: 'Earl Grey Essence',
    frequency: 'biweekly',
    price: 14.99,
    nextShipmentDate: '2024-02-08',
    status: 'active',
    quantity: 2,
  },
  {
    id: '3',
    productName: 'Dragon Fire Blend',
    frequency: 'monthly',
    price: 19.99,
    nextShipmentDate: '2024-02-20',
    status: 'paused',
    quantity: 1,
  },
];

const frequencyLabels = {
  weekly: 'Every Week',
  biweekly: 'Every 2 Weeks',
  monthly: 'Every Month',
  bimonthly: 'Every 2 Months',
};

function SubscriptionsContent() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(mockSubscriptions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePause = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSubscriptions(prev => prev.map(sub => 
        sub.id === id ? { ...sub, status: 'paused' as const } : sub
      ));
      setMessage({ type: 'success', text: 'Subscription paused. Your enchantment sleeps.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to pause subscription.' });
    }
  };

  const handleResume = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSubscriptions(prev => prev.map(sub => 
        sub.id === id ? { ...sub, status: 'active' as const } : sub
      ));
      setMessage({ type: 'success', text: 'Subscription resumed. The enchantment awakens!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to resume subscription.' });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
      setCancelConfirmId(null);
      setMessage({ type: 'success', text: 'Subscription cancelled. The enchantment has been dispelled.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to cancel subscription.' });
    }
  };

  // TODO: Integrate with subscription API to update the next shipment date
  const handleSkipNext = async (subscriptionId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Simulated API call - in production: await subscriptionApi.skipNext(subscriptionId, accessToken);
      console.log('Skipping next shipment for subscription:', subscriptionId);
      setMessage({ type: 'success', text: 'Next shipment skipped. Your schedule has been adjusted.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to skip shipment.' });
    }
  };

  const handleFrequencyChange = async (id: string, frequency: Subscription['frequency']) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSubscriptions(prev => prev.map(sub => 
        sub.id === id ? { ...sub, frequency } : sub
      ));
      setEditingId(null);
      setMessage({ type: 'success', text: 'Delivery frequency updated.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update frequency.' });
    }
  };

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const pausedSubscriptions = subscriptions.filter(s => s.status === 'paused');

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
            <span className="text-3xl">🔮</span>
            Subscriptions
          </h1>
          <p className="text-purple-200/70 mt-1">Enchantments that persist</p>
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

        {/* Summary Card */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-white">{activeSubscriptions.length}</p>
              <p className="text-purple-300/70 text-sm">Active</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{pausedSubscriptions.length}</p>
              <p className="text-purple-300/70 text-sm">Paused</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">
                ${subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.price * s.quantity, 0).toFixed(2)}
              </p>
              <p className="text-purple-300/70 text-sm">Monthly Est.</p>
            </div>
          </div>
        </div>

        {/* Upcoming Shipments */}
        {activeSubscriptions.length > 0 && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>📅</span>
              Upcoming Shipments
            </h2>
            <div className="space-y-3">
              {activeSubscriptions
                .sort((a, b) => new Date(a.nextShipmentDate).getTime() - new Date(b.nextShipmentDate).getTime())
                .slice(0, 3)
                .map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{sub.productName}</p>
                      <p className="text-purple-300/60 text-sm">{frequencyLabels[sub.frequency]}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-purple-400 font-semibold">
                        {new Date(sub.nextShipmentDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Active Subscriptions */}
        {activeSubscriptions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-green-400">●</span>
              Active Subscriptions
            </h2>
            <div className="space-y-4">
              {activeSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border border-purple-500/20"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-700/50 rounded-lg flex items-center justify-center text-3xl border border-purple-500/20">
                        {sub.productImage ? (
                          <img src={sub.productImage} alt={sub.productName} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          '🧪'
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{sub.productName}</h3>
                        <p className="text-purple-300/60 text-sm">
                          {sub.quantity}x · {frequencyLabels[sub.frequency]}
                        </p>
                        <p className="text-purple-400 font-medium mt-1">
                          ${(sub.price * sub.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-900/50 text-green-300 text-xs font-medium rounded border border-green-600/50">
                      Active
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-purple-500/10">
                    <p className="text-purple-300/60 text-sm">
                      Next shipment: <span className="text-white font-medium">
                        {new Date(sub.nextShipmentDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSkipNext(sub.id)}
                        className="px-3 py-1 text-purple-300 hover:text-purple-100 text-sm transition-colors"
                      >
                        Skip Next
                      </button>
                      <button
                        onClick={() => setEditingId(sub.id)}
                        className="px-3 py-1 text-purple-300 hover:text-purple-100 text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handlePause(sub.id)}
                        className="px-3 py-1 text-amber-400 hover:text-amber-300 text-sm transition-colors"
                      >
                        Pause
                      </button>
                      <button
                        onClick={() => setCancelConfirmId(sub.id)}
                        className="px-3 py-1 text-red-400 hover:text-red-300 text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Edit Frequency Modal */}
                  {editingId === sub.id && (
                    <div className="mt-4 p-4 bg-slate-700/30 rounded-lg border border-purple-500/20">
                      <h4 className="text-white font-medium mb-3">Change Delivery Frequency</h4>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {(Object.keys(frequencyLabels) as Array<keyof typeof frequencyLabels>).map((freq) => (
                          <button
                            key={freq}
                            onClick={() => handleFrequencyChange(sub.id, freq)}
                            className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                              sub.frequency === freq
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-600/50 text-purple-200 hover:bg-slate-600'
                            }`}
                          >
                            {frequencyLabels[freq]}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-purple-300 text-sm hover:text-purple-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Cancel Confirmation */}
                  {cancelConfirmId === sub.id && (
                    <div className="mt-4 p-4 bg-red-900/30 rounded-lg border border-red-600/50">
                      <p className="text-red-200 mb-3">
                        Are you sure you wish to cancel this subscription? The enchantment will be dispelled.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCancel(sub.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Yes, Cancel
                        </button>
                        <button
                          onClick={() => setCancelConfirmId(null)}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-purple-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          Keep Subscription
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paused Subscriptions */}
        {pausedSubscriptions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-amber-400">●</span>
              Paused Subscriptions
            </h2>
            <div className="space-y-4">
              {pausedSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border border-amber-500/20 opacity-80"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-700/50 rounded-lg flex items-center justify-center text-3xl border border-purple-500/20">
                        🧪
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{sub.productName}</h3>
                        <p className="text-purple-300/60 text-sm">
                          {sub.quantity}x · {frequencyLabels[sub.frequency]}
                        </p>
                        <p className="text-purple-400 font-medium mt-1">
                          ${(sub.price * sub.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-amber-900/50 text-amber-300 text-xs font-medium rounded border border-amber-600/50">
                      Paused
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-purple-500/10">
                    <button
                      onClick={() => handleResume(sub.id)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Resume
                    </button>
                    <button
                      onClick={() => setCancelConfirmId(sub.id)}
                      className="px-4 py-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Cancel Confirmation for paused */}
                  {cancelConfirmId === sub.id && (
                    <div className="mt-4 p-4 bg-red-900/30 rounded-lg border border-red-600/50">
                      <p className="text-red-200 mb-3">
                        Cancel this subscription permanently?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCancel(sub.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Yes, Cancel
                        </button>
                        <button
                          onClick={() => setCancelConfirmId(null)}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-purple-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          Keep
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {subscriptions.length === 0 && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-8 text-center border border-purple-500/20">
            <span className="text-6xl mb-4 block">🔮</span>
            <h2 className="text-xl font-bold text-white mb-2">No Active Subscriptions</h2>
            <p className="text-purple-300/70 mb-6">
              Subscribe to your favorite blends for automatic delivery and never run out.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Browse Products
            </Link>
          </div>
        )}

        {/* Benefits */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-5 border border-purple-500/10">
          <h3 className="text-purple-200 font-medium mb-3">Subscription Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-purple-300/70">
              <span>💰</span>
              <span>10% off every order</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300/70">
              <span>📦</span>
              <span>Free shipping always</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300/70">
              <span>🎁</span>
              <span>Exclusive member samples</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <ProtectedRoute>
      <SubscriptionsContent />
    </ProtectedRoute>
  );
}
