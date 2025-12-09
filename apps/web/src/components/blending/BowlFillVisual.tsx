/**
 * BowlFillVisual Component
 * 
 * Ceramic bowl visualization with animated fill for the blend creation page.
 * Displays ingredient layers inside a masked bowl container.
 */

'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import type { ExtendedBlendState } from './types';
import type { BlendingIngredient } from './mockData';
import { getIngredientById } from '@/hooks/useIngredients';
import { BRANDING } from '@/config/branding';

// Bowl fill configuration constants
/** Maximum bowl capacity in ounces (4 oz = 100% fill) */
const MAX_BOWL_CAPACITY_OZ = 4;
/** Base tea fills 60% of the total capacity relative to blend size */
const BASE_TEA_PROPORTION = 0.6;
/** Minimum visible height for ingredient layers in pixels */
const MIN_LAYER_HEIGHT_PX = '8px';
/** Steam wisp counts based on fill intensity */
const STEAM_COUNT_HIGH = 5;
const STEAM_COUNT_MEDIUM = 3;
const STEAM_COUNT_LOW = 1;

interface BowlFillVisualProps {
  /** Current blend state */
  blendState: ExtendedBlendState;
  /** Base teas from API */
  bases: BlendingIngredient[];
  /** Add-ins data from API */
  addInsData: {
    addIns: BlendingIngredient[];
    botanicals: BlendingIngredient[];
    premium: BlendingIngredient[];
  };
}

interface IngredientLayer {
  id: string;
  name: string;
  emoji: string;
  category: string;
  quantity: number;
  heightPercentage: number;
  startPercentage: number;
  color: string;
}

// Color mapping for ingredient categories
const CATEGORY_COLORS: Record<string, string> = {
  base: 'from-amber-700 via-amber-600 to-amber-800',
  floral: 'from-pink-400 via-rose-300 to-pink-500',
  fruit: 'from-orange-400 via-yellow-300 to-orange-500',
  spice: 'from-amber-600 via-orange-500 to-amber-700',
  herbal: 'from-green-500 via-emerald-400 to-green-600',
  special: 'from-purple-500 via-indigo-400 to-purple-600',
};

// Texture patterns for different categories
const CATEGORY_PATTERNS: Record<string, string> = {
  base: 'bg-gradient-to-br',
  floral: 'bg-gradient-to-tr',
  fruit: 'bg-gradient-to-bl',
  spice: 'bg-gradient-to-tl',
  herbal: 'bg-gradient-to-r',
  special: 'bg-gradient-to-b',
};

