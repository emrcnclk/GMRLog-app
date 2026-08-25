#!/usr/bin/env bash
# Restore MinIO media from an archive backup-minio.sh wrote. Run from
# infrastructure/deploy/.
#
#   ./scripts/restore-minio.sh backups/minio-gmrlog-20260819T040000Z.tar.gz
#
# Unlike restore.sh's Postgres/Redis paths, this is additive by default: `mc
# mirror` overwrites objects that exist in both the archive and the live
# bucket, but does NOT delete objects that exist only in the bucket. That's
# deliberate — "restore" here means "recover what's missing," not "force the
# bucket back to exactly this archive's contents," which would silently
# delete anything uploaded after the backup was taken. Pass --exact-mirror to
# get that stricter behavior if you actually want it.
set -euo pipefail

cd "$(dirname "$0")/.."

ARCHIVE="${1:-}"
EXACT_MIRROR="false"
if [ "${2:-}" = "--exact-mirror" ]; then
  EXACT_MIRROR="true"
fi

if [ -z "$ARCHIVE" ]; then
  echo "usage: $0 <archive.tar.gz> [--exact-mirror]" >&2
  exit 1
fi

if [ ! -f "$ARCHIVE" ]; then
  echo "error: archive not found: $ARCHIVE" >&2
  exit 1
fi

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
NETWORK="${MINIO_BACKUP_NETWORK:-gmrlog-network}"

if [ "${CONFIRM:-}" != "yes" ]; then
  echo "error: this writes into the live '$S3_BUCKET' bucket. Re-run with CONFIRM=yes." >&2
  exit 1
fi

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

echo "==> Extracting $ARCHIVE -> $WORKDIR"
tar -C "$WORKDIR" -xzf "$ARCHIVE"

MIRROR_FLAGS="--quiet"
if [ "$EXACT_MIRROR" = "true" ]; then
  echo "==> --exact-mirror: objects in '$S3_BUCKET' not present in the archive WILL be deleted."
  MIRROR_FLAGS="$MIRROR_FLAGS --remove"
fi

echo "==> Restoring into MinIO bucket '$S3_BUCKET'"
docker run --rm \
  --network "$NETWORK" \
  -v "$WORKDIR":/mirror:ro \
  --entrypoint sh minio/mc:latest -c "
    set -e
    mc alias set dst http://minio:9000 '$MINIO_ROOT_USER' '$MINIO_ROOT_PASSWORD' >/dev/null
    mc mb -p 'dst/$S3_BUCKET' >/dev/null 2>&1 || true
    mc mirror $MIRROR_FLAGS /mirror 'dst/$S3_BUCKET'
  "

echo "==> Restore complete. $S3_BUCKET now contains the archive's objects"
if [ "$EXACT_MIRROR" != "true" ]; then
  echo "    (merged with whatever already existed — nothing was deleted)."
fi
