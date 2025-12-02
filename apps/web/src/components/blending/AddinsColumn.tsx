/**
 * AddinsColumn Component
 * 
 * Right column for selecting add-ins, botanicals, and premium ingredients
 */

'use client';

import React, { useState } from 'react';
import type { AddInCategoryTab } from './types';
import type { BlendingIngredient } from './mockData';
import { getAddInsByTab } from './mockData';

interface AddinsColumnProps {
  /** Selected add-in IDs with quantities */
  selectedAddIns: Array<{ ingredientId: string; quantity: number }>;
  /** Callback when an add-in is toggled */
  onToggleAddIn: (ingredientId: string) => void;
  /** Callback when add-in quantity is changed */
  onQuantityChange: (ingredientId: string, quantity: number) => void;
}

interface IngredientItemProps {
  ingredient: BlendingIngredient;
  quantity: number;
  isSelected: boolean;
  onToggle: () => void;
  onQuantityChange: (quantity: number) => void;
}

const IngredientItem: React.FC<IngredientItemProps> = ({
  ingredient,
  quantity,
  isSelected,
  onToggle,
  onQuantityChange,
}) => {
  const incrementAmount = ingredient.incrementAmount || 0.25;
  const minQuantity = ingredient.baseAmount || 0.25;
  const maxQuantity = 2; // Max 2 oz per add-in

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

  return (
    <div
      className={`
        rounded-xl border-2 transition-all duration-200
        ${isSelected
          ? 'bg-purple-50 border-purple-300 shadow-md'
          : 'bg-white/60 border-white/40 hover:border-purple-200'
        }
      `}
    >
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-start gap-3 text-left"
        aria-pressed={isSelected}
      >
        {/* Thumbnail */}
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0
          ${isSelected ? 'bg-purple-200' : 'bg-gray-100'}
        `}>
          {ingredient.emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`
              font-medium text-sm
              ${isSelected ? 'text-purple-900' : 'text-gray-800'}
            `}>
              {ingredient.name}
            </h4>
            {ingredient.tier === 'premium' && (
              <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                Premium
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
            {ingredient.shortTags?.join(' · ') || ingredient.description}
          </p>
        </div>

        {/* Selection Indicator */}
        <div className={`
          w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
          ${isSelected
            ? 'bg-purple-500 border-purple-500'
            : 'border-gray-300'
          }
        `}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </button>

      {/* Quantity Controls (when selected) */}
      {isSelected && (
        <div className="px-3 pb-3">
          <div className="flex items-center justify-between bg-white rounded-lg border border-purple-200 p-2">
            <button
              onClick={handleDecrement}
              disabled={quantity <= minQuantity}
              className="w-8 h-8 rounded-lg bg-purple-100 hover:bg-purple-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Decrease quantity"
            >
              <svg className="w-4 h-4 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="font-semibold text-purple-900">
              {quantity.toFixed(2)} oz
            </span>
            <button
              onClick={handleIncrement}
              disabled={quantity >= maxQuantity}
              className="w-8 h-8 rounded-lg bg-purple-100 hover:bg-purple-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Increase quantity"
            >
              <svg className="w-4 h-4 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TABS: Array<{ id: AddInCategoryTab; label: string; emoji: string }> = [
  { id: 'addIns', label: 'Add-ins', emoji: '🌿' },
  { id: 'botanicals', label: 'Botanicals', emoji: '🌸' },
  { id: 'premium', label: 'Premium', emoji: '✨' },
];

export const AddinsColumn: React.FC<AddinsColumnProps> = ({
  selectedAddIns,
  onToggleAddIn,
  onQuantityChange,
}) => {
  const [activeTab, setActiveTab] = useState<AddInCategoryTab>('addIns');

  const tabIngredients = getAddInsByTab(activeTab);

  const getSelectedQuantity = (ingredientId: string): number => {
    const addIn = selectedAddIns.find(a => a.ingredientId === ingredientId);
    return addIn?.quantity || 0.25;
  };

  return (
    <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-lg">
      {/* Section Title */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
          <span className="text-2xl">🪄</span>
          Add your magic
        </h2>
        <p className="text-xs text-gray-600 mt-1">
          Select ingredients to customize your blend
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 mb-4 bg-purple-100/50 rounded-lg p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 px-2 py-2 rounded-md text-xs font-medium transition-all
              ${activeTab === tab.id
                ? 'bg-white text-purple-900 shadow-sm'
                : 'text-purple-600 hover:text-purple-800'
              }
            `}
          >
            <span className="mr-1">{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ingredient List */}
      <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
        {tabIngredients.map((ingredient) => {
          const isSelected = selectedAddIns.some(a => a.ingredientId === ingredient.id);
          return (
            <IngredientItem
              key={ingredient.id}
              ingredient={ingredient}
              quantity={getSelectedQuantity(ingredient.id)}
              isSelected={isSelected}
              onToggle={() => onToggleAddIn(ingredient.id)}
              onQuantityChange={(q) => onQuantityChange(ingredient.id, q)}
            />
          );
        })}
      </div>
    </div>
  );
};
