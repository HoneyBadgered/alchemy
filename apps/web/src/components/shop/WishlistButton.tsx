'use client';

/**
 * Wishlist Button Component
 * Heart button to add/remove products from wishlist
 */

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { catalogApi } from '@/lib/catalog-api';

interface WishlistButtonProps {
  productId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onToggle?: (isInWishlist: boolean) => void;
}

export function WishlistButton({
  productId,
  size = 'md',
  className = '',
  onToggle,
}: WishlistButtonProps) {
  const { isAuthenticated, accessToken } = useAuthStore();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      setIsChecking(true);
      catalogApi
        .isInWishlist(productId, accessToken)
        .then(setIsInWishlist)
        .catch(() => setIsInWishlist(false))
        .finally(() => setIsChecking(false));
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, accessToken, productId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Could redirect to login or show a message
      alert('Please log in to add items to your wishlist');
      return;
    }

    if (!accessToken || isLoading) return;

    setIsLoading(true);
    try {
      if (isInWishlist) {
        await catalogApi.removeFromWishlist(productId, accessToken);
        setIsInWishlist(false);
        onToggle?.(false);
      } else {
        await catalogApi.addToWishlist(productId, accessToken);
        setIsInWishlist(true);
        onToggle?.(true);
      }
    } catch (error) {
      console.error('Wishlist error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (isChecking) {
    return (
      <button
        className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-white/80 shadow-md ${className}`}
        disabled
      >
        <svg
          className={`${iconSizes[size]} animate-spin text-gray-400`}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-md transition-all hover:scale-110 ${
        isLoading ? 'opacity-50' : ''
      } ${className}`}
      title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <svg
        className={`${iconSizes[size]} ${
          isInWishlist ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
        } transition-colors`}
        viewBox="0 0 24 24"
        fill={isInWishlist ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
