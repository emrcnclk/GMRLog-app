# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/00_PROJECT/ENVIRONMENT_VARIABLES.md`

**Status:** Approved

**Owner:** Platform Team

**Classification:** Internal Engineering Documentation

---

# Environment Variables

## Purpose

This document defines every environment variable used throughout the GMRLOG ecosystem.

All applications must read configuration from environment variables.

Hardcoded secrets, credentials, URLs, or API keys are strictly prohibited.

---

# Environment Strategy

Supported environments:

```text
development
```

```text
test
```

```text
staging
```

```text
production
```

```text
preview
```

Each environment has its own configuration.

---

# Naming Convention

All variables use:

```text
UPPER_SNAKE_CASE
```

Examples

```text
DATABASE_URL

JWT_SECRET

REDIS_URL

APP_ENV
```

---

# Root Variables

```env
NODE_ENV=

APP_ENV=

APP_NAME=GMRLOG

APP_VERSION=

LOG_LEVEL=

TZ=UTC
```

---

# Backend Variables

## Server

```env
PORT=4000

HOST=0.0.0.0

API_PREFIX=/api/v1
```

---

## Database

```env
DATABASE_URL=

DATABASE_POOL_SIZE=20

DATABASE_SSL=true

DATABASE_SHADOW_URL=
```

---

## Prisma

```env
PRISMA_LOG_LEVEL=info
```

---

## Authentication

```env
JWT_SECRET=

JWT_ALGORITHM=HS256

# Required when JWT_ALGORITHM=RS256 (PEM content or absolute file path)
JWT_PRIVATE_KEY=

JWT_PUBLIC_KEY=

JWT_ISSUER=gmrlog

JWT_ACCESS_TTL_SECONDS=900

JWT_REFRESH_TTL_SECONDS=2592000

JWT_REFRESH_TTL_REMEMBER_ME_SECONDS=7776000

PASSWORD_HASH_ROUNDS=12
```

`JWT_ALGORITHM` supports `HS256` (default) and `RS256`. Switching to RS256 is configuration-only; no code change is required when keys are provided.

---

## OAuth

### Google

```env
GOOGLE_CLIENT_ID=

GOOGLE_CLIENT_SECRET=
```

### Steam

```env
STEAM_WEB_API_KEY=

STEAM_CLIENT_ID=
```

`STEAM_WEB_API_KEY` is **required in production** and is listed in
`PRODUCTION_REQUIRED_ENV_KEYS`. Without it the backend used to fall back to
`MockSteamWebApiClient`, which serves fixture libraries, playtimes and
achievements — a production box missing the variable would present invented
data as the player's real Steam profile, and nothing downstream could tell the
difference. Boot now fails instead, from two places: env validation rejects the
environment, and `createSteamWebApiClient()` refuses to hand out a mock when
`NODE_ENV` or `APP_ENV` is `production`.

Outside production the variable stays optional and an unset key still selects
the mock client, which is what local development and the test suite run against.

(The variable was previously documented here as `STEAM_API_KEY`; that name is
not read anywhere in the backend.)

### Discord

```env
DISCORD_CLIENT_ID=

DISCORD_CLIENT_SECRET=
```

### Apple

```env
APPLE_CLIENT_ID=

APPLE_TEAM_ID=

APPLE_KEY_ID=

APPLE_PRIVATE_KEY=
```

---

# Redis

```env
REDIS_URL=

REDIS_PASSWORD=
```

---

# Storage

```env
S3_BUCKET=

S3_REGION=

S3_ACCESS_KEY=

S3_SECRET_KEY=

S3_ENDPOINT=
```

---

# CDN

```env
CDN_URL=
```

---

# Queue

```env
BULL_REDIS_URL=
```

---

# Mail

```env
SMTP_HOST=

SMTP_PORT=

SMTP_USERNAME=

SMTP_PASSWORD=

EMAIL_FROM=
```

---

# Push Notifications

```env
EXPO_ACCESS_TOKEN=

FCM_SERVER_KEY=

APNS_KEY=
```

---

# Monitoring

```env
SENTRY_DSN=

PROMETHEUS_ENABLED=true

OTEL_EXPORTER=
```

---

# Analytics

```env
POSTHOG_API_KEY=

FIREBASE_MEASUREMENT_ID=
```

---

# Frontend Variables

All public variables must begin with:

```text
EXPO_PUBLIC_
```

---

