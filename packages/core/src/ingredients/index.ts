/**
 * Ingredient data and utilities
 */

import type { Ingredient, IngredientCategory } from '../types';

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
    isBase: true,
  },
  {
    id: 'black-tea',
    name: 'Black Tea',
    category: 'base',
    description: 'Bold and robust base',
    tags: ['strong', 'classic'],
    emoji: '☕',
    isBase: true,
  },
  {
    id: 'white-tea',
    name: 'White Tea',
    category: 'base',
    description: 'Delicate and subtle base',
    tags: ['mild', 'premium'],
    emoji: '🫖',
    isBase: true,
  },
  {
    id: 'oolong-tea',
    name: 'Oolong Tea',
    category: 'base',
    description: 'Balanced and complex base',
    tags: ['traditional', 'aromatic'],
    emoji: '🍃',
    isBase: true,
  },

  // Floral Add-ins
  {
    id: 'lavender',
    name: 'Lavender',
    category: 'floral',
    description: 'Calming floral notes',
    tags: ['relaxing', 'aromatic'],
    emoji: '🌸',
    isBase: false,
  },
  {
    id: 'chamomile',
    name: 'Chamomile',
    category: 'floral',
    description: 'Soothing and gentle',
    tags: ['calming', 'bedtime'],
    emoji: '🌼',
    isBase: false,
  },
  {
    id: 'rose',
    name: 'Rose Petals',
    category: 'floral',
    description: 'Elegant and fragrant',
    tags: ['romantic', 'luxurious'],
    emoji: '🌹',
    isBase: false,
  },
  {
    id: 'hibiscus',
    name: 'Hibiscus',
    category: 'floral',
    description: 'Tart and vibrant',
    tags: ['tangy', 'colorful'],
    emoji: '🌺',
    isBase: false,
  },

  // Fruit Add-ins
  {
    id: 'lemon',
    name: 'Lemon Peel',
    category: 'fruit',
    description: 'Bright and citrusy',
    tags: ['refreshing', 'zesty'],
    emoji: '🍋',
    isBase: false,
  },
  {
    id: 'orange',
    name: 'Orange Peel',
    category: 'fruit',
    description: 'Sweet citrus notes',
    tags: ['uplifting', 'sweet'],
    emoji: '🍊',
    isBase: false,
  },
  {
    id: 'berry-mix',
    name: 'Berry Mix',
    category: 'fruit',
    description: 'Mixed berries blend',
    tags: ['fruity', 'antioxidant'],
    emoji: '🫐',
    isBase: false,
  },
  {
    id: 'apple',
    name: 'Dried Apple',
    category: 'fruit',
    description: 'Sweet and crisp',
    tags: ['comforting', 'mild'],
    emoji: '🍎',
    isBase: false,
  },

  // Herbal Add-ins
  {
    id: 'mint',
    name: 'Peppermint',
    category: 'herbal',
    description: 'Cool and invigorating',
    tags: ['refreshing', 'digestive'],
    emoji: '🌿',
    isBase: false,
  },
  {
    id: 'ginger',
    name: 'Ginger Root',
    category: 'herbal',
    description: 'Warming and spicy',
    tags: ['warming', 'energizing'],
    emoji: '🫚',
    isBase: false,
  },
  {
    id: 'lemongrass',
    name: 'Lemongrass',
    category: 'herbal',
    description: 'Fresh and citrusy',
    tags: ['cleansing', 'aromatic'],
    emoji: '🌾',
    isBase: false,
  },
  {
    id: 'echinacea',
    name: 'Echinacea',
    category: 'herbal',
    description: 'Immune support',
    tags: ['wellness', 'earthy'],
    emoji: '🌻',
    isBase: false,
  },

  // Spice Add-ins
  {
    id: 'cinnamon',
    name: 'Cinnamon',
    category: 'spice',
    description: 'Warm and sweet',
    tags: ['cozy', 'sweet'],
    emoji: '🪵',
    isBase: false,
  },
  {
    id: 'cardamom',
    name: 'Cardamom',
    category: 'spice',
    description: 'Aromatic and complex',
    tags: ['exotic', 'warming'],
    emoji: '🫘',
    isBase: false,
  },
  {
    id: 'vanilla',
    name: 'Vanilla Bean',
    category: 'spice',
    description: 'Sweet and creamy',
    tags: ['dessert', 'smooth'],
    emoji: '🍦',
    isBase: false,
  },
  {
    id: 'clove',
    name: 'Clove',
    category: 'spice',
    description: 'Bold and aromatic',
    tags: ['intense', 'warming'],
    emoji: '🌰',
    isBase: false,
  },

  // Special Add-ins
  {
    id: 'honey-dust',
    name: 'Honey Dust',
    category: 'special',
    description: 'Natural sweetener',
    tags: ['sweet', 'soothing'],
    badges: ['Rare'],
    emoji: '🍯',
    isBase: false,
  },
  {
    id: 'butterfly-pea',
    name: 'Butterfly Pea Flower',
    category: 'special',
    description: 'Color-changing magic',
    tags: ['magical', 'visual'],
    badges: ['Epic'],
    emoji: '🦋',
    isBase: false,
  },
  {
    id: 'matcha',
    name: 'Matcha Powder',
    category: 'special',
    description: 'Concentrated energy',
    tags: ['energizing', 'premium'],
    badges: ['Premium'],
    emoji: '🍃✨',
    isBase: false,
  },
  {
    id: 'edible-flowers',
    name: 'Edible Flowers',
    category: 'special',
    description: 'Beautiful and delicate',
    tags: ['aesthetic', 'elegant'],
    badges: ['Rare'],
    emoji: '🌸✨',
    isBase: false,
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
  return INGREDIENTS.filter(ing => ing.isBase);
}

/**
 * Get all add-ins
 */
export function getAddIns(): Ingredient[] {
  return INGREDIENTS.filter(ing => !ing.isBase);
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
  floral: {
    title: 'Floral',
    description: 'Delicate petals and blooms',
    emoji: '🌸',
    color: 'pink',
  },
  fruit: {
    title: 'Fruit',
    description: 'Sweet and tangy additions',
    emoji: '🍊',
    color: 'orange',
  },
  herbal: {
    title: 'Herbal',
    description: 'Natural herbs and roots',
    emoji: '🌿',
    color: 'green',
  },
  spice: {
    title: 'Spice',
    description: 'Warm and aromatic spices',
    emoji: '🪵',
    color: 'amber',
  },
  special: {
    title: 'Special',
    description: 'Rare and magical ingredients',
    emoji: '✨',
    color: 'purple',
  },
};
