'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Header, Footer } from '@/components/layout';

/**
 * Account page - serves as a landing page for authentication.
 * Shows login/register options for unauthenticated users,
 * or redirects to profile for authenticated users.
 */
export default function AccountPage() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
          <div className="text-purple-900 text-xl">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-md mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl" aria-hidden="true">👤</span>
            </div>
            <h1 className="text-3xl font-bold text-purple-900">
              {isAuthenticated ? 'My Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isAuthenticated 
                ? 'Manage your account and preferences'
                : 'Sign in to access your account or create a new one'}
            </p>
          </div>

          {isAuthenticated ? (
            // Authenticated user options
            <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
              <Link
                href="/profile"
                className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">👤</span>
                  <span className="font-medium text-gray-900">My Profile</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                href="/profile/orders"
                className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">📦</span>
                  <span className="font-medium text-gray-900">Order History</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                href="/wishlist"
                className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">❤️</span>
                  <span className="font-medium text-gray-900">Wishlist</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                href="/profile/achievements"
                className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">🏆</span>
                  <span className="font-medium text-gray-900">Achievements</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            // Unauthenticated user options
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="space-y-4">
                <Link
                  href="/login"
                  className="block w-full bg-purple-600 text-white text-center py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors"
                >
                  Sign In
                </Link>
                
                <Link
                  href="/signup"
                  className="block w-full bg-white text-purple-600 text-center py-4 rounded-lg font-semibold text-lg border-2 border-purple-600 hover:bg-purple-50 transition-colors"
                >
                  Create Account
                </Link>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h2 className="font-semibold text-gray-900 mb-4">Account Benefits</h2>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600" aria-hidden="true">✓</span>
                    Save custom blend recipes
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600" aria-hidden="true">✓</span>
                    Earn XP and unlock rewards
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600" aria-hidden="true">✓</span>
                    Track orders and order history
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600" aria-hidden="true">✓</span>
                    Faster checkout with saved info
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
