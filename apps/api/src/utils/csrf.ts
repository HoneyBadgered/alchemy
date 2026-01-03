/**
 * CSRF Token Management
 * 
 * Implements dual-token pattern for CSRF protection:
 * 1. Token stored in httpOnly cookie (server-side validation)
 * 2. Token value sent in custom header (client-side inclusion)
 * 
 * This prevents CSRF attacks because:
 * - Attackers cannot read cookies from other origins (Same-Origin Policy)
 * - Attackers cannot set custom headers on cross-origin requests
 */

import { randomBytes, timingSafeEqual } from 'crypto';

export interface CsrfToken {
  token: string;
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * In-memory CSRF token storage
 * For production with multiple instances, use Redis
 */
class CsrfTokenStore {
  private tokens: Map<string, CsrfToken> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired tokens every 10 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 10 * 60 * 1000);
    this.cleanupInterval.unref();
  }

  /**
   * Store a CSRF token associated with a session
   */
  set(sessionId: string, token: string, expiresInSeconds: number = 3600): void {
    const now = new Date();
    this.tokens.set(sessionId, {
      token,
      sessionId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + expiresInSeconds * 1000),
    });
  }

  /**
   * Retrieve a CSRF token for a session
   */
  get(sessionId: string): CsrfToken | undefined {
    const csrfToken = this.tokens.get(sessionId);
    
    if (!csrfToken) {
      return undefined;
    }

    // Check if expired
    if (new Date() > csrfToken.expiresAt) {
      this.tokens.delete(sessionId);
      return undefined;
    }

    return csrfToken;
  }

  /**
   * Delete a CSRF token for a session
   */
  delete(sessionId: string): void {
    this.tokens.delete(sessionId);
  }

  /**
   * Clean up expired tokens
   */
  private cleanup(): void {
    const now = new Date();
    const entries = Array.from(this.tokens.entries());
    for (const [sessionId, csrfToken] of entries) {
      if (now > csrfToken.expiresAt) {
        this.tokens.delete(sessionId);
      }
    }
  }

  /**
   * Clear all tokens (for testing)
   */
  clear(): void {
    this.tokens.clear();
  }

  /**
   * Get token count (for monitoring)
   */
  count(): number {
    return this.tokens.size;
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.tokens.clear();
  }
}

/**
 * Global CSRF token store instance
 * 
 * TODO: For production with multiple API instances, replace with Redis:
 * 
 * import Redis from 'ioredis';
 * const redis = new Redis(process.env.REDIS_URL);
 * 
 * async set(sessionId: string, token: string, ttl: number) {
 *   await redis.setex(`csrf:${sessionId}`, ttl, token);
 * }
 * 
 * async get(sessionId: string): Promise<string | null> {
 *   return await redis.get(`csrf:${sessionId}`);
 * }
 */
export const csrfTokenStore = new CsrfTokenStore();

/**
 * Generate a cryptographically secure random CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Create and store a CSRF token for a session
 * @returns The generated token
 */
export function createCsrfToken(sessionId: string, expiresInSeconds: number = 3600): string {
  const token = generateCsrfToken();
  csrfTokenStore.set(sessionId, token, expiresInSeconds);
  return token;
}

/**
 * Validate a CSRF token against the stored token for a session
 */
export function validateCsrfToken(sessionId: string, token: string): boolean {
  if (!sessionId || !token) {
    return false;
  }

  const storedToken = csrfTokenStore.get(sessionId);
  
  if (!storedToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  try {
    return timingSafeEqual(
      Buffer.from(token),
      Buffer.from(storedToken.token)
    );
  } catch {
    // Tokens are different lengths
    return false;
  }
}

/**
 * Rotate CSRF token (generate new token, delete old one)
 * Used on login/logout to prevent session fixation
 */
export function rotateCsrfToken(sessionId: string, expiresInSeconds: number = 3600): string {
  csrfTokenStore.delete(sessionId);
  return createCsrfToken(sessionId, expiresInSeconds);
}

/**
 * Delete CSRF token for a session (on logout)
 */
export function deleteCsrfToken(sessionId: string): void {
  csrfTokenStore.delete(sessionId);
}

/**
 * Get or create CSRF token for a session
 * Returns existing token if valid, creates new one if expired or missing
 */
export function getOrCreateCsrfToken(sessionId: string, expiresInSeconds: number = 3600): string {
  const existing = csrfTokenStore.get(sessionId);
  
  if (existing) {
    return existing.token;
  }

  return createCsrfToken(sessionId, expiresInSeconds);
}
