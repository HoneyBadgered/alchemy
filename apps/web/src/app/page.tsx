'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to the appropriate page
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/table');
      }
    }
  }, [isAuthenticated, user, router, isLoading]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show homepage for unauthenticated users
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600 p-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo and Title */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            🧪 The Alchemy Table
          </h1>
          <p className="text-xl text-purple-200">
            A gamified e-commerce platform for building blends at an alchemy table
          </p>
        </div>

        {/* Feature highlights */}
        <div className="mb-10 space-y-3">
          <div className="flex items-center justify-center gap-2 text-white">
            <span className="text-2xl">✨</span>
            <span>Create unique blends with magical ingredients</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-white">
            <span className="text-2xl">🎮</span>
            <span>Gamified experience with rewards and achievements</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-white">
            <span className="text-2xl">🛒</span>
            <span>Shop for premium ingredients and accessories</span>
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="space-y-4">
          <Link
            href="/signup"
            className="block w-full bg-white text-purple-900 py-4 rounded-lg font-semibold text-lg hover:bg-purple-100 transition shadow-lg"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="block w-full bg-transparent border-2 border-white text-white py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition"
          >
            Sign In
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-8 text-purple-300 text-sm">
          Start your alchemy journey today!
        </p>
      </div>
    </div>
  );
}
