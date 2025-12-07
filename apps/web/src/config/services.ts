/**
 * External Services Configuration
 * 
 * API keys, URLs, and settings for third-party services
 */

export const SERVICES = {
  /**
   * API Configuration
   */
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
  },
  
  /**
   * Stripe Payment Processing
   */
  stripe: {
    publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    successUrl: '/checkout/success',
    cancelUrl: '/checkout/cancel',
  },
  
  /**
   * Image CDN
   */
  cdn: {
    baseUrl: process.env.NEXT_PUBLIC_CDN_URL || '',
    enabled: !!process.env.NEXT_PUBLIC_CDN_URL,
  },
  
  /**
   * Email Service
   */
  email: {
    provider: 'sendgrid', // or 'mailgun', 'ses', etc.
    fromAddress: 'noreply@alchemytable.com',
    fromName: 'The Alchemy Table',
  },
  
  /**
   * Error Tracking (Sentry, etc.)
   */
  errorTracking: {
    enabled: process.env.NODE_ENV === 'production',
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  },
  
  /**
   * Map Services (if needed for shipping/locations)
   */
  maps: {
    provider: 'google', // or 'mapbox'
    apiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY || '',
  },
  
  /**
   * Search Service (Algolia, etc.)
   */
  search: {
    enabled: false,
    provider: 'algolia',
    appId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '',
    apiKey: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || '',
  },
  
  /**
   * Customer Support Chat
   */
  chat: {
    enabled: false,
    provider: 'intercom', // or 'zendesk', 'crisp', etc.
    appId: process.env.NEXT_PUBLIC_CHAT_APP_ID || '',
  },
} as const;
