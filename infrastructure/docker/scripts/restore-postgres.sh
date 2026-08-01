#!/usr/bin/env sh
# Restore a gzipped pg_dump into the running compose Postgres (D3.20).
# Usage: sh infrastructure/docker/scripts/restore-postgres.sh backups/gmrlog-....sql.gz [target_db]
set -eu
ARCHIVE="${1:?archive path required}"
TARGET_DB="${2:-gmrlog}"
CONTAINER="${POSTGRES_CONTAINER:-gmrlog-postgres}"
USER_NAME="${POSTGRES_USER:-gmrlog}"

if [ ! -f "$ARCHIVE" ]; then
  echo "Archive not found: $ARCHIVE" >&2
  exit 1
fi

echo "Restoring $ARCHIVE → $TARGET_DB on $CONTAINER"
gunzip -c "$ARCHIVE" | docker exec -i "$CONTAINER" psql -U "$USER_NAME" -d "$TARGET_DB"
echo "Restore complete."
