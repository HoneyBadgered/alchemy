/**
 * JWT Authentication Utilities
 */

import { SignOptions } from 'jsonwebtoken';
import { config, jwtKeyManager } from '../config';

export interface JwtPayload {
  userId: string;
  email: string;
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwtKeyManager.signAccessToken(payload, {
    expiresIn: config.jwt.expiresIn,
  } as SignOptions);
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwtKeyManager.signRefreshToken(payload, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwtKeyManager.verifyAccessToken<JwtPayload>(token);
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwtKeyManager.verifyRefreshToken<JwtPayload>(token);
}

