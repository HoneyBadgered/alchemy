/**
 * Input Sanitization Utilities
 * 
 * Centralized HTML sanitization to prevent XSS attacks across user-generated content.
 * Uses sanitize-html library with predefined security profiles.
 */

import sanitizeHtml from 'sanitize-html';

/**
 * Strict Configuration - Plain text only
 * Use for: reviews, usernames, blend names, short text fields
 */
export const strictConfig: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

/**
 * Basic Configuration - Allow basic formatting
 * Use for: descriptions, notes, user bios, address labels
 */
export const basicConfig: sanitizeHtml.IOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'br', 'p'],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

/**
 * Markdown Configuration - For blog content
 * Use for: blog posts, articles, long-form content
 */
export const markdownConfig: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'ul', 'ol', 'li',
    'strong', 'em', 'code', 'pre',
    'blockquote', 'a', 'img',
  ],
  allowedAttributes: {
    'a': ['href', 'title'],
    'img': ['src', 'alt', 'title'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  disallowedTagsMode: 'discard',
};

/**
 * Sanitize input with strict config (plain text only)
 * Strips all HTML tags and returns trimmed string or null
 */
export function sanitizeStrict(input: string | null | undefined): string | null {
  if (!input) return null;
  const sanitized = sanitizeHtml(input, strictConfig).trim();
  return sanitized || null;
}

/**
 * Sanitize input with basic config (allows basic formatting)
 * Allows safe HTML tags like <strong>, <em>, <p>, <br>
 */
export function sanitizeBasic(input: string | null | undefined): string | null {
  if (!input) return null;
  const sanitized = sanitizeHtml(input, basicConfig).trim();
  return sanitized || null;
}

/**
 * Sanitize markdown content
 * Allows heading, paragraph, list, link, and image tags with restricted attributes
 */
export function sanitizeMarkdown(input: string | null | undefined): string | null {
  if (!input) return null;
  const sanitized = sanitizeHtml(input, markdownConfig).trim();
  return sanitized || null;
}

/**
 * Sanitize array of strings (strict)
 */
export function sanitizeArray(input: string[] | null | undefined): string[] {
  if (!input || !Array.isArray(input)) return [];
  return input
    .map(item => sanitizeStrict(item))
    .filter((item): item is string => item !== null && item.length > 0);
}

/**
 * Escape HTML for display (alternative to sanitization)
 * Use when you need to display user input as-is but safely
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
