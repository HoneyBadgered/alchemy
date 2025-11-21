/**
 * Session Utilities
 */

/**
 * Validate session ID format (UUID v4)
 */
export function isValidSessionId(sessionId: string): boolean {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(sessionId);
}

/**
 * Sanitize session ID
 */
export function sanitizeSessionId(sessionId: string): string {
  // Remove any non-alphanumeric characters except hyphens
  return sessionId.replace(/[^a-zA-Z0-9-]/g, '');
}
