# GMRLOG Sprint 1.1.1 — Authentication Hardening Report

**Sprint:** 1.1.1 — Authentication Hardening  
**Date:** 2026-07-11  
**Status:** **COMPLETE**  
**Schema:** unchanged (no migrations)

---

## Summary

Hardening tasks completed on top of Sprint 1.1 Core Authentication.

> ## Sprint 1.1 Approved for Production Baseline

---

## Task 1 — JWT Algorithm Abstraction

| Item | Detail |
|------|--------|
| Default | `JWT_ALGORITHM=HS256` |
| Supported | `HS256`, `RS256` |
| Resolver | `apps/api/src/auth/services/jwt-signing.config.ts` |
| RS256 keys | `JWT_PRIVATE_KEY` + `JWT_PUBLIC_KEY` (PEM or file path) |

Migration to RS256 is **configuration-only**: set algorithm + keys; no code change required.

---

## Task 2 — rememberMe Refresh Lifetime

| Mode | Access TTL | Refresh TTL | Env |
|------|------------|-------------|-----|
| Normal | 15m (`900`) | 30d (`2592000`) | `JWT_ACCESS_TTL_SECONDS` / `JWT_REFRESH_TTL_SECONDS` |
| Remember Me | 15m (`900`) | 90d (`7776000`) | `JWT_REFRESH_TTL_REMEMBER_ME_SECONDS` |

`rememberMe` is stored in the Redis session record and preserved across refresh rotation.

---

## Task 3 — Redis Failure Behavior

| Operation | Redis unavailable | Missing session key |
|-----------|-------------------|---------------------|
| **login / register** | `503 SERVICE_UNAVAILABLE` — session not issued | n/a |
| **refresh** | `503 SERVICE_UNAVAILABLE` — not treated as expired | `401 AUTH_REFRESH_EXPIRED` |
| **logout** | `503 SERVICE_UNAVAILABLE` after DB revoke attempt | proceeds with DB revoke when key absent |
| **GET /auth/me** (JwtAuthGuard) | `503 SERVICE_UNAVAILABLE` | `401 AUTH_INVALID_TOKEN` |

Policy: **fail closed** for session store outages. Connectivity errors never masquerade as auth failures.

Exception: `SessionStoreUnavailableException` → ProblemDetails `SERVICE_UNAVAILABLE`.

---

## Task 4 — Auth E2E

| Suite | Result |
|-------|--------|
| Auth e2e | **9/9 passed** (no skips) |
| Unit (auth) | **16/16 passed** |
| Health e2e | 3/3 passed |
| Lint | ✅ |
| Build | ✅ |

E2E no longer soft-skips when Postgres/Redis are down; prerequisites fail the suite explicitly.

---

## Files Touched (high level)

- `packages/config/src/env.ts` — JWT algorithm + remember-me TTL
- `apps/api/src/auth/services/{token,auth,jwt-signing.config}.ts`
- `apps/api/src/auth/guards/jwt-auth.guard.ts`
- `apps/api/src/auth/exceptions/auth.exceptions.ts`
- `apps/api/test/auth.e2e-spec.ts`
- `.env.example`, `docs/00_PROJECT/ENVIRONMENT_VARIABLES.md`
- Migration SQL BOM stripped (tooling fix; schema unchanged)

---

## Known Limitations (carry to later sprints)

1. OAuth / MFA / email verification / password recovery — not in scope
2. Auth rate limiting — not implemented
3. Prisma migration folder order: `20260710_database_freeze_patch` sorts before `20260710210000_init` lexicographically; deploy on empty DB may need manual ordering (documented for ops)
4. Local Redis used Windows Redis 3.0.504 (Docker Compose remains the documented path)

---

## Gate

> Sprint 1.1 + 1.1.1 form the **Production Baseline** for Core Authentication.  
> Ready for Sprint 1.2 after product owner confirms 1.2 scope.
