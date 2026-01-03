# JWT Secret Rotation & Validation

Comprehensive guide for managing JWT secret rotation with zero-downtime migration and immediate token revocation capabilities.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Environment Configuration](#environment-configuration)
- [Secret Rotation Procedure](#secret-rotation-procedure)
- [Emergency Rotation](#emergency-rotation)
- [Token Blacklist](#token-blacklist)
- [CLI Tools](#cli-tools)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

The JWT authentication system supports:

- **Zero-downtime secret rotation** - Multiple secrets active simultaneously during migration
- **Version-aware tokens** - Each JWT includes a `kid` (Key ID) header identifying which secret was used
- **Backward compatibility** - Legacy tokens without `kid` headers are still verified
- **Immediate token revocation** - Access token blacklist for logout functionality
- **Multi-device logout** - Force logout all sessions for a user

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    JWT Key Manager                          │
│                                                             │
│  Access Secrets:           Refresh Secrets:                │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │ v1 (legacy)      │      │ v1 (legacy)      │           │
│  │ v2 (current) ✓   │      │ v2 (current) ✓   │           │
│  └──────────────────┘      └──────────────────┘           │
│                                                             │
│  Token Signing:                                            │
│  - Always uses CURRENT version                             │
│  - Includes kid header (e.g., "access-v2")                │
│                                                             │
│  Token Verification:                                       │
│  - Checks kid header first                                 │
│  - Falls back to all known secrets (backward compat)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Token Blacklist                           │
│                                                             │
│  In-Memory (Development):                                  │
│  - Single-instance only                                    │
│  - Automatic cleanup                                       │
│                                                             │
│  Redis (Production - Optional):                            │
│  - Multi-instance support                                  │
│  - Distributed token revocation                            │
│  - TTL-based expiration                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

### 1. Multi-Version Secret Support

- Maintain **multiple active secrets** simultaneously (typically 2: current + previous)
- New tokens signed with **current version**
- Old tokens verified with **any known version**
- Automatic warning if more than 2 versions active (indicates cleanup needed)

### 2. Version-Aware JWTs

Each JWT includes a `kid` (Key ID) header:

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT",
    "kid": "access-v2"
  },
  "payload": {
    "userId": "abc123",
    "email": "user@example.com",
    "iat": 1234567890,
    "exp": 1234571490
  }
}
```

### 3. Token Blacklist

**Access Token Revocation:**
- Blacklist individual tokens on logout
- Blacklist all tokens for a user (logout-all)
- Automatic expiration based on token TTL
- In-memory storage (development) or Redis (production)

**Refresh Token Revocation:**
- Database-backed (existing implementation)
- Rotation on refresh (existing implementation)
- Complete invalidation on password reset

---

## Environment Configuration

### Legacy Configuration (Backward Compatible)

```bash
# Single secret (no rotation support)
JWT_SECRET=your-access-token-secret-here
JWT_REFRESH_SECRET=your-refresh-token-secret-here
```

⚠️ **Legacy mode limitations:**
- No zero-downtime rotation
- Changing secrets invalidates all tokens immediately
- Automatic fallback to version 1

### Versioned Configuration (Recommended)

```bash
# Access token secrets (keep current + previous during rotation)
JWT_ACCESS_SECRET_V1=legacy-secret-keep-during-migration
JWT_ACCESS_SECRET_V2=new-secret-current-version

# Refresh token secrets
JWT_REFRESH_SECRET_V1=legacy-refresh-keep-during-migration
JWT_REFRESH_SECRET_V2=new-refresh-current-version

# Current versions (which secret to use for signing new tokens)
JWT_CURRENT_ACCESS_VERSION=2
JWT_CURRENT_REFRESH_VERSION=2
```

### Optional: Redis for Token Blacklist

```bash
# Enable Redis-based blacklist (production recommended)
REDIS_URL=redis://localhost:6379

# Or for AWS ElastiCache
REDIS_URL=redis://your-elasticache-endpoint:6379
```

---

## Secret Rotation Procedure

### Standard Rotation (Zero Downtime)

**Timeline:** ~7 days (refresh token expiration period)

#### Step 1: Generate New Secrets

```bash
cd apps/api
npx tsx scripts/rotate-jwt-secret.ts generate
```

This outputs:
```
🔐 JWT Secret Generator

New Access Token Secret:
  Zm9vYmFyYmF6cXV4...

New Refresh Token Secret:
  YWJjZGVmZ2hpamts...

Next Steps:
1. Add these secrets to your environment variables:
   ...
```

#### Step 2: Add New Secrets (Keep Old Ones)

Update your `.env` or deployment environment:

```bash
# KEEP existing secrets active
JWT_ACCESS_SECRET_V1=old-access-secret
JWT_REFRESH_SECRET_V1=old-refresh-secret

# ADD new secrets
JWT_ACCESS_SECRET_V2=Zm9vYmFyYmF6cXV4...
JWT_REFRESH_SECRET_V2=YWJjZGVmZ2hpamts...

# UPDATE current versions to use new secrets
JWT_CURRENT_ACCESS_VERSION=2
JWT_CURRENT_REFRESH_VERSION=2
```

#### Step 3: Deploy and Restart

```bash
# For Docker deployments
docker-compose restart api

# For local development
pnpm dev
```

#### Step 4: Validate Configuration

```bash
npx tsx scripts/rotate-jwt-secret.ts validate
```

Expected output:
```
✓ JWT Configuration Validator

Current Configuration:
  Current Access Version:  v2
  Current Refresh Version: v2
  Active Access Versions:  v2, v1
  Active Refresh Versions: v2, v1

✓ Configuration is valid
```

#### Step 5: Monitor (Wait Period)

**Wait for token expiration:**
- Access tokens: **1 hour**
- Refresh tokens: **7 days** ⏳

During this period:
- ✅ New tokens signed with v2
- ✅ Old tokens (v1) still verified
- ✅ Users won't notice anything

#### Step 6: Remove Old Secrets

After waiting period (7+ days):

```bash
# Remove old secrets from environment
# JWT_ACCESS_SECRET_V1=...  ← DELETE THIS LINE
# JWT_REFRESH_SECRET_V1=... ← DELETE THIS LINE

# Keep only current version
JWT_ACCESS_SECRET_V2=Zm9vYmFyYmF6cXV4...
JWT_REFRESH_SECRET_V2=YWJjZGVmZ2hpamts...
JWT_CURRENT_ACCESS_VERSION=2
JWT_CURRENT_REFRESH_VERSION=2
```

Restart and validate:

```bash
docker-compose restart api
npx tsx scripts/rotate-jwt-secret.ts validate
```

---

## Emergency Rotation

**Use Case:** Secret compromise detected, immediate action required.

⚠️ **WARNING:** This will **force logout ALL users immediately**. Use only in emergency situations.

### Procedure

#### Step 1: Assess the Situation

- Confirm secret compromise
- Identify affected systems
- Notify security team

#### Step 2: Run Emergency Rotation

```bash
cd apps/api
npx tsx scripts/rotate-jwt-secret.ts emergency-rotate --force
```

This will:
1. ✅ Delete ALL refresh tokens from database
2. ✅ Generate new secrets
3. ⚠️ Display instructions for updating environment

#### Step 3: Update Environment Immediately

```bash
# REMOVE all old secrets completely
# Keep ONLY new secrets

JWT_ACCESS_SECRET_V3=new-emergency-secret-abc123...
JWT_REFRESH_SECRET_V3=new-emergency-secret-def456...
JWT_CURRENT_ACCESS_VERSION=3
JWT_CURRENT_REFRESH_VERSION=3
```

#### Step 4: Restart All API Instances

```bash
# Restart ALL instances immediately
docker-compose restart api

# For multi-instance deployments
kubectl rollout restart deployment/api
```

#### Step 5: Post-Incident Actions

- [ ] Investigate how secret was compromised
- [ ] Review access logs for suspicious activity
- [ ] Update secret management procedures
- [ ] Notify affected users
- [ ] Document incident in security log
- [ ] Consider implementing automated rotation

---

## Token Blacklist

### Overview

The token blacklist provides **immediate token revocation** for access tokens, complementing the existing refresh token invalidation in the database.

### Logout (Single Session)

**Endpoint:** `POST /auth/logout`

**What it does:**
- ✅ Invalidates current refresh token (database)
- ✅ Blacklists current access token (blacklist)
- ✅ Clears refresh token cookie

**Example:**
```bash
curl -X POST https://api.example.com/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Cookie: refreshToken=eyJhbGciOiJIUzI1NiIs..."
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### Logout All (All Sessions/Devices)

**Endpoint:** `POST /auth/logout-all`

**What it does:**
- ✅ Blacklists ALL tokens for the user (1 hour)
- ✅ Deletes ALL refresh tokens for the user (database)
- ✅ Forces re-login on all devices

**Use Cases:**
- User suspects account compromise
- Password change (force re-auth everywhere)
- Admin action (suspend user access)

**Example:**
```bash
curl -X POST https://api.example.com/auth/logout-all \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response:**
```json
{
  "message": "All sessions terminated successfully",
  "devicesLoggedOut": "all"
}
```

### Blacklist Implementation

**Development (In-Memory):**
```typescript
// Automatic - no configuration needed
// ⚠️ Single-instance only
// ⚠️ Lost on restart
```

**Production (Redis - Recommended):**

1. Install Redis client:
```bash
pnpm add ioredis @types/ioredis
```

2. Update `apps/api/src/services/token-blacklist.service.ts`:
   - Uncomment `RedisTokenBlacklist` class
   - Update export to use Redis implementation

3. Add environment variable:
```bash
REDIS_URL=redis://your-redis-endpoint:6379
```

---

## CLI Tools

### Generate New Secrets

```bash
npx tsx scripts/rotate-jwt-secret.ts generate
```

**Output:**
- New access token secret (base64, 64 bytes)
- New refresh token secret (base64, 64 bytes)
- Step-by-step rotation instructions

### Validate Configuration

```bash
npx tsx scripts/rotate-jwt-secret.ts validate
```

**Checks:**
- ✅ Current versions exist in secrets
- ✅ No more than 2 versions active
- ✅ Not using default dev secrets in production
- ✅ Token expiration settings

**Exit Codes:**
- `0` - Configuration valid
- `1` - Issues found

### List Active Keys

```bash
npx tsx scripts/rotate-jwt-secret.ts list
```

**Output:**
```
🔑 Active JWT Key Versions

Access Token Keys:
  v2 - CURRENT (signing)
  v1 - LEGACY (verify only)

Refresh Token Keys:
  v2 - CURRENT (signing)
  v1 - LEGACY (verify only)

Rotation Status:
  Rotation in progress
  Legacy keys can be removed after token expiration:
    Access tokens:  1h
    Refresh tokens: 7d
```

### Emergency Rotation

```bash
npx tsx scripts/rotate-jwt-secret.ts emergency-rotate --force
```

⚠️ **Requires `--force` flag** to prevent accidental execution.

---

## Production Deployment

### Checklist

#### Before Deployment

- [ ] **Change default secrets** - Never use `dev-secret-key-change-in-production`
- [ ] **Use versioned secrets** - Migrate from legacy `JWT_SECRET` to `JWT_ACCESS_SECRET_V1`
- [ ] **Enable Redis** - Install `ioredis` and configure for multi-instance deployments
- [ ] **Test rotation** - Practice rotation in staging environment
- [ ] **Document secrets** - Store in secure vault (AWS Secrets Manager, HashiCorp Vault, etc.)

#### Security Best Practices

1. **Never commit secrets to version control**
   ```bash
   # .gitignore should include:
   .env
   .env.local
   .env.production
   ```

2. **Use secret management service**
   ```bash
   # AWS Secrets Manager
   aws secretsmanager get-secret-value --secret-id prod/alchemy/jwt-secrets
   
   # HashiCorp Vault
   vault kv get secret/alchemy/jwt
   ```

3. **Rotate secrets regularly**
   - **Recommended:** Every 90 days
   - **Minimum:** Every 180 days
   - **After breach:** Immediately

4. **Monitor token usage**
   - Track token verification failures
   - Alert on unknown version attempts
   - Log blacklist hits

#### Multi-Instance Deployments

**Requirements:**
- ✅ Redis for shared blacklist
- ✅ Same environment variables on all instances
- ✅ Synchronized secret rotation

**Deployment Strategy:**
```bash
# 1. Update secrets in environment
# 2. Rolling restart (zero downtime)
kubectl set env deployment/api \
  JWT_ACCESS_SECRET_V2=new-secret \
  JWT_CURRENT_ACCESS_VERSION=2

# 3. Monitor for errors
kubectl logs -f deployment/api --tail=100

# 4. Validate all instances
for pod in $(kubectl get pods -l app=api -o name); do
  kubectl exec $pod -- curl http://localhost:3000/health
done
```

---

## Troubleshooting

### "Invalid or expired token" After Rotation

**Symptom:** Users getting 401 errors immediately after rotation.

**Cause:** Old secret removed too soon.

**Fix:**
```bash
# Re-add the old secret temporarily
JWT_ACCESS_SECRET_V1=old-secret-restore-this
JWT_ACCESS_SECRET_V2=new-secret

# Restart and wait full expiration period (7 days)
```

### "Using insecure default JWT secrets in production!"

**Symptom:** Warning on server startup.

**Cause:** Default development secrets still in environment.

**Fix:**
```bash
# Generate and set proper secrets
npx tsx scripts/rotate-jwt-secret.ts generate

# Update environment with generated secrets
JWT_ACCESS_SECRET_V1=generated-secret-here
JWT_REFRESH_SECRET_V1=generated-secret-here
```

### Token Blacklist Not Working (Multi-Instance)

**Symptom:** Logout on one server doesn't affect other instances.

**Cause:** Using in-memory blacklist with multiple API instances.

**Fix:**
```bash
# Install Redis client
pnpm add ioredis @types/ioredis

# Configure Redis
REDIS_URL=redis://your-redis:6379

# Update token-blacklist.service.ts to use Redis
# (Uncomment RedisTokenBlacklist class and update export)
```

### Too Many Active Versions Warning

**Symptom:** `⚠️ Warning: 3 access token versions active`

**Cause:** Old secrets not removed after rotation.

**Fix:**
```bash
# List active versions
npx tsx scripts/rotate-jwt-secret.ts list

# Remove old versions (keep only current + previous max)
# JWT_ACCESS_SECRET_V1=...  ← DELETE if v3 exists
```

### Emergency Rotation Blocked

**Symptom:** `emergency-rotate` command shows warning but doesn't proceed.

**Cause:** Missing `--force` flag (safety feature).

**Fix:**
```bash
# Add --force flag to confirm
npx tsx scripts/rotate-jwt-secret.ts emergency-rotate --force
```

---

## Migration from Legacy Secrets

### Current State (Legacy)

```bash
JWT_SECRET=my-old-secret
JWT_REFRESH_SECRET=my-old-refresh-secret
```

### Migration Steps

1. **Keep legacy secrets**, add versioned equivalents:

```bash
# Legacy (keep for backward compatibility)
JWT_SECRET=my-old-secret
JWT_REFRESH_SECRET=my-old-refresh-secret

# New versioned secrets (same values initially)
JWT_ACCESS_SECRET_V1=my-old-secret
JWT_REFRESH_SECRET_V1=my-old-refresh-secret
JWT_CURRENT_ACCESS_VERSION=1
JWT_CURRENT_REFRESH_VERSION=1
```

2. **Deploy and validate** - All tokens still work

3. **Generate new secrets** for version 2:

```bash
npx tsx scripts/rotate-jwt-secret.ts generate
```

4. **Add version 2** (follow [Standard Rotation](#standard-rotation-zero-downtime))

5. **After 7 days**, remove legacy `JWT_SECRET` and `JWT_REFRESH_SECRET`

---

## API Reference

### Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `JWT_SECRET` | string | `dev-secret-key...` | Legacy access token secret |
| `JWT_REFRESH_SECRET` | string | `dev-refresh-secret...` | Legacy refresh token secret |
| `JWT_ACCESS_SECRET_V{N}` | string | - | Versioned access secret (N = version number) |
| `JWT_REFRESH_SECRET_V{N}` | string | - | Versioned refresh secret (N = version number) |
| `JWT_CURRENT_ACCESS_VERSION` | number | `1` | Version number for signing new access tokens |
| `JWT_CURRENT_REFRESH_VERSION` | number | `1` | Version number for signing new refresh tokens |
| `REDIS_URL` | string | - | Redis connection URL (optional, enables distributed blacklist) |

### JWT Header Format

```typescript
{
  "alg": "HS256",
  "typ": "JWT",
  "kid": "access-v2"  // or "refresh-v2"
}
```

### CLI Commands

| Command | Description | Destructive? |
|---------|-------------|--------------|
| `generate` | Generate new secrets | No |
| `validate` | Validate configuration | No |
| `list` | List active versions | No |
| `emergency-rotate` | Force logout all users | **Yes** (requires `--force`) |

---

## Additional Resources

- [SECURITY_HEADERS.md](./SECURITY_HEADERS.md) - HTTP security headers configuration
- [INPUT_SANITIZATION.md](./INPUT_SANITIZATION.md) - XSS protection and input validation
- [JWT.io](https://jwt.io/) - JWT debugger and documentation
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review error logs: `kubectl logs -f deployment/api`
3. Validate configuration: `npx tsx scripts/rotate-jwt-secret.ts validate`
4. Contact security team for emergency rotation assistance
