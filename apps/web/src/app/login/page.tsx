'use client';

/**
 * Login Page
 */

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const searchParams = useSearchParams();
  // Get redirect parameter and validate it (trim whitespace, ensure non-empty)
  const rawRedirect = searchParams.get('redirect');
  const redirectTo = rawRedirect?.trim() || '';
  const { login, isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Redirect already authenticated users to appropriate dashboard
  // Only redirect when not loading and both isAuthenticated and user are available
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/table');
      }
    }
  }, [isAuthenticated, user, router, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login(email, password, redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-purple-900 mb-2">
          🧪 The Alchemy Table
        </h1>
        <p className="text-gray-600">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition text-black"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition text-black"
            placeholder="••••••••"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <Link
            href="/forgot-password"
            className="text-sm text-purple-600 hover:text-purple-800 transition"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <Link
            href={redirectTo ? `/signup?redirect=${encodeURIComponent(redirectTo)}` : '/signup'}
            className="text-purple-600 font-semibold hover:text-purple-800 transition"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

function LoginFormFallback() {
  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-purple-900 mb-2">
          🧪 The Alchemy Table
        </h1>
        <p className="text-gray-600">Sign in to your account</p>
      </div>
      <div className="text-center py-8">
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600 p-4">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
