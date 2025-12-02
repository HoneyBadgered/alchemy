/**
 * CenterScene Component
 * 
 * Central column with blend controls and table visualization
 */

'use client';

import React from 'react';
import type { ExtendedBlendState, FlavorProfile, BlendSize, BlendBreakdownItem } from './types';
import { getBlendingIngredientById } from './mockData';
import { BowlFillVisual } from './BowlFillVisual';

interface CenterSceneProps {
  /** Current blend state */
  blendState: ExtendedBlendState;
  /** Callback when blend name changes */
  onBlendNameChange: (name: string) => void;
  /** Callback when size changes */
  onSizeChange: (size: BlendSize) => void;
  /** Estimated price */
  price: number;
  /** Flavor profile data */
  flavorProfile: FlavorProfile;
  /** Callback when an ingredient is removed from the breakdown */
  onRemoveIngredient: (ingredientId: string) => void;
}

interface BlendNameFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const BlendNameField: React.FC<BlendNameFieldProps> = ({ value, onChange }) => {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Name your blend…"
      className="w-full bg-transparent border-b-2 border-white/30 focus:border-purple-300 text-white text-xl font-semibold placeholder-white/50 outline-none pb-2 transition-colors"
      maxLength={50}
    />
  );
};

interface SizeSelectorProps {
  value: BlendSize;
  onChange: (size: BlendSize) => void;
}

const SizeSelector: React.FC<SizeSelectorProps> = ({ value, onChange }) => {
  const sizes: BlendSize[] = [1, 2, 4];

  return (
    <div className="flex gap-2">
      {sizes.map((size) => (
        <button
          key={size}
          onClick={() => onChange(size)}
          className={`
            px-4 py-2 rounded-full text-sm font-semibold transition-all
            ${value === size
              ? 'bg-white text-purple-900 shadow-lg'
              : 'bg-white/20 text-white hover:bg-white/30'
            }
          `}
          aria-pressed={value === size}
        >
          {size} oz
        </button>
      ))}
    </div>
  );
};

interface PriceEstimateChipProps {
  price: number;
}

const PriceEstimateChip: React.FC<PriceEstimateChipProps> = ({ price }) => {
  return (
    <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 px-4 py-2 rounded-full font-bold shadow-lg">
      ${price}
    </div>
  );
};

// TableVisual has been replaced by BowlFillVisual component

interface BlendStatsPanelProps {
  profile: FlavorProfile;
}

const BlendStatsPanel: React.FC<BlendStatsPanelProps> = ({ profile }) => {
  const flavorStats = [
    { label: 'Floral', value: profile.floral, color: 'bg-pink-400' },
    { label: 'Citrus', value: profile.citrus, color: 'bg-orange-400' },
    { label: 'Earthy', value: profile.earthy, color: 'bg-amber-600' },
    { label: 'Sweet', value: profile.sweet, color: 'bg-yellow-400' },
  ];

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
      <h3 className="text-white/80 text-sm font-medium mb-3">Flavor Profile</h3>
      <div className="space-y-2">
        {flavorStats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-2">
            <span className="text-white/60 text-xs w-16">{stat.label}</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full ${stat.color} rounded-full transition-all duration-500`}
                style={{ width: `${stat.value}%` }}
              />
            </div>
            <span className="text-white/60 text-xs w-8 text-right">{Math.round(stat.value)}</span>
          </div>
        ))}
      </div>

      {/* Caffeine Level - Separated from flavor profile */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <h4 className="text-white/80 text-sm font-medium mb-2">Caffeine Level</h4>
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-xs w-16">Caffeine</span>
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${profile.caffeine}%` }}
            />
          </div>
          <span className="text-white/60 text-xs w-8 text-right">{Math.round(profile.caffeine)}</span>
        </div>
      </div>
    </div>
  );
};

interface BlendBreakdownListProps {
  blendState: ExtendedBlendState;
  onRemoveIngredient: (ingredientId: string) => void;
}

const BlendBreakdownList: React.FC<BlendBreakdownListProps> = ({
  blendState,
  onRemoveIngredient,
}) => {
  // Calculate total weight
  const baseWeight = blendState.baseTeaId ? blendState.size * 0.6 : 0;
  const addInsWeight = blendState.addIns.reduce((sum, a) => sum + a.quantity, 0);
  const totalWeight = baseWeight + addInsWeight;

  // Build breakdown items
  const items: BlendBreakdownItem[] = [];

  if (blendState.baseTeaId) {
    const base = getBlendingIngredientById(blendState.baseTeaId);
    if (base) {
      items.push({
        ingredient: base,
        weightOz: baseWeight,
        percentage: totalWeight > 0 ? (baseWeight / totalWeight) * 100 : 0,
      });
    }
  }

  for (const addIn of blendState.addIns) {
    const ingredient = getBlendingIngredientById(addIn.ingredientId);
    if (ingredient) {
      items.push({
        ingredient,
        weightOz: addIn.quantity,
        percentage: totalWeight > 0 ? (addIn.quantity / totalWeight) * 100 : 0,
      });
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
        <p className="text-white/50 text-sm">No ingredients selected yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
      <h3 className="text-white/80 text-sm font-medium mb-3">Blend Breakdown</h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.ingredient.id}
            className="flex items-center gap-2 group"
          >
            <span className="text-lg">{item.ingredient.emoji}</span>
            <span className="flex-1 text-white/80 text-sm truncate">
              {item.ingredient.name}
              {index === 0 && blendState.baseTeaId && (
                <span className="text-purple-300 text-xs ml-1">(Base)</span>
              )}
            </span>
            <span className="text-white/60 text-xs">
              {Math.round(item.percentage)}%
            </span>
            {/* Remove button (not for base) */}
            {!(index === 0 && blendState.baseTeaId) && (
              <button
                onClick={() => onRemoveIngredient(item.ingredient.id)}
                className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-opacity"
                aria-label={`Remove ${item.ingredient.name}`}
              >
                <svg className="w-3 h-3 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CenterScene: React.FC<CenterSceneProps> = ({
  blendState,
  onBlendNameChange,
  onSizeChange,
  price,
  flavorProfile,
  onRemoveIngredient,
}) => {
  return (
    <div className="bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-purple-950/90 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-2xl">
      {/* Top Controls: Blend Name, Size, Price */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
          <div className="flex-1">
            <BlendNameField
              value={blendState.blendName}
              onChange={onBlendNameChange}
            />
          </div>
          <PriceEstimateChip price={price} />
        </div>
        <div className="flex items-center justify-between">
          <SizeSelector value={blendState.size} onChange={onSizeChange} />
        </div>
      </div>

      {/* Bowl Fill Visual */}
      <BowlFillVisual blendState={blendState} />

      {/* Bottom Panels: Stats and Breakdown */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <BlendStatsPanel profile={flavorProfile} />
        <BlendBreakdownList
          blendState={blendState}
          onRemoveIngredient={onRemoveIngredient}
        />
      </div>
    </div>
  );
};
