# Operations Guide

## Services

| Service | Role | Local port |
|---------|------|------------|
| api | Nest HTTP | 4000 |
| worker | BullMQ consumers | — |
| postgres | Primary store | 5432 |
| redis | Sessions meta · rate limit · BullMQ · password reset | 6379 |
| minio | S3-compatible media | 9000 / 9001 |
| meilisearch | Search index | 7700 |
| mailpit | Dev SMTP + UI | 1025 / 8025 |
| nginx | TLS edge | 80 / 443 |

## Day-2 commands

```bash
pnpm docker:up                 # infra only
pnpm docker:prod:up            # full prod-parity
pnpm release:smoke             # core smoke chain
pnpm release:smoke:full        # PowerShell full suite (+ perf/backup)
pnpm release:perf              # p50/p95/p99
pnpm release:backup            # dump + restore smoke
pnpm db:backup                 # pg_dump.gz
```

## Logging

HTTP (Pino structured):

- `requestId` — Fastify id / `x-gmrlog-request-id`
- `correlationId` — `x-gmrlog-correlation-id` or request id
- `durationMs` — request logging interceptor
- 5xx stacks via exception filter

Worker:

- `bullmq.job.failed` and processor event names (`media.image.process.*`, search upsert, fanout)

Optional file rotation: `LOG_FILE=...` (pino-roll).

## Metrics & errors

- `GET /api/v1/metrics` — Prometheus text
- Optional `METRICS_TOKEN` → header `x-metrics-token`
- `SENTRY_DSN` — optional Node SDK init

## Rate limits (S1 classes)

| Class | Limit | Notes |
|-------|-------|-------|
| auth | 5 / min | login, forgot, reset — fail-closed if Redis down |
| upload | 30 / min | explicit on uploads controller |
| search | 120 / min | |
| write / read | 180 / 300 | defaults |

## Redis / Postgres host conflicts (Windows)

- If localhost:5432 is a **native Windows PostgreSQL** (`lc_messages=tr-TR`), Prisma error parsing breaks and migrations appear as nonsense column names (`sütunu`). Point `DATABASE_URL` at Docker (`POSTGRES_PORT=5433`).
- If localhost:6379 is Redis **&lt; 5**, BullMQ workers fail. Use Compose `redis:7-alpine`.

## Backups

- Dump: `infrastructure/docker/scripts/backup-postgres.sh`
- Restore: `infrastructure/docker/scripts/restore-postgres.sh <file.sql.gz> [db]`
- Strategy overview: `docs/10_DEVOPS/BACKUP_STRATEGY.md`

## Incidents

1. Check `/health/ready` checks map
2. Check worker container / BullMQ keys
3. Check MinIO + Meili health endpoints
4. Run `pnpm release:smoke`
5. Follow `ROLLBACK_GUIDE.md` if needed
