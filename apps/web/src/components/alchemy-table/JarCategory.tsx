/**
 * JarCategory Component
 * 
 * Clickable jar representing an ingredient category
 */

'use client';

import React from 'react';
import { IngredientCategory, CATEGORY_INFO } from '@alchemy/core';

interface JarCategoryProps {
  category: IngredientCategory;
  isOpen: boolean;
  hasSelections: boolean;
  onClick: () => void;
}

// Helper to get category-specific jar classes
const getJarClasses = (category: IngredientCategory, isOpen: boolean, hasSelections: boolean) => {
  const colorClasses = {
    base: {
      body: isOpen
        ? 'from-emerald-100 to-emerald-200 border-emerald-400'
        : hasSelections
        ? 'from-emerald-50 to-emerald-100 border-emerald-300'
        : 'from-gray-50 to-gray-100 border-gray-300 group-hover:border-emerald-200',
      text: isOpen || hasSelections ? 'text-emerald-900' : 'text-gray-700',
      lid: isOpen
        ? 'from-emerald-300 to-emerald-400 border-emerald-500'
        : hasSelections
        ? 'from-emerald-200 to-emerald-300 border-emerald-400'
        : 'from-gray-300 to-gray-400 border-gray-400',
      knob: isOpen ? 'bg-emerald-400' : hasSelections ? 'bg-emerald-300' : 'bg-gray-400',
      glow: 'bg-emerald-400',
    },
    floral: {
      body: isOpen
        ? 'from-pink-100 to-pink-200 border-pink-400'
        : hasSelections
        ? 'from-pink-50 to-pink-100 border-pink-300'
        : 'from-gray-50 to-gray-100 border-gray-300 group-hover:border-pink-200',
      text: isOpen || hasSelections ? 'text-pink-900' : 'text-gray-700',
      lid: isOpen
        ? 'from-pink-300 to-pink-400 border-pink-500'
        : hasSelections
        ? 'from-pink-200 to-pink-300 border-pink-400'
        : 'from-gray-300 to-gray-400 border-gray-400',
      knob: isOpen ? 'bg-pink-400' : hasSelections ? 'bg-pink-300' : 'bg-gray-400',
      glow: 'bg-pink-400',
    },
    fruit: {
      body: isOpen
        ? 'from-orange-100 to-orange-200 border-orange-400'
        : hasSelections
        ? 'from-orange-50 to-orange-100 border-orange-300'
        : 'from-gray-50 to-gray-100 border-gray-300 group-hover:border-orange-200',
      text: isOpen || hasSelections ? 'text-orange-900' : 'text-gray-700',
      lid: isOpen
        ? 'from-orange-300 to-orange-400 border-orange-500'
        : hasSelections
        ? 'from-orange-200 to-orange-300 border-orange-400'
        : 'from-gray-300 to-gray-400 border-gray-400',
      knob: isOpen ? 'bg-orange-400' : hasSelections ? 'bg-orange-300' : 'bg-gray-400',
      glow: 'bg-orange-400',
    },
    herbal: {
      body: isOpen
        ? 'from-green-100 to-green-200 border-green-400'
        : hasSelections
        ? 'from-green-50 to-green-100 border-green-300'
        : 'from-gray-50 to-gray-100 border-gray-300 group-hover:border-green-200',
      text: isOpen || hasSelections ? 'text-green-900' : 'text-gray-700',
      lid: isOpen
        ? 'from-green-300 to-green-400 border-green-500'
        : hasSelections
        ? 'from-green-200 to-green-300 border-green-400'
        : 'from-gray-300 to-gray-400 border-gray-400',
      knob: isOpen ? 'bg-green-400' : hasSelections ? 'bg-green-300' : 'bg-gray-400',
      glow: 'bg-green-400',
    },
    spice: {
      body: isOpen
        ? 'from-amber-100 to-amber-200 border-amber-400'
        : hasSelections
        ? 'from-amber-50 to-amber-100 border-amber-300'
        : 'from-gray-50 to-gray-100 border-gray-300 group-hover:border-amber-200',
      text: isOpen || hasSelections ? 'text-amber-900' : 'text-gray-700',
      lid: isOpen
        ? 'from-amber-300 to-amber-400 border-amber-500'
        : hasSelections
        ? 'from-amber-200 to-amber-300 border-amber-400'
        : 'from-gray-300 to-gray-400 border-gray-400',
      knob: isOpen ? 'bg-amber-400' : hasSelections ? 'bg-amber-300' : 'bg-gray-400',
      glow: 'bg-amber-400',
    },
    special: {
      body: isOpen
        ? 'from-purple-100 to-purple-200 border-purple-400'
        : hasSelections
        ? 'from-purple-50 to-purple-100 border-purple-300'
        : 'from-gray-50 to-gray-100 border-gray-300 group-hover:border-purple-200',
      text: isOpen || hasSelections ? 'text-purple-900' : 'text-gray-700',
      lid: isOpen
        ? 'from-purple-300 to-purple-400 border-purple-500'
        : hasSelections
        ? 'from-purple-200 to-purple-300 border-purple-400'
        : 'from-gray-300 to-gray-400 border-gray-400',
      knob: isOpen ? 'bg-purple-400' : hasSelections ? 'bg-purple-300' : 'bg-gray-400',
      glow: 'bg-purple-400',
    },
  };
  return colorClasses[category];
};

