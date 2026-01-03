/**
 * Authentication Middleware
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../utils/jwt';
import { tokenBlacklist } from '../services/token-blacklist.service';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
    };
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({ message: 'No authorization header' });
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return reply.status(401).send({ message: 'Invalid authorization format' });
    }

    // Verify token signature and expiration
    const payload = verifyAccessToken(token);

    // Check if token is blacklisted
    const isBlacklisted = await tokenBlacklist.isBlacklisted(token);
    if (isBlacklisted) {
      return reply.status(401).send({ message: 'Token has been revoked' });
    }

    // Check if user has been force-logged out
    const isUserBlacklisted = await tokenBlacklist.isUserBlacklisted(payload.userId);
    if (isUserBlacklisted) {
      return reply.status(401).send({ message: 'Session has been terminated' });
    }

    request.user = payload;
  } catch (error) {
    return reply.status(401).send({ message: 'Invalid or expired token' });
  }
}

/**
 * Optional Authentication Middleware
 * Decodes the JWT token if present but doesn't reject if missing or invalid.
 * Use this for routes that support both authenticated users and guests.
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return; // No token provided, continue as guest
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return; // Invalid format, continue as guest
    }

    // Verify token signature and expiration
    const payload = verifyAccessToken(token);

    // Check blacklist (silently fail for optional auth)
    const isBlacklisted = await tokenBlacklist.isBlacklisted(token);
    if (isBlacklisted) {
      return; // Token revoked, continue as guest
    }

    const isUserBlacklisted = await tokenBlacklist.isUserBlacklisted(payload.userId);
    if (isUserBlacklisted) {
      return; // User logged out, continue as guest
    }

    request.user = payload;
  } catch {
    // Invalid token, continue as guest
    // Do not set request.user, allowing fallback to sessionId
  }
}

