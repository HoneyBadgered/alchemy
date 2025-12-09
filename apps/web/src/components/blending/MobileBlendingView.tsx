/**
 * MobileBlendingView Component
 * 
 * Mobile-specific layout for the blending experience
 * Features stacked layout with simplified controls
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { ExtendedBlendState, FlavorProfile, BlendSize } from './types';
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
  flavorProfile: FlavorProfile;
  onSelectBase: (baseId: string) => void;
  onToggleAddIn: (ingredientId: string) => void;
  onQuantityChange: (ingredientId: string, quantity: number) => void;
  onSizeChange: (size: BlendSize) => void;
  onRemoveIngredient: (ingredientId: string) => void;
}

export const MobileBlendingView: React.FC<MobileBlendingViewProps> = ({
  blendState,
  bases,
  addIns,
  price,
  flavorProfile,
  onSelectBase,
  onToggleAddIn,
  onQuantityChange,
  onSizeChange,
  onRemoveIngredient,
}) => {
  const [showBlendInfo, setShowBlendInfo] = useState(false);

  const flavorStats = [
    { label: 'Floral', value: flavorProfile.floral, color: 'bg-pink-400' },
    { label: 'Citrus', value: flavorProfile.citrus, color: 'bg-orange-400' },
    { label: 'Earthy', value: flavorProfile.earthy, color: 'bg-amber-600' },
    { label: 'Sweet', value: flavorProfile.sweet, color: 'bg-yellow-400' },
  ];
  return (
    <div className="lg:hidden space-y-6">
      {/* Blend Information Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowBlendInfo(true)}
          className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 shadow-lg hover:from-purple-500/40 hover:to-pink-500/40 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Blend Info
        </button>
      </div>

      {/* Blend Information Modal */}
      {showBlendInfo && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowBlendInfo(false)}>
          <div 
            className="bg-gradient-to-br from-purple-900/95 to-indigo-900/95 backdrop-blur-md border-t border-white/20 rounded-t-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-br from-purple-900 to-indigo-900 border-b border-white/10 p-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Blend Information</h2>
              <button
                onClick={() => setShowBlendInfo(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Price */}
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">Estimated Price</p>
                <div className="inline-block bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 px-6 py-3 rounded-full font-bold text-2xl shadow-lg">
                  ${price}
                </div>
              </div>

              {/* Size Selector */}
              <div>
                <h3 className="text-white/80 text-sm font-medium mb-3">Blend Size</h3>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 4].map((s) => (
                    <button
                      key={s}
                      onClick={() => onSizeChange(s as BlendSize)}
                      className={`
                        px-6 py-3 rounded-full text-sm font-semibold transition-all
                        ${blendState.size === s
                          ? 'bg-white text-purple-900 shadow-lg'
                          : 'bg-white/20 text-white hover:bg-white/30'
                        }
                      `}
                    >
                      {s} oz
                    </button>
                  ))}
                </div>
              </div>

              {/* Flavor Profile */}
              <div>
                <h3 className="text-white/80 text-sm font-medium mb-3">Flavor Profile</h3>
                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                  {flavorStats.map((stat) => (
                    <div key={stat.label} className="flex items-center gap-3">
                      <span className="text-white/80 text-sm w-16">{stat.label}</span>
                      <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${stat.color} rounded-full transition-all duration-500`}
                          style={{ width: `${stat.value}%` }}
                        />
                      </div>
                      <span className="text-white/60 text-sm w-10 text-right">{Math.round(stat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Caffeine Level */}
              <div>
                <h3 className="text-white/80 text-sm font-medium mb-3">Caffeine Level</h3>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-white/80 text-sm w-16">Caffeine</span>
                    <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${flavorProfile.caffeine}%` }}
                      />
                    </div>
                    <span className="text-white/60 text-sm w-10 text-right">{Math.round(flavorProfile.caffeine)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bowl Visual (simplified for mobile) */}
      <div className="rounded-2xl p-6">
        <div className="relative w-[36rem] h-[36rem] mx-auto">
          <Image
            src={`${BRANDING.IMAGE_BASE_PATH}/wooden-bowl.png`}
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