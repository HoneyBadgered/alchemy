/**
 * Authentication Middleware
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../utils/jwt';

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

    const payload = verifyAccessToken(token);
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

    const payload = verifyAccessToken(token);
    request.user = payload;
  } catch {
    // Invalid token, continue as guest
    // Do not set request.user, allowing fallback to sessionId
  }
}
