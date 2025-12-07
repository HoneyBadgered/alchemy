/**
 * Analytics Configuration
 * 
 * Tracking and analytics service configuration
 */

export const ANALYTICS = {
  /**
   * Google Analytics
   */
  googleAnalytics: {
    enabled: process.env.NODE_ENV === 'production',
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
  },
  
  /**
   * Meta Pixel (Facebook)
   */
  metaPixel: {
    enabled: false,
    pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || '',
  },
  
  /**
   * TikTok Pixel
   */
  tiktokPixel: {
    enabled: false,
    pixelId: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || '',
  },
  
  /**
   * Google Tag Manager
   */
  googleTagManager: {
    enabled: false,
    containerId: process.env.NEXT_PUBLIC_GTM_ID || '',
  },
  
  /**
   * Event Names
   * Standardized event naming for consistency
   */
  events: {
    // E-commerce
    viewProduct: 'view_product',
    addToCart: 'add_to_cart',
    removeFromCart: 'remove_from_cart',
    beginCheckout: 'begin_checkout',
    purchase: 'purchase',
    
    // Blending
    startBlend: 'start_blend',
    addIngredient: 'add_ingredient',
    completeBlend: 'complete_blend',
    saveBlend: 'save_blend',
    
    // User
    signup: 'sign_up',
    login: 'login',
    logout: 'logout',
    
    // Engagement
    search: 'search',
    share: 'share',
    viewLibrary: 'view_library',
    unlockAchievement: 'unlock_achievement',
    
    // Theme
    changeTheme: 'change_theme',
  },
} as const;
