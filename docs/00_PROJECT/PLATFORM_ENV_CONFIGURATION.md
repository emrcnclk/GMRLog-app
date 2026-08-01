# Platform Environment Configuration

**Document:** `docs/00_PROJECT/PLATFORM_ENV_CONFIGURATION.md`  
**Status:** Normative for Platform Infrastructure (Sprint 15.3–15.4)  
**Schema SoT:** `packages/config/src/env.ts` (`loadApiEnv` / `getCachedApiEnv`)

---

## Purpose

Document Platform-owned environment variables, startup validation behavior, and diagnostics when configuration is missing or invalid.

Domain feature flags (Admin FeatureFlag CRUD) are **not** Platform config.

---

## Startup validation

1. Nest `ConfigModule` / `AppConfigModule` calls `loadApiEnv()`.
2. Zod parses `apiEnvSchema`.
3. On failure, process exits with a **keyed diagnostic list** (path + message), pointing here.
4. Cross-rules after parse:
   - `JWT_ALGORITHM=RS256` → requires `JWT_PRIVATE_KEY` + `JWT_PUBLIC_KEY`
   - Production + `MAIL_DRIVER=smtp` → requires `SMTP_HOST`
   - Production forbids `MAIL_FALLBACK_DRIVER=memory`
   - Production forbids `STORAGE_DRIVER=memory`
   - `SMTP_USERNAME` / `SMTP_PASSWORD` must be both set or both omitted

`PlatformConfigService.onModuleInit` logs a non-secret fingerprint (drivers, rate-limit flag). Env parse is cached via `getCachedApiEnv()` (single Zod pass per process).

---

## Platform variable matrix

| Variable | Default | Notes |
|----------|---------|-------|
| `MAIL_DRIVER` | `smtp` | Forced `memory` when `NODE_ENV=test` |
| `MAIL_FALLBACK_DRIVER` | `none` | `memory` allowed only non-production |
| `MAIL_TIMEOUT_MS` | `10000` | SMTP connection/send timeout |
| `MAIL_RETRY_ATTEMPTS` | `3` | Includes first attempt |
| `MAIL_RETRY_BASE_DELAY_MS` | `200` | Exponential backoff base |
| `SMTP_HOST` / `SMTP_PORT` | required / `1025` | Mailpit locally |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | optional | Auth when provided |
| `EMAIL_FROM` | `noreply@gmrlog.local` | Envelope from |
| `STORAGE_DRIVER` | `s3` | Forced `memory` in tests; **forbidden in production** |
| `STORAGE_PUBLIC_BASE_URL` | optional | Public CDN/base for object URLs |
| `STORAGE_SIGNED_URL_TTL_SECONDS` | `900` | GetObject signed URL TTL |
| `S3_*` | — | Endpoint, bucket, credentials |
| `APP_VERSION` | `dev` | Health operational meta |
| `HEALTH_CHECK_TIMEOUT_MS` | `3000` | Per-dependency probe timeout |
| `RATE_LIMIT_ENABLED` | `true` | Tests force `false` |
| `RATE_LIMIT_FAIL_OPEN` | `true` | Auth class still fail-closed |
| `RATE_LIMIT_GLOBAL_MULTIPLIER` | `1` | Incident multiplier |
| `REDIS_URL` | required | Cache + rate limit |
| `DATABASE_URL` / `DIRECT_URL` | required | Prisma |

---

## Missing config diagnostics

Example boot failure:

```text
Invalid API environment configuration. Missing or invalid keys:
  - DATABASE_URL: Required
  - JWT_SECRET: String must contain at least 32 character(s)
See docs/00_PROJECT/PLATFORM_ENV_CONFIGURATION.md
```

Do **not** log secret values in diagnostics.

---

## Related

- Freeze: [`PLATFORM_INFRASTRUCTURE_FREEZE_v1.md`](./PLATFORM_INFRASTRUCTURE_FREEZE_v1.md)
- Local template: [`.env.example`](../../.env.example)
