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
# It also refuses to run against the *dev* stack, which is not a hypothetical
# distinction: the prod overlay does not rename `postgres`, so both stacks use
# the container name `gmrlog-postgres` under the same compose project (`docker`,
# from the directory name). `docker compose -f base -f prod ps -q postgres`
# therefore happily returns the **dev** container when the dev stack is the one
# that is up — at which point step 2's DROP DATABASE would destroy the
# developer's local database instead of rehearsing anything. The guard below
# reads the container's own `com.docker.compose.project.config_files` label,
# which records exactly which compose files created it, and stops rather than
# guessing.
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

ENV_FILE="infrastructure/docker/.env.production.local"

# `pnpm docker:prod:up` passes this file to compose, so every command here has
# to pass it too — the overlay dereferences `JWT_SECRET` and friends with `:?`,
# and a compose invocation that resolves those differently is not talking about
# the same stack. It is gitignored and does not exist until someone writes it.
if [ ! -f "$ENV_FILE" ]; then
  echo "error: $ENV_FILE not found." >&2
  echo "       The production-parity stack reads it; create it with: pnpm docker:prod:init" >&2
  exit 1
fi

COMPOSE_FILES="-f infrastructure/docker/docker-compose.yml -f infrastructure/docker/docker-compose.prod.yml --env-file $ENV_FILE"

# Which compose files created the running `gmrlog-postgres`, if any. Empty when
# no such container exists. This is the discriminator, not `compose ps` — see
# the header: `ps` matches on project+service labels, and the dev stack shares
# both.
CONFIG_FILES_LABEL='{{index .Config.Labels "com.docker.compose.project.config_files"}}'

postgres_config_files() {
  docker inspect gmrlog-postgres --format "$CONFIG_FILES_LABEL" 2>/dev/null || true
}

assert_not_the_dev_stack() {
  files="$(postgres_config_files)"
  if [ -n "$files" ] && ! echo "$files" | grep -q 'docker-compose\.prod\.yml'; then
    echo "error: 'gmrlog-postgres' is running, but it was created without the production" >&2
    echo "       overlay — this is your DEV stack, and step 2 below would DROP its" >&2
    echo "       database. Refusing." >&2
    echo "         created from: $files" >&2
    echo "       Stop it first, then re-run:  pnpm docker:down" >&2
    exit 1
  fi
}

assert_not_the_dev_stack

if [ -z "$(postgres_config_files)" ]; then
  echo "==> Local production-parity stack not running — starting it (pnpm docker:prod:up)"
  pnpm docker:prod:up
  # Re-checked rather than assumed: `docker:prod:up` reuses a container it finds
  # already present, so the thing that came up is not guaranteed to be the thing
  # this script asked for.
  assert_not_the_dev_stack
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
