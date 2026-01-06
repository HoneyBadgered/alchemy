/**
 * Ingredient data and utilities
 */

import type { Ingredient, IngredientCategory } from '../types';

/**
 * Default values for ingredient amounts
 */
export const DEFAULT_BASE_AMOUNT = 5;
export const DEFAULT_INCREMENT_AMOUNT = 1;

/**
 * Get the base amount for an ingredient, with fallback to default
 */
export function getIngredientBaseAmount(ingredient: Ingredient): number {
  return ingredient.baseAmount ?? DEFAULT_BASE_AMOUNT;
}

/**
 * Get the increment amount for an ingredient, with fallback to baseAmount or default
 */
export function getIngredientIncrementAmount(ingredient: Ingredient): number {
  return ingredient.incrementAmount ?? ingredient.baseAmount ?? DEFAULT_INCREMENT_AMOUNT;
}

/**
 * Sample ingredients for The Alchemy Table
 */
export const INGREDIENTS: Ingredient[] = [
  // Base Teas
  {
    id: 'green-tea',
    name: 'Green Tea',
    category: 'base',
    description: 'Light and refreshing base',
    tags: ['antioxidant', 'energizing'],
    emoji: '🍵',
    
  },
  {
    id: 'black-tea',
    name: 'Black Tea',
    category: 'base',
    description: 'Bold and robust base',
    tags: ['strong', 'classic'],
    emoji: '☕',
    
  },
  {
    id: 'white-tea',
    name: 'White Tea',
    category: 'base',
    description: 'Delicate and subtle base',
    tags: ['mild', 'premium'],
    emoji: '🫖',
    
  },
  {
    id: 'oolong-tea',
    name: 'Oolong Tea',
    category: 'base',
    description: 'Balanced and complex base',
    tags: ['traditional', 'aromatic'],
    emoji: '🍃',
    
  },

  // Flower Add-ins
  {
    id: 'lavender',
    name: 'Lavender',
    category: 'flowers',
    description: 'Calming floral notes',
    tags: ['relaxing', 'aromatic'],
    emoji: '🌸',
    
    baseAmount: 2,
    incrementAmount: 1,
  },
  {
    id: 'chamomile',
    name: 'Chamomile',
    category: 'flowers',
    description: 'Soothing and gentle',
    tags: ['calming', 'bedtime'],
    emoji: '🌼',
    
    baseAmount: 3,
    incrementAmount: 1,
  },
  {
    id: 'rose',
    name: 'Rose Petals',
    category: 'flowers',
    description: 'Elegant and fragrant',
    tags: ['romantic', 'luxurious'],
    emoji: '🌹',
    
    baseAmount: 2,
    incrementAmount: 0.5,
  },
  {
    id: 'hibiscus',
    name: 'Hibiscus',
    category: 'flowers',
    description: 'Tart and vibrant',
    tags: ['tangy', 'colorful'],
    emoji: '🌺',
    
    baseAmount: 3,
    incrementAmount: 1,
  },

  // Fruit Add-ins
  {
    id: 'lemon',
    name: 'Lemon Peel',
    category: 'fruit',
    description: 'Bright and citrusy',
    tags: ['refreshing', 'zesty'],
    emoji: '🍋',
    
    baseAmount: 2,
    incrementAmount: 1,
  },
  {
    id: 'orange',
    name: 'Orange Peel',
    category: 'fruit',
    description: 'Sweet citrus notes',
    tags: ['uplifting', 'sweet'],
    emoji: '🍊',
    
    baseAmount: 3,
    incrementAmount: 1,
  },
  {
    id: 'berry-mix',
    name: 'Berry Mix',
    category: 'fruit',
    description: 'Mixed berries blend',
    tags: ['fruity', 'antioxidant'],
    emoji: '🫐',
    
    baseAmount: 5,
    incrementAmount: 2,
  },
  {
    id: 'apple',
    name: 'Dried Apple',
    category: 'fruit',
    description: 'Sweet and crisp',
    tags: ['comforting', 'mild'],
    emoji: '🍎',
    
    baseAmount: 4,
    incrementAmount: 2,
  },

  // Herb Add-ins
  {
    id: 'mint',
    name: 'Peppermint',
    category: 'herbs',
    description: 'Cool and invigorating',
    tags: ['refreshing', 'digestive'],
    emoji: '🌿',
    
    baseAmount: 2,
    incrementAmount: 1,
  },
  {
    id: 'ginger',
    name: 'Ginger Root',
    category: 'herbs',
    description: 'Warming and spicy',
    tags: ['warming', 'energizing'],
    emoji: '🫚',
    
    baseAmount: 2,
    incrementAmount: 0.5,
  },
  {
    id: 'lemongrass',
    name: 'Lemongrass',
    category: 'herbs',
    description: 'Fresh and citrusy',
    tags: ['cleansing', 'aromatic'],
    emoji: '🌾',
    
    baseAmount: 3,
    incrementAmount: 1,
  },
  {
    id: 'echinacea',
    name: 'Echinacea',
    category: 'herbs',
    description: 'Immune support',
    tags: ['wellness', 'earthy'],
    emoji: '🌻',
    
    baseAmount: 2,
    incrementAmount: 1,
  },

  // Spice Add-ins
  {
    id: 'cinnamon',
    name: 'Cinnamon',
    category: 'spice',
    description: 'Warm and sweet',
    tags: ['cozy', 'sweet'],
    emoji: '🪵',
    
    baseAmount: 1,
    incrementAmount: 0.5,
  },
  {
    id: 'cardamom',
    name: 'Cardamom',
    category: 'spice',
    description: 'Aromatic and complex',
    tags: ['exotic', 'warming'],
    emoji: '🫘',
    
    baseAmount: 1,
    incrementAmount: 0.5,
  },
  {
    id: 'clove',
    name: 'Clove',
    category: 'spice',
    description: 'Bold and aromatic',
    tags: ['intense', 'warming'],
    emoji: '🌰',
    
    baseAmount: 0.5,
    incrementAmount: 0.25,
  },

  // Sweet & Aromatic Add-ins
  {
    id: 'vanilla',
    name: 'Vanilla Bean',
    category: 'sweet',
    description: 'Sweet and creamy',
    tags: ['dessert', 'smooth'],
    emoji: '🍦',
    
    baseAmount: 1,
    incrementAmount: 0.5,
  },
  {
    id: 'honey-dust',
    name: 'Honey Dust',
    category: 'sweet',
    description: 'Natural sweetener',
    tags: ['sweet', 'soothing'],
    badges: ['Rare'],
    emoji: '🍯',
    
    baseAmount: 2,
    incrementAmount: 1,
  },

  // Specialty Add-ins
  {
    id: 'butterfly-pea',
    name: 'Butterfly Pea Flower',
    category: 'specialty',
    description: 'Color-changing magic',
    tags: ['magical', 'visual'],
    badges: ['Epic'],
    emoji: '🦋',
    
    baseAmount: 1,
    incrementAmount: 0.5,
  },
  {
    id: 'matcha',
    name: 'Matcha Powder',
    category: 'specialty',
    description: 'Concentrated energy',
    tags: ['energizing', 'premium'],
    badges: ['Premium'],
    emoji: '🍃✨',
    
    baseAmount: 1,
    incrementAmount: 0.5,
  },
  {
    id: 'edible-flowers',
    name: 'Edible Flowers',
    category: 'specialty',
    description: 'Beautiful and delicate',
    tags: ['aesthetic', 'elegant'],
    badges: ['Rare'],
    emoji: '🌸✨',
    
    baseAmount: 1,
    incrementAmount: 0.5,
  },
];

