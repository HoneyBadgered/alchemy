'use client';

/**
 * Payment Methods Page
 * 
 * Manage saved payment methods with dark-fairytale aesthetic.
 */

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Link from 'next/link';
import BottomNavigation from '@/components/BottomNavigation';

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  email?: string;
  isDefault: boolean;
}

// Mock payment methods for demonstration
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'card',
    brand: 'Visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2026,
    isDefault: true,
  },
  {
    id: '2',
    type: 'card',
    brand: 'Mastercard',
    last4: '8888',
    expMonth: 6,
    expYear: 2025,
    isDefault: false,
  },
  {
    id: '3',
    type: 'paypal',
    email: 'alchemist@example.com',
    isDefault: false,
  },
];

function PaymentMethodsContent() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getCardIcon = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setPaymentMethods(prev => prev.map(pm => ({
        ...pm,
        isDefault: pm.id === id,
      })));
      setMessage({ type: 'success', text: 'Default payment method updated.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update default payment method.' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
      setDeleteConfirmId(null);
      setMessage({ type: 'success', text: 'Payment method removed from your treasury.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to remove payment method.' });
    }
  };

  const handleAddCard = () => {
    // In production, this would integrate with Stripe Elements or similar
    setMessage({ type: 'success', text: 'Card addition would integrate with Stripe here.' });
    setIsAddingNew(false);
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
            <span className="text-3xl">💎</span>
            Payment Methods
          </h1>
          <p className="text-purple-200/70 mt-1">Your treasury connections</p>
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

        {/* Add New Button */}
        {!isAddingNew && (
          <button
            onClick={() => {
              setIsAddingNew(true);
              setMessage(null);
            }}
            className="w-full bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border border-dashed border-purple-500/40 hover:border-purple-400/60 transition-all duration-300 text-center group"
          >
            <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">➕</span>
            <span className="text-purple-300 font-medium">Add Payment Method</span>
          </button>
        )}

        {/* Add Payment Form */}
        {isAddingNew && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h2 className="text-lg font-semibold text-white mb-4">Add Payment Method</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={handleAddCard}
                className="p-6 bg-slate-700/50 hover:bg-slate-700/70 rounded-lg border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 text-left group"
              >
                <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform">💳</span>
                <h3 className="text-white font-semibold mb-1">Credit or Debit Card</h3>
                <p className="text-purple-300/60 text-sm">Add a card for quick checkout</p>
              </button>
              
              <button
                onClick={() => {
                  setMessage({ type: 'success', text: 'PayPal integration would connect here.' });
                  setIsAddingNew(false);
                }}
                className="p-6 bg-slate-700/50 hover:bg-slate-700/70 rounded-lg border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 text-left group"
              >
                <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform">🅿️</span>
                <h3 className="text-white font-semibold mb-1">PayPal</h3>
                <p className="text-purple-300/60 text-sm">Connect your PayPal account</p>
              </button>
            </div>

            <button
              onClick={() => setIsAddingNew(false)}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-purple-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Payment Methods List */}
        {paymentMethods.length > 0 && !isAddingNew && (
          <div className="space-y-4">
            {paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className={`bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border transition-all duration-300 ${
                  pm.isDefault 
                    ? 'border-purple-400/50 shadow-lg shadow-purple-500/10' 
                    : 'border-purple-500/20'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center text-2xl border border-purple-500/20">
                      {pm.type === 'paypal' ? '🅿️' : getCardIcon(pm.brand)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-semibold">
                          {pm.type === 'paypal' 
                            ? 'PayPal' 
                            : `${pm.brand} •••• ${pm.last4}`}
                        </h3>
                        {pm.isDefault && (
                          <span className="px-2 py-1 bg-purple-600/30 text-purple-300 text-xs font-medium rounded border border-purple-500/50">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-purple-300/60 text-sm mt-1">
                        {pm.type === 'paypal' 
                          ? pm.email 
                          : `Expires ${pm.expMonth}/${pm.expYear}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!pm.isDefault && (
                      <button
                        onClick={() => handleSetDefault(pm.id)}
                        className="px-3 py-1 text-purple-300 hover:text-purple-100 text-sm transition-colors"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteConfirmId(pm.id)}
                      className="px-3 py-1 text-red-400 hover:text-red-300 text-sm transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation */}
                {deleteConfirmId === pm.id && (
                  <div className="mt-4 p-3 bg-red-900/30 rounded-lg border border-red-600/50">
                    <p className="text-red-200 text-sm mb-3">
                      Remove this payment method from your treasury?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(pm.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-medium transition-colors"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-purple-200 rounded text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {paymentMethods.length === 0 && !isAddingNew && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-8 text-center border border-purple-500/20">
            <span className="text-6xl mb-4 block">💎</span>
            <h2 className="text-xl font-bold text-white mb-2">No Payment Methods</h2>
            <p className="text-purple-300/70 mb-4">
              Add a payment method for faster checkout.
            </p>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-5 border border-purple-500/10">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h3 className="text-purple-200 font-medium">Your treasury is secure</h3>
              <p className="text-purple-300/60 text-sm mt-1">
                All payment information is encrypted and securely stored. We never store your full card details on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function PaymentMethodsPage() {
  return (
    <ProtectedRoute>
      <PaymentMethodsContent />
    </ProtectedRoute>
  );
}
