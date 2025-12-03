/**
 * Theme Palette Definitions
 * 
 * Defines color palettes for The Alchemy Table.
 * Themes can be unlocked via progression system.
 */

export type ThemeId = 'verdant' | 'purple' | 'crimson';

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  emoji: string;
  preview: string;
  requiredLevel?: number;
  isPremium?: boolean;
  price?: number;
}

export const THEMES: Theme[] = [
  {
    id: 'verdant',
    name: 'Verdant Elixir',
    description: 'Moody botanical noir with deep greens and gold accents',
    emoji: '🌿',
    preview: 'linear-gradient(135deg, #14513A, #163E33)',
    requiredLevel: 1,
  },
  {
    id: 'purple',
    name: 'Magical Alchemy',
    description: 'Classic mystical purple with ethereal vibes',
    emoji: '✨',
    preview: 'linear-gradient(135deg, #9333ea, #7c3aed)',
    requiredLevel: 5,
  },
  {
    id: 'crimson',
    name: 'Crimson Ritual',
    description: 'Dark crimson with amber highlights',
    emoji: '🔥',
    preview: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
    requiredLevel: 15,
    isPremium: true,
    price: 500,
  },
];

export function getThemeById(id: ThemeId): Theme | undefined {
  return THEMES.find(theme => theme.id === id);
}
