/**
 * Mock data for the blending page
 * This provides standalone data for the page to work without backend calls
 */

import type { Ingredient, CaffeineLevel } from '@alchemy/core';
import type { FlavorProfile, IngredientTier } from './types';

/**
 * Extended ingredient interface with pricing and flavor data
 */
export interface BlendingIngredient extends Ingredient {
  costPerOz: number;
  tier: IngredientTier;
  flavorProfile: FlavorProfile;
  caffeineLevel: CaffeineLevel;
  shortTags: string[];
}

/**
 * Mock base teas with complete data
 */
export const MOCK_BASES: BlendingIngredient[] = [
  {
    id: 'moonlit-black',
    name: 'Moonlit Black',
    category: 'base',
    description: 'Bold and robust black tea with malty undertones',
    shortTags: ['Black', 'Medium Caffeine', 'Malty'],
    emoji: '🌙',
    isBase: true,
    costPerOz: 1.50,
    tier: 'standard',
    flavorProfile: { floral: 10, citrus: 5, earthy: 40, sweet: 20, caffeine: 70 },
    caffeineLevel: 'medium',
  },
  {
    id: 'jade-dragon-green',
    name: 'Jade Dragon Green',
    category: 'base',
    description: 'Light and refreshing green tea with grassy notes',
    shortTags: ['Green', 'Low Caffeine', 'Grassy'],
    emoji: '🐉',
    isBase: true,
    costPerOz: 2.00,
    tier: 'standard',
    flavorProfile: { floral: 20, citrus: 15, earthy: 30, sweet: 15, caffeine: 40 },
    caffeineLevel: 'low',
  },
  {
    id: 'silver-needle-white',
    name: 'Silver Needle White',
    category: 'base',
    description: 'Delicate white tea with subtle sweetness',
    shortTags: ['White', 'Low Caffeine', 'Delicate'],
    emoji: '✨',
    isBase: true,
    costPerOz: 3.50,
    tier: 'premium',
    flavorProfile: { floral: 35, citrus: 10, earthy: 15, sweet: 30, caffeine: 25 },
    caffeineLevel: 'low',
  },
  {
    id: 'twilight-oolong',
    name: 'Twilight Oolong',
    category: 'base',
    description: 'Complex oolong with roasted and floral notes',
    shortTags: ['Oolong', 'Medium Caffeine', 'Complex'],
    emoji: '🌅',
    isBase: true,
    costPerOz: 2.50,
    tier: 'standard',
    flavorProfile: { floral: 40, citrus: 10, earthy: 35, sweet: 25, caffeine: 50 },
    caffeineLevel: 'medium',
  },
  {
    id: 'herbal-rooibos',
    name: 'Herbal Rooibos',
    category: 'base',
    description: 'Caffeine-free South African red bush tea',
    shortTags: ['Herbal', 'No Caffeine', 'Earthy'],
    emoji: '🍂',
    isBase: true,
    costPerOz: 1.25,
    tier: 'standard',
    flavorProfile: { floral: 15, citrus: 5, earthy: 50, sweet: 35, caffeine: 0 },
    caffeineLevel: 'none',
  },
];

/**
 * Mock add-ins with complete data
 */
