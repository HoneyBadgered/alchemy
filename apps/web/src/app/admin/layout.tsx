'use client';

/**
 * Admin Layout with Navigation
 */

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!user) {
        // User is not logged in, redirect to login
        router.push('/login');
      } else if (user.role !== 'admin') {
        // User is logged in but not an admin, redirect to table
        router.push('/table');
      }
    }
  }, [user, router, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
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
