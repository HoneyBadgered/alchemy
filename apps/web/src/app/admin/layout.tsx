'use client';

/**
 * Admin Layout with Navigation
 */

import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100" role="status" aria-label="Loading" aria-live="polite">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
    <span className="sr-only">Loading admin dashboard...</span>
  </div>
);

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, isLoading } = useAuth();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only redirect when mounted, not loading, hydrated, and auth state is determined
  useEffect(() => {
    if (mounted && !isLoading && hasHydrated) {
      if (!user) {
        // User is not logged in, redirect to login
        router.push('/login');
      } else if (user.role !== 'admin') {
        // User is logged in but not an admin, redirect to table
        router.push('/table');
      }
    }
  }, [user, router, mounted, isLoading, hasHydrated]);

  // Show loading state while waiting for hydration or auth check
  if (!mounted || isLoading || !hasHydrated) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Redirecting to login...</div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Access denied. Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-purple-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">🧪 Alchemy Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-purple-200">{user.username}</span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-purple-800 hover:bg-purple-700 rounded-lg text-sm font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white shadow-md min-h-[calc(100vh-4rem)]">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admin/dashboard"
                  className="block px-4 py-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-900 transition"
                >
                  📊 Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/products"
                  className="block px-4 py-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-900 transition"
                >
                  📦 Products
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/ingredients"
                  className="block px-4 py-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-900 transition"
                >
                  🌿 Ingredients
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/orders"
                  className="block px-4 py-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-900 transition"
                >
                  📋 Orders
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/themes"
                  className="block px-4 py-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-900 transition"
                >
                  🎨 Themes
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/settings"
                  className="block px-4 py-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-900 transition"
                >
                  ⚙️ Settings
                </Link>
              </li>
              
              {/* Content Management Section */}
              <li className="pt-4 border-t border-gray-200">
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Content
                </div>
              </li>
              <li>
                <Link
                  href="/admin/blog"
                  className="block px-4 py-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-900 transition"
                >
                  📚 All Posts
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/blog?type=log"
                  className="block px-4 py-2 pl-8 rounded-lg hover:bg-purple-50 text-gray-600 hover:text-purple-900 transition text-sm"
                >
                  📝 Log Book
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/blog?type=grimoire"
                  className="block px-4 py-2 pl-8 rounded-lg hover:bg-purple-50 text-gray-600 hover:text-purple-900 transition text-sm"
                >
                  📖 Grimoire
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/blog/tags"
                  className="block px-4 py-2 pl-8 rounded-lg hover:bg-purple-50 text-gray-600 hover:text-purple-900 transition text-sm"
                >
                  🏷️ Tags
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/blog/stats"
                  className="block px-4 py-2 pl-8 rounded-lg hover:bg-purple-50 text-gray-600 hover:text-purple-900 transition text-sm"
                >
                  📈 Statistics
                </Link>
              </li>
              
              <li className="pt-4 border-t border-gray-200">
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition"
                >
                  ← Back to User Dashboard
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
