'use client';

/**
 * Stock Status Badge Component
 * Displays the stock status of a product
 */

import React from 'react';

interface StockStatusBadgeProps {
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  label?: string;
  size?: 'sm' | 'md';
}

export function StockStatusBadge({
  status,
  label,
  size = 'md',
}: StockStatusBadgeProps) {
  const statusConfig = {
    in_stock: {
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      dotColor: 'bg-green-500',
      defaultLabel: 'In Stock',
    },
    low_stock: {
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      dotColor: 'bg-yellow-500',
      defaultLabel: 'Low Stock',
    },
    out_of_stock: {
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      dotColor: 'bg-red-500',
      defaultLabel: 'Sold Out',
    },
  };

  const config = statusConfig[status];
  const displayLabel = label || config.defaultLabel;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {displayLabel}
    </span>
  );
}