export const BowlFillVisual: React.FC<BowlFillVisualProps> = ({ blendState, bases, addInsData }) => {
  // Helper to get ingredient by ID
  const getIngredient = (id: string) => getIngredientById(id, bases, addInsData);

  // Calculate ingredient layers with their positions and heights
  const { layers, totalFillPercentage } = useMemo(() => {
    const ingredientLayers: IngredientLayer[] = [];
    let totalQuantity = 0;

    // Add base tea if selected
    if (blendState.baseTeaId) {
      const base = getIngredient(blendState.baseTeaId);
      if (base) {
        // Base fills proportionally to size
        const baseQuantity = blendState.size * BASE_TEA_PROPORTION;
        totalQuantity += baseQuantity;
        ingredientLayers.push({
          id: base.id,
          name: base.name,
          emoji: base.emoji || '🍵',
          category: base.category,
          quantity: baseQuantity,
          heightPercentage: 0, // Will be calculated after
          startPercentage: 0,
          color: CATEGORY_COLORS[base.category] || CATEGORY_COLORS.base,
        });
      }
    }

    // Add add-ins
    for (const addIn of blendState.addIns) {
      const ingredient = getIngredient(addIn.ingredientId);
      if (ingredient) {
        totalQuantity += addIn.quantity;
        ingredientLayers.push({
          id: ingredient.id,
          name: ingredient.name,
          emoji: ingredient.emoji || '✨',
          category: ingredient.category,
          quantity: addIn.quantity,
          heightPercentage: 0,
          startPercentage: 0,
          color: CATEGORY_COLORS[ingredient.category] || CATEGORY_COLORS.special,
        });
      }
    }

    // Calculate max fill based on size
    const fillPercentage = Math.min((totalQuantity / MAX_BOWL_CAPACITY_OZ) * 100, 100);

    // Calculate proportional heights for each layer
    let currentStart = 0;
    for (const layer of ingredientLayers) {
      const proportion = totalQuantity > 0 ? layer.quantity / totalQuantity : 0;
      layer.heightPercentage = proportion * fillPercentage;
      layer.startPercentage = currentStart;
      currentStart += layer.heightPercentage;
    }

    return { layers: ingredientLayers, totalFillPercentage: fillPercentage };
  }, [blendState]);

  // Determine steam intensity based on fill level
  const steamIntensity = totalFillPercentage > 70 ? 'high' : totalFillPercentage > 40 ? 'medium' : 'low';

  return (
    <div className="relative w-full aspect-square max-w-2xl mx-auto">
      {/* Outer glow effect */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-transparent to-transparent rounded-full animate-pulse" />
      
      {/* Bowl container with perspective */}
      <div className="absolute inset-4 perspective-1000">
        {/* Bowl shadow */}
        <div className="absolute inset-0 translate-y-2 bg-gradient-radial from-black/30 to-transparent rounded-[50%] blur-xl" />
        
        {/* Empty Bowl Image */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
          <Image
            src={`${BRANDING.IMAGE_BASE_PATH}/wooden-bowl.png`}
            alt="Blending bowl"
            fill
            className="object-contain"
            priority
          />
        </div>
        
        {/* Fill container - masked to bowl interior */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath: 'ellipse(32.5% 27.5% at 50% 50%)',
          }}
        >
          {/* Ingredient layers - stacked from bottom */}
          <div className="absolute inset-0 flex flex-col-reverse">
            <AnimatePresence mode="sync">
              {layers.map((layer, index) => (
                <motion.div
                  key={layer.id}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ 
                    height: `${layer.heightPercentage}%`,
                    opacity: 1,
                  }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
                    opacity: { duration: 0.3 },
                  }}
                  className={`
                    relative w-full overflow-hidden
                    ${CATEGORY_PATTERNS[layer.category] || 'bg-gradient-to-br'}
                    ${layer.color}
                  `}
                  style={{
                    minHeight: layer.heightPercentage > 0 ? MIN_LAYER_HEIGHT_PX : '0',
                  }}
                >
                  {/* Texture overlay */}
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.05)_2px,rgba(255,255,255,0.05)_4px)]" />
                  
                  {/* Layer separator line */}
                  {index < layers.length - 1 && (
                    <div className="absolute top-0 left-0 right-0 h-px bg-white/20" />
                  )}
                  
                  {/* Subtle shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: 'linear',
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Surface shimmer for liquid effect */}
          {totalFillPercentage > 0 && (
            <motion.div
              className="absolute left-0 right-0 h-4 bg-gradient-to-b from-white/20 to-transparent"
              style={{
                bottom: `${100 - totalFillPercentage}%`,
              }}
              animate={{
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </div>
        
        {/* Bowl rim overlay (on top of fill) */}
        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* Rim highlight */}
          <ellipse
            cx="100"
            cy="100"
            rx="75"
            ry="65"
            fill="none"
            stroke="url(#bowlRimGradient)"
            strokeWidth="3"
            opacity="0.5"
          />
        </svg>
      </div>
      
      {/* Steam effect */}
      <AnimatePresence>
        {totalFillPercentage > 20 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Steam wisps */}
            {[...Array(steamIntensity === 'high' ? STEAM_COUNT_HIGH : steamIntensity === 'medium' ? STEAM_COUNT_MEDIUM : STEAM_COUNT_LOW)].map((_, i) => (
              <motion.div
                key={`steam-${i}`}
                className="absolute w-8 h-16 opacity-30"
                style={{
                  left: `${35 + i * 8}%`,
                  bottom: '55%',
                }}
                initial={{ y: 0, opacity: 0, scale: 0.8 }}
                animate={{
                  y: -60,
                  opacity: [0, 0.4, 0],
                  scale: [0.8, 1.2, 1.5],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: 'easeOut',
                }}
              >
                <div className="w-full h-full bg-gradient-to-t from-white/40 to-transparent rounded-full blur-sm" />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
      
      {/* Floating particles effect */}
      <AnimatePresence>
        {totalFillPercentage > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {layers.slice(0, 3).map((layer, i) => (
              <motion.div
                key={`particle-${layer.id}`}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${30 + i * 15}%`,
                  backgroundColor: layer.category === 'floral' ? 'rgba(244, 114, 182, 0.6)' :
                                   layer.category === 'fruit' ? 'rgba(251, 146, 60, 0.6)' :
                                   layer.category === 'herbal' ? 'rgba(52, 211, 153, 0.6)' :
                                   'rgba(168, 85, 247, 0.6)',
                }}
                initial={{ y: 100, opacity: 0 }}
                animate={{
                  y: [50, 30, 50],
                  opacity: [0.3, 0.6, 0.3],
                  x: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: i * 0.8,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
      
      {/* Glow effect based on fill level */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, rgba(168, 85, 247, ${totalFillPercentage * 0.003}) 0%, transparent 70%)`,
        }}
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};
