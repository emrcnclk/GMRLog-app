# Backup & restore runbook

Governs the production host's data protection, via
[`infrastructure/deploy/scripts/backup.sh`](infrastructure/deploy/scripts/backup.sh),
[`infrastructure/deploy/scripts/restore.sh`](infrastructure/deploy/scripts/restore.sh),
and — for the one data class those two don't cover —
[`infrastructure/deploy/scripts/backup-minio.sh`](infrastructure/deploy/scripts/backup-minio.sh) /
[`infrastructure/deploy/scripts/restore-minio.sh`](infrastructure/deploy/scripts/restore-minio.sh).

## Current state — what's backed up and what isn't

| Data                                                                                     | Backed up?           | Mechanism                                                                                                          |
| ---------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Postgres (the product — profiles, DNA matches, everything)                               | Yes                  | `pg_dump` → gzip (`backup.sh`)                                                                                     |
| Redis (BullMQ job state, **not just a cache** — media/metadata ingestion jobs live here) | Yes                  | `BGSAVE` → RDB snapshot → gzip (`backup.sh`)                                                                       |
| MinIO (user-uploaded media)                                                              | Yes                  | `mc mirror` → tar → gzip (`backup-minio.sh`), on its own schedule — see below                                      |
| Meilisearch index                                                                        | **No, deliberately** | It's a derived index — `pnpm repair:index` rebuilds it from Postgres, so backing it up would be backing up a cache |

`pg_dump`, the Redis snapshot, and the MinIO archive are all validated immediately
after writing (gzip integrity check + non-empty check) — each script exits non-zero
rather than leaving a silently-corrupt backup file on disk.

## Backup strategy

**Automated daily backup**, via cron on the host:

```bash
crontab -e
# add:
0 3 * * *  cd /opt/gmrlog/deploy && ./scripts/backup.sh >> /var/log/gmrlog-backup.log 2>&1
```

`deploy.sh` also runs `backup.sh` automatically **before every release's migration
step** (skipped only on a true first install with no running Postgres container yet) —
so in practice you get a backup both on a schedule and immediately before every schema
change, which is exactly the moment a backup matters most.

**Retention**: `BACKUP_RETENTION_DAYS` in `.env.deploy.local`, default 14 days — local
files older than that are pruned at the end of every `backup.sh` run. Set it to 30 if
you want a month of history:

```
BACKUP_RETENTION_DAYS=30
```

**Offsite copy** — strongly recommended, optional, off by default. A backup that only
lives on the host it backs up survives a bad migration and nothing else (a lost host
loses the backups with it). Enable by setting, in `.env.deploy.local`:

```
BACKUP_S3_TARGET=offsite/gmrlog-backups
BACKUP_S3_ENDPOINT=https://s3.your-provider.com
BACKUP_S3_ACCESS_KEY=...
BACKUP_S3_SECRET_KEY=...
```

`backup.sh` then copies both archives to that target via a throwaway `minio/mc`
container after each local backup succeeds. `backup-minio.sh` reuses the same
`BACKUP_S3_*` variables for its own offsite copy — one set of credentials covers all
three archives.

**MinIO media — weekly, separate cron slot.** Media is large and changes slowly, so it
doesn't need Postgres's daily cadence:

```bash
crontab -e
# add:
0 4 * * 0  cd /opt/gmrlog/deploy && ./scripts/backup-minio.sh >> /var/log/gmrlog-backup-minio.log 2>&1
```

Unlike Postgres/Redis, `backup-minio.sh` is **not** run automatically by `deploy.sh` —
a release doesn't touch media the way a migration touches schema, so there's no
equivalent "back up right before this could break something" moment for it. Its cron
entry is the only schedule it runs on; set one explicitly, it isn't implied by anything
else in this stack.

