# Staging test runbook — local production-parity stack

Exercises the exact same images, migration path, and nginx/TLS edge as production,
without touching a real host. This is the local **production-parity** stack
(`infrastructure/docker/docker-compose.yml` + `.prod.yml` overlay), not the remote-only
`infrastructure/deploy/docker-compose.deploy.yml` — that one hard-requires a real domain
and Let's Encrypt and isn't runnable on a laptop. Same containers, same Dockerfile, same
`prisma migrate deploy`; different TLS (self-signed) and no Let's Encrypt/certbot.

Run this before every tagged release, and any time `apps/backend/Dockerfile`,
`docker-compose.prod.yml`, or a migration changes.

## Prerequisites

| Tool                                            | Check                    |
| ----------------------------------------------- | ------------------------ |
| Docker Desktop / Docker Engine ≥ 24             | `docker --version`       |
| Docker Compose v2 (bundled with Docker Desktop) | `docker compose version` |
| curl                                            | `curl --version`         |
| jq                                              | `jq --version`           |
| openssl (for the self-signed cert)              | `openssl version`        |

Free disk: the build stage compiles the whole backend image; budget ~4 GB free before
`docker:prod:up --build`.

## 1. Configure the environment

```bash
pnpm docker:prod:init      # copies .env.production.example → .env.production.local
```

Edit `infrastructure/docker/.env.production.local` (gitignored) and replace every
placeholder the file flags — at minimum `POSTGRES_PASSWORD`, `JWT_SECRET`,
`MINIO_ROOT_PASSWORD`/`S3_SECRET_KEY`, `MEILI_API_KEY`, and `STEAM_WEB_API_KEY` (the
backend refuses to boot without a real Steam key — get a free one at
<https://steamcommunity.com/dev/apikey>, or use any 32-hex-char throwaway value if you
only need the process to start, not real Steam calls to succeed).

```bash
openssl rand -base64 24    # POSTGRES_PASSWORD, MINIO_ROOT_PASSWORD
openssl rand -base64 48    # JWT_SECRET
openssl rand -base64 24    # MEILI_API_KEY
```

Generate the self-signed nginx certificate (one-time, unless you delete
`infrastructure/docker/nginx/certs/`):

```bash
sh infrastructure/docker/nginx/generate-certs.sh
```

## 2. Bring the stack up

```bash
pnpm docker:prod:up
```

This runs `preflight-prod-env.mjs` first — it hard-fails on any remaining placeholder
value, so a config mistake is caught before a single container starts, not discovered
as a runtime 500. Then it builds the backend image from the current checkout and starts
postgres, redis, minio (+ minio-init), meilisearch, api, worker, and nginx.

`api` and `worker` both carry Docker healthchecks with `start_period: 30s` — expect the
first `docker compose ps` right after `up` to show them as `starting`, not `healthy`.

## 3. Wait for health, then verify every service

```bash
# Poll until every service reports healthy (or unhealthy — this loop will hang
# forever on a service with no healthcheck, so cap it manually if you're scripting it)
until [ "$(docker inspect -f '{{.State.Health.Status}}' gmrlog-api 2>/dev/null)" = "healthy" ]; do
  sleep 3
  echo "waiting on api..."
done
```

Then confirm each service individually:

```bash
docker exec gmrlog-postgres pg_isready -U gmrlog -d gmrlog
docker exec gmrlog-redis redis-cli ping                       # expect PONG
docker exec gmrlog-meilisearch wget -qO- http://localhost:7700/health
curl -fsS http://localhost:9000/minio/health/live              # minio
docker compose -f infrastructure/docker/docker-compose.yml \
  -f infrastructure/docker/docker-compose.prod.yml ps          # everything at a glance
```

## 4. Smoke tests against the API

The backend listens behind nginx on `https://localhost` (self-signed — every curl below
needs `-k`). `/health/live` never touches a dependency; `/health/ready` checks Postgres,
Redis, MinIO and Meilisearch and returns 503 if any of them is down.

```bash
# Liveness — should always be 200 once the process is up
curl -ksS https://localhost/api/v1/health/live | jq .

# Readiness — 200 once every dependency answers, 503 with a per-service
# breakdown otherwise
curl -ksS https://localhost/api/v1/health/ready | jq .
```

Expected `/health/ready` body once everything is up:

```json
{
  "status": "ok",
  "checks": { "database": "up", "redis": "up", "storage": "up", "meili": "up" },
  "version": "1.0.0-rc2",
  "environment": "production"
}
```

Register a throwaway user to prove the full write path (Postgres write, password
hashing, JWT issuance) works end to end:

```bash
curl -ksS -X POST https://localhost/api/v1/sessions/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "smoke-test@staging.gmrlog.local",
    "handle": "smoketest",
    "password": "SmokeTestPass12"
  }' | jq .
```

A 201 with `accessToken`/`refreshToken` in the body means registration, hashing, and
session issuance all work. A validation 400 usually means the request body doesn't
match `sessionRegisterSchema` in `packages/validators` — check that first before
assuming the service is broken.

## 5. Rollback test — restore from backup

Proves the backup/restore path (see [`BACKUP_RESTORE_RUNBOOK.md`](BACKUP_RESTORE_RUNBOOK.md)
for the full procedure) actually works before you need it in production.

```bash
# 1. Take a real backup of the current staging state
cd infrastructure/docker && sh scripts/backup-postgres.sh   # or pg_dump directly if
                                                              # this stack predates the
                                                              # scripted helper — check
                                                              # the script exists first

# 2. Register a second user so there's a detectable "before restore" delta
curl -ksS -X POST https://localhost/api/v1/sessions/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"post-backup@staging.gmrlog.local","handle":"postbackup","password":"SmokeTestPass12"}'

# 3. Stop the stack
pnpm docker:prod:down

# 4. Restore from the backup taken in step 1 (before "post-backup" existed)
sh infrastructure/docker/scripts/restore-postgres.sh <the-dump-file-from-step-1>

# 5. Bring it back up and verify
pnpm docker:prod:up
curl -ksS https://localhost/api/v1/health/ready | jq .

# 6. Confirm the rollback actually rolled back: log in as the FIRST user
#    (should succeed) and the "post-backup" user (should fail — it never
#    existed in the restored dump)
curl -ksS -X POST https://localhost/api/v1/sessions \
  -H 'Content-Type: application/json' \
  -d '{"email":"post-backup@staging.gmrlog.local","password":"SmokeTestPass12"}'
# expect 401 — proves the restore actually replaced state rather than merging
```

## Teardown

```bash
pnpm docker:prod:down
```

Volumes (`gmrlog_postgres_data`, `gmrlog_redis_data`, `gmrlog_minio_data`) persist
across `down`. Add `-v` to `docker compose ... down` if you want a genuinely clean slate
for the next run — do this before re-running the rollback test above, or the "before"
state from a previous run will still be there.

## Honest limits

- This validates the container/migration/TLS-plumbing path, not real Let's Encrypt
  issuance — that only happens against the real host's public DNS
  (see [`PRODUCTION_DEPLOY.md`](PRODUCTION_DEPLOY.md)).
- `docker:prod:up --build` rebuilds the image locally rather than pulling the GHCR image
  the real deploy uses. It proves the Dockerfile and compose wiring work; it does not
  prove the exact artifact CI built is the one running.
