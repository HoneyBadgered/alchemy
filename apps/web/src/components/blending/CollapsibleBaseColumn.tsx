/**
 * CollapsibleBaseColumn Component
 * 
 * Collapsible wrapper for the Base tea selection panel
 * Hidden by default, expands when trigger is clicked
 * Auto-collapses when a base is selected
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BlendingIngredient } from './mockData';
import { getBlendingIngredientById } from './mockData';

interface CollapsibleBaseColumnProps {
  /** Available base teas */
  bases: BlendingIngredient[];
  /** Currently selected base tea ID */
  selectedBaseId?: string;
  /** Callback when a base is selected */
  onSelectBase: (baseId: string) => void;
}

interface BaseJarItemProps {
  base: BlendingIngredient;
  isSelected: boolean;
  onSelect: () => void;
}

const BaseJarItem: React.FC<BaseJarItemProps> = ({ base, isSelected, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full p-3 rounded-xl border-2 transition-all duration-200
        flex flex-col items-center text-center
        hover:scale-[1.02] active:scale-[0.98]
        ${isSelected
          ? 'bg-purple-100 border-purple-400 shadow-lg shadow-purple-200/50'
          : 'bg-white/60 border-white/40 hover:border-purple-200 hover:bg-white/80'
        }
      `}
      aria-pressed={isSelected}
      aria-label={`Select ${base.name} as base tea`}
    >
      {/* Jar Icon / Thumbnail Placeholder */}
      <div className={`
        w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-2
        ${isSelected ? 'bg-purple-200' : 'bg-gradient-to-br from-amber-100 to-amber-200'}
      `}>
        {base.emoji}
      </div>

      {/* Name */}
      <h4 className={`
        font-semibold text-sm
        ${isSelected ? 'text-purple-900' : 'text-gray-800'}
      `}>
        {base.name}
      </h4>

      {/* Short Tags */}
      <p className="text-xs text-gray-500 mt-1 leading-tight">
        {base.shortTags?.join(' · ') || base.description}
      </p>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="mt-2 flex items-center gap-1 text-purple-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs font-medium">Selected</span>
        </div>
      )}
    </button>
  );
};

export const CollapsibleBaseColumn: React.FC<CollapsibleBaseColumnProps> = ({
  bases,
  selectedBaseId,
  onSelectBase,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const prevSelectedRef = useRef(selectedBaseId);

  // Auto-collapse when a new base is selected
  useEffect(() => {
    if (selectedBaseId && selectedBaseId !== prevSelectedRef.current && isOpen) {
      setIsOpen(false);
    }
    prevSelectedRef.current = selectedBaseId;
  }, [selectedBaseId, isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleSelectBase = useCallback((baseId: string) => {
    onSelectBase(baseId);
    // Auto-close is handled by the useEffect above
  }, [onSelectBase]);

  const selectedBase = selectedBaseId ? getBlendingIngredientById(selectedBaseId) : null;

  return (
    <div className="relative" data-testid="collapsible-base-panel">
      {/* Collapsed Trigger */}
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="cursor-pointer"
            onClick={handleToggle}
            data-testid="base-trigger"
          >
            <div
              className={`
                group flex flex-col items-center gap-2 p-4
                bg-white/20 backdrop-blur-sm rounded-2xl
                border-2 hover:border-purple-400/50
                shadow-lg hover:shadow-xl
                transition-all duration-200
                ${selectedBaseId ? 'border-purple-400/50 ring-2 ring-purple-400/30' : 'border-white/30'}
              `}
            >
              {/* Icon with selection indicator */}
              <div className="relative">
                <span className="text-5xl group-hover:scale-110 transition-transform duration-200 block">
                  {selectedBase?.emoji || '🍵'}
                </span>
                {selectedBaseId && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Label */}
              <span className="text-white font-semibold text-center">
                {selectedBase ? selectedBase.name : 'Choose Your Base'}
              </span>
              
              {/* Subtitle */}
              {selectedBase ? (
                <span className="text-purple-300 text-xs text-center">
                  Tap to change
                </span>
              ) : (
                <span className="text-white/60 text-xs text-center">
                  Tap to select
                </span>
              )}
              
              {/* Expand indicator */}
              <div className="flex items-center gap-1 text-white/50 group-hover:text-white/80 transition-colors mt-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Panel */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative"
            data-testid="base-panel-expanded"
          >
            <div className="bg-white/30 backdrop-blur-md rounded-2xl p-4 border border-white/40 shadow-xl">
              {/* Header with close button */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">🍵</span>
                    Choose your base
                  </h2>
                  <p className="text-xs text-white/70 mt-1">
                    Select one tea as the foundation for your blend
                  </p>
                </div>
                <button
                  onClick={handleToggle}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  aria-label="Close base selection panel"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Base List */}
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {bases.map((base) => (
                  <BaseJarItem
                    key={base.id}
                    base={base}
                    isSelected={selectedBaseId === base.id}
                    onSelect={() => handleSelectBase(base.id)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
