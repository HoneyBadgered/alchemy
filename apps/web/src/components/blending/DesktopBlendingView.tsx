/**
 * DesktopBlendingView Component
 * 
 * Desktop-specific layout for the blending experience
 * Features 3-column grid with sticky side panels
 */

'use client';

import React from 'react';
import type { ExtendedBlendState, FlavorProfile, BlendSize } from './types';
import type { BlendingIngredient } from './mockData';
import { CenterScene } from './CenterScene';
import { CollapsibleBaseColumn } from './CollapsibleBaseColumn';
import { CategoryBottles } from './CategoryBottles';

interface DesktopBlendingViewProps {
  blendState: ExtendedBlendState;
  bases: BlendingIngredient[];
  addIns: {
    addIns: BlendingIngredient[];
    botanicals: BlendingIngredient[];
    premium: BlendingIngredient[];
  };
  flavorProfile: FlavorProfile;
  price: number;
  isBasePanelOpen: boolean;
  onSelectBase: (baseId: string) => void;
  onToggleAddIn: (ingredientId: string) => void;
  onQuantityChange: (ingredientId: string, quantity: number) => void;
  onSizeChange: (size: BlendSize) => void;
  onRemoveIngredient: (ingredientId: string) => void;
  onBasePanelOpenChange: (isOpen: boolean) => void;
  onContinue?: () => void;
}

export const DesktopBlendingView: React.FC<DesktopBlendingViewProps> = ({
  blendState,
  bases,
  addIns,
  flavorProfile,
  price,
  isBasePanelOpen,
  onSelectBase,
  onToggleAddIn,
  onQuantityChange,
  onSizeChange,
  onRemoveIngredient,
  onBasePanelOpenChange,
  onContinue,
}) => {
  return (
    <div className="hidden lg:block">
      {/* Left Column: Base Selection - Absolute positioned */}
      <div className="fixed left-8 top-24 z-[55] w-80">
        <CollapsibleBaseColumn
          bases={bases}
          selectedBaseId={blendState.baseTeaId}
          onSelectBase={onSelectBase}
          onOpenChange={onBasePanelOpenChange}
        />
      </div>

      {/* Center: Table Scene with Category Bottles */}
      <div className="relative z-40">
        <CenterScene
          blendState={blendState}
          onSizeChange={onSizeChange}
          price={price}
          flavorProfile={flavorProfile}
          onRemoveIngredient={onRemoveIngredient}
          bases={bases}
          addInsData={addIns}
          isBasePanelOpen={isBasePanelOpen}
          onContinue={onContinue}
        />
      </div>

      {/* Category Bottles - Positioned on the table surface */}
      <div className="fixed bottom-1/4 left-1/2 -translate-x-1/2 z-[60] w-[700px]">
        <CategoryBottles
          selectedAddIns={blendState.addIns}
          onToggleAddIn={onToggleAddIn}
          onQuantityChange={onQuantityChange}
          blendSize={blendState.size}
          addInsData={addIns}
        />
      </div>
    </div>
  );
};