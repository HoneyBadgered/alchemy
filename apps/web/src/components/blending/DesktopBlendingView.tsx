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
import { CollapsibleMagicColumn } from './CollapsibleMagicColumn';

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
}) => {
  return (
    <div className="hidden lg:grid lg:grid-cols-12 gap-6">
      {/* Left Column: Base Selection (~20-25%) - Collapsible */}
      <div className="lg:col-span-3">
        <div className="sticky top-24 z-[55]">
          <CollapsibleBaseColumn
            bases={bases}
            selectedBaseId={blendState.baseTeaId}
            onSelectBase={onSelectBase}
            onOpenChange={onBasePanelOpenChange}
          />
        </div>
      </div>

      {/* Center Column: Table Scene (~50-60%) */}
      <div className="lg:col-span-6">
        <CenterScene
          blendState={blendState}
          onSizeChange={onSizeChange}
          price={price}
          flavorProfile={flavorProfile}
          onRemoveIngredient={onRemoveIngredient}
          bases={bases}
          addInsData={addIns}
          isBasePanelOpen={isBasePanelOpen}
        />
      </div>

      {/* Right Column: Add-ins (~20-25%) - Collapsible */}
      <div className="lg:col-span-3">
        <div className="sticky top-24 z-[55]">
          <CollapsibleMagicColumn
            selectedAddIns={blendState.addIns}
            onToggleAddIn={onToggleAddIn}
            onQuantityChange={onQuantityChange}
            addInsData={addIns}
          />
        </div>
      </div>
    </div>
  );
};