'use client';

/**
 * Sale Badge Component
 * Displays discount percentage for products on sale
 */

import React from 'react';

interface SaleBadgeProps {
  discountPercent: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'tag';
}

export function SaleBadge({
  discountPercent,
  size = 'md',
  variant = 'badge',
}: SaleBadgeProps) {
  if (discountPercent <= 0) return null;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  if (variant === 'tag') {
    return (
      <span
        className={`inline-flex items-center bg-red-500 text-white font-bold rounded ${sizeClasses[size]}`}
      >
        🔥 -{discountPercent}%
      </span>
    );
  }

  return (
    <span
      className={`absolute top-2 left-2 bg-red-500 text-white font-bold rounded-full ${sizeClasses[size]} shadow-md z-10`}
    >
      -{discountPercent}%
    </span>
  );
}
