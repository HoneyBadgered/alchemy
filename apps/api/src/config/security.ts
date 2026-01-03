/**
 * Security Configuration for Fastify API
 * Centralized security headers configuration using Helmet
 */

export const helmetConfig = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  // Cross-Origin Embedder Policy (disable in dev for better compatibility)
  crossOriginEmbedderPolicy: false,

  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: {
    policy: "same-origin" as const,
  },

  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: {
    policy: "same-origin" as const,
  },

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false,
  },

  // Frameguard (X-Frame-Options)
  frameguard: {
    action: "deny" as const,
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // IE No Open
  ieNoOpen: true,

  // X-Content-Type-Options
  noSniff: true,

  // Origin Agent Cluster
  originAgentCluster: true,

  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: {
    permittedPolicies: "none" as const,
  },

  // Referrer Policy
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin" as const,
  },

  // XSS Filter
  xssFilter: true,
};

/**
 * Get helmet config with environment-specific settings
 */
export function getHelmetConfig(isDevelopment: boolean) {
  return {
    ...helmetConfig,
    // Disable COEP in development for better compatibility
    crossOriginEmbedderPolicy: !isDevelopment,
  };
}
