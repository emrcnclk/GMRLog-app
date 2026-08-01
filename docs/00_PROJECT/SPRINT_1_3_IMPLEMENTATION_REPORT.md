# GMRLOG Sprint 1.3 — OAuth & Account Linking Implementation Report

**Sprint:** 1.3 — OAuth & Account Linking  
**Date:** 2026-07-11  
**Status:** **COMPLETE — Awaiting review before Sprint 1.4**  
**Contract:** `docs/08_API/AUTH_API.yaml` + `docs/11_SECURITY/AUTHENTICATION.md`  
**Schema:** unchanged (no migrations)

---

## Implemented Providers

| Provider | Protocol | PKCE | Notes |
|----------|----------|------|-------|
| Google | OAuth 2.0 + OIDC | Yes | `openid email profile` |
| Discord | OAuth 2.0 | Yes | `identify email` |
| Steam | OpenID 2.0 | N/A | Assertion verified via `check_authentication` |
| Apple | OAuth 2.0 + OIDC | Yes | Client secret = ES256 JWT |

All providers implement `OAuthProvider` and are resolved through `OAuthProviderRegistry`.

---

## Implemented Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/auth/oauth/{provider}/login` | Public | Start login (auth URL + state) |
| GET | `/api/v1/auth/oauth/{provider}/callback` | Public | Code/OpenID callback |
| POST | `/api/v1/auth/oauth/{provider}/link` | Bearer | Start link flow (OpenAPI) |
| DELETE | `/api/v1/auth/oauth/{provider}/unlink` | Bearer | Unlink provider (OpenAPI) |

`{provider}` ∈ `GOOGLE | DISCORD | STEAM | APPLE`

> **OpenAPI note:** `AUTH_API.yaml` currently documents only link/unlink. Login + callback follow AUTHENTICATION.md (authorization code + PKCE) and are required by this sprint. Recommend documenting them in a docs pass.

---

## Architecture

```text
OAuthController
  → OAuthService
    → OAuthProviderRegistry → Google | Discord | Steam | Apple
    → OAuthStateService (Redis state + PKCE verifier)
    → OAuthAccountRepository → Prisma `oauth_accounts`
    → AuthService.createSessionForUser()
```

---

## Security Considerations

| Control | Implementation |
|---------|----------------|
| CSRF / state | Cryptographic `state` stored in Redis, single-use consume |
| PKCE | S256 for Google/Discord/Apple |
| Replay | State key deleted on first use → subsequent use `410 OAUTH_STATE_EXPIRED` |
| Redirect allowlist | `OAUTH_ALLOWED_REDIRECT_URIS` |
| Callback redirect URI | Built from `OAUTH_CALLBACK_BASE_URL` (not client-supplied) |
| Provider verification | Token exchange + userinfo / OpenID assertion / Apple `id_token` |
| No auto-merge | Existing email → `409 OAUTH_ACCOUNT_CONFLICT` (must login + link) |
| Orphan prevention | Cannot unlink last login method when no password |
| Duplicate link | Same provider already linked → conflict |
| Security log (success) | `AUTH_OAUTH_LOGIN`, `AUTH_OAUTH_LINK`, `AUTH_OAUTH_UNLINK` |
| Security log (failure) | `AUTH_OAUTH_FAILURE`, `AUTH_OAUTH_PROVIDER_REJECTED`, `AUTH_OAUTH_INVALID_STATE`, `AUTH_OAUTH_REPLAY` |
| Token at rest | **No access tokens stored** — only `providerUserId`, optional `refreshToken`, `expiresAt` |
| Provider isolation | Implementations depend only on `OAuthProvider`; registry is the sole composition root |

---

## Account Linking Rules

1. Link requires authenticated session + OAuth consent callback with `intent=link`.
2. Provider identity already belonging to another user → conflict.
3. Unlink requires password **or** another linked provider remaining.
4. Identity merge by email is **not** performed (docs do not authorize silent merge).

---

## Test Results

| Suite | Result |
|-------|--------|
| Unit (incl. OAuthService) | **36/36** |
| Auth e2e | 9/9 |
| Lifecycle e2e | 7/7 |
| OAuth e2e | **7/7** |
| Health e2e | 3/3 |
| Lint / Build | ✅ |

OAuth e2e coverage:

- successful login  
- invalid callback (missing state)  
- expired / replayed state  
- provider rejection  
- duplicate linking  
- unlink success (password remains)  
- unlink last provider failure  

E2E uses `MockOAuthProvider` registered via `OAuthProviderRegistry` (no live Google/Steam/etc. credentials required).

---

## Configuration

```env
OAUTH_CALLBACK_BASE_URL=http://localhost:4000/api/v1/auth/oauth
OAUTH_ALLOWED_REDIRECT_URIS=http://localhost:3000/auth/callback
OAUTH_STATE_TTL_SECONDS=600
GOOGLE_CLIENT_ID= / GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID= / DISCORD_CLIENT_SECRET=
STEAM_API_KEY= / STEAM_REALM=
APPLE_CLIENT_ID= / APPLE_TEAM_ID= / APPLE_KEY_ID= / APPLE_PRIVATE_KEY=
```

Unconfigured providers return `503 OAUTH_NOT_CONFIGURED`.

---

## Known Limitations

1. **OpenAPI gap:** login/callback routes not yet in `AUTH_API.yaml`.
2. **Live provider smoke tests:** not run against real Google/Discord/Steam/Apple in CI (mocked).
3. **Apple signature:** ES256 client-secret JWT uses local DER→JOSE conversion; validate with Apple sandbox before production.
4. **Frontend redirect after callback:** API returns JSON `AuthResponse` / `{ linked: true }`; browser redirect handoff is client responsibility (`returnTo` allowlisted for future use).
5. **Token at rest:** Access tokens are not persisted. Only provider account id + optional refresh token/expiry are stored.
6. **MFA:** explicitly out of scope.
7. **Rate limiting:** still deferred.

---

## Gate

> ## Sprint 1.3 — **COMPLETE**
>
> Ready for review. **Do not start Sprint 1.4 until approved.**
