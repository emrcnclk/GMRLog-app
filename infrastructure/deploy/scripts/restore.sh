#!/usr/bin/env bash
# Restore from the archives backup.sh writes. Run from infrastructure/deploy/.
#
#   ./scripts/restore.sh postgres backups/postgres-20260819T030000Z.sql.gz
#   ./scripts/restore.sh redis    backups/redis-20260819T030000Z.rdb.gz
#
# Destructive, and refuses to run without CONFIRM=yes for that reason:
# the Postgres path drops and recreates the database, the Redis path replaces
# the whole keyspace, including every queued BullMQ job.
#
# Restore is the half of a backup strategy that is never exercised until it is
# needed. Rehearse it against a throwaway host before you need it — an untested
# restore is an assumption, not a plan.
set -euo pipefail

cd "$(dirname "$0")/.."

WHAT="${1:-}"
ARCHIVE="${2:-}"

if [ -z "$WHAT" ] || [ -z "$ARCHIVE" ]; then
  echo "usage: $0 <postgres|redis> <archive.gz>" >&2
  exit 1
fi

if [ ! -f "$ARCHIVE" ]; then
  echo "error: archive not found: $ARCHIVE" >&2
  exit 1
fi

if [ "${CONFIRM:-}" != "yes" ]; then
  echo "error: this destroys the current $WHAT data. Re-run with CONFIRM=yes." >&2
  exit 1
fi

ENV_FILE=".env.deploy.local"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a
  . "./$ENV_FILE"
  set +a
fi

COMPOSE=(docker compose -f docker-compose.deploy.yml --env-file "$ENV_FILE")
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-gmrlog-postgres}"
REDIS_CONTAINER="${REDIS_CONTAINER:-gmrlog-redis}"
POSTGRES_USER="${POSTGRES_USER:-gmrlog}"
POSTGRES_DB="${POSTGRES_DB:-gmrlog}"

echo "==> Stopping api and worker so nothing writes during the restore"
"${COMPOSE[@]}" stop api worker

case "$WHAT" in
  postgres)
    echo "==> Recreating database ${POSTGRES_DB}"
    # WITH (FORCE) terminates the sessions Prisma's pool leaves behind; without
    # it the DROP blocks forever behind an idle connection.
    docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d postgres \
      -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"${POSTGRES_DB}\" WITH (FORCE);"
    docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d postgres \
      -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"${POSTGRES_DB}\" OWNER \"${POSTGRES_USER}\";"

    echo "==> Loading ${ARCHIVE}"
    gunzip -c "$ARCHIVE" | docker exec -i "$POSTGRES_CONTAINER" \
      psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1
    ;;

  redis)
    echo "==> Replacing the Redis dataset from ${ARCHIVE}"
    "${COMPOSE[@]}" stop redis
    # Redis 7 with `appendonly yes` loads the AOF and ignores dump.rdb entirely.
    # Removing the AOF directory is what makes it fall back to the restored RDB,
    # after which it rewrites a fresh AOF from that state.
    docker run --rm -v gmrlog_redis_data:/data alpine:3 \
      sh -c 'rm -rf /data/appendonlydir /data/appendonly.aof /data/dump.rdb'
    gunzip -c "$ARCHIVE" | docker run --rm -i -v gmrlog_redis_data:/data alpine:3 \
      sh -c 'cat > /data/dump.rdb'
    "${COMPOSE[@]}" up -d redis
    ;;

  *)
    echo "error: unknown target '$WHAT' (expected postgres or redis)" >&2
    "${COMPOSE[@]}" up -d api worker
    exit 1
    ;;
esac

echo "==> Bringing api and worker back up"
"${COMPOSE[@]}" up -d api worker

echo "==> Restore complete. Check readiness:"
echo "    docker compose -f docker-compose.deploy.yml exec api wget -q -O- http://localhost:4000/api/v1/health/ready"
echo "==> If Postgres was restored from a dump older than the deployed code,"
echo "    re-run migrations and rebuild the search index:"
echo "    ./scripts/deploy.sh \$(cat .deployed-tag)"
