/**
 * CollapsibleMagicColumn Component
 * 
 * Collapsible wrapper for the "Add Your Magic" ingredient selection panel
 * Hidden by default, expands when trigger is clicked
 * Remains open until user explicitly closes it
 * Contains independent collapsible sections for Add-ins, Botanicals, and Premium
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { BRANDING } from '@/config/branding';
import type { AddInCategoryTab } from './types';
import type { BlendingIngredient } from './mockData';
import { useDeviceType } from '@/hooks/useDeviceType';
import { IngredientDetailsSheet } from './IngredientDetailsSheet';

interface CollapsibleMagicColumnProps {
  /** Selected add-in IDs with quantities */
  selectedAddIns: Array<{ ingredientId: string; quantity: number }>;
  /** Callback when an add-in is toggled */
  onToggleAddIn: (ingredientId: string) => void;
  /** Callback when add-in quantity is changed */
  onQuantityChange: (ingredientId: string, quantity: number) => void;
  /** Add-ins data from API */
  addInsData: {
    addIns: BlendingIngredient[];
    botanicals: BlendingIngredient[];
    premium: BlendingIngredient[];
  };
}

interface IngredientItemProps {
  ingredient: BlendingIngredient;
  quantity: number;
  isSelected: boolean;
  onToggle: () => void;
  onQuantityChange: (quantity: number) => void;
  useMobileBehavior: boolean;
  onOpenDetails?: () => void;
}

const IngredientItem: React.FC<IngredientItemProps> = ({
  ingredient,
  quantity,
  isSelected,
  onToggle,
  onQuantityChange,
  useMobileBehavior,
  onOpenDetails,
}) => {
  const incrementAmount = ingredient.incrementAmount || 0.25;
  const minQuantity = ingredient.baseAmount || 0.25;
  const maxQuantity = 2; // Max 2 oz per add-in

  const handleClick = () => {
    if (useMobileBehavior && onOpenDetails) {
      // On mobile: tap opens details sheet
      onOpenDetails();
    } else {
      // On desktop: click toggles selection
      onToggle();
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity < maxQuantity) {
      onQuantityChange(Math.min(maxQuantity, quantity + incrementAmount));
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > minQuantity) {
      onQuantityChange(Math.max(minQuantity, quantity - incrementAmount));
    }
  };

  const tooltipText = [
    ingredient.shortTags?.join(' · ') || ingredient.description,
    ingredient.tier === 'premium' ? 'Premium' : ''
  ].filter(Boolean).join(' · ');

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (showTooltip && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top - 8,
        left: rect.left + rect.width / 2
      });
    }
  }, [showTooltip]);

  return (
    <>
    <div className="relative group">
      <button
        ref={buttonRef}
        onClick={handleClick}
        onMouseEnter={() => !useMobileBehavior && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative w-full p-2 transition-all duration-200 flex flex-col items-center text-center gap-2 hover:scale-105 active:scale-95"
        aria-pressed={isSelected}
      >

        {/* Rose Bottle Image */}
        <div className="relative w-16 h-20">
          <Image
            src={`${BRANDING.IMAGE_BASE_PATH}/rose-bottle.png`}
            alt={ingredient.name}
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
          {ingredient.name}
        </h4>
      </button>

      {/* Quantity Controls (when selected) */}
      {isSelected && (
        <div className="mt-1 flex items-center justify-center gap-2">
          <button
            onClick={handleDecrement}
            disabled={quantity <= minQuantity}
            className="w-6 h-6 rounded-full bg-purple-500 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            aria-label="Decrease quantity"
          >
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="font-semibold text-white text-xs min-w-[3rem] text-center">
            {quantity.toFixed(2)} oz
          </span>
          <button
            onClick={handleIncrement}
            disabled={quantity >= maxQuantity}
            className="w-6 h-6 rounded-full bg-purple-500 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            aria-label="Increase quantity"
          >
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}

      {/* Mobile: Show select/unselect button when details sheet is used */}
      {useMobileBehavior && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`mt-1 px-3 py-1 text-white text-xs rounded-full transition-colors ${
            isSelected 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-purple-500 hover:bg-purple-600'
          }`}
        >
          {isSelected ? 'Remove' : 'Add'}
        </button>
      )}
    </div>

    {/* Portal Tooltip */}
    {showTooltip && !useMobileBehavior && typeof window !== 'undefined' && createPortal(
      <div 
        className="fixed pointer-events-none z-[9999] transition-opacity duration-200"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          transform: 'translate(-50%, -100%)'
        }}
      >
        <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
          {tooltipText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>,
      document.body
    )}
  </>
  );
};

