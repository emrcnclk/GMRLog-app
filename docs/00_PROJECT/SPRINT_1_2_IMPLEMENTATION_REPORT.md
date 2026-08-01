# GMRLOG Sprint 1.2 — Account Lifecycle Implementation Report

**Sprint:** 1.2 — Account Lifecycle  
**Date:** 2026-07-11  
**Status:** **COMPLETE — Awaiting review before Sprint 1.3**  
**Contract:** `docs/08_API/AUTH_API.yaml` (+ sprint-required `POST /auth/change-email`)  
**Schema:** unchanged (no migrations)

---

## Implemented Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/v1/auth/verify-email` | Public | Email verify **or** email-change confirm |
| POST | `/api/v1/auth/resend-verification` | Public | Body `{ email }` (OpenAPI omits body; required for public resend) |
| POST | `/api/v1/auth/forgot-password` | Public | Always **204** (no email enumeration) |
| POST | `/api/v1/auth/reset-password` | Public | Single-use hashed reset token |
| PATCH | `/api/v1/auth/change-password` | Bearer | OpenAPI method; invalidates **all** sessions |
| POST | `/api/v1/auth/change-email` | Bearer | Sprint feature; confirm via `verify-email` |
| GET | `/api/v1/auth/security-log` | Bearer | Paginated `SecureEventPage` |

OpenAPI aliases from the sprint brief:

- `/auth/email/verify` → `/auth/verify-email`
- `/auth/email/resend-verification` → `/auth/resend-verification`
- `POST /auth/change-password` → **`PATCH`** `/auth/change-password` (OpenAPI SSOT)

---

## Architecture

```text
Controller → AccountLifecycleService / AuthService
          → SecureTokenService (HMAC-signed tokens)
          → Repositories (VerificationToken, PasswordReset, AuditLog, …)
          → Prisma + Redis (session revoke)
          → MailService (outbox + log; SMTP-ready)
```

Register now issues an email-verification message automatically.

---

## Security Considerations

| Topic | Implementation |
|-------|----------------|
| Token format | HMAC-SHA256 signed payload (`payload.sig`) using `JWT_SECRET` |
| Storage | SHA-256 hash only (`verification_tokens` / `password_resets`) |
| Single-use | Delete verification row / set `usedAt` on reset |
| Replay | Missing/used hash → `400` invalid token/code |
| Expiry | Configurable TTLs; expired → `410` |
| Signature compare | `crypto.timingSafeEqual` |
| Password hashing | Argon2id |
| Forgot-password | Always `204`; never reveals account existence |
| Email change | Current email unchanged until new address confirms |
| Password change/reset | Revokes all refresh tokens + DB sessions + Redis session keys |
| Security log | `audit_logs` with `AUTH_*` actions |

### Configurable TTLs

| Env | Default |
|-----|---------|
| `EMAIL_VERIFICATION_TTL_SECONDS` | 86400 (24h) |
| `PASSWORD_RESET_TTL_SECONDS` | 3600 (1h) |
| `EMAIL_CHANGE_TTL_SECONDS` | 86400 (24h) |

---

## Security Log Events

- `AUTH_LOGIN_SUCCESS` / `AUTH_LOGIN_FAILURE`
- `AUTH_LOGOUT`
- `AUTH_PASSWORD_CHANGE` / `AUTH_PASSWORD_RESET` / `AUTH_PASSWORD_RESET_REQUESTED`
- `AUTH_EMAIL_VERIFIED` / `AUTH_EMAIL_CHANGE_REQUESTED` / `AUTH_EMAIL_CHANGED`
- `AUTH_VERIFICATION_RESENT`
- `AUTH_REFRESH_REUSE`

---

## Test Results

| Suite | Result |
|-------|--------|
| Unit (auth + lifecycle + secure token) | **28/28** |
| Auth e2e | **9/9** |
| Account lifecycle e2e | **7/7** |
| Health e2e | **3/3** |
| Lint | ✅ |
| Build | ✅ |

Lifecycle e2e coverage:

- email verification success  
- expired / invalid verification  
- replay attack  
- forgot + reset password (no enumeration)  
- invalid reset token  
- password change + session invalidation  
- email change + confirm  
- security log retrieval  

---

## Known Limitations

1. **Mail delivery:** `MailService` queues to an in-memory outbox and logs; SMTP/Mailpit transport not wired yet.
2. **`POST /auth/change-email`:** Required by Sprint 1.2; not yet present in `AUTH_API.yaml` — OpenAPI should be updated in a docs pass.
3. **`resend-verification` body:** OpenAPI lists no body; implementation requires `{ email }` for public use.
4. **Forgot-password vs OpenAPI 404:** Spec lists `UserNotFound`; product/security requirement is non-enumerating **204**.
5. **OAuth / MFA:** Explicitly out of scope.
6. **Rate limiting:** Still deferred.
7. **Change-password session policy:** Invalidates **all** sessions (stricter than AUTH.md “except current”).

---

## Gate

> ## Sprint 1.2 — **COMPLETE**
>
> Ready for review. **Do not start Sprint 1.3 until approved.**