## API

```env
EXPO_PUBLIC_API_URL=

EXPO_PUBLIC_SOCKET_URL=
```

---

## Analytics

```env
EXPO_PUBLIC_POSTHOG_KEY=

EXPO_PUBLIC_FIREBASE_APP_ID=
```

---

## Feature Flags

```env
EXPO_PUBLIC_ENABLE_CHAT=true

EXPO_PUBLIC_ENABLE_TIERLISTS=true

EXPO_PUBLIC_ENABLE_AI=false
```

---

## Backend — Game Catalog Metadata (D3.25)

Every variable above this section is an `EXPO_PUBLIC_*` frontend key. The
following are **backend** keys, read by the API and worker processes via
`apps/backend/src/infrastructure/config/env.schema.ts` (`backendEnvSchema` /
`parseBackendEnv`) — see `docs/18_CATALOG/CATALOG_OPERATIONS.md` §6 for the
operational reference. Every key defaults to a safe, zero-credential value;
none is required for boot, tests, or CI.

```env
# IGDB — primary catalog provider. Enabled only when both are set.
IGDB_CLIENT_ID=
IGDB_CLIENT_SECRET=
IGDB_RATE_LIMIT_RPS=4

# Steam Store — fallback. Operator opt-in, off by default.
STEAM_STORE_METADATA_ENABLED=false
STEAM_STORE_RATE_LIMIT_RPS=1

# RAWG — implemented but off by default; see METADATA_LICENSING.md §4.
# Requires BOTH keys — either alone is a no-op.
RAWG_ENABLED=false
RAWG_API_KEY=
RAWG_RATE_LIMIT_RPS=2

# Match / enrichment thresholds
METADATA_MIN_CONFIDENCE=0.55
METADATA_COMPLETE_CONFIDENCE=0.8
METADATA_MAX_ATTEMPTS=5

# Backfill / refresh scan sizing
METADATA_BACKFILL_BATCH_SIZE=200
METADATA_REFRESH_BATCH_SIZE=500
METADATA_REFRESH_INTERVAL_DAYS=30

# Worker concurrency (bounded by provider rate limits, not CPU)
GAME_METADATA_WORKER_CONCURRENCY=2
GAME_MEDIA_WORKER_CONCURRENCY=4

# Media ingestion limits
MEDIA_INGEST_TIMEOUT_MS=15000
MEDIA_INGEST_MAX_BYTES=8388608
MEDIA_INGEST_MAX_SCREENSHOTS=12
MEDIA_INGEST_MAX_ARTWORKS=4
```

See `docs/18_CATALOG/METADATA_LICENSING.md` for why each provider is
enabled/disabled by default, and `docs/18_CATALOG/METADATA_PROVIDERS.md` for
what each variable controls.

---

# Admin Panel

```env
NEXT_PUBLIC_API_URL=

NEXT_PUBLIC_SOCKET_URL=
```

---

# Docker Variables

```env
POSTGRES_USER=

POSTGRES_PASSWORD=

POSTGRES_DB=

REDIS_PASSWORD=
```

---

# Kubernetes Secrets

Must never exist inside Git.

Secrets are injected during deployment.

---

# Secret Management

Allowed:

GitHub Secrets

AWS Secrets Manager

Google Secret Manager

Azure Key Vault

1Password Secrets Automation

---

Forbidden:

❌ Hardcoded keys

❌ Secrets in source code

❌ Secrets inside Dockerfiles

❌ Secrets committed to Git

---

# Validation

Backend validates every required variable during startup.

Application startup fails if:

* Secret missing
* URL invalid
* Required variable absent

---

# .env Files

Allowed

```text
.env.local

.env.development

.env.staging

.env.production

.env.test
```

Never commit:

```text
.env.production

.env.local
```

---

# Rotation Policy

JWT Secret

Every 90 days

API Keys

Every 180 days

Database Password

Every 180 days

OAuth Secrets

Every 365 days

Emergency rotation supported at any time.

---

# Acceptance Criteria

* Every service has documented variables.
* Secret handling policy is defined.
* Validation strategy is documented.
* Rotation policy is established.
* Public/private variables are separated.

---

# Dependencies

* SECURITY.md
* DEPLOYMENT.md
* BACKEND_ARCHITECTURE.md

---

# Related Documents

* CI_CD.md
* MONOREPO_STRUCTURE.md
* CODING_STANDARDS.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
