/**
 * CSRF Protection Middleware
 * 
 * Validates CSRF tokens using the dual-token pattern:
 * 1. Token in cookie (XSRF-TOKEN) - readable by JavaScript
 * 2. Token in header (X-CSRF-Token) - set by JavaScript
 * 
 * Both must match and be valid for the request to succeed.
 * 
 * For new guest sessions without tokens, automatically issues a token
 * and returns a 403 with CSRF_TOKEN_REQUIRED to trigger frontend retry.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { validateCsrfToken, getOrCreateCsrfToken } from '../utils/csrf';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
    };
    cookies?: Record<string, string>;
  }
  
  interface FastifyReply {
    cookie(name: string, value: string, options?: any): this;
  }
}

/**
 * HTTP methods that require CSRF protection
 */
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Paths that are exempt from CSRF validation
 * - Authentication endpoints (users don't have tokens yet)
 * - Webhook endpoints (third-party callbacks with signature validation)
 */
const EXEMPT_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/payments/webhook',  // Stripe webhook (validated via signature)
  '/health',
  '/ready',
  '/live',
];

/**
 * Check if a path is exempt from CSRF validation
 */
function isExemptPath(path: string): boolean {
  return EXEMPT_PATHS.some(exemptPath => path.startsWith(exemptPath));
}

/**
 * CSRF validation middleware
 * 
 * Validates that state-changing requests include matching CSRF tokens
 * in both cookie and custom header.
 */
export async function csrfProtection(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const method = request.method;
  const path = request.url;

  // Skip validation for safe methods (GET, HEAD, OPTIONS)
  if (!STATE_CHANGING_METHODS.includes(method)) {
    return;
  }

  // Skip validation for exempt paths
  if (isExemptPath(path)) {
    return;
  }

  // Extract session ID (from user or guest session)
  const sessionId = getSessionId(request);

  if (!sessionId) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'No session found. Please refresh the page.',
      code: 'CSRF_NO_SESSION',
    });
  }

  // Extract CSRF token from header
  const headerToken = request.headers['x-csrf-token'] as string | undefined;

  if (!headerToken) {
    // For new guest sessions, issue a token and instruct client to retry
    const token = getOrCreateCsrfToken(sessionId);
    
    // Set XSRF-TOKEN cookie for JavaScript to read
    reply.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Must be readable by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Use 'lax' for cross-origin local development
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });

    return reply.status(403).send({
      error: 'Forbidden',
      message: 'CSRF token required. Retrying...',
      code: 'CSRF_TOKEN_REQUIRED',
    });
  }

  // Validate token
  const isValid = validateCsrfToken(sessionId, headerToken);

  if (!isValid) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'Invalid CSRF token. Please refresh the page.',
      code: 'CSRF_TOKEN_INVALID',
    });
  }

  // Token is valid, continue to route handler
}

/**
 * Extract session ID from authenticated user or guest session
 */
function getSessionId(request: FastifyRequest): string | null {
  // For authenticated users, use userId as session identifier
  if (request.user?.userId) {
    return request.user.userId;
  }

  // For guest sessions, check session cookie first, then header
  const sessionCookie = request.cookies?.session_id;
  if (sessionCookie) {
    return sessionCookie;
  }

  // Backward compatibility: check x-session-id header
  const sessionHeader = request.headers['x-session-id'] as string | undefined;
  if (sessionHeader) {
    return sessionHeader;
  }

  return null;
}

/**
 * Optional CSRF validation for routes that support both authenticated and guest users
 * If CSRF token is present, validates it. If missing, allows request to proceed.
 * 
 * Use this for routes that have additional security measures (e.g., rate limiting)
 */
export async function optionalCsrfProtection(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const method = request.method;

  // Skip validation for safe methods
  if (!STATE_CHANGING_METHODS.includes(method)) {
    return;
  }

  const sessionId = getSessionId(request);
  const headerToken = request.headers['x-csrf-token'] as string | undefined;

  // If both session and token present, validate them
  if (sessionId && headerToken) {
    const isValid = validateCsrfToken(sessionId, headerToken);
    
    if (!isValid) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Invalid CSRF token. Please refresh the page.',
        code: 'CSRF_TOKEN_INVALID',
      });
    }
  }

  // If token missing but session exists, log warning but allow
  // (useful during migration period)
  if (sessionId && !headerToken) {
    request.log.warn({
      sessionId,
      path: request.url,
      method: request.method,
    }, 'CSRF token missing for state-changing request');
  }

  // Continue to route handler
}

/**
 * Get session ID from request (helper for route handlers)
 */
export function getSessionIdFromRequest(request: FastifyRequest): string | null {
  return getSessionId(request);
}
