'use client';

/**
 * User Dashboard Page (Protected)
 */

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Link from 'next/link';

function DashboardContent() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-purple-900 mb-2">
                Welcome, {user?.username}! 🧪
              </h1>
              <p className="text-gray-600">Your Alchemy Table Dashboard</p>
            </div>
            <button
              onClick={logout}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                Account Information
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">Email:</span> {user?.email}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Username:</span> {user?.username}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Email Verified:</span>{' '}
                  {user?.emailVerified ? (
                    <span className="text-green-600">✓ Yes</span>
                  ) : (
                    <span className="text-red-600">✗ No</span>
                  )}
                </p>
              </div>
            </div>

            <div className="bg-pink-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link
                  href="/table"
                  className="block px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition text-center"
                >
                  Go to Alchemy Table
                </Link>
                <Link
                  href="/shop"
                  className="block px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition text-center"
                >
                  Visit Shop
                </Link>
              </div>
            </div>
          </div>

          {!user?.emailVerified && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">Please verify your email</p>
              <p className="text-sm mt-1">
                Check your inbox for a verification link. Didn't receive it?{' '}
                <button className="underline hover:text-yellow-900">
                  Resend verification email
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
