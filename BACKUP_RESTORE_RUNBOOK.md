# Backup & restore runbook

Governs the production host's data protection, via
[`infrastructure/deploy/scripts/backup.sh`](infrastructure/deploy/scripts/backup.sh) and
[`infrastructure/deploy/scripts/restore.sh`](infrastructure/deploy/scripts/restore.sh).
Both are real, working scripts already in the repo — this runbook explains when and how
to run them, not new tooling.

## Current state — what's backed up and what isn't

| Data                                                                                     | Backed up?                 | Mechanism                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Postgres (the product — profiles, DNA matches, everything)                               | Yes                        | `pg_dump` → gzip                                                                                                                                                                                                                                                     |
| Redis (BullMQ job state, **not just a cache** — media/metadata ingestion jobs live here) | Yes                        | `BGSAVE` → RDB snapshot → gzip                                                                                                                                                                                                                                       |
| Meilisearch index                                                                        | **No, deliberately**       | It's a derived index — `pnpm repair:index` rebuilds it from Postgres, so backing it up would be backing up a cache                                                                                                                                                   |
| MinIO (user-uploaded media)                                                              | **No, not by `backup.sh`** | Large, changes slowly — back the `gmrlog_minio_data` Docker volume up on its own schedule/tool (e.g. `restic`/`rclone` against the volume, or MinIO's own bucket replication). Not scripted in this repo yet — flagged as a gap below, not silently assumed handled. |

Both `pg_dump` and the Redis snapshot are validated immediately after writing (gzip
integrity check + non-empty check) — `backup.sh` exits non-zero rather than leaving a
silently-corrupt backup file on disk.

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
container after each local backup succeeds.

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

## Disaster recovery targets

| Metric                             | Target   | Basis                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RTO** (time to recovery)         | ≤ 1 hour | `restore.sh` itself completes in minutes; the 1-hour budget covers noticing the incident, choosing the right archive, and running the procedure under pressure — not the script's own runtime                                                                                                                                                             |
| **RPO** (recovery point objective) | < 1 hour | Achieved by the pre-migration backup (immediately before any schema-changing release) plus the daily 03:00 cron. **Between two daily backups on an otherwise-quiet day, RPO can be as high as ~24h** — if sub-hour RPO matters more than that gap allows, tighten the cron interval (e.g. hourly) rather than assuming the daily default already meets it |

## Test restore dry-run — how to rehearse safely

Never rehearse against the production database. Use the local production-parity stack
(see [`STAGING_TEST.md`](STAGING_TEST.md)) as the throwaway target:

```bash
# 1. Copy a real production backup archive down to your workstation/staging host
scp deploy@api.gmrlog.com:/opt/gmrlog/deploy/backups/postgres-<stamp>.sql.gz ./backups/

# 2. Bring up the local production-parity stack (fresh, empty database)
pnpm docker:prod:up

# 3. Restore into it — this is a THROWAWAY database, not production
docker exec -i gmrlog-postgres psql -U gmrlog -d postgres \
  -c "DROP DATABASE IF EXISTS gmrlog WITH (FORCE);" \
  -c "CREATE DATABASE gmrlog OWNER gmrlog;"
gunzip -c backups/postgres-<stamp>.sql.gz | \
  docker exec -i gmrlog-postgres psql -U gmrlog -d gmrlog

# 4. Verify it actually restored real data, not just "the command exited 0"
docker exec -i gmrlog-postgres psql -U gmrlog -d gmrlog \
  -c "SELECT count(*) FROM \"User\";"   # adjust table name to the actual Prisma schema
curl -fsS http://localhost/api/v1/health/ready

# 5. Tear down the throwaway stack — do not leave a copy of a production dump
#    sitting on a laptop or staging host longer than the test needs
pnpm docker:prod:down -v
```

Run this monthly at minimum, and any time the Prisma schema changes in a way that isn't
purely additive (see the migration-rollback discussion in
[`PRODUCTION_DEPLOY.md`](PRODUCTION_DEPLOY.md) — a schema-breaking migration is exactly
the scenario this restore path exists for).

## Honest limits

- **MinIO/media backup is not scripted.** `backup.sh` explicitly does not touch it. If
  user-uploaded media matters for your RPO/RTO targets, that's a gap to close (volume
  snapshot, `mc mirror` to offsite, etc.) before those targets can be said to cover the
  whole product, not just the database.
- **Restore has not been rehearsed against a copy of real production data as part of
  producing this runbook** — the procedure above is read directly from
  `restore.sh`/`backup.sh`'s logic and is internally consistent with it, but "the script
  is correct" and "we've proven the restore works end-to-end on real data" are different
  claims. Do the dry-run above before relying on this under real incident pressure.
- Offsite backup (`BACKUP_S3_TARGET`) is off by default — check `.env.deploy.local`
  before assuming an offsite copy exists.
