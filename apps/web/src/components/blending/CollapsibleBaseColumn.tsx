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
import Image from 'next/image';
import type { BlendingIngredient } from './mockData';
import { getBlendingIngredientById } from './mockData';
import { BRANDING } from '@/config/branding';

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
      className="relative group w-full p-2 transition-all duration-200 flex flex-col items-center text-center gap-2 hover:scale-105 active:scale-95"
      aria-pressed={isSelected}
      aria-label={`Select ${base.name} as base tea`}
    >
      {/* Hover Tooltip */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
          {base.shortTags?.join(' · ') || base.description}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>

      {/* Tea Bottle Image */}
      <div className="relative w-16 h-20">
        <Image
          src={`${BRANDING.IMAGE_BASE_PATH}/tea-bottle.png`}
          alt={base.name}
          fill
          className="object-contain"
        />
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
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

      {/* Name */}
      <h4 className={`font-semibold text-sm ${isSelected ? 'text-purple-300' : 'text-white'}`}>
        {base.name}
      </h4>
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
      {/* Collapsed Trigger - Tea Bottle Image */}
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="cursor-pointer pt-[25vh]"
            onClick={handleToggle}
            data-testid="base-trigger"
          >
            <div className="relative w-96 h-112 group">
              <Image
                src={`${BRANDING.IMAGE_BASE_PATH}/tea-bottle.png`}
                alt="Choose your base"
                fill
                className="object-contain group-hover:scale-110 transition-transform duration-200"
              />
              {selectedBaseId && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
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
            <div 
              className="rounded-2xl p-4 shadow-xl relative bg-cover bg-center"
              style={{ backgroundImage: `url(${BRANDING.IMAGE_BASE_PATH}/background-scroll.png)` }}
            >
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
