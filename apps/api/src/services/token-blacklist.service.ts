/**
 * Token Blacklist Service
 * 
 * Provides immediate token revocation for access tokens.
 * Uses Redis when available, falls back to in-memory storage for development.
 * 
 * WARNING: In-memory storage is not suitable for production multi-instance deployments.
 * Install and configure Redis for production use.
 */

import { config } from '../config';

export interface TokenBlacklistService {
  /**
   * Add a token to the blacklist
   * @param token - The JWT token to blacklist
   * @param expiresInSeconds - TTL in seconds (should match token expiration)
   */
  blacklist(token: string, expiresInSeconds: number): Promise<void>;

  /**
   * Check if a token is blacklisted
   * @param token - The JWT token to check
   * @returns true if blacklisted, false otherwise
   */
  isBlacklisted(token: string): Promise<boolean>;

  /**
   * Blacklist all tokens for a specific user
   * @param userId - The user ID
   * @param expiresInSeconds - TTL in seconds
   */
  blacklistUser(userId: string, expiresInSeconds: number): Promise<void>;

  /**
   * Check if all tokens for a user are blacklisted
   * @param userId - The user ID
   * @returns true if user is blacklisted, false otherwise
   */
  isUserBlacklisted(userId: string): Promise<boolean>;

  /**
   * Clear the blacklist (for testing purposes)
   */
  clear(): Promise<void>;
}

/**
 * In-Memory Token Blacklist (Development/Single-Instance Only)
 * 
 * WARNING: Not suitable for production with multiple API instances
 */
class InMemoryTokenBlacklist implements TokenBlacklistService {
  private tokenBlacklist: Map<string, number> = new Map(); // token -> expiry timestamp
  private userBlacklist: Map<string, number> = new Map(); // userId -> expiry timestamp
  private cleanupInterval?: NodeJS.Timeout;

  constructor(options: { enableCleanup?: boolean } = {}) {
    // Clean up expired entries every 5 minutes (optional, can be disabled for testing)
    const enableCleanup = options.enableCleanup ?? true;
    if (enableCleanup) {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      // Unref to allow process to exit if this is the only thing running
      this.cleanupInterval.unref();
    }
    
    if (config.isProduction && enableCleanup) {
      console.warn('⚠️  WARNING: Using in-memory token blacklist in production!');
      console.warn('   This is NOT suitable for multi-instance deployments.');
      console.warn('   Install and configure Redis for production use.');
    }
  }

  async blacklist(token: string, expiresInSeconds: number): Promise<void> {
    const expiryTime = Date.now() + (expiresInSeconds * 1000);
    this.tokenBlacklist.set(token, expiryTime);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const expiryTime = this.tokenBlacklist.get(token);
    
    if (!expiryTime) {
      return false;
    }

    // Check if expired
    if (Date.now() > expiryTime) {
      this.tokenBlacklist.delete(token);
      return false;
    }

    return true;
  }

  async blacklistUser(userId: string, expiresInSeconds: number): Promise<void> {
    const expiryTime = Date.now() + (expiresInSeconds * 1000);
    this.userBlacklist.set(userId, expiryTime);
  }

  async isUserBlacklisted(userId: string): Promise<boolean> {
    const expiryTime = this.userBlacklist.get(userId);
    
    if (!expiryTime) {
      return false;
    }

    // Check if expired
    if (Date.now() > expiryTime) {
      this.userBlacklist.delete(userId);
      return false;
    }

    return true;
  }

  async clear(): Promise<void> {
    this.tokenBlacklist.clear();
    this.userBlacklist.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    
    // Clean up expired tokens
    for (const [token, expiryTime] of this.tokenBlacklist.entries()) {
      if (now > expiryTime) {
        this.tokenBlacklist.delete(token);
      }
    }

    // Clean up expired user blacklists
    for (const [userId, expiryTime] of this.userBlacklist.entries()) {
      if (now > expiryTime) {
        this.userBlacklist.delete(userId);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }
}

/**
 * Redis Token Blacklist (Production)
 * 
 * NOTE: This implementation requires the 'ioredis' package.
 * Install with: pnpm add ioredis @types/ioredis
 * 
 * Uncomment and configure when Redis is available:
 * 
 * import Redis from 'ioredis';
 * 
 * class RedisTokenBlacklist implements TokenBlacklistService {
 *   private redis: Redis;
 * 
 *   constructor(redisUrl: string) {
 *     this.redis = new Redis(redisUrl);
 *   }
 * 
 *   async blacklist(token: string, expiresInSeconds: number): Promise<void> {
 *     await this.redis.setex(`token:blacklist:${token}`, expiresInSeconds, '1');
 *   }
 * 
 *   async isBlacklisted(token: string): Promise<boolean> {
 *     const result = await this.redis.get(`token:blacklist:${token}`);
 *     return result === '1';
 *   }
 * 
 *   async blacklistUser(userId: string, expiresInSeconds: number): Promise<void> {
 *     await this.redis.setex(`user:blacklist:${userId}`, expiresInSeconds, '1');
 *   }
 * 
 *   async isUserBlacklisted(userId: string): Promise<boolean> {
 *     const result = await this.redis.get(`user:blacklist:${userId}`);
 *     return result === '1';
 *   }
 * 
 *   async clear(): Promise<void> {
 *     const keys = await this.redis.keys('token:blacklist:*');
 *     const userKeys = await this.redis.keys('user:blacklist:*');
 *     if (keys.length > 0) await this.redis.del(...keys);
 *     if (userKeys.length > 0) await this.redis.del(...userKeys);
 *   }
 * 
 *   async disconnect(): Promise<void> {
 *     await this.redis.quit();
 *   }
 * }
 */

/**
 * Global token blacklist instance
 * 
 * To enable Redis support:
 * 1. Install: pnpm add ioredis @types/ioredis
 * 2. Add REDIS_URL to environment variables
 * 3. Uncomment RedisTokenBlacklist class above
 * 4. Replace initialization below with:
 *    export const tokenBlacklist = env.REDIS_URL 
 *      ? new RedisTokenBlacklist(env.REDIS_URL)
 *      : new InMemoryTokenBlacklist();
 */
export const tokenBlacklist: TokenBlacklistService = new InMemoryTokenBlacklist();

/**
 * Parse expiration time from JWT token
 * Returns remaining seconds until expiration
 */
export function getTokenExpirationSeconds(decodedToken: { exp?: number }): number {
  if (!decodedToken.exp) {
    // Default to 1 hour if no expiration
    return 3600;
  }

  const expirationSeconds = decodedToken.exp - Math.floor(Date.now() / 1000);
  return Math.max(expirationSeconds, 0);
}
