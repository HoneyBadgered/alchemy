/**
 * Branding Configuration
 * 
 * Central location for all brand assets and identity elements
 * used across the application.
 */

export const BRANDING = {
  /**
   * Logo image path
   * Used in headers, footers, and other brand touchpoints
   */
  LOGO_PATH: '/images/logo1.png',

  /**
   * Site name
   */
  SITE_NAME: 'The Alchemy Table',

  /**
   * Site tagline/description
   */
  TAGLINE: 'Craft your perfect blend with magical ingredients',

  /**
   * Favicon path
   */
  FAVICON_PATH: '/favicon.ico',

  /**
   * Social media images
   */
  OG_IMAGE: '/images/og-image.png',

  /**
   * Brand emoji/icon (fallback when image not available)
   */
  ICON_EMOJI: '🧪',

  /**
   * Base path for all images
   */
  IMAGE_BASE_PATH: '/images',
} as const;
