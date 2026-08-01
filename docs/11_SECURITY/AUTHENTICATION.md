# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/11_SECURITY/AUTHENTICATION.md`

**Status:** Approved

**Owner:** Security Team

**Classification:** Internal Engineering Documentation

---

# Authentication

## Purpose

This document specifies GMRLOG's authentication architecture: JWT access tokens, refresh token rotation, OAuth providers, multi-factor authentication (MFA), session management, and client integration patterns.

The canonical API contract is [`AUTH_API.yaml`](../08_API/AUTH_API.yaml). Implementation must not deviate from documented endpoints.

---

## Authentication Overview

```text
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Mobile App  │     │   Web App    │     │  Admin App   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │    HTTPS /api/v1/auth/*                  │
       └────────────────────┼────────────────────┘
                            ▼
                 ┌─────────────────────┐
                 │   Auth Service       │
                 │   (NestJS module)    │
                 └──────────┬──────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         PostgreSQL      Redis         OAuth Providers
         (users)       (sessions)    Google, Steam, Discord, Apple
```

---

## Supported Authentication Methods

| Method | Phase | Endpoint |
|--------|-------|----------|
| Email + password | Alpha | `POST /auth/register`, `POST /auth/login` |
| Google OAuth | Alpha | `POST /auth/register`, `POST /auth/login` |
| Steam OAuth | Alpha | `POST /auth/register`, `POST /auth/login` |
| Discord OAuth | Alpha | `POST /auth/register`, `POST /auth/login` |
| Apple OAuth | Beta | `POST /auth/register`, `POST /auth/login` |
| TOTP MFA | V1.5 | `/auth/2fa/*` |
| Passkeys | V2 (future) | Not yet specified |
| Magic link | Future | Not yet specified |

Provider linking: `POST /auth/oauth/{provider}/link`, `DELETE /auth/oauth/{provider}/unlink`.

---

## Token Architecture

### Access token (JWT)

| Property | Value |
|----------|-------|
| Format | JWT (RS256) |
| Lifetime | 15 minutes |
| Storage (mobile) | Memory + secure bootstrap; not MMKV |
| Storage (web) | Memory; optional BFF cookie for SSR |
| Transport | `Authorization: Bearer {token}` |
| Claims | `sub`, `email`, `username`, `roles[]`, `sessionId`, `iat`, `exp`, `iss` |

### Refresh token

| Property | Value |
|----------|-------|
| Format | Opaque random (256-bit) |
| Lifetime | 30 days (rolling on use) |
| Storage (mobile) | `expo-secure-store` |
| Storage (web) | HTTP-only, Secure, SameSite=Strict cookie |
| Rotation | Single-use; new pair on every refresh |
| Revocation | Redis session store + DB `refresh_tokens` |

### Refresh flow

```text
POST /auth/refresh
  Body: { refreshToken }   (mobile)
  Cookie: refresh_token    (web)

→ 200 AuthResponse { accessToken, refreshToken, user }
→ 401 if revoked, expired, or reuse detected (family revocation)
```

**Reuse detection:** Presenting a revoked refresh token invalidates the entire token family for that device session.

---

## Session Model

Each login creates a **device session**:

```typescript
interface DeviceSession {
  id: string;              // sessionId claim
  userId: string;
  deviceName: string;
  platform: 'ios' | 'android' | 'web';
  ipAddress: string;       // hashed at rest
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
  pushTokenId: string | null;
}
```

Sessions listed and revocable via future account security UI. `POST /auth/logout` revokes current session.

Redis key: `session:{sessionId}` — TTL matches refresh token.

---

## Registration and Login

### Email registration

`POST /auth/register`

```json
{
  "method": "EMAIL",
  "email": "player@example.com",
  "password": "secure-password-here",
  "username": "playerone",
  "displayName": "Player One"
}
```

Password policy per [SECURITY.md](SECURITY.md): minimum 12 characters, Argon2id hashing.

Response: `201 AuthResponse` — email verification required before full access.

### Login

`POST /auth/login`

```json
{
  "method": "EMAIL",
  "email": "player@example.com",
  "password": "secure-password-here"
}
```

OAuth login uses same endpoint with `method: GOOGLE | STEAM | DISCORD | APPLE` and provider token.

### Rate limiting

| Endpoint | Limit |
|----------|-------|
| `/auth/login` | 10 / 15 min per IP + email |
| `/auth/register` | 5 / hour per IP |
| `/auth/refresh` | 30 / min per session |
| `/auth/forgot-password` | 3 / hour per email |

Returns `429` with `ProblemDetails` code `RATE_LIMITED`.

---

## OAuth Providers

### Flow (authorization code + PKCE)

```text
Client → Provider consent screen
       → Authorization code
       → Backend token exchange (secret server-side)
       → GMRLOG AuthResponse
```

Mobile uses system browser / `expo-auth-session` with PKCE. Web uses redirect callback route.

### Provider-specific notes

| Provider | Identifier | Notes |
|----------|------------|-------|
| Google | `GOOGLE` | OpenID Connect; email required |
| Steam | `STEAM` | Steam OpenID; no email — username from persona |
| Discord | `DISCORD` | Guilds scope not requested at login |
| Apple | `APPLE` | Hide-my-email supported; Beta phase |

