/**
 * JWT Key Manager Tests
 * 
 * Tests for JWT secret rotation and multi-version verification
 */

import { JwtKeyManager, generateJwtSecret, parseJwtSecretsFromEnv } from '../../utils/jwt-keys';
import jwt from 'jsonwebtoken';

describe('JwtKeyManager', () => {
  describe('constructor and validation', () => {
    it('should create instance with valid configuration', () => {
      const manager = new JwtKeyManager({
        accessSecrets: [
          { version: 1, secret: 'access-secret-1', createdAt: new Date() },
        ],
        refreshSecrets: [
          { version: 1, secret: 'refresh-secret-1', createdAt: new Date() },
        ],
        currentAccessVersion: 1,
        currentRefreshVersion: 1,
      });

      expect(manager).toBeDefined();
      expect(manager.getCurrentVersions()).toEqual({ access: 1, refresh: 1 });
    });

    it('should throw error if no access secrets configured', () => {
      expect(() => {
        new JwtKeyManager({
          accessSecrets: [],
          refreshSecrets: [{ version: 1, secret: 'refresh-secret-1', createdAt: new Date() }],
          currentAccessVersion: 1,
          currentRefreshVersion: 1,
        });
      }).toThrow('At least one access token secret must be configured');
    });

    it('should throw error if no refresh secrets configured', () => {
      expect(() => {
        new JwtKeyManager({
          accessSecrets: [{ version: 1, secret: 'access-secret-1', createdAt: new Date() }],
          refreshSecrets: [],
          currentAccessVersion: 1,
          currentRefreshVersion: 1,
        });
      }).toThrow('At least one refresh token secret must be configured');
    });

    it('should throw error if current version not found in secrets', () => {
      expect(() => {
        new JwtKeyManager({
          accessSecrets: [{ version: 1, secret: 'access-secret-1', createdAt: new Date() }],
          refreshSecrets: [{ version: 1, secret: 'refresh-secret-1', createdAt: new Date() }],
          currentAccessVersion: 2,
          currentRefreshVersion: 1,
        });
      }).toThrow('Current access token version 2 not found in secrets');
    });

    it('should warn if too many versions active', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      new JwtKeyManager({
        accessSecrets: [
          { version: 1, secret: 'access-secret-1', createdAt: new Date() },
          { version: 2, secret: 'access-secret-2', createdAt: new Date() },
          { version: 3, secret: 'access-secret-3', createdAt: new Date() },
        ],
        refreshSecrets: [{ version: 1, secret: 'refresh-secret-1', createdAt: new Date() }],
        currentAccessVersion: 3,
        currentRefreshVersion: 1,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('3 access token versions active')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('signAccessToken', () => {
    it('should sign token with current version', () => {
      const manager = new JwtKeyManager({
        accessSecrets: [
          { version: 1, secret: 'access-secret-1', createdAt: new Date() },
        ],
        refreshSecrets: [{ version: 1, secret: 'refresh-secret-1', createdAt: new Date() }],
        currentAccessVersion: 1,
        currentRefreshVersion: 1,
      });

      const token = manager.signAccessToken({ userId: '123', email: 'test@example.com' });
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded).toBeDefined();
      expect(decoded?.header.kid).toBe('access-v1');
    });

    it('should include custom options', () => {
      const manager = new JwtKeyManager({
        accessSecrets: [{ version: 1, secret: 'access-secret-1', createdAt: new Date() }],
        refreshSecrets: [{ version: 1, secret: 'refresh-secret-1', createdAt: new Date() }],
        currentAccessVersion: 1,
        currentRefreshVersion: 1,
      });

      const token = manager.signAccessToken(
        { userId: '123', email: 'test@example.com' },
        { expiresIn: '1h' }
      );

      const decoded = jwt.decode(token) as { exp?: number; iat?: number };
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp! - decoded.iat!).toBe(3600); // 1 hour in seconds
    });
  });

  describe('signRefreshToken', () => {
    it('should sign token with current version', () => {
      const manager = new JwtKeyManager({
        accessSecrets: [{ version: 1, secret: 'access-secret-1', createdAt: new Date() }],
        refreshSecrets: [{ version: 1, secret: 'refresh-secret-1', createdAt: new Date() }],
        currentAccessVersion: 1,
        currentRefreshVersion: 1,
      });

      const token = manager.signRefreshToken({ userId: '123', email: 'test@example.com' });
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded).toBeDefined();
      expect(decoded?.header.kid).toBe('refresh-v1');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify token signed with current version', () => {
      const manager = new JwtKeyManager({
        accessSecrets: [{ version: 1, secret: 'access-secret-1', createdAt: new Date() }],
        refreshSecrets: [{ version: 1, secret: 'refresh-secret-1', createdAt: new Date() }],
        currentAccessVersion: 1,
        currentRefreshVersion: 1,
      });

      const token = manager.signAccessToken({ userId: '123', email: 'test@example.com' });
      const payload = manager.verifyAccessToken<{ userId: string; email: string }>(token);

      expect(payload.userId).toBe('123');
      expect(payload.email).toBe('test@example.com');
    });

    it('should verify token signed with previous version', () => {
      const manager = new JwtKeyManager({
        accessSecrets: [
          { version: 1, secret: 'access-secret-1', createdAt: new Date() },
          { version: 2, secret: 'access-secret-2', createdAt: new Date() },
        ],
        refreshSecrets: [{ version: 1, secret: 'refresh-secret-1', createdAt: new Date() }],
        currentAccessVersion: 2,
        currentRefreshVersion: 1,
      });

      // Create token with version 1 secret
      const oldToken = jwt.sign(
        { userId: '123', email: 'test@example.com' },
        'access-secret-1',
        { header: { kid: 'access-v1', alg: 'HS256' } }
      );

      const payload = manager.verifyAccessToken<{ userId: string; email: string }>(oldToken);
      expect(payload.userId).toBe('123');
    });

    it('should verify legacy token without kid (backward compatibility)', () => {
      const manager = new JwtKeyManager({
        accessSecrets: [{ version: 1, secret: 'access-secret-1', createdAt: new Date() }],
        refreshSecrets: [{ version: 1, secret: 'refresh-secret-1', createdAt: new Date() }],
        currentAccessVersion: 1,
        currentRefreshVersion: 1,
      });

      // Create legacy token without kid header
      const legacyToken = jwt.sign(
        { userId: '123', email: 'test@example.com' },
        'access-secret-1'
      );

      const payload = manager.verifyAccessToken<{ userId: string; email: string }>(legacyToken);
      expect(payload.userId).toBe('123');
    });

    it('should throw error for token with unknown version', () => {
      const manager = new JwtKeyManager({
        accessSecrets: [{ version: 2, secret: 'access-secret-2', createdAt: new Date() }],
        refreshSecrets: [{ version: 1, secret: 'refresh-secret-1', createdAt: new Date() }],
        currentAccessVersion: 2,
        currentRefreshVersion: 1,
      });

      const tokenWithOldVersion = jwt.sign(
        { userId: '123', email: 'test@example.com' },
        'access-secret-1',
        { header: { kid: 'access-v1', alg: 'HS256' } }
      );

      expect(() => {
        manager.verifyAccessToken(tokenWithOldVersion);
      }).toThrow('Access token signed with unknown version 1');
    });

    it('should throw error for invalid token', () => {
      const manager = new JwtKeyManager({
        accessSecrets: [{ version: 1, secret: 'access-secret-1', createdAt: new Date() }],
        refreshSecrets: [{ version: 1, secret: 'refresh-secret-1', createdAt: new Date() }],
        currentAccessVersion: 1,
        currentRefreshVersion: 1,
      });

      expect(() => {
        manager.verifyAccessToken('invalid-token');
      }).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify token signed with current version', () => {
      const manager = new JwtKeyManager({
        accessSecrets: [{ version: 1, secret: 'access-secret-1', createdAt: new Date() }],
        refreshSecrets: [{ version: 1, secret: 'refresh-secret-1', createdAt: new Date() }],
        currentAccessVersion: 1,
        currentRefreshVersion: 1,
      });

      const token = manager.signRefreshToken({ userId: '123', email: 'test@example.com' });
      const payload = manager.verifyRefreshToken<{ userId: string; email: string }>(token);

      expect(payload.userId).toBe('123');
      expect(payload.email).toBe('test@example.com');
    });

    it('should verify token signed with previous version', () => {
      const manager = new JwtKeyManager({
        accessSecrets: [{ version: 1, secret: 'access-secret-1', createdAt: new Date() }],
        refreshSecrets: [
          { version: 1, secret: 'refresh-secret-1', createdAt: new Date() },
          { version: 2, secret: 'refresh-secret-2', createdAt: new Date() },
        ],
        currentAccessVersion: 1,
        currentRefreshVersion: 2,
      });

      const oldToken = jwt.sign(
        { userId: '123', email: 'test@example.com' },
        'refresh-secret-1',
        { header: { kid: 'refresh-v1', alg: 'HS256' } }
      );

      const payload = manager.verifyRefreshToken<{ userId: string; email: string }>(oldToken);
      expect(payload.userId).toBe('123');
    });
  });

  describe('version queries', () => {
    it('should return active access versions', () => {
      const manager = new JwtKeyManager({
        accessSecrets: [
          { version: 1, secret: 'access-secret-1', createdAt: new Date() },
          { version: 2, secret: 'access-secret-2', createdAt: new Date() },
        ],
        refreshSecrets: [{ version: 1, secret: 'refresh-secret-1', createdAt: new Date() }],
        currentAccessVersion: 2,
        currentRefreshVersion: 1,
      });

      const versions = manager.getActiveAccessVersions();
      expect(versions).toEqual([2, 1]); // Sorted descending
    });

    it('should return active refresh versions', () => {
      const manager = new JwtKeyManager({
        accessSecrets: [{ version: 1, secret: 'access-secret-1', createdAt: new Date() }],
        refreshSecrets: [
          { version: 1, secret: 'refresh-secret-1', createdAt: new Date() },
          { version: 2, secret: 'refresh-secret-2', createdAt: new Date() },
        ],
        currentAccessVersion: 1,
        currentRefreshVersion: 2,
      });

      const versions = manager.getActiveRefreshVersions();
      expect(versions).toEqual([2, 1]);
    });

    it('should check if version exists', () => {
      const manager = new JwtKeyManager({
        accessSecrets: [{ version: 1, secret: 'access-secret-1', createdAt: new Date() }],
        refreshSecrets: [{ version: 1, secret: 'refresh-secret-1', createdAt: new Date() }],
        currentAccessVersion: 1,
        currentRefreshVersion: 1,
      });

      expect(manager.hasAccessVersion(1)).toBe(true);
      expect(manager.hasAccessVersion(2)).toBe(false);
      expect(manager.hasRefreshVersion(1)).toBe(true);
      expect(manager.hasRefreshVersion(2)).toBe(false);
    });
  });
});

describe('generateJwtSecret', () => {
  it('should generate a valid base64 secret', () => {
    const secret = generateJwtSecret();
    expect(secret).toBeTruthy();
    expect(secret.length).toBeGreaterThan(0);
    
    // Should be valid base64
    const decoded = Buffer.from(secret, 'base64');
    expect(decoded.length).toBe(64); // 64 bytes
  });

  it('should generate unique secrets', () => {
    const secret1 = generateJwtSecret();
    const secret2 = generateJwtSecret();
    expect(secret1).not.toBe(secret2);
  });
});

describe('parseJwtSecretsFromEnv', () => {
  it('should parse versioned access secrets', () => {
    const config = parseJwtSecretsFromEnv(
      {
        JWT_ACCESS_SECRET_V1: 'access-v1-secret',
        JWT_ACCESS_SECRET_V2: 'access-v2-secret',
      },
      {
        JWT_REFRESH_SECRET_V1: 'refresh-v1-secret',
      },
      2,
      1
    );

    expect(config.accessSecrets).toHaveLength(2);
    expect(config.accessSecrets[0].version).toBe(1);
    expect(config.accessSecrets[0].secret).toBe('access-v1-secret');
    expect(config.accessSecrets[1].version).toBe(2);
    expect(config.currentAccessVersion).toBe(2);
  });

  it('should parse versioned refresh secrets', () => {
    const config = parseJwtSecretsFromEnv(
      {
        JWT_ACCESS_SECRET_V1: 'access-v1-secret',
      },
      {
        JWT_REFRESH_SECRET_V1: 'refresh-v1-secret',
        JWT_REFRESH_SECRET_V2: 'refresh-v2-secret',
      },
      1,
      2
    );

    expect(config.refreshSecrets).toHaveLength(2);
    expect(config.refreshSecrets[0].version).toBe(1);
    expect(config.refreshSecrets[1].version).toBe(2);
    expect(config.currentRefreshVersion).toBe(2);
  });

  it('should fallback to legacy JWT_SECRET', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const config = parseJwtSecretsFromEnv(
      {
        JWT_SECRET: 'legacy-access-secret',
      },
      {
        JWT_REFRESH_SECRET: 'legacy-refresh-secret',
      },
      1,
      1
    );

    expect(config.accessSecrets).toHaveLength(1);
    expect(config.accessSecrets[0].version).toBe(1);
    expect(config.accessSecrets[0].secret).toBe('legacy-access-secret');
    expect(config.refreshSecrets).toHaveLength(1);
    expect(config.refreshSecrets[0].secret).toBe('legacy-refresh-secret');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Using legacy JWT_SECRET')
    );

    consoleSpy.mockRestore();
  });

  it('should ignore non-versioned environment variables', () => {
    const config = parseJwtSecretsFromEnv(
      {
        JWT_ACCESS_SECRET_V1: 'access-v1-secret',
        SOME_OTHER_VAR: 'ignore-me',
        JWT_UNRELATED: 'also-ignore',
      },
      {
        JWT_REFRESH_SECRET_V1: 'refresh-v1-secret',
      },
      1,
      1
    );

    expect(config.accessSecrets).toHaveLength(1);
    expect(config.refreshSecrets).toHaveLength(1);
  });
});