**Test restore weekly** — see the dry-run section below. An untested restore procedure
is an assumption, not a plan; this is the runbook's own stated position
(`restore.sh`'s header comment says the same thing), not an aspiration added here.

## Restore procedure

**This is destructive.** `restore.sh` drops and recreates the target database (Postgres
path) or replaces the entire keyspace (Redis path) — it refuses to run at all without
`CONFIRM=yes`, which is deliberate friction, not a bug to work around with a wrapper
script.

```bash
cd /opt/gmrlog/deploy

# Postgres — stops api/worker first (nothing should write mid-restore), drops
# and recreates the database, then loads the dump
CONFIRM=yes ./scripts/restore.sh postgres backups/postgres-20260819T030000Z.sql.gz

# Redis — replaces the AOF/RDB state entirely, including every queued BullMQ job
CONFIRM=yes ./scripts/restore.sh redis backups/redis-20260819T030000Z.rdb.gz
```

Both paths:

1. Stop `api` and `worker` (so nothing writes during the restore)
2. Perform the destructive restore
3. Bring `api` and `worker` back up
4. Print the readiness check command to confirm the stack came back healthy

**If the restored Postgres dump predates the currently-deployed code's migrations**,
re-run migrations and rebuild the search index afterward — `restore.sh` prints the exact
command it needs (`./scripts/deploy.sh $(cat .deployed-tag)`), since a dump taken before
a schema migration doesn't have that migration's columns/tables.

**MinIO media** — `restore-minio.sh` is deliberately _not_ destructive by default. It
`mc mirror`s the archive's objects back into the live bucket, overwriting anything with
the same key but leaving everything else in the bucket untouched — recovering what's
missing, not forcing the bucket back to exactly one point in time (which would delete
anything a user uploaded after the backup was taken):

```bash
CONFIRM=yes ./scripts/restore-minio.sh backups/minio-gmrlog-20260819T040000Z.tar.gz
```

Pass `--exact-mirror` only if you actually want bucket-exact parity with the archive —
that mode does delete objects the archive doesn't have:

```bash
CONFIRM=yes ./scripts/restore-minio.sh backups/minio-gmrlog-20260819T040000Z.tar.gz --exact-mirror
```

## Disaster recovery targets

| Metric                             | Target   | Basis                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RTO** (time to recovery)         | ≤ 1 hour | `restore.sh` itself completes in minutes; the 1-hour budget covers noticing the incident, choosing the right archive, and running the procedure under pressure — not the script's own runtime                                                                                                                                                             |
| **RPO** (recovery point objective) | < 1 hour | Achieved by the pre-migration backup (immediately before any schema-changing release) plus the daily 03:00 cron. **Between two daily backups on an otherwise-quiet day, RPO can be as high as ~24h** — if sub-hour RPO matters more than that gap allows, tighten the cron interval (e.g. hourly) rather than assuming the daily default already meets it |

## Test restore dry-run — how to rehearse safely

Never rehearse against the production database. Use the local production-parity stack
(see [`STAGING_TEST.md`](STAGING_TEST.md)) as the throwaway target —
[`infrastructure/docker/scripts/restore-dry-run.sh`](infrastructure/docker/scripts/restore-dry-run.sh)
scripts the whole rehearsal so "run it monthly at minimum" is one command, not a
paragraph of manual steps that quietly stops happening:

```bash
# 1. Copy a real production backup archive down to your workstation/staging host
#    (the only step that touches production — everything after this is local)
scp deploy@api.gmrlog.com:/opt/gmrlog/deploy/backups/postgres-<stamp>.sql.gz ./backups/

# 2. Run the dry-run script
sh infrastructure/docker/scripts/restore-dry-run.sh backups/postgres-<stamp>.sql.gz
```

It brings up the local production-parity stack if it isn't already running, runs the
**exact same DROP DATABASE / CREATE DATABASE / psql load sequence**
`infrastructure/deploy/scripts/restore.sh` runs on the real host (so a pass here is
evidence about the real restore procedure, not a lookalike), restarts `api`/`worker`,
polls `/api/v1/health/ready`, and prints the restored database's table list so you can
spot-check that real rows came back rather than an empty schema:

```bash
docker exec gmrlog-postgres psql -U gmrlog -d gmrlog -c 'SELECT count(*) FROM "User";'
```

It deliberately does **not** tear the stack down afterward — inspect the result, then
tear down yourself when satisfied:

```bash
pnpm docker:prod:down -v
```

Do not leave a copy of a production dump sitting on a laptop or staging host longer than
the test needs — delete `backups/postgres-<stamp>.sql.gz` once the dry run is done.

Run this monthly at minimum, and any time the Prisma schema changes in a way that isn't
purely additive (see the migration-rollback discussion in
[`PRODUCTION_DEPLOY.md`](PRODUCTION_DEPLOY.md) — a schema-breaking migration is exactly
the scenario this restore path exists for).

## Honest limits

- **The restore-dry-run script has not itself been run against a copy of real
  production data.** It was written by reading `restore.sh`'s exact command sequence and
  reproducing it against the local production-parity stack, so it's internally
  consistent with the real procedure — but "the script is correct" and "we've watched it
  restore real production data end to end" are different claims, and only the second one
  retires this note. Run it for real, on a real archive, before trusting it under actual
  incident pressure.
- **`backup-minio.sh`/`restore-minio.sh` are new and have not been exercised against a
  production-sized bucket.** `mc mirror` is MinIO's own supported tool for exactly this,
  so the mechanism is sound, but "sound mechanism" and "tested at your actual media
  volume" are different claims — time a real run before assuming the weekly cron window
  is long enough for it.
- Offsite backup (`BACKUP_S3_TARGET`) is off by default for all three archive types —
  check `.env.deploy.local` before assuming an offsite copy exists.
