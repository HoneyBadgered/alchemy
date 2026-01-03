/**
 * Token Blacklist Service Tests
 */

import { tokenBlacklist, getTokenExpirationSeconds } from '../../services/token-blacklist.service';

describe('TokenBlacklistService', () => {
  beforeEach(async () => {
    // Clear blacklist before each test
    await tokenBlacklist.clear();
  });

  describe('blacklist', () => {
    it('should blacklist a token', async () => {
      const token = 'test-token-123';
      
      await tokenBlacklist.blacklist(token, 3600);
      const isBlacklisted = await tokenBlacklist.isBlacklisted(token);
      
      expect(isBlacklisted).toBe(true);
    });

    it('should not blacklist different token', async () => {
      const token1 = 'test-token-123';
      const token2 = 'test-token-456';
      
      await tokenBlacklist.blacklist(token1, 3600);
      const isToken1Blacklisted = await tokenBlacklist.isBlacklisted(token1);
      const isToken2Blacklisted = await tokenBlacklist.isBlacklisted(token2);
      
      expect(isToken1Blacklisted).toBe(true);
      expect(isToken2Blacklisted).toBe(false);
    });

    it('should expire blacklisted token after TTL', async () => {
      const token = 'test-token-123';
      
      // Blacklist with 1 second TTL
      await tokenBlacklist.blacklist(token, 1);
      
      // Should be blacklisted immediately
      expect(await tokenBlacklist.isBlacklisted(token)).toBe(true);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should no longer be blacklisted
      expect(await tokenBlacklist.isBlacklisted(token)).toBe(false);
    });
  });

  describe('blacklistUser', () => {
    it('should blacklist all tokens for a user', async () => {
      const userId = 'user-123';
      
      await tokenBlacklist.blacklistUser(userId, 3600);
      const isBlacklisted = await tokenBlacklist.isUserBlacklisted(userId);
      
      expect(isBlacklisted).toBe(true);
    });

    it('should not blacklist different user', async () => {
      const userId1 = 'user-123';
      const userId2 = 'user-456';
      
      await tokenBlacklist.blacklistUser(userId1, 3600);
      const isUser1Blacklisted = await tokenBlacklist.isUserBlacklisted(userId1);
      const isUser2Blacklisted = await tokenBlacklist.isUserBlacklisted(userId2);
      
      expect(isUser1Blacklisted).toBe(true);
      expect(isUser2Blacklisted).toBe(false);
    });

    it('should expire user blacklist after TTL', async () => {
      const userId = 'user-123';
      
      // Blacklist with 1 second TTL
      await tokenBlacklist.blacklistUser(userId, 1);
      
      // Should be blacklisted immediately
      expect(await tokenBlacklist.isUserBlacklisted(userId)).toBe(true);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should no longer be blacklisted
      expect(await tokenBlacklist.isUserBlacklisted(userId)).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all blacklisted tokens', async () => {
      const token1 = 'test-token-123';
      const token2 = 'test-token-456';
      const userId = 'user-123';
      
      await tokenBlacklist.blacklist(token1, 3600);
      await tokenBlacklist.blacklist(token2, 3600);
      await tokenBlacklist.blacklistUser(userId, 3600);
      
      // Verify all are blacklisted
      expect(await tokenBlacklist.isBlacklisted(token1)).toBe(true);
      expect(await tokenBlacklist.isBlacklisted(token2)).toBe(true);
      expect(await tokenBlacklist.isUserBlacklisted(userId)).toBe(true);
      
      // Clear all
      await tokenBlacklist.clear();
      
      // Verify all are cleared
      expect(await tokenBlacklist.isBlacklisted(token1)).toBe(false);
      expect(await tokenBlacklist.isBlacklisted(token2)).toBe(false);
      expect(await tokenBlacklist.isUserBlacklisted(userId)).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle logout scenario', async () => {
      const accessToken = 'access-token-abc';
      
      // Blacklist access token on logout
      await tokenBlacklist.blacklist(accessToken, 3600);
      
      // Token should be rejected
      expect(await tokenBlacklist.isBlacklisted(accessToken)).toBe(true);
      
      // Other tokens should still work
      expect(await tokenBlacklist.isBlacklisted('other-token')).toBe(false);
    });

    it('should handle logout-all scenario', async () => {
      const userId = 'user-123';
      
      // User has multiple active tokens
      // When logout-all is called, blacklist the user
      await tokenBlacklist.blacklistUser(userId, 3600);
      
      // All tokens for this user should be rejected
      expect(await tokenBlacklist.isUserBlacklisted(userId)).toBe(true);
      
      // Other users should not be affected
      expect(await tokenBlacklist.isUserBlacklisted('other-user')).toBe(false);
    });

    it('should handle multiple concurrent blacklists', async () => {
      const tokens = Array.from({ length: 10 }, (_, i) => `token-${i}`);
      
      // Blacklist multiple tokens concurrently
      await Promise.all(
        tokens.map(token => tokenBlacklist.blacklist(token, 3600))
      );
      
      // All should be blacklisted
      const results = await Promise.all(
        tokens.map(token => tokenBlacklist.isBlacklisted(token))
      );
      
      expect(results.every(r => r === true)).toBe(true);
    });
  });
});

describe('getTokenExpirationSeconds', () => {
  it('should calculate remaining seconds from exp claim', () => {
    const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const decodedToken = { exp: futureTime };
    
    const seconds = getTokenExpirationSeconds(decodedToken);
    
    expect(seconds).toBeGreaterThan(3590); // ~1 hour (allowing for test execution time)
    expect(seconds).toBeLessThanOrEqual(3600);
  });

  it('should return 0 for expired token', () => {
    const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const decodedToken = { exp: pastTime };
    
    const seconds = getTokenExpirationSeconds(decodedToken);
    
    expect(seconds).toBe(0);
  });

  it('should return default 3600 if no exp claim', () => {
    const decodedToken = {};
    
    const seconds = getTokenExpirationSeconds(decodedToken);
    
    expect(seconds).toBe(3600);
  });
});
