# Rollback Guide

## When to roll back

- Ready probe degraded after deploy
- Elevated 5xx / Sentry spike
- Smoke suite FAIL on upload, search, password, or queue
- Bad migration or data corruption

## Application rollback (compose)

```bash
# Stop current api/worker/nginx
pnpm docker:prod:down

# Redeploy previous image tag / git SHA
git checkout <previous-sha>
pnpm docker:prod:up

# Verify
curl -fsS http://127.0.0.1:4000/api/v1/health/ready
pnpm release:smoke
```

Keep previous container images tagged (`gmrlog-api:<sha>`) so rollback does not require a rebuild when possible.

## Database rollback

1. Stop writers (scale api/worker to 0 or `docker:prod:down`).
2. Restore last known-good dump:

```bash
# Example — restore into primary DB (destructive)
sh infrastructure/docker/scripts/restore-postgres.sh backups/gmrlog-<stamp>.sql.gz gmrlog
```

3. Prefer restore-to-side-DB then cut over when possible (`RESTORE_DB` pattern in `smoke-backup.mjs`).
4. Re-run migrations only if the restored schema expects them.

## Redis / queues

- BullMQ failed jobs persist (`removeOnFail: false`).
- After rollback, drain poison jobs or restart workers.
- Password-reset tokens are Redis TTL keys — safe to lose on Redis flush (users re-request).

## Object storage

- Orphan objects may remain after failed confirms; maintenance `media.purge` / upload cleanup job removes expired grants.
- Do not delete the bucket on rollback.

## Meilisearch

- Index drift after rollback: re-run domain writes or a future reindex job.
- Search falls back to SQL only when `MEILI_HOST` is empty (not allowed in production).

## Communication

Record: incident time, rolled-back SHA, dump file used, smoke result (`PASS`/`FAIL`).