export const JarCategory: React.FC<JarCategoryProps> = ({
  category,
  isOpen,
  hasSelections,
  onClick,
}) => {
  const categoryInfo = CATEGORY_INFO[category];
  const classes = getJarClasses(category, isOpen, hasSelections);

  return (
    <button
      onClick={onClick}
      className={`
        relative group
        transform transition-all duration-200
        ${isOpen ? 'scale-110 z-10' : 'hover:scale-105'}
      `}
      aria-label={`Open ${categoryInfo.title} ingredients`}
      aria-pressed={isOpen}
    >
      {/* Jar Container */}
      <div className="relative w-28 h-32 md:w-36 md:h-40 transition-all duration-200">
        {/* Jar Body */}
        <div className={`
          absolute inset-x-0 bottom-0 h-24 md:h-32
          rounded-t-lg rounded-b-2xl
          bg-gradient-to-b
          border-4 transition-all duration-200
          shadow-lg
          ${classes.body}
        `}>
          {/* Jar Label */}
          <div className="absolute inset-x-0 bottom-2 px-2">
            <div className={`text-center text-xs md:text-sm font-bold ${classes.text}`}>
              {categoryInfo.title}
            </div>
          </div>

          {/* Selection Indicator */}
          {hasSelections && !isOpen && (
            <div className="absolute -top-2 -right-2">
              <div className="
                w-6 h-6 rounded-full
                bg-gradient-to-br from-purple-500 to-pink-500
                border-2 border-white
                flex items-center justify-center
                text-white text-xs font-bold
                shadow-lg
              ">
                ✓
              </div>
            </div>
          )}

          {/* Glow Effect When Open */}
          {isOpen && (
            <div className={`
              absolute inset-0 rounded-t-lg rounded-b-2xl
              opacity-20 animate-pulse ${classes.glow}
            `} />
          )}
        </div>

        {/* Jar Lid */}
        <div className={`
          absolute top-0 inset-x-0 h-8 md:h-10
          rounded-t-xl
          bg-gradient-to-b
          border-4 border-b-0 transition-all duration-200
          ${classes.lid}
        `}>
          {/* Lid Knob */}
          <div className={`
            absolute -top-2 left-1/2 -translate-x-1/2
            w-6 h-4 rounded-full ${classes.knob}
          `} />
        </div>

        {/* Category Emoji */}
        <div className="absolute top-8 md:top-10 left-1/2 -translate-x-1/2 text-3xl md:text-4xl z-10">
          {categoryInfo.emoji}
        </div>
      </div>

      {/* Hover Tooltip */}
      <div className="
        absolute -bottom-8 left-1/2 -translate-x-1/2
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        pointer-events-none
        whitespace-nowrap
      ">
        <div className="bg-gray-900 text-white text-xs px-3 py-1 rounded-full">
          {categoryInfo.description}
        </div>
      </div>
    </button>
  );
};
