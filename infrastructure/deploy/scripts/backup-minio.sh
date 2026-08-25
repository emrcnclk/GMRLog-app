#!/usr/bin/env bash
# Back up MinIO's user-uploaded media — the data class backup.sh explicitly
# does not cover (see BACKUP_RESTORE_RUNBOOK.md's "Current state" table: media
# is large and changes slowly, so it gets its own schedule rather than piggy-
# backing on backup.sh's daily/pre-migration run).
#
# Run from infrastructure/deploy/, by hand or from cron. A weekly cadence is a
# reasonable default — media doesn't carry the same "must survive every
# migration" urgency Postgres does:
#
#   0 4 * * 0  cd /opt/gmrlog/deploy && ./scripts/backup-minio.sh >> /var/log/gmrlog-backup-minio.log 2>&1
#
# What it does: mirrors every object in $S3_BUCKET out of MinIO with `mc
# mirror`, over the compose network — never touches the `gmrlog_minio_data`
# volume directly, so it doesn't need to know or care how MinIO lays files out
# on disk. The mirrored tree is then tarred, gzipped, and validated before
# being kept, the same way backup.sh validates its Postgres/Redis archives.
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE=".env.deploy.local"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a
  . "./$ENV_FILE"
  set +a
fi

: "${MINIO_ROOT_USER:?set MINIO_ROOT_USER}"
: "${MINIO_ROOT_PASSWORD:?set MINIO_ROOT_PASSWORD}"
S3_BUCKET="${S3_BUCKET:-gmrlog}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
# The compose file names the network explicitly (`networks: gmrlog-network:
# name: gmrlog-network`), the same way it names every container — so this is
# not derived from a Compose project prefix and doesn't need one.
NETWORK="${MINIO_BACKUP_NETWORK:-gmrlog-network}"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

mkdir -p "$BACKUP_DIR"
ARCHIVE="$BACKUP_DIR/minio-$S3_BUCKET-$STAMP.tar.gz"

echo "==> Mirroring MinIO bucket '$S3_BUCKET' -> $WORKDIR"
docker run --rm \
  --network "$NETWORK" \
  -v "$WORKDIR":/mirror \
  --entrypoint sh minio/mc:latest -c "
    set -e
    mc alias set src http://minio:9000 '$MINIO_ROOT_USER' '$MINIO_ROOT_PASSWORD' >/dev/null
    mc mirror --quiet 'src/$S3_BUCKET' /mirror
  "

echo "==> Archiving -> $ARCHIVE"
tar -C "$WORKDIR" -czf "$ARCHIVE" .

# A zero-length or truncated archive that nobody notices is worse than no
# archive — same reasoning backup.sh applies to its two archives.
if [ ! -s "$ARCHIVE" ] || ! gzip -t "$ARCHIVE"; then
  echo "!!! MinIO archive is empty or not a valid gzip stream: $ARCHIVE" >&2
  exit 1
fi

# Offsite copy — reuses the same BACKUP_S3_* target backup.sh uses for
# Postgres/Redis, so one set of offsite credentials covers all three.
if [ -n "${BACKUP_S3_TARGET:-}" ]; then
  echo "==> Copying offsite to ${BACKUP_S3_TARGET}"
  docker run --rm \
    -v "$(cd "$BACKUP_DIR" && pwd)":/backups:ro \
    --entrypoint sh minio/mc:latest -c "
      mc alias set offsite '${BACKUP_S3_ENDPOINT:?set BACKUP_S3_ENDPOINT}' \
        '${BACKUP_S3_ACCESS_KEY:?set BACKUP_S3_ACCESS_KEY}' \
        '${BACKUP_S3_SECRET_KEY:?set BACKUP_S3_SECRET_KEY}' >/dev/null
      mc cp '/backups/$(basename "$ARCHIVE")' '${BACKUP_S3_TARGET}/'
    "
fi

echo "==> Pruning local MinIO backups older than ${BACKUP_RETENTION_DAYS} days"
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'minio-*.tar.gz' \
  -mtime "+${BACKUP_RETENTION_DAYS}" -print -delete

echo "==> Backup complete."
ls -lh "$ARCHIVE"
