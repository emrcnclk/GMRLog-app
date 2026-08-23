#!/usr/bin/env sh
# Rehearse a Postgres restore against the LOCAL production-parity stack,
# never against production. This is BACKUP_RESTORE_RUNBOOK.md's "Test restore
# dry-run" section, scripted, so the rehearsal that section says to do
# "monthly at minimum" is a one-command thing to actually run rather than a
# paragraph of manual steps that quietly stops happening.
#
# Usage (from repo root):
#   sh infrastructure/docker/scripts/restore-dry-run.sh backups/postgres-<stamp>.sql.gz
#
# What it does:
#   1. Brings up the local production-parity stack (`pnpm docker:prod:up`) if
#      it isn't already running.
#   2. Drops and recreates the 'gmrlog' database, then loads the given dump —
#      the same DROP/CREATE/psql sequence infrastructure/deploy/scripts/
#      restore.sh uses on the real host, so a pass here is evidence about the
#      real procedure, not a different one that happens to look similar.
#   3. Restarts api/worker and polls readiness.
#   4. Prints table names so you can spot-check that real rows came back, not
#      an empty schema.
#
# What it deliberately does NOT do: touch production, or tear the stack down
# afterward — the point of a dry run is to look at what came back. Tear down
# yourself when you're satisfied: `pnpm docker:prod:down -v`.
#
# The archive has to already be on this machine — copying one down from the
# production host (`scp deploy@host:.../backups/postgres-....sql.gz ./backups/`)
# is a separate, explicit step, so this script never needs production SSH
# access itself.
set -eu

if [ $# -lt 1 ]; then
  echo "usage: $0 <postgres-archive.sql.gz>" >&2
  exit 1
fi
ARCHIVE="$1"

if [ ! -f "$ARCHIVE" ]; then
  echo "error: archive not found: $ARCHIVE" >&2
  exit 1
fi
# Resolve to an absolute path before any `cd` below changes what a relative
# path would mean.
case "$ARCHIVE" in
  /*) : ;;
  *) ARCHIVE="$(pwd)/$ARCHIVE" ;;
esac

REPO_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)"
cd "$REPO_ROOT"

COMPOSE_FILES="-f infrastructure/docker/docker-compose.yml -f infrastructure/docker/docker-compose.prod.yml"

if [ -z "$(docker compose $COMPOSE_FILES ps -q postgres 2>/dev/null)" ]; then
  echo "==> Local production-parity stack not running — starting it (pnpm docker:prod:up)"
  pnpm docker:prod:up
else
  echo "==> Local production-parity stack already running — using it as-is"
fi

echo "==> Waiting for postgres to accept connections"
i=0
until docker exec gmrlog-postgres pg_isready -U gmrlog -d gmrlog >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "error: postgres never became ready" >&2
    exit 1
  fi
  sleep 2
done

echo "==> Recreating database 'gmrlog' from $ARCHIVE"
docker exec -i gmrlog-postgres psql -U gmrlog -d postgres \
  -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS gmrlog WITH (FORCE);"
docker exec -i gmrlog-postgres psql -U gmrlog -d postgres \
  -v ON_ERROR_STOP=1 -c "CREATE DATABASE gmrlog OWNER gmrlog;"
gunzip -c "$ARCHIVE" | docker exec -i gmrlog-postgres psql -U gmrlog -d gmrlog -v ON_ERROR_STOP=1

echo "==> Restarting api/worker so they pick up the restored schema"
docker compose $COMPOSE_FILES restart api worker

echo "==> Waiting for readiness"
i=0
until curl -ksf https://localhost/api/v1/health/ready >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "error: /api/v1/health/ready never came up after the restore" >&2
    echo "       check: docker compose $COMPOSE_FILES logs --tail 80 api" >&2
    exit 1
  fi
  sleep 2
done

echo ""
echo "==> Restore landed. Readiness report:"
curl -ksS https://localhost/api/v1/health/ready
echo ""
echo ""
echo "==> Tables in the restored database (spot-check a real one has rows):"
docker exec gmrlog-postgres psql -U gmrlog -d gmrlog -c '\dt' -t | awk '{print "    " $3}'
echo ""
echo "    e.g.: docker exec gmrlog-postgres psql -U gmrlog -d gmrlog -c 'SELECT count(*) FROM \"User\";'"
echo ""
echo "==> Dry run complete. The stack is left running for inspection."
echo "    Tear down when done: pnpm docker:prod:down -v"
