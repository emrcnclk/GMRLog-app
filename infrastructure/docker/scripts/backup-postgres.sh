#!/usr/bin/env sh
# Postgres backup for local/prod-parity compose (D3.19).
set -eu
CONTAINER="${POSTGRES_CONTAINER:-gmrlog-postgres}"
USER_NAME="${POSTGRES_USER:-gmrlog}"
DB_NAME="${POSTGRES_DB:-gmrlog}"
OUT_DIR="${BACKUP_DIR:-./backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/gmrlog-$STAMP.sql.gz"
docker exec -t "$CONTAINER" pg_dump -U "$USER_NAME" "$DB_NAME" | gzip > "$FILE"
echo "Backup written: $FILE"
