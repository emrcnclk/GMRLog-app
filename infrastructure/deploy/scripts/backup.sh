#!/usr/bin/env bash
# Back up everything on this host that cannot be rebuilt. Run from
# infrastructure/deploy/, by hand or from cron:
#
#   0 3 * * *  cd /opt/gmrlog/deploy && ./scripts/backup.sh >> /var/log/gmrlog-backup.log 2>&1
#
# What is backed up, and why only these two:
#   * Postgres — the product. Nothing reconstructs it.
#   * Redis    — not a pure cache here. BullMQ keeps job state in it, so losing
#                Redis loses queued metadata/media ingestion work.
# Deliberately not backed up:
#   * Meilisearch — a derived index. `pnpm repair:index` rebuilds it from Postgres.
#   * MinIO       — user uploads, which are large and change slowly; back the
#                   `gmrlog_minio_data` volume up on its own schedule (see
#                   docs/10_DEVOPS/PRODUCTION_DEPLOYMENT.md).
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE=".env.deploy.local"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a
  . "./$ENV_FILE"
  set +a
fi

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-gmrlog-postgres}"
REDIS_CONTAINER="${REDIS_CONTAINER:-gmrlog-redis}"
POSTGRES_USER="${POSTGRES_USER:-gmrlog}"
POSTGRES_DB="${POSTGRES_DB:-gmrlog}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"

PG_FILE="$BACKUP_DIR/postgres-$STAMP.sql.gz"
REDIS_FILE="$BACKUP_DIR/redis-$STAMP.rdb.gz"

echo "==> Postgres → $PG_FILE"
# `docker exec` without -t: a TTY would inject CRLF into the dump stream and
# corrupt it. The repo's older backup-postgres.sh uses -t; do not copy that.
docker exec "$POSTGRES_CONTAINER" \
  pg_dump -U "$POSTGRES_USER" --no-owner --no-privileges "$POSTGRES_DB" \
  | gzip > "$PG_FILE"

# A zero-length or truncated dump that nobody notices is worse than no dump.
if [ ! -s "$PG_FILE" ] || ! gzip -t "$PG_FILE"; then
  echo "!!! Postgres dump is empty or not a valid gzip stream: $PG_FILE" >&2
  exit 1
fi

echo "==> Redis → $REDIS_FILE"
# BGSAVE is asynchronous. rdb_bgsave_in_progress is the only reliable signal
# that the snapshot on disk is the one just asked for.
LAST_SAVE_BEFORE="$(docker exec "$REDIS_CONTAINER" redis-cli LASTSAVE | tr -d '\r')"
docker exec "$REDIS_CONTAINER" redis-cli BGSAVE >/dev/null
for _ in $(seq 1 60); do
  IN_PROGRESS="$(docker exec "$REDIS_CONTAINER" redis-cli INFO persistence \
    | tr -d '\r' | awk -F: '/^rdb_bgsave_in_progress:/ { print $2 }')"
  LAST_SAVE_NOW="$(docker exec "$REDIS_CONTAINER" redis-cli LASTSAVE | tr -d '\r')"
  if [ "$IN_PROGRESS" = "0" ] && [ "$LAST_SAVE_NOW" != "$LAST_SAVE_BEFORE" ]; then
    break
  fi
  sleep 1
done
docker exec "$REDIS_CONTAINER" cat /data/dump.rdb | gzip > "$REDIS_FILE"

if [ ! -s "$REDIS_FILE" ] || ! gzip -t "$REDIS_FILE"; then
  echo "!!! Redis snapshot is empty or not a valid gzip stream: $REDIS_FILE" >&2
  exit 1
fi

# Offsite. A backup that only exists on the host it backs up is not a backup —
# it survives a bad migration and nothing else. Set BACKUP_S3_TARGET (an
# `mc`-style alias path, e.g. offsite/gmrlog-backups) plus BACKUP_S3_ENDPOINT /
# BACKUP_S3_ACCESS_KEY / BACKUP_S3_SECRET_KEY in .env.deploy.local to enable it.
if [ -n "${BACKUP_S3_TARGET:-}" ]; then
  echo "==> Copying offsite to ${BACKUP_S3_TARGET}"
  docker run --rm \
    -v "$(cd "$BACKUP_DIR" && pwd)":/backups:ro \
    --entrypoint sh minio/mc:latest -c "
      mc alias set offsite '${BACKUP_S3_ENDPOINT:?set BACKUP_S3_ENDPOINT}' \
        '${BACKUP_S3_ACCESS_KEY:?set BACKUP_S3_ACCESS_KEY}' \
        '${BACKUP_S3_SECRET_KEY:?set BACKUP_S3_SECRET_KEY}' >/dev/null
      mc cp '/backups/$(basename "$PG_FILE")' '${BACKUP_S3_TARGET}/'
      mc cp '/backups/$(basename "$REDIS_FILE")' '${BACKUP_S3_TARGET}/'
    "
fi

echo "==> Pruning local backups older than ${BACKUP_RETENTION_DAYS} days"
find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'postgres-*.sql.gz' -o -name 'redis-*.rdb.gz' \) \
  -mtime "+${BACKUP_RETENTION_DAYS}" -print -delete

echo "==> Backup complete."
ls -lh "$PG_FILE" "$REDIS_FILE"
