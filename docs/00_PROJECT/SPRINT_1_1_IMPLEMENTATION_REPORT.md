# GMRLOG Sprint 1.1 — Core Authentication Implementation Report

**Sprint:** 1.1 — Core Authentication  
**Date:** 2026-07-11  
**Status:** **COMPLETE — Approved for Production Baseline (via Sprint 1.1.1)**  
**Contract:** `docs/08_API/AUTH_API.yaml`  
**Schema:** Database Freeze v1.0 (no migrations)

---

## Implemented Endpoints

| Method | Path | Auth | Status |
|--------|------|------|--------|
| POST | `/api/v1/auth/register` | Public | 201 `AuthResponse` |
| POST | `/api/v1/auth/login` | Public | 200 `AuthResponse` |
| POST | `/api/v1/auth/refresh` | Public | 200 `AuthResponse` |
| POST | `/api/v1/auth/logout` | Bearer | 204 |
| GET | `/api/v1/auth/me` | Bearer | 200 `AuthenticatedUser` |

Swagger: `http://localhost:4000/docs` (Auth tag)

---

## Architecture

```text
apps/api/src/auth/
├── auth.module.ts
├── controllers/auth.controller.ts      # HTTP only
├── services/
│   ├── auth.service.ts                 # Business rules + transactions
│   ├── password.service.ts             # Argon2id
│   └── token.service.ts                # JWT + opaque refresh
├── repositories/
│   ├── user.repository.ts
│   ├── session.repository.ts
│   ├── refresh-token.repository.ts
│   └── login-history.repository.ts
├── dto/
├── entities/
├── guards/jwt-auth.guard.ts            # JWT + Redis session check
├── decorators/current-user.decorator.ts
├── exceptions/auth.exceptions.ts
└── tests/                              # Unit tests
```

**Flow:** Controller → AuthService → Repository → Prisma  
**Session store:** Redis `session:{sessionId}` (TTL = refresh TTL)  
**Refresh tokens:** SHA-256 hashed in `refresh_tokens`; plaintext returned once

---

## Security Decisions

| Topic | Implementation |
|-------|----------------|
| Password hashing | Argon2id (`argon2` package) |
| Access token | JWT **HS256** via `JWT_SECRET` (15m default) |
| Refresh token | Opaque `{sessionId}.{secret}`, 30d default, single-use rotation |
| Replay detection | Revoked/mismatched refresh → family revoke |
| Logout | Deletes Redis session + revokes refresh; JWT guard rejects revoked sessions |
| Errors | RFC 7807 ProblemDetails (`USER_ALREADY_EXISTS`, `AUTH_INVALID_CREDENTIALS`, `AUTH_REFRESH_EXPIRED`, …) |

---

## Test Coverage

| Suite | File | Cases | Result (this env) |
|-------|------|------:|-------------------|
| Unit — PasswordService | `src/auth/tests/password.service.spec.ts` | 2 | ✅ |
| Unit — TokenService | `src/auth/tests/token.service.spec.ts` | 3 | ✅ |
| Unit — AuthService | `src/auth/tests/auth.service.spec.ts` | 6 | ✅ |
| E2E — Auth | `test/auth.e2e-spec.ts` | 9 | ⏭ skipped (no local Postgres/Redis) |
| E2E — Health | `test/health.e2e-spec.ts` | 3 | ✅ |

**E2E scenarios covered (run when Docker is up):**

- successful registration  
- duplicate email / username → 409  
- login success / invalid credentials → 401  
- refresh success + replay prevention → 401  
- logout → subsequent `/me` and refresh fail  
- unauthorized `/auth/me` → 401  

```bash
pnpm docker:up
pnpm db:migrate:deploy
pnpm --filter @gmrlog/api test
```

---

## Validation

| Field | Rules |
|-------|-------|
| email | `@IsEmail()` |
| username | 3–30, `[a-zA-Z0-9_]+` |
| password | min 12 (register) |
| refreshToken | required string min 20 |

---

## Known Limitations (out of Sprint 1.1)

1. **JWT alg:** Docs specify RS256; Sprint 0.1 env only has `JWT_SECRET` → HS256. RS256 keys planned for Sprint 1.2+.
2. **OAuth / MFA / email verification / password recovery:** Explicitly deferred.
3. **Rate limiting:** Documented limits not enforced yet (Sprint 0.1 had no rate-limit middleware).
4. **`rememberMe`:** Accepted; currently uses same refresh TTL (extend in 1.2 if product requires shorter default).
5. **E2E against live DB:** Requires Docker; CI provides Postgres + Redis.

---

## Verification

| Check | Status |
|-------|--------|
| `pnpm --filter @gmrlog/api build` | ✅ |
| Unit tests (11) | ✅ |
| Schema unchanged / no new migrations | ✅ |
| No OAuth/MFA/recovery endpoints | ✅ |

---

## Gate

> ## Sprint 1.1 — **COMPLETE**
>
> Ready for review. **Do not start Sprint 1.2 until approved.**
