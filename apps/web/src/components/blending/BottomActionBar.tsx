/**
 * BottomActionBar Component
 * 
 * Fixed bottom action bar with blend summary and CTA
 */

'use client';

import React from 'react';
import type { BlendSize, BlendStatus } from './types';

interface BottomActionBarProps {
  /** Selected size */
  size: BlendSize;
  /** Blend status (e.g., "Balanced", "Extra floral") */
  status: BlendStatus;
  /** Estimated price */
  price: number;
  /** Whether the blend is ready (has base + at least one add-in) */
  isReady: boolean;
  /** Whether we're currently processing */
  isProcessing?: boolean;
  /** Callback when CTA is clicked */
  onContinue: () => void;
  /** Callback when size is changed */
  onSizeChange: (size: BlendSize) => void;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  size,
  status,
  price,
  isReady,
  isProcessing = false,
  onContinue,
  onSizeChange,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Top decorative line */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      
      {/* Bar content */}
      <div className="bg-black/40 backdrop-blur-md border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-lg">📦</span>
              <div className="flex gap-1">
                {[1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => onSizeChange(s as BlendSize)}
                    className={`
                      px-3 py-1 rounded-full text-xs font-medium transition-all
                      ${size === s
                        ? 'bg-white text-purple-900 shadow'
                        : 'bg-white/20 text-white/80 hover:bg-white/30'
                      }
                    `}
                  >
                    {s}oz
                  </button>
                ))}
              </div>
            </div>

            {/* Center: Status + Price */}
            <div className="flex-1 flex flex-col items-center text-center">
              <span className={`text-sm font-semibold ${isReady ? 'text-purple-300' : 'text-white/50'}`}>
                {status.label}
              </span>
              <span className="text-xs text-white/60 hidden sm:inline">
                Estimated: <span className="font-bold text-amber-400">${price}</span>
              </span>
            </div>

            {/* Right: CTA Button */}
            <button
              onClick={onContinue}
              disabled={!isReady || isProcessing}
              className={`
                px-6 py-2.5 rounded-full font-semibold text-sm transition-all transform
                ${isReady && !isProcessing
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 hover:from-amber-300 hover:to-amber-400 hover:scale-105 shadow-lg shadow-amber-500/30'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
                }
              `}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Enchanting...
                </span>
              ) : (
                <>
                  <span className="hidden sm:inline">✨ Enchant & Review</span>
                  <span className="sm:hidden">✨ Continue</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
