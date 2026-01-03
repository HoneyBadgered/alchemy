# HTTP Security Headers Implementation

This document describes the HTTP security headers implementation for The Alchemy Table using `next-secure-headers` for Next.js and `@fastify/helmet` for the Fastify API.

## Overview

Security headers have been implemented across both the frontend (Next.js) and backend (Fastify) to protect against common web vulnerabilities.

## Implementation

### Next.js (Frontend)

**Package**: `next-secure-headers`

**Configuration File**: `apps/web/src/config/security.ts`

**Applied in**: `apps/web/next.config.ts`

### Fastify API (Backend)

**Package**: `@fastify/helmet`

**Configuration File**: `apps/api/src/config/security.ts`

**Applied in**: `apps/api/src/main.ts`

## Security Headers Configured

### 1. Content Security Policy (CSP)

**Purpose**: Prevents XSS attacks by controlling which resources can be loaded.

**Configuration**:
- `default-src 'self'` - Only allow resources from same origin
- `script-src` - Allows scripts from self, Stripe (payment processing), and inline scripts for Next.js
- `style-src` - Allows styles from self and inline styles (required for Tailwind CSS)
- `img-src` - Allows images from self, data URIs, HTTPS, and blob URLs
- `connect-src` - Allows connections to API endpoints and Stripe
- `frame-ancestors 'none'` - Prevents clickjacking

### 2. HTTP Strict Transport Security (HSTS)

**Purpose**: Forces browsers to use HTTPS connections.

**Configuration**:
- Max Age: 2 years (Next.js), 1 year (API)
- Include Subdomains: Yes
- Preload: Yes

### 3. X-Frame-Options

**Purpose**: Prevents clickjacking attacks.

**Configuration**: `DENY` - Page cannot be displayed in a frame

### 4. X-Content-Type-Options

**Purpose**: Prevents MIME sniffing.

**Configuration**: `nosniff`

### 5. X-XSS-Protection

**Purpose**: Legacy XSS filter (for older browsers).

**Configuration**: `1; mode=block`

### 6. Referrer-Policy

**Purpose**: Controls how much referrer information is sent.

**Configuration**: `strict-origin-when-cross-origin`

### 7. Permissions-Policy

**Purpose**: Controls browser features and APIs.

**Configuration**: Disabled camera, microphone, geolocation, and FLoC

### 8. Cross-Origin Policies (API only)

- **Cross-Origin-Opener-Policy**: `same-origin`
- **Cross-Origin-Resource-Policy**: `same-origin`
- **Cross-Origin-Embedder-Policy**: Disabled in development

## Environment-Specific Configuration

### Development
- COEP disabled for better compatibility
- Allows localhost connections
- More permissive CORS policy

### Production
- All security headers fully enforced
- CORS restricted to production domain
- HTTPS enforced via HSTS

## Testing Security Headers

### Using curl

```bash
# Test Next.js headers
curl -I http://localhost:3001

# Test API headers
curl -I http://localhost:3000/health
```

### Using Browser DevTools

1. Open Developer Tools (F12)
2. Navigate to Network tab
3. Refresh the page
4. Click on any request
5. View "Response Headers" section

### Online Tools

- [Security Headers](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

## Customization

### Adding New CSP Sources

Edit `apps/web/src/config/security.ts` or `apps/api/src/config/security.ts`:

```typescript
export const securityConfig = {
  csp: {
    scriptSrc: [
      "'self'",
      "https://trusted-domain.com", // Add new trusted source
    ],
  },
};
```

### Adjusting HSTS Duration

```typescript
hsts: {
  maxAge: 31536000, // Change to desired seconds
  includeSubDomains: true,
  preload: true,
},
```

## Common Issues and Solutions

### Issue: CSP blocking resources

**Solution**: Add the domain to the appropriate CSP directive in `security.ts`

### Issue: Mixed content warnings

**Solution**: Ensure all resources are loaded over HTTPS in production

### Issue: CORS errors

**Solution**: Verify `config.app.url` is correctly set in environment variables

## Security Best Practices

1. **Regular Updates**: Keep `next-secure-headers` and `@fastify/helmet` updated
2. **Monitor CSP Violations**: Implement CSP reporting in production
3. **Test Headers**: Use security header testing tools before deployment
4. **Review Permissions**: Regularly audit CSP and Permissions-Policy
5. **HTTPS Only**: Always use HTTPS in production

## Related Documentation

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [next-secure-headers](https://github.com/jagaapple/next-secure-headers)
- [@fastify/helmet](https://github.com/fastify/fastify-helmet)

## Maintenance

Security headers should be reviewed and updated:
- After adding new third-party services
- When updating major framework versions
- At least quarterly for security best practices
- After security audits or penetration tests
