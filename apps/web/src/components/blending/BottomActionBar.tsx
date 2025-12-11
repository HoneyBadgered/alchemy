/**
 * BottomActionBar Component
 * 
 * Fixed bottom action bar with blend summary and CTA
 */

'use client';

import React, { useState } from 'react';
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
  /** Whether the bowl has any contents */
  hasContents: boolean;
  /** Callback when CTA is clicked */
  onContinue: () => void;
  /** Callback when size is changed */
  onSizeChange: (size: BlendSize) => void;
  /** Callback when empty bowl is clicked */
  onEmptyBowl: () => void;
  /** Callback when randomize blend is clicked */
  onRandomize: () => void;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  size,
  status,
  price,
  isReady,
  isProcessing = false,
  hasContents,
  onContinue,
  onSizeChange,
  onEmptyBowl,
  onRandomize,
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleEmptyBowlClick = () => {
    console.log('Empty Bowl clicked, showing dialog');
    setShowConfirmDialog(true);
  };

  const handleConfirmEmpty = () => {
    console.log('Confirmed empty bowl');
    onEmptyBowl();
    setShowConfirmDialog(false);
  };

  const handleCancelEmpty = () => {
    console.log('Cancelled empty bowl');
    setShowConfirmDialog(false);
  };

  console.log('BottomActionBar render - hasContents:', hasContents, 'showConfirmDialog:', showConfirmDialog);

  return (
    <>
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleCancelEmpty}>
          <div 
            className="bg-gradient-to-br from-purple-900/95 to-indigo-900/95 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-2">Empty Bowl?</h3>
            <p className="text-white/80 mb-6">
              This will remove your base tea and all add-ins. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelEmpty}
                className="flex-1 px-4 py-2.5 rounded-full font-semibold text-sm bg-white/20 text-white hover:bg-white/30 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEmpty}
                className="flex-1 px-4 py-2.5 rounded-full font-semibold text-sm bg-red-500 text-white hover:bg-red-600 transition-all"
              >
                Empty Bowl
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-[60]">
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

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Randomize Button */}
              <button
                onClick={onRandomize}
                className="px-4 py-2.5 rounded-full font-semibold text-sm transition-all bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 hover:from-purple-500/30 hover:to-pink-500/30 hover:text-white border border-purple-400/30 hover:border-purple-400/50"
              >
                <span className="hidden sm:inline">🎲 Randomize</span>
                <span className="sm:hidden">🎲</span>
              </button>

              {/* Empty Bowl Button */}
              {hasContents && (
                <button
                  onClick={handleEmptyBowlClick}
                  className="px-4 py-2.5 rounded-full font-semibold text-sm transition-all bg-white/10 text-white/80 hover:bg-red-500/20 hover:text-red-300 border border-white/20 hover:border-red-400/50"
                >
                  <span className="hidden sm:inline">🗑️ Empty Bowl</span>
                  <span className="sm:hidden">🗑️</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};
