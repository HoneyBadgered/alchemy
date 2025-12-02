/**
 * BaseColumn Component
 * 
 * Left column for selecting the base tea
 */

'use client';

import React from 'react';
import type { BlendingIngredient } from './mockData';

interface BaseColumnProps {
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

export const BaseColumn: React.FC<BaseColumnProps> = ({
  bases,
  selectedBaseId,
  onSelectBase,
}) => {
  return (
    <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-lg">
      {/* Section Title */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-purple-900 flex items-center gap-2">
          <span className="text-2xl">🍵</span>
          Choose your base
        </h2>
        <p className="text-xs text-gray-600 mt-1">
          Select one tea as the foundation for your blend
        </p>
      </div>

      {/* Base List */}
      <div className="space-y-3">
        {bases.map((base) => (
          <BaseJarItem
            key={base.id}
            base={base}
            isSelected={selectedBaseId === base.id}
            onSelect={() => onSelectBase(base.id)}
          />
        ))}
      </div>
    </div>
  );
};
