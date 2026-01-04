/**
 * Security Configuration for Next.js
 * Centralized security headers configuration
 */

export const securityConfig = {
  // Content Security Policy directives
  csp: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: [
      "'self'",
      "'unsafe-eval'",
      "'unsafe-inline'",
      "https://js.stripe.com",
    ],
    frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"],
    connectSrc: [
      "'self'",
      "http://localhost:3000",
      "http://localhost:3001",
      "https://api.stripe.com",
    ],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    fontSrc: ["'self'", "data:"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: [],
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true,
  },

  // Other security headers
  referrerPolicy: "strict-origin-when-cross-origin" as const,
  xFrameOptions: "DENY" as const,
  xContentTypeOptions: "nosniff" as const,
  xXSSProtection: "1; mode=block" as const,

  // Permissions Policy
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    interestCohort: [],
  },
};