interface CategorySectionProps {
  id: AddInCategoryTab;
  label: string;
  emoji: string;
  isExpanded: boolean;
  onToggle: () => void;
  ingredients: BlendingIngredient[];
  selectedAddIns: Array<{ ingredientId: string; quantity: number }>;
  onToggleAddIn: (ingredientId: string) => void;
  onQuantityChange: (ingredientId: string, quantity: number) => void;
  useMobileBehavior: boolean;
  onOpenDetails: (ingredient: BlendingIngredient) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  id,
  label,
  emoji,
  isExpanded,
  onToggle,
  ingredients,
  selectedAddIns,
  onToggleAddIn,
  onQuantityChange,
  useMobileBehavior,
  onOpenDetails,
}) => {
  const getSelectedQuantity = (ingredientId: string): number => {
    const addIn = selectedAddIns.find(a => a.ingredientId === ingredientId);
    return addIn?.quantity || 0.25;
  };

  const selectedCount = ingredients.filter(ing => 
    selectedAddIns.some(a => a.ingredientId === ing.id)
  ).length;

  return (
    <div 
      className="border border-white/30 rounded-xl overflow-hidden bg-white/10"
      data-testid={`category-section-${id}`}
    >
      {/* Category Header - Always visible, clickable to expand/collapse */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-white/10 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <span className="font-semibold text-white">{label}</span>
          {selectedCount > 0 && (
            <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
              {selectedCount}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      {/* Expandable ingredient list */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-2 max-h-60 overflow-y-auto">
              {ingredients.map((ingredient) => {
                const isSelected = selectedAddIns.some(a => a.ingredientId === ingredient.id);
                return (
                  <IngredientItem
                    key={ingredient.id}
                    ingredient={ingredient}
                    quantity={getSelectedQuantity(ingredient.id)}
                    isSelected={isSelected}
                    onToggle={() => onToggleAddIn(ingredient.id)}
                    onQuantityChange={(q) => onQuantityChange(ingredient.id, q)}
                    useMobileBehavior={useMobileBehavior}
                    onOpenDetails={() => onOpenDetails(ingredient)}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CATEGORIES: Array<{ id: AddInCategoryTab; label: string; emoji: string }> = [
  { id: 'addIns', label: 'Add-ins', emoji: '🌿' },
  { id: 'botanicals', label: 'Botanicals', emoji: '🌸' },
  { id: 'premium', label: 'Premium', emoji: '✨' },
];

export const CollapsibleMagicColumn: React.FC<CollapsibleMagicColumnProps> = ({
  selectedAddIns,
  onToggleAddIn,
  onQuantityChange,
  addInsData,
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [detailsIngredient, setDetailsIngredient] = useState<BlendingIngredient | null>(null);
  const { useMobileBehavior } = useDeviceType();
  
  // Independent expanded state for each category section
  const [expandedCategories, setExpandedCategories] = useState<Record<AddInCategoryTab, boolean>>({
    addIns: false,
    botanicals: false,
    premium: false,
  });

  const handleTogglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);

  const handleToggleCategory = useCallback((categoryId: AddInCategoryTab) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  }, []);

  const handleOpenDetails = useCallback((ingredient: BlendingIngredient) => {
    setDetailsIngredient(ingredient);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setDetailsIngredient(null);
  }, []);

  const totalSelectedCount = selectedAddIns.length;

  return (
    <div className="relative" data-testid="collapsible-magic-panel">
      {/* Collapsed Trigger */}
      <AnimatePresence mode="wait">
        {!isPanelOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="cursor-pointer fixed top-[40vh] right-8 z-30"
            onClick={handleTogglePanel}
            data-testid="magic-trigger"
          >
            <div className="relative w-98 h-112 group">
              <Image
                src={`${BRANDING.IMAGE_BASE_PATH}/rose-bottle.png`}
                alt="Add your magic"
                fill
                className="object-contain group-hover:scale-110 transition-transform duration-200"
              />
              {totalSelectedCount > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs font-bold">{totalSelectedCount}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Panel */}
      <AnimatePresence mode="wait">
        {isPanelOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative max-w-lg z-[55]"
            data-testid="magic-panel-expanded"
          >
            <div 
              className="rounded-2xl pt-6 px-6 pb-12 shadow-xl relative w-full max-w-lg overflow-visible"
              style={{ 
                backgroundImage: `url(${BRANDING.IMAGE_BASE_PATH}/background-wide-scroll-2.png)`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
              }}
            >
              {/* Header with close button */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">🪄</span>
                    Add your magic
                  </h2>
                  <p className="text-xs text-white/70 mt-1">
                    Select ingredients to customize your blend
                  </p>
                </div>
                <button
                  onClick={handleTogglePanel}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  aria-label="Close magic selection panel"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* All Ingredients in Grid - Wrapper allows tooltips to escape */}
              <div className="overflow-visible">
                <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1 pt-2">
                  {['addIns', 'botanicals', 'premium'].flatMap((categoryId) => {
                  const categoryKey = categoryId as keyof typeof addInsData;
                  return addInsData[categoryKey].map((ingredient) => {
                    const isSelected = selectedAddIns.some(a => a.ingredientId === ingredient.id);
                    const quantity = selectedAddIns.find(a => a.ingredientId === ingredient.id)?.quantity || ingredient.baseAmount || 0.25;
                    return (
                      <IngredientItem
                        key={`${categoryId}-${ingredient.id}`}
                        ingredient={ingredient}
                        quantity={quantity}
                        isSelected={isSelected}
                        onToggle={() => onToggleAddIn(ingredient.id)}
                        onQuantityChange={(q) => onQuantityChange(ingredient.id, q)}
                        useMobileBehavior={useMobileBehavior}
                        onOpenDetails={() => handleOpenDetails(ingredient)}
                      />
                    );
                  });
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Details Sheet */}
      <IngredientDetailsSheet
        ingredient={detailsIngredient}
        isOpen={detailsIngredient !== null}
        onClose={handleCloseDetails}
      />
    </div>
  );
};