/**
 * Get ingredients by category
 */
export function getIngredientsByCategory(category: IngredientCategory): Ingredient[] {
  return INGREDIENTS.filter(ing => ing.category === category);
}

/**
 * Get ingredient by ID
 */
export function getIngredientById(id: string): Ingredient | undefined {
  return INGREDIENTS.find(ing => ing.id === id);
}

/**
 * Get all base teas
 */
export function getBaseTeas(): Ingredient[] {
  return INGREDIENTS.filter(ing => ing.category === 'base');
}

/**
 * Get all add-ins
 */
export function getAddIns(): Ingredient[] {
  return INGREDIENTS.filter(ing => ing.category !== 'base');
}

/**
 * Category metadata for UI
 */
export const CATEGORY_INFO: Record<IngredientCategory, {
  title: string;
  description: string;
  emoji: string;
  color: string;
}> = {
  base: {
    title: 'Base Tea',
    description: 'Choose your foundation',
    emoji: '🍵',
    color: 'emerald',
  },
  flowers: {
    title: 'Flowers',
    description: 'Petals, blossoms, gentle aromatics',
    emoji: '🌸',
    color: 'pink',
  },
  herbs: {
    title: 'Herbs',
    description: 'Leafy, green, restorative ingredients',
    emoji: '🌿',
    color: 'green',
  },
  fruit: {
    title: 'Fruits & Citrus',
    description: 'Dried fruit and peel for brightness',
    emoji: '🍊',
    color: 'orange',
  },
  spice: {
    title: 'Spices',
    description: 'Warm, bold, or smoky accents',
    emoji: '🔥',
    color: 'amber',
  },
  sweet: {
    title: 'Sweet & Aromatic',
    description: 'Rounding and smoothing elements',
    emoji: '🍯',
    color: 'yellow',
  },
  essence: {
    title: 'Essences',
    description: 'Concentrated flavor adjustments',
    emoji: '💧',
    color: 'blue',
  },
  specialty: {
    title: 'Specialty',
    description: 'Seasonal, rare, or functional ingredients',
    emoji: '⭐',
    color: 'purple',
  },
};
