/**
 * MobileBlendingView Component
 * 
 * Mobile-specific layout for the blending experience
 * Features stacked layout with simplified controls
 */

'use client';

import React from 'react';
import Image from 'next/image';
import type { ExtendedBlendState } from './types';
import type { BlendingIngredient } from './mockData';
import { getIngredientById } from '@/hooks/useIngredients';
import { CollapsibleBaseColumn } from './CollapsibleBaseColumn';
import { CollapsibleMagicColumn } from './CollapsibleMagicColumn';
import { BRANDING } from '@/config/branding';

interface MobileBlendingViewProps {
  blendState: ExtendedBlendState;
  bases: BlendingIngredient[];
  addIns: {
    addIns: BlendingIngredient[];
    botanicals: BlendingIngredient[];
    premium: BlendingIngredient[];
  };
  price: number;
  onSelectBase: (baseId: string) => void;
  onToggleAddIn: (ingredientId: string) => void;
  onQuantityChange: (ingredientId: string, quantity: number) => void;
  onRemoveIngredient: (ingredientId: string) => void;
}

export const MobileBlendingView: React.FC<MobileBlendingViewProps> = ({
  blendState,
  bases,
  addIns,
  price,
  onSelectBase,
  onToggleAddIn,
  onQuantityChange,
  onRemoveIngredient,
}) => {
  return (
    <div className="lg:hidden space-y-6">

      {/* Bowl Visual (simplified for mobile) */}
      <div className="rounded-2xl p-6">
        <div className="relative w-48 h-48 mx-auto">
          <Image
            src={`${BRANDING.IMAGE_BASE_PATH}/bowl.png`}
            alt="Empty bowl"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Collapsible Panels for Mobile */}
      <div className="flex gap-4 justify-center">
        {/* Base Selection Trigger */}
        <CollapsibleBaseColumn
          bases={bases}
          selectedBaseId={blendState.baseTeaId}
          onSelectBase={onSelectBase}
        />

        {/* Magic Selection Trigger */}
        <CollapsibleMagicColumn
          selectedAddIns={blendState.addIns}
          onToggleAddIn={onToggleAddIn}
          onQuantityChange={onQuantityChange}
          addInsData={addIns}
        />
      </div>

      {/* Blend Breakdown */}
      <div className="rounded-2xl p-4">
        <h3 className="text-lg font-bold text-white mb-3">Your Blend</h3>
        {blendState.baseTeaId || blendState.addIns.length > 0 ? (
          <div className="space-y-2">
            {blendState.baseTeaId && (
              <div className="flex items-center gap-2 bg-white/20 p-2 rounded-lg">
                <span>{getIngredientById(blendState.baseTeaId, bases, addIns)?.emoji}</span>
                <span className="flex-1 text-sm font-medium text-white">
                  {getIngredientById(blendState.baseTeaId, bases, addIns)?.name}
                </span>
                <span className="text-xs text-purple-300">Base</span>
              </div>
            )}
            {blendState.addIns.map((addIn) => {
              const ing = getIngredientById(addIn.ingredientId, bases, addIns);
              if (!ing) return null;
              return (
                <div key={addIn.ingredientId} className="flex items-center gap-2 bg-white/10 p-2 rounded-lg">
                  <span>{ing.emoji}</span>
                  <span className="flex-1 text-sm text-white">{ing.name}</span>
                  <span className="text-xs text-white/60">{addIn.quantity.toFixed(2)} oz</span>
                  <button
                    onClick={() => onRemoveIngredient(addIn.ingredientId)}
                    className="w-5 h-5 rounded-full bg-red-500/30 hover:bg-red-500/50 flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-white/50 text-sm text-center py-4">
            Select a base and add ingredients
          </p>
        )}
      </div>
    </div>
  );
};