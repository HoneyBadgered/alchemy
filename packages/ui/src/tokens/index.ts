/**
 * Design Tokens for The Alchemy Table
 * 
 * Cozy fantasy/alchemy aesthetic theme
 */

export const colors = {
  // Primary alchemy palette
  primary: {
    50: '#FFF9E6',
    100: '#FFF0BD',
    200: '#FFE794',
    300: '#FFDD6B',
    400: '#FFD442',
    500: '#FFCB19', // Golden glow
    600: '#E6B716',
    700: '#CCA313',
    800: '#B38F10',
    900: '#997B0D',
  },
  
  // Secondary mystical purple
  secondary: {
    50: '#F3E6FF',
    100: '#E0BFFF',
    200: '#CC99FF',
    300: '#B873FF',
    400: '#A54DFF',
    500: '#9126FF', // Mystical purple
    600: '#8222E6',
    700: '#731ECC',
    800: '#641AB3',
    900: '#551699',
  },
  
  // Neutral wood tones
  neutral: {
    50: '#FAF8F5',
    100: '#F5F0E8',
    200: '#E8DFC8',
    300: '#D4C4A8',
    400: '#BFB088',
    500: '#8B7355', // Warm wood
    600: '#6E5C44',
    700: '#514433',
    800: '#342D22',
    900: '#1A1611',
  },
  
  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Background & surface
  background: '#0F0D0A',
  surface: '#1A1611',
  surfaceElevated: '#342D22',
};

export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
};

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
    mono: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fantasy: '"Cinzel", "IM Fell English", Georgia, serif', // Alchemy-themed headings
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  glow: '0 0 20px rgba(255, 203, 25, 0.5)', // Golden alchemy glow
  glowPurple: '0 0 20px rgba(145, 38, 255, 0.5)', // Mystical purple glow
};

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
};
