import { ReactNode } from 'react';

export interface ZoneConfig {
  name: string;
  tagline: string;
  theme: string;
  gradient: string;
  bgGradient: string;
  accentColor: string;
  defaultFilters: {
    flavorProfile: string[];
    caffeineLevel: string[];
  };
  subTabs: Array<{
    id: string;
    label: string;
    bias: string[] | null;
  }>;
}

export const ZONE_CONFIGS: Record<string, ZoneConfig> = {
  hearthhouse: {
    name: 'The Hearthhouse',
    tagline: 'Dark, smoky, grounding',
    theme: 'Where warmth gathers and stories linger',
    gradient: 'from-amber-900 via-orange-800 to-red-900',
    bgGradient: 'from-stone-950 via-stone-900 to-stone-950',
    accentColor: 'amber',
    defaultFilters: {
      flavorProfile: ['smoky', 'roasted'],
      caffeineLevel: ['medium', 'high'],
    },
    subTabs: [
      { id: 'all', label: 'All', bias: null },
      { id: 'deep', label: 'Deep', bias: ['smoky', 'roasted', 'earthy'] },
      { id: 'spiced', label: 'Spiced', bias: ['spiced', 'warming'] },
      { id: 'mellow', label: 'Mellow', bias: ['mellow', 'smooth'] },
    ],
  },
  conservatory: {
    name: 'The Conservatory',
    tagline: 'Light, floral, restorative',
    theme: 'Where daylight lingers and renewal blooms',
    gradient: 'from-emerald-600 via-green-500 to-teal-600',
    bgGradient: 'from-emerald-950 via-teal-950 to-green-950',
    accentColor: 'emerald',
    defaultFilters: {
      flavorProfile: ['floral', 'herbs'],
      caffeineLevel: ['none', 'low'],
    },
    subTabs: [
      { id: 'all', label: 'All', bias: null },
      { id: 'floral', label: 'Floral', bias: ['floral', 'rose', 'jasmine'] },
      { id: 'herbs', label: 'Herbal', bias: ['herbs', 'mint', 'chamomile'] },
      { id: 'calming', label: 'Calming', bias: ['calming', 'soothing'] },
    ],
  },
  'east-pavilion': {
    name: 'The East Pavilion',
    tagline: 'Mornings, greens, clarity',
    theme: 'Where the first light brings focus and awakening',
    gradient: 'from-cyan-600 via-blue-500 to-indigo-600',
    bgGradient: 'from-slate-950 via-blue-950 to-indigo-950',
    accentColor: 'cyan',
    defaultFilters: {
      flavorProfile: ['bright', 'grassy'],
      caffeineLevel: ['medium', 'high'],
    },
    subTabs: [
      { id: 'all', label: 'All', bias: null },
      { id: 'bright', label: 'Bright', bias: ['bright', 'crisp', 'fresh'] },
      { id: 'grassy', label: 'Grassy', bias: ['grassy', 'vegetal'] },
      { id: 'energizing', label: 'Energizing', bias: ['energizing', 'invigorating'] },
    ],
  },
  observatory: {
    name: 'The Observatory',
    tagline: 'Night, quiet, contemplation',
    theme: 'Where stars whisper and stillness deepens',
    gradient: 'from-indigo-900 via-purple-800 to-violet-900',
    bgGradient: 'from-indigo-950 via-purple-950 to-violet-950',
    accentColor: 'violet',
    defaultFilters: {
      flavorProfile: ['subtle', 'delicate'],
      caffeineLevel: ['none', 'low'],
    },
    subTabs: [
      { id: 'all', label: 'All', bias: null },
      { id: 'subtle', label: 'Subtle', bias: ['subtle', 'delicate', 'nuanced'] },
      { id: 'meditative', label: 'Meditative', bias: ['meditative', 'quiet'] },
      { id: 'nighttime', label: 'Nighttime', bias: ['calming', 'relaxing'] },
    ],
  },
  'liminal-tent': {
    name: 'The Liminal Tent',
    tagline: 'Seasonal and limited finds',
    theme: 'Where rare moments gather and fleeting treasures wait',
    gradient: 'from-pink-600 via-rose-500 to-fuchsia-600',
    bgGradient: 'from-fuchsia-950 via-pink-950 to-rose-950',
    accentColor: 'fuchsia',
    defaultFilters: {
      flavorProfile: [],
      caffeineLevel: [],
    },
    subTabs: [
      { id: 'all', label: 'All', bias: null },
      { id: 'seasonal', label: 'Seasonal', bias: ['seasonal', 'limited'] },
      { id: 'experimental', label: 'Experimental', bias: ['unique', 'rare'] },
      { id: 'exclusive', label: 'Exclusive', bias: ['exclusive', 'specialty'] },
    ],
  },
};

export const CAFFEINE_ICONS = {
  none: '○',
  low: '◔',
  medium: '◑',
  high: '●',
};
