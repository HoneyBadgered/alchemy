/**
 * JWT Key Management with Versioning Support
 * 
 * Enables zero-downtime secret rotation by supporting multiple active keys simultaneously.
 * Each JWT includes a 'kid' (Key ID) header to identify which secret was used for signing.
 */

import jwt, { SignOptions, VerifyOptions, JwtPayload as JwtLibPayload } from 'jsonwebtoken';
import crypto from 'crypto';

export interface JwtSecret {
  version: number;
  secret: string;
  createdAt: Date;
}

export interface JwtKeyManagerConfig {
  accessSecrets: JwtSecret[];
  refreshSecrets: JwtSecret[];
  currentAccessVersion: number;
  currentRefreshVersion: number;
}

export class JwtKeyManager {
  private accessSecrets: Map<number, JwtSecret>;
  private refreshSecrets: Map<number, JwtSecret>;
  private currentAccessVersion: number;
  private currentRefreshVersion: number;

  constructor(config: JwtKeyManagerConfig) {
    this.accessSecrets = new Map(config.accessSecrets.map(s => [s.version, s]));
    this.refreshSecrets = new Map(config.refreshSecrets.map(s => [s.version, s]));
    this.currentAccessVersion = config.currentAccessVersion;
    this.currentRefreshVersion = config.currentRefreshVersion;

    this.validate();
  }

  /**
   * Validate configuration
   */
  private validate(): void {
    if (this.accessSecrets.size === 0) {
      throw new Error('At least one access token secret must be configured');
    }
    if (this.refreshSecrets.size === 0) {
      throw new Error('At least one refresh token secret must be configured');
    }
    if (!this.accessSecrets.has(this.currentAccessVersion)) {
      throw new Error(`Current access token version ${this.currentAccessVersion} not found in secrets`);
    }
    if (!this.refreshSecrets.has(this.currentRefreshVersion)) {
      throw new Error(`Current refresh token version ${this.currentRefreshVersion} not found in secrets`);
    }

    // Warn if too many versions active (indicates stale keys not cleaned up)
    if (this.accessSecrets.size > 2) {
      console.warn(`⚠️  Warning: ${this.accessSecrets.size} access token versions active. Consider removing old versions.`);
    }
    if (this.refreshSecrets.size > 2) {
      console.warn(`⚠️  Warning: ${this.refreshSecrets.size} refresh token versions active. Consider removing old versions.`);
    }
  }

  /**
   * Sign an access token with the current version
   */
  signAccessToken(payload: object, options?: SignOptions): string {
    const secret = this.accessSecrets.get(this.currentAccessVersion);
    if (!secret) {
      throw new Error('Current access token secret not found');
    }

    return jwt.sign(payload, secret.secret, {
      ...options,
      header: {
        alg: 'HS256',
        ...options?.header,
        kid: `access-v${this.currentAccessVersion}`,
      },
    });
  }

  /**
   * Sign a refresh token with the current version
   */
  signRefreshToken(payload: object, options?: SignOptions): string {
    const secret = this.refreshSecrets.get(this.currentRefreshVersion);
    if (!secret) {
      throw new Error('Current refresh token secret not found');
    }

    return jwt.sign(payload, secret.secret, {
      ...options,
      header: {
        alg: 'HS256',
        ...options?.header,
        kid: `refresh-v${this.currentRefreshVersion}`,
      },
    });
  }

  /**
   * Verify an access token, attempting all known versions if kid is missing
   */
  verifyAccessToken<T = JwtLibPayload>(token: string, options?: VerifyOptions): T {
    // Decode header to get kid (Key ID)
    const decoded = jwt.decode(token, { complete: true });
    
    if (decoded && typeof decoded === 'object' && decoded.header.kid) {
      // Kid present - use specific version
      const versionMatch = decoded.header.kid.match(/^access-v(\d+)$/);
      if (versionMatch) {
        const version = parseInt(versionMatch[1], 10);
        const secret = this.accessSecrets.get(version);
        
        if (!secret) {
          throw new Error(`Access token signed with unknown version ${version}`);
        }

        return jwt.verify(token, secret.secret, options) as T;
      }
    }

    // No kid or invalid format - try all known secrets (backward compatibility)
    const errors: Error[] = [];
    
    for (const secret of this.accessSecrets.values()) {
      try {
        return jwt.verify(token, secret.secret, options) as T;
      } catch (error) {
        errors.push(error as Error);
      }
    }

    // All attempts failed
    throw new Error(`Access token verification failed with all known versions: ${errors[0]?.message || 'Unknown error'}`);
  }

