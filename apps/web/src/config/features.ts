/**
 * Feature Flags Configuration
 * 
 * Enable/disable features across the application
 * Useful for gradual rollouts, A/B testing, and maintenance
 */

export const FEATURES = {
  /**
   * Core Features
   */
  enableBlending: true,
  enableShop: true,
  enableGamification: true,
  enableRewards: true,
  enableLibrary: true,
  
  /**
   * User Features
   */
  enableGuestCheckout: true,
  enableSocialLogin: false,
  enableWishlist: true,
  enableReviews: true,
  
  /**
   * Payment Features
   */
  enableStripe: true,
  enablePayPal: false,
  enableApplePay: false,
  enableGooglePay: false,
  
  /**
   * Beta Features
   */
  enableThemeSwitcher: true,
  enableAIRecommendations: false,
  enableVoiceSearch: false,
  enableARPreview: false,
  
  /**
   * Admin Features
   */
  enableAdminPanel: true,
  enableAnalyticsDashboard: true,
  
  /**
   * Maintenance
   */
  maintenanceMode: false,
  maintenanceMessage: 'The Alchemy Table is currently undergoing magical maintenance. We\'ll be back soon!',
  
  /**
   * Development
   */
  enableDebugMode: process.env.NODE_ENV === 'development',
  enableErrorReporting: process.env.NODE_ENV === 'production',
} as const;
