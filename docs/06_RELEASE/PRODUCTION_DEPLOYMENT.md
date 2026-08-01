# Production Deployment Guide

**Audience:** operators deploying GMRLOG API + worker  
**Companion:** `ROLLBACK_GUIDE.md`, `OPERATIONS_GUIDE.md`

## Prerequisites

- Docker Engine + Compose v2
- Node 22+ / pnpm 9+ (for image build context)
- TLS certificates under `infrastructure/docker/nginx/certs/`  
  Generate locally: `sh infrastructure/docker/nginx/generate-certs.sh`
- Explicit production secrets (never commit real values)

## Required environment (fail-closed)

Boot rejects production when any of these are missing from process env:

| Key | Purpose |
|-----|---------|
| `DATABASE_URL` | Postgres |
| `REDIS_URL` | Redis ≥5 (BullMQ) |
| `JWT_SECRET` | ≥32 chars, not the dev default |
| `S3_BUCKET` | Object storage bucket |
| `S3_ENDPOINT` | S3-compatible endpoint |
| `SMTP_HOST` | Mail transport |
| `MEILI_HOST` | Meilisearch |

Template: `infrastructure/docker/.env.production.example`

## Local production-parity

```bash
# 1. Infra + API + worker + nginx
pnpm docker:prod:up

# 2. Smoke (API must be reachable on :4000 or via nginx)
pnpm release:smoke

# 3. Tear down
pnpm docker:prod:down
```

Compose files:

- `infrastructure/docker/docker-compose.yml` — postgres, redis, minio, meilisearch, mailpit
- `infrastructure/docker/docker-compose.prod.yml` — api, worker, nginx, minio-init

## Manual process (without full compose app stack)

```bash
pnpm docker:up
pnpm --filter @gmrlog/database generate
# apply migrations as documented in database package
pnpm --filter @gmrlog/backend build
pnpm --filter @gmrlog/backend start
pnpm --filter @gmrlog/backend worker
```

Set `MEILI_HOST`, `S3_*`, `REDIS_URL`, `SMTP_HOST` for local parity with smoke suite.

## Health gates

| Probe | Path | Meaning |
|-------|------|---------|
| Liveness | `GET /api/v1/health/live` | Process up |
| Health | `GET /api/v1/health` | Version / uptime |
| Readiness | `GET /api/v1/health/ready` | PG + Redis + configured MinIO + Meili |

Nginx healthcheck targets `/api/v1/health/live`.

## Edge (nginx)

- HTTP → HTTPS redirect
- HSTS, CSP, X-Frame-Options, nosniff
- Proxies to `api:4000`
- Forwards `X-Gmrlog-Request-Id`

## Post-deploy checklist

1. `/health/ready` returns `checks.database|redis|storage|meili = up`
2. `pnpm release:smoke` → `PASS`
3. Metrics: `GET /api/v1/metrics` (optional `x-metrics-token`)
4. Backup smoke: `pnpm release:backup`
