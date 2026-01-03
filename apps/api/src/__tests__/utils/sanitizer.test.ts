/**
 * Sanitizer Utility Tests
 * Tests for HTML sanitization functions
 */

import {
  sanitizeStrict,
  sanitizeBasic,
  sanitizeMarkdown,
  sanitizeArray,
  escapeHtml,
} from '../../utils/sanitizer';

describe('Sanitizer Utilities', () => {
  describe('sanitizeStrict', () => {
    it('should strip all HTML tags', () => {
      expect(sanitizeStrict('<p>Hello World</p>')).toBe('Hello World');
      expect(sanitizeStrict('<strong>Bold</strong> text')).toBe('Bold text');
      expect(sanitizeStrict('<script>alert("xss")</script>Hello')).toBe('Hello');
    });

    it('should handle XSS attack vectors', () => {
      expect(sanitizeStrict('<img src=x onerror=alert("xss")>')).toBeNull(); // Empty after sanitization
      expect(sanitizeStrict('<script>alert(document.cookie)</script>')).toBeNull();
      // Malformed HTML with quotes - sanitize-html preserves the quote characters
      const result = sanitizeStrict('"><script>alert("xss")</script>');
      expect(result).toBeTruthy(); // Has content (the quotes)
      expect(result).not.toContain('script'); // But no script tag
      expect(sanitizeStrict('<iframe src="javascript:alert(\'xss\')"></iframe>')).toBeNull();
    });

    it('should preserve plain text', () => {
      expect(sanitizeStrict('Plain text')).toBe('Plain text');
      expect(sanitizeStrict('Text with spaces')).toBe('Text with spaces');
      expect(sanitizeStrict('Text with 123 numbers')).toBe('Text with 123 numbers');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeStrict(null)).toBeNull();
      expect(sanitizeStrict(undefined)).toBeNull();
      expect(sanitizeStrict('')).toBeNull();
      expect(sanitizeStrict('   ')).toBeNull();
    });

    it('should trim whitespace', () => {
      expect(sanitizeStrict('  Hello  ')).toBe('Hello');
      expect(sanitizeStrict('   Text   ')).toBe('Text');
    });

    it('should handle special characters', () => {
      expect(sanitizeStrict('Hello &amp; goodbye')).toBe('Hello &amp; goodbye');
      expect(sanitizeStrict('Price: $10.99')).toBe('Price: $10.99');
      expect(sanitizeStrict('Email: test@example.com')).toBe('Email: test@example.com');
    });
  });

  describe('sanitizeBasic', () => {
    it('should allow safe HTML tags', () => {
      expect(sanitizeBasic('<strong>Bold</strong>')).toBe('<strong>Bold</strong>');
      expect(sanitizeBasic('<em>Italic</em>')).toBe('<em>Italic</em>');
      expect(sanitizeBasic('<p>Paragraph</p>')).toBe('<p>Paragraph</p>');
      expect(sanitizeBasic('Line 1<br>Line 2')).toBe('Line 1<br />Line 2');
    });

    it('should strip dangerous tags', () => {
      expect(sanitizeBasic('<script>alert("xss")</script>')).toBeNull();
      expect(sanitizeBasic('<img src=x onerror=alert("xss")>')).toBeNull();
      expect(sanitizeBasic('<iframe>content</iframe>')).toBe('content');
    });

    it('should allow mixed safe and unsafe', () => {
      const input = '<p>Safe</p><script>bad()</script><strong>More safe</strong>';
      const output = sanitizeBasic(input);
      expect(output).toContain('<p>Safe</p>');
      expect(output).toContain('<strong>More safe</strong>');
      expect(output).not.toContain('script');
    });

    it('should strip attributes from allowed tags', () => {
      expect(sanitizeBasic('<p onclick="alert()">Text</p>')).toBe('<p>Text</p>');
      expect(sanitizeBasic('<strong class="danger">Text</strong>')).toBe('<strong>Text</strong>');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeBasic(null)).toBeNull();
      expect(sanitizeBasic(undefined)).toBeNull();
      expect(sanitizeBasic('')).toBeNull();
    });
  });

  describe('sanitizeMarkdown', () => {
    it('should allow markdown-safe HTML', () => {
      expect(sanitizeMarkdown('<h1>Heading</h1>')).toBe('<h1>Heading</h1>');
      expect(sanitizeMarkdown('<p>Paragraph</p>')).toBe('<p>Paragraph</p>');
      expect(sanitizeMarkdown('<ul><li>Item</li></ul>')).toBe('<ul><li>Item</li></ul>');
    });

    it('should allow links with href', () => {
      const input = '<a href="https://example.com">Link</a>';
      const output = sanitizeMarkdown(input);
      expect(output).toContain('href="https://example.com"');
      expect(output).toContain('Link');
    });

    it('should allow images with src and alt', () => {
      const input = '<img src="https://example.com/img.jpg" alt="Description">';
      const output = sanitizeMarkdown(input);
      expect(output).toContain('src="https://example.com/img.jpg"');
      expect(output).toContain('alt="Description"');
    });

    it('should strip dangerous protocols', () => {
      const jsLink = '<a href="javascript:alert()">Bad</a>';
      const output = sanitizeMarkdown(jsLink);
      expect(output).not.toContain('javascript:');
    });

    it('should strip script tags', () => {
      const input = '<h1>Title</h1><script>alert("xss")</script><p>Content</p>';
      const output = sanitizeMarkdown(input);
      expect(output).toContain('<h1>Title</h1>');
      expect(output).toContain('<p>Content</p>');
      expect(output).not.toContain('script');
    });

    it('should handle code blocks', () => {
      expect(sanitizeMarkdown('<code>const x = 1;</code>')).toBe('<code>const x = 1;</code>');
      expect(sanitizeMarkdown('<pre>Code block</pre>')).toBe('<pre>Code block</pre>');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeMarkdown(null)).toBeNull();
      expect(sanitizeMarkdown(undefined)).toBeNull();
      expect(sanitizeMarkdown('')).toBeNull();
    });
  });

  describe('sanitizeArray', () => {
    it('should sanitize all items in array', () => {
      const input = ['<p>One</p>', '<strong>Two</strong>', 'Three'];
      const output = sanitizeArray(input);
      expect(output).toEqual(['One', 'Two', 'Three']);
    });

    it('should filter out empty results', () => {
      const input = ['Valid', '<script></script>', '', '  ', 'Also valid'];
      const output = sanitizeArray(input);
      expect(output).toEqual(['Valid', 'Also valid']);
    });

    it('should handle null and undefined', () => {
      expect(sanitizeArray(null)).toEqual([]);
      expect(sanitizeArray(undefined)).toEqual([]);
      expect(sanitizeArray([])).toEqual([]);
    });

    it('should handle XSS attempts in arrays', () => {
      const input = [
        'tag1',
        '<script>alert("xss")</script>',
        'tag2<img src=x onerror=alert()>',
        'tag3',
      ];
      const output = sanitizeArray(input);
      expect(output).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<p>Hello</p>')).toBe('&lt;p&gt;Hello&lt;/p&gt;');
      expect(escapeHtml('A & B')).toBe('A &amp; B');
      expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
      expect(escapeHtml("'single'")).toBe('&#039;single&#039;');
    });

    it('should escape XSS attempts', () => {
      const input = '<script>alert("xss")</script>';
      const output = escapeHtml(input);
      expect(output).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should preserve safe text', () => {
      expect(escapeHtml('Plain text')).toBe('Plain text');
      expect(escapeHtml('Text with 123')).toBe('Text with 123');
    });
  });

  describe('Edge cases and security', () => {
    it('should handle deeply nested HTML', () => {
      const nested = '<div><div><div><script>alert("xss")</script></div></div></div>';
      expect(sanitizeStrict(nested)).toBeNull();
    });

    it('should handle encoded attacks', () => {
      const encoded = '&lt;script&gt;alert("xss")&lt;/script&gt;';
      // Already encoded content is preserved (safe to display)
      expect(sanitizeStrict(encoded)).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });

    it('should handle unicode and special characters', () => {
      expect(sanitizeStrict('Hello 世界 🌍')).toBe('Hello 世界 🌍');
      expect(sanitizeBasic('<p>Café résumé</p>')).toBe('<p>Café résumé</p>');
    });

    it('should handle very long strings efficiently', () => {
      const longString = 'a'.repeat(10000);
      const result = sanitizeStrict(longString);
      expect(result).toBe(longString);
    });

    it('should handle malformed HTML', () => {
      expect(sanitizeStrict('<p>Unclosed')).toBe('Unclosed');
      expect(sanitizeStrict('<div><p>Nested</div>')).toBe('Nested');
    });
  });
});
