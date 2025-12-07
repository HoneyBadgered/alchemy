/**
 * Site Metadata Configuration
 * 
 * SEO, social media, and general site information
 */

export const SITE = {
  /**
   * Site metadata
   */
  name: 'The Alchemy Table',
  description: 'Craft your perfect blend with magical ingredients. A gamified experience where alchemy meets artisan quality.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://alchemytable.com',
  
  /**
   * SEO
   */
  keywords: [
    'alchemy',
    'custom blends',
    'artisan',
    'magical ingredients',
    'gamified shopping',
    'crafting',
    'potions',
  ],
  
  /**
   * Author/Company
   */
  author: {
    name: 'The Alchemy Table',
    email: 'hello@alchemytable.com',
    url: 'https://alchemytable.com',
  },
  
  /**
   * Social Media
   */
  social: {
    twitter: '@alchemytable',
    instagram: '@alchemytable',
    facebook: 'alchemytable',
    tiktok: '@alchemytable',
  },
  
  /**
   * Contact
   */
  contact: {
    email: 'support@alchemytable.com',
    phone: '+1 (555) 123-4567',
  },
  
  /**
   * OpenGraph defaults
   */
  og: {
    type: 'website',
    locale: 'en_US',
    siteName: 'The Alchemy Table',
  },
} as const;