Account linking requires verified primary email or explicit user confirmation.

---

## Email Verification

| Endpoint | Purpose |
|----------|---------|
| `POST /auth/verify-email` | Confirm token from email |
| `POST /auth/resend-verification` | Resend (rate limited) |

Unverified accounts:

- Can browse public content
- Cannot post, review, or message
- Banner prompts verification

---

## Password Management

| Endpoint | Purpose |
|----------|---------|
| `POST /auth/forgot-password` | Send reset email |
| `POST /auth/reset-password` | Complete reset with token |
| `POST /auth/change-password` | Authenticated password change |

Reset tokens: single-use, 1-hour TTL, hashed in DB.

`POST /auth/change-password` invalidates all refresh tokens except current session (configurable).

---

## Multi-Factor Authentication (MFA)

MFA uses TOTP (RFC 6238). Release phase: V1.5 per [FEATURE_MATRIX.md](../01_PRODUCT/FEATURE_MATRIX.md).

### Endpoints

| Endpoint | Operation | Description |
|----------|-----------|-------------|
| `GET /auth/2fa` | `getTwoFactorStatus` | Returns enabled state |
| `POST /auth/2fa/setup` | `setupTwoFactor` | Returns QR + secret |
| `POST /auth/2fa/verify` | `verifyTwoFactor` | Confirms setup; enables MFA |
| `POST /auth/2fa/disable` | `disableTwoFactor` | Requires password + TOTP |

### Login with MFA

When MFA enabled, initial `POST /auth/login` returns:

```json
{
  "mfaRequired": true,
  "mfaToken": "temporary-mfa-session-token"
}
```

Client submits TOTP via dedicated verify step (documented in `AUTH_API.yaml` MFA login flow). `mfaToken` TTL: 5 minutes.

### Recovery codes

10 single-use recovery codes generated at MFA setup. Stored hashed. Regeneration invalidates previous codes.

---

## Current User

`GET /auth/me` — returns authenticated user profile summary and roles.

Distinct from `USER_API` `/users/me` which owns full profile editing. Auth `/me` is session-scoped identity; user API is profile data.

---

## Account Lifecycle

| Endpoint | Purpose |
|----------|---------|
| `POST /auth/account/export` | GDPR data export request |
| `GET /auth/account/deletion-status` | Pending deletion state |
| `POST /auth/account/cancel-deletion` | Cancel scheduled deletion |

Deletion grace period: 14 days. Sessions revoked on deletion request.

---

## Security Log

`GET /auth/security-log` — paginated audit of login, MFA, password, and OAuth events for the current user.

---

## Authorization Integration

JWT `roles` claim maps to RBAC in [SECURITY.md](SECURITY.md):

`Guest` | `User` | `Premium` | `Developer` | `Studio` | `Moderator` | `Admin`

NestJS `RolesGuard` validates against route metadata. Premium/Developer roles enriched from subscription tables at token issue time.

---

## Client Implementation

### Mobile (`apps/mobile`)

```text
Login success
  → secure-store: refreshToken
  → auth-store: accessToken, user
  → TanStack Query: invalidate user queries

API interceptor
  → attach Bearer accessToken
  → on 401: POST /auth/refresh once (mutex)
  → on refresh fail: clearSession(), navigate to auth
```

### Web (`apps/web`)

```text
Login success
  → BFF sets HTTP-only refresh cookie
  → Client holds accessToken in memory

SSR routes
  → Server reads cookie, exchanges/refreshes server-side
  → Passes user to RSC props
```

See [STATE_MANAGEMENT.md](../05_FRONTEND/STATE_MANAGEMENT.md).

---

## Push Token Registration

Push tokens register post-auth via `NOTIFICATION_API.yaml` — not `AUTH_API`. Auth session `sessionId` links device for remote logout.

---

## Threat Mitigations

| Threat | Mitigation |
|--------|------------|
| Token theft | Short access TTL, refresh rotation, reuse detection |
| CSRF (web) | SameSite cookies, CSRF token on state-changing BFF routes |
| Brute force | Rate limits, Argon2id, optional CAPTCHA on abuse |
| Session fixation | New session ID on login |
| XSS | No refresh token in JS-accessible storage (web) |
| OAuth phishing | PKCE, redirect URI allowlist |

---

## Observability

| Event | Destination |
|-------|-------------|
| Login success/failure | Security log + PostHog `auth_login` |
| Refresh reuse | Sentry alert + session family revoke |
| MFA enable/disable | Security log + email notification |
| OAuth link/unlink | Security log |

---

## Acceptance Criteria

- All auth flows implement `AUTH_API.yaml` operationIds exactly.
- Refresh token rotation with reuse detection is enforced.
- MFA endpoints gate sensitive account actions when enabled.
- Mobile and web storage strategies prevent refresh token exposure to XSS.

---

## Related Documents

- [AUTH_API.yaml](../08_API/AUTH_API.yaml)
- [SECURITY.md](SECURITY.md)
- [API_ARCHITECTURE.md](../08_API/API_ARCHITECTURE.md)
- [STATE_MANAGEMENT.md](../05_FRONTEND/STATE_MANAGEMENT.md)
- [TECH_STACK_DECISIONS.md](../00_PROJECT/TECH_STACK_DECISIONS.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 Alpha | 2026-07-10 | Initial release |
