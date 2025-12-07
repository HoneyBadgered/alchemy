/**
 * IngredientDetailsSheet Component
 * 
 * Bottom sheet for displaying ingredient details on mobile devices
 * Used when tap-to-open behavior is detected
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BlendingIngredient } from './mockData';

interface IngredientDetailsSheetProps {
  ingredient: BlendingIngredient | null;
  isOpen: boolean;
  onClose: () => void;
}

export const IngredientDetailsSheet: React.FC<IngredientDetailsSheetProps> = ({
  ingredient,
  isOpen,
  onClose,
}) => {
  if (!ingredient) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-gray-900 to-gray-950 rounded-t-3xl shadow-2xl z-50 md:hidden max-h-[80vh] overflow-hidden"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-600 rounded-full" />
            </div>

            {/* Content */}
            <div className="px-6 pb-8 overflow-y-auto max-h-[calc(80vh-4rem)]">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">{ingredient.name}</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Description */}
              {ingredient.description && (
                <p className="text-gray-300 mb-4 leading-relaxed">
                  {ingredient.description}
                </p>
              )}

              {/* Tags */}
              {ingredient.shortTags && ingredient.shortTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {ingredient.shortTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full border border-purple-500/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Tier Badge */}
              {ingredient.tier === 'premium' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg mb-4">
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-amber-300 font-semibold">Premium Ingredient</span>
                </div>
              )}

              {/* Flavor Notes */}
              {ingredient.flavorNotes && ingredient.flavorNotes.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Flavor Notes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {ingredient.flavorNotes.map((note, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded-full"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pairings */}
              {ingredient.pairings && ingredient.pairings.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Pairs Well With
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {ingredient.pairings.map((pairing, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded-full"
                      >
                        {pairing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Usage Range */}
              {(ingredient.baseAmount || ingredient.incrementAmount) && (
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Recommended Amount
                  </h4>
                  <p className="text-white">
                    {ingredient.baseAmount ? `${ingredient.baseAmount} oz` : 'As desired'}
                    {ingredient.incrementAmount && ` (adjust by ${ingredient.incrementAmount} oz)`}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