  /**
   * Verify a refresh token, attempting all known versions if kid is missing
   */
  verifyRefreshToken<T = JwtLibPayload>(token: string, options?: VerifyOptions): T {
    // Decode header to get kid (Key ID)
    const decoded = jwt.decode(token, { complete: true });
    
    if (decoded && typeof decoded === 'object' && decoded.header.kid) {
      // Kid present - use specific version
      const versionMatch = decoded.header.kid.match(/^refresh-v(\d+)$/);
      if (versionMatch) {
        const version = parseInt(versionMatch[1], 10);
        const secret = this.refreshSecrets.get(version);
        
        if (!secret) {
          throw new Error(`Refresh token signed with unknown version ${version}`);
        }

        return jwt.verify(token, secret.secret, options) as T;
      }
    }

    // No kid or invalid format - try all known secrets (backward compatibility)
    const errors: Error[] = [];
    
    for (const secret of this.refreshSecrets.values()) {
      try {
        return jwt.verify(token, secret.secret, options) as T;
      } catch (error) {
        errors.push(error as Error);
      }
    }

    // All attempts failed
    throw new Error(`Refresh token verification failed with all known versions: ${errors[0]?.message || 'Unknown error'}`);
  }

  /**
   * Get all active access token versions
   */
  getActiveAccessVersions(): number[] {
    return Array.from(this.accessSecrets.keys()).sort((a, b) => b - a);
  }

  /**
   * Get all active refresh token versions
   */
  getActiveRefreshVersions(): number[] {
    return Array.from(this.refreshSecrets.keys()).sort((a, b) => b - a);
  }

  /**
   * Get current version info
   */
  getCurrentVersions(): { access: number; refresh: number } {
    return {
      access: this.currentAccessVersion,
      refresh: this.currentRefreshVersion,
    };
  }

  /**
   * Check if a specific version exists
   */
  hasAccessVersion(version: number): boolean {
    return this.accessSecrets.has(version);
  }

  /**
   * Check if a specific version exists
   */
  hasRefreshVersion(version: number): boolean {
    return this.refreshSecrets.has(version);
  }
}

/**
 * Generate a secure random secret suitable for JWT signing
 */
export function generateJwtSecret(): string {
  return crypto.randomBytes(64).toString('base64');
}

/**
 * Parse JWT secrets from environment variables
 * Expected format: JWT_ACCESS_SECRET_V1, JWT_ACCESS_SECRET_V2, etc.
 */
export function parseJwtSecretsFromEnv(
  accessSecretEnvVars: Record<string, string>,
  refreshSecretEnvVars: Record<string, string>,
  currentAccessVersion: number,
  currentRefreshVersion: number
): JwtKeyManagerConfig {
  const accessSecrets: JwtSecret[] = [];
  const refreshSecrets: JwtSecret[] = [];

  // Parse access secrets
  for (const [key, value] of Object.entries(accessSecretEnvVars)) {
    const match = key.match(/^JWT_ACCESS_SECRET_V(\d+)$/);
    if (match) {
      const version = parseInt(match[1], 10);
      accessSecrets.push({
        version,
        secret: value,
        createdAt: new Date(), // In production, this would be loaded from a config store
      });
    }
  }

  // Parse refresh secrets
  for (const [key, value] of Object.entries(refreshSecretEnvVars)) {
    const match = key.match(/^JWT_REFRESH_SECRET_V(\d+)$/);
    if (match) {
      const version = parseInt(match[1], 10);
      refreshSecrets.push({
        version,
        secret: value,
        createdAt: new Date(),
      });
    }
  }

  // Fallback to legacy environment variables if no versioned secrets found
  if (accessSecrets.length === 0 && accessSecretEnvVars['JWT_SECRET']) {
    console.warn('⚠️  Using legacy JWT_SECRET. Migrate to JWT_ACCESS_SECRET_V1 for rotation support.');
    accessSecrets.push({
      version: 1,
      secret: accessSecretEnvVars['JWT_SECRET'],
      createdAt: new Date(),
    });
  }

  if (refreshSecrets.length === 0 && refreshSecretEnvVars['JWT_REFRESH_SECRET']) {
    console.warn('⚠️  Using legacy JWT_REFRESH_SECRET. Migrate to JWT_REFRESH_SECRET_V1 for rotation support.');
    refreshSecrets.push({
      version: 1,
      secret: refreshSecretEnvVars['JWT_REFRESH_SECRET'],
      createdAt: new Date(),
    });
  }

  return {
    accessSecrets,
    refreshSecrets,
    currentAccessVersion,
    currentRefreshVersion,
  };
}