export const MOCK_ADDINS: BlendingIngredient[] = [
  // Florals
  {
    id: 'rose-petals',
    name: 'Rose Petals',
    category: 'floral',
    description: 'Delicate and romantic floral notes',
    shortTags: ['Floral', 'Sweet'],
    emoji: '🌹',
    isBase: false,
    baseAmount: 0.25,
    incrementAmount: 0.25,
    costPerOz: 4.00,
    tier: 'standard',
    flavorProfile: { floral: 80, citrus: 5, earthy: 5, sweet: 40, caffeine: 0 },
    caffeineLevel: 'none',
  },
  {
    id: 'lavender-buds',
    name: 'Lavender Buds',
    category: 'floral',
    description: 'Calming and aromatic purple flowers',
    shortTags: ['Floral', 'Calming'],
    emoji: '💜',
    isBase: false,
    baseAmount: 0.25,
    incrementAmount: 0.25,
    costPerOz: 3.50,
    tier: 'standard',
    flavorProfile: { floral: 85, citrus: 0, earthy: 15, sweet: 20, caffeine: 0 },
    caffeineLevel: 'none',
  },
  {
    id: 'jasmine-flowers',
    name: 'Jasmine Flowers',
    category: 'floral',
    description: 'Sweet and intensely fragrant',
    shortTags: ['Floral', 'Intense'],
    emoji: '🤍',
    isBase: false,
    baseAmount: 0.25,
    incrementAmount: 0.25,
    costPerOz: 5.00,
    tier: 'premium',
    flavorProfile: { floral: 90, citrus: 5, earthy: 0, sweet: 35, caffeine: 0 },
    caffeineLevel: 'none',
  },

  // Citrus / Fruits
  {
    id: 'orange-peel',
    name: 'Orange Peel',
    category: 'fruit',
    description: 'Bright and zesty citrus notes',
    shortTags: ['Citrus', 'Zesty'],
    emoji: '🍊',
    isBase: false,
    baseAmount: 0.25,
    incrementAmount: 0.25,
    costPerOz: 2.00,
    tier: 'standard',
    flavorProfile: { floral: 5, citrus: 85, earthy: 0, sweet: 30, caffeine: 0 },
    caffeineLevel: 'none',
  },
  {
    id: 'lemon-peel',
    name: 'Lemon Peel',
    category: 'fruit',
    description: 'Sharp and refreshing citrus',
    shortTags: ['Citrus', 'Tart'],
    emoji: '🍋',
    isBase: false,
    baseAmount: 0.25,
    incrementAmount: 0.25,
    costPerOz: 2.00,
    tier: 'standard',
    flavorProfile: { floral: 0, citrus: 90, earthy: 0, sweet: 10, caffeine: 0 },
    caffeineLevel: 'none',
  },
  {
    id: 'dried-berries',
    name: 'Dried Berries',
    category: 'fruit',
    description: 'Sweet and fruity berry blend',
    shortTags: ['Fruity', 'Sweet'],
    emoji: '🫐',
    isBase: false,
    baseAmount: 0.5,
    incrementAmount: 0.25,
    costPerOz: 3.00,
    tier: 'standard',
    flavorProfile: { floral: 10, citrus: 20, earthy: 0, sweet: 70, caffeine: 0 },
    caffeineLevel: 'none',
  },

  // Spices
  {
    id: 'cinnamon-chips',
    name: 'Cinnamon Chips',
    category: 'spice',
    description: 'Warm and comforting spice',
    shortTags: ['Spicy', 'Warm'],
    emoji: '🪵',
    isBase: false,
    baseAmount: 0.25,
    incrementAmount: 0.25,
    costPerOz: 2.50,
    tier: 'standard',
    flavorProfile: { floral: 0, citrus: 5, earthy: 40, sweet: 35, caffeine: 0 },
    caffeineLevel: 'none',
  },
  {
    id: 'ginger-root',
    name: 'Ginger Root',
    category: 'spice',
    description: 'Spicy and invigorating',
    shortTags: ['Spicy', 'Warming'],
    emoji: '🫚',
    isBase: false,
    baseAmount: 0.25,
    incrementAmount: 0.25,
    costPerOz: 2.50,
    tier: 'standard',
    flavorProfile: { floral: 0, citrus: 10, earthy: 30, sweet: 15, caffeine: 0 },
    caffeineLevel: 'none',
  },
  {
    id: 'vanilla-bean',
    name: 'Vanilla Bean',
    category: 'spice',
    description: 'Rich and creamy sweetness',
    shortTags: ['Sweet', 'Creamy'],
    emoji: '🍦',
    isBase: false,
    baseAmount: 0.25,
    incrementAmount: 0.25,
    costPerOz: 8.00,
    tier: 'premium',
    flavorProfile: { floral: 10, citrus: 0, earthy: 10, sweet: 80, caffeine: 0 },
    caffeineLevel: 'none',
  },
  {
    id: 'cardamom-pods',
    name: 'Cardamom Pods',
    category: 'spice',
    description: 'Exotic and aromatic',
    shortTags: ['Spicy', 'Exotic'],
    emoji: '🫘',
    isBase: false,
    baseAmount: 0.25,
    incrementAmount: 0.25,
    costPerOz: 6.00,
    tier: 'premium',
    flavorProfile: { floral: 20, citrus: 15, earthy: 40, sweet: 25, caffeine: 0 },
    caffeineLevel: 'none',
  },

  // Herbals
  {
    id: 'peppermint-leaves',
    name: 'Peppermint Leaves',
    category: 'herbal',
    description: 'Cool and refreshing mint',
    shortTags: ['Minty', 'Cool'],
    emoji: '🌿',
    isBase: false,
    baseAmount: 0.25,
    incrementAmount: 0.25,
    costPerOz: 2.00,
    tier: 'standard',
    flavorProfile: { floral: 5, citrus: 10, earthy: 20, sweet: 15, caffeine: 0 },
    caffeineLevel: 'none',
  },
  {
    id: 'chamomile-flowers',
    name: 'Chamomile Flowers',
    category: 'herbal',
    description: 'Soothing and calming',
    shortTags: ['Calming', 'Gentle'],
    emoji: '🌼',
    isBase: false,
    baseAmount: 0.5,
    incrementAmount: 0.25,
    costPerOz: 2.50,
    tier: 'standard',
    flavorProfile: { floral: 50, citrus: 5, earthy: 25, sweet: 30, caffeine: 0 },
    caffeineLevel: 'none',
  },

  // Premium / Special
  {
    id: 'butterfly-pea-flower',
    name: 'Butterfly Pea Flower',
    category: 'special',
    description: 'Color-changing magical flower',
    shortTags: ['Magical', 'Color-Changing'],
    badges: ['Premium'],
    emoji: '🦋',
    isBase: false,
    baseAmount: 0.25,
    incrementAmount: 0.25,
    costPerOz: 10.00,
    tier: 'premium',
    flavorProfile: { floral: 40, citrus: 5, earthy: 30, sweet: 20, caffeine: 0 },
    caffeineLevel: 'none',
  },
  {
    id: 'matcha-powder',
    name: 'Matcha Powder',
    category: 'special',
    description: 'Concentrated green tea energy',
    shortTags: ['Energizing', 'Earthy'],
    badges: ['Premium'],
    emoji: '🍵',
    isBase: false,
    baseAmount: 0.25,
    incrementAmount: 0.25,
    costPerOz: 12.00,
    tier: 'premium',
    flavorProfile: { floral: 10, citrus: 5, earthy: 60, sweet: 15, caffeine: 80 },
    caffeineLevel: 'high',
  },
  {
    id: 'edible-gold-flakes',
    name: 'Edible Gold Flakes',
    category: 'special',
    description: 'Luxurious golden shimmer',
    shortTags: ['Luxurious', 'Decorative'],
    badges: ['Ultra'],
    emoji: '✨',
    isBase: false,
    baseAmount: 0.1,
    incrementAmount: 0.05,
    costPerOz: 50.00,
    tier: 'premium',
    flavorProfile: { floral: 0, citrus: 0, earthy: 0, sweet: 0, caffeine: 0 },
    caffeineLevel: 'none',
  },
];

/**
 * Get all blending ingredients (bases + add-ins)
 */
export const getAllBlendingIngredients = (): BlendingIngredient[] => {
  return [...MOCK_BASES, ...MOCK_ADDINS];
};

/**
 * Get ingredient by ID
 */
export const getBlendingIngredientById = (id: string): BlendingIngredient | undefined => {
  return getAllBlendingIngredients().find(ing => ing.id === id);
};

/**
 * Get add-ins by category tab
 */
export const getAddInsByTab = (tab: 'addIns' | 'botanicals' | 'premium'): BlendingIngredient[] => {
  switch (tab) {
    case 'addIns':
      return MOCK_ADDINS.filter(ing => 
        ['fruit', 'spice', 'herbal'].includes(ing.category) && ing.tier === 'standard'
      );
    case 'botanicals':
      return MOCK_ADDINS.filter(ing => 
        ['floral'].includes(ing.category)
      );
    case 'premium':
      return MOCK_ADDINS.filter(ing => 
        ing.tier === 'premium' || ing.category === 'special'
      );
    default:
      return [];
  }
};
