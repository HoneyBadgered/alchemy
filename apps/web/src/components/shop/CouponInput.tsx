'use client';

/**
 * Coupon Code Input Component
 * Allows users to enter and validate discount codes
 */

import React, { useState } from 'react';
import { catalogApi, CouponValidation } from '@/lib/catalog-api';

interface CouponInputProps {
  subtotal: number;
  onApply: (validation: CouponValidation) => void;
  onRemove: () => void;
  appliedCoupon?: CouponValidation | null;
}

export function CouponInput({ subtotal, onApply, onRemove, appliedCoupon }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const validation = await catalogApi.validateCoupon(code.trim(), subtotal);
      
      if (validation.valid) {
        onApply(validation);
        setCode('');
      } else {
        setError(validation.message || 'Invalid coupon code');
      }
    } catch (err) {
      setError('Failed to validate coupon. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-semibold">✓ {appliedCoupon.code}</span>
              {appliedCoupon.description && (
                <span className="text-sm text-gray-600">- {appliedCoupon.description}</span>
              )}
            </div>
            <div className="text-sm text-green-700 mt-1">
              {appliedCoupon.discountType === 'percentage'
                ? `${appliedCoupon.discountValue}% off`
                : `$${appliedCoupon.discountValue?.toFixed(2)} off`}
              {' '}
              (saving ${appliedCoupon.discountAmount?.toFixed(2)})
            </div>
          </div>
          <button
            onClick={onRemove}
            className="text-red-600 hover:text-red-700 font-semibold text-sm"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Discount Code
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter code"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
        />
        <button
          onClick={handleApply}
          disabled={isValidating || !code.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          {isValidating ? 'Applying...' : 'Apply'}
        </button>
      </div>
      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}
