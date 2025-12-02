/**
 * ImmersiveHeader Component
 * 
 * A fixed, semi-transparent header for the blending page that feels like an in-world HUD
 * Rather than a standard ecommerce header
 */

'use client';

import React from 'react';

interface ImmersiveHeaderProps {
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Cart item count */
  cartItemCount?: number;
  /** Current step indicator text (e.g., "Step 1 · Choose your base") */
  stepIndicator?: string;
  /** Callback when cart is clicked */
  onCartClick?: () => void;
}

export const ImmersiveHeader: React.FC<ImmersiveHeaderProps> = ({
  onBack,
  cartItemCount = 0,
  stepIndicator,
  onCartClick,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Semi-transparent frosted glass effect */}
      <div className="bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-purple-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back Button */}
            <div className="flex-1 flex justify-start">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
                aria-label="Back to Library"
              >
                <svg
                  className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="text-sm font-medium hidden sm:inline">Back to Library</span>
              </button>
            </div>

            {/* Center: Brand/Session Title */}
            <div className="flex-1 flex flex-col items-center">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                <span className="text-purple-300">✨</span> The Alchemy Table
              </h1>
              <p className="text-xs sm:text-sm text-purple-300/80 font-medium">
                Custom Blend Session
              </p>
              {stepIndicator && (
                <p className="text-xs text-white/60 mt-0.5 hidden sm:block">
                  {stepIndicator}
                </p>
              )}
            </div>

            {/* Right: Cart Summary */}
            <div className="flex-1 flex justify-end">
              <button
                onClick={onCartClick}
                className="relative flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
                aria-label={`Cart with ${cartItemCount} items`}
              >
                <span className="text-sm font-medium hidden sm:inline">Cart</span>
                <div className="relative">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                      {cartItemCount > 9 ? '9+' : cartItemCount}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative bottom glow */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
    </header>
  );
};
