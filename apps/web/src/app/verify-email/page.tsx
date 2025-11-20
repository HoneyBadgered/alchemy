'use client';

/**
 * Email Verification Page
 */

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/auth-api';
import Link from 'next/link';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing verification token');
      setIsLoading(false);
      return;
    }

    // Automatically verify on page load
    const verifyEmail = async () => {
      try {
        const response = await authApi.verifyEmail(token);
        setMessage(response.message);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch {
        setError('Failed to verify email. The link may have expired.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-900 mb-2">
            🧪 The Alchemy Table
          </h1>
          <p className="text-gray-600">Email Verification</p>
        </div>

        <div className="space-y-6">
          {isLoading && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <p className="font-semibold mb-2">{message}</p>
              <p className="text-sm">Redirecting to login...</p>
            </div>
          )}

          <div className="text-center">
            <Link
              href="/login"
              className="text-purple-600 font-semibold hover:text-purple-800 transition"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
