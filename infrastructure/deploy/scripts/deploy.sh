#!/usr/bin/env bash
# Release one image tag onto this host. Run from infrastructure/deploy/.
#
#   ./scripts/deploy.sh v1.0.0
#
# What it does, in order: back up Postgres, pull the image, apply migrations,
# restart the API and worker, and gate on the readiness probe. If readiness
# never comes up it puts the previous image tag back and exits non-zero.
#
# What it deliberately does NOT do: undo a migration. Prisma's `migrate deploy`
# is forward-only and this script has no down-migrations, so an image rollback
# lands the previous code on the newer schema. That is survivable only while
# migrations stay additive — a migration that drops or renames a column breaks
# the rollback path, and the release that carries one has to be treated as
# irreversible and gated on the backup this script takes first.
set -euo pipefail

cd "$(dirname "$0")/.."

TAG="${1:-}"
if [ -z "$TAG" ]; then
  echo "usage: $0 <image-tag>" >&2
  exit 1
fi

ENV_FILE=".env.deploy.local"
STATE_FILE=".deployed-tag"
COMPOSE=(docker compose -f docker-compose.deploy.yml --env-file "$ENV_FILE")

if [ ! -f "$ENV_FILE" ]; then
  echo "error: $ENV_FILE not found on this host." >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
. "./$ENV_FILE"
set +a

: "${GMRLOG_IMAGE:?GMRLOG_IMAGE must be set in $ENV_FILE}"

PREVIOUS_TAG=""
if [ -f "$STATE_FILE" ]; then
  PREVIOUS_TAG="$(cat "$STATE_FILE")"
fi

READY_TIMEOUT_SECONDS="${READY_TIMEOUT_SECONDS:-180}"

wait_for_ready() {
  local deadline=$(( SECONDS + READY_TIMEOUT_SECONDS ))
  while [ "$SECONDS" -lt "$deadline" ]; do
    # Asked of the container directly rather than through nginx: this has to
    # distinguish "the API is not ready" from "the edge is misconfigured", and
    # /ready (unlike /live) checks Postgres, Redis, storage and search.
    if "${COMPOSE[@]}" exec -T api wget -q -O /dev/null \
      http://localhost:4000/api/v1/health/ready 2>/dev/null; then
      return 0
    fi
    sleep 3
  done
  return 1
}

echo "==> Deploying ${GMRLOG_IMAGE}:${TAG} (previous: ${PREVIOUS_TAG:-none})"

# Skipped on a first install, where there is no container to dump and nothing to
# lose. Every later release backs up first, because `migrate deploy` is
# forward-only and this dump is the only way back from a destructive migration.
if [ -n "$(docker ps -q -f name='^gmrlog-postgres$' 2>/dev/null || true)" ]; then
  echo "==> Backing up Postgres and Redis before migrations run"
  ./scripts/backup.sh
else
  echo "==> No running Postgres container — first install, skipping the pre-release backup."
fi

export GMRLOG_IMAGE_TAG="$TAG"

echo "==> Pulling images"
"${COMPOSE[@]}" pull --quiet api worker migrate

echo "==> Applying migrations and restarting services"
# `up -d` reruns the one-shot `migrate` service and only recreates the
# containers whose image or config actually changed. A migration failure aborts
# here, before the API is recreated — the previous containers are still serving,
# so the correct move is to stop and report, not to roll anything back.
if ! "${COMPOSE[@]}" up -d --remove-orphans; then
  echo "!!! Bringing the stack up failed. Migration output:" >&2
  "${COMPOSE[@]}" logs --tail 60 migrate >&2 || true
  echo "!!! ${PREVIOUS_TAG:-the previous release} is still running. Nothing was rolled back." >&2
  exit 1
fi

echo "==> Waiting up to ${READY_TIMEOUT_SECONDS}s for /api/v1/health/ready"
if wait_for_ready; then
  echo "$TAG" > "$STATE_FILE"
  echo "==> ${TAG} is live."
  # Keep the previous image so a rollback does not need the registry.
  docker image prune -f --filter "until=168h" >/dev/null 2>&1 || true
  "${COMPOSE[@]}" ps
  exit 0
fi

echo "!!! ${TAG} never became ready. Recent API logs:" >&2
"${COMPOSE[@]}" logs --tail 80 api >&2 || true

if [ -z "$PREVIOUS_TAG" ]; then
  echo "!!! No previously deployed tag recorded — cannot roll back automatically." >&2
  echo "!!! The stack is left running so the failure can be inspected." >&2
  exit 1
fi

echo "==> Rolling back to ${PREVIOUS_TAG}"
export GMRLOG_IMAGE_TAG="$PREVIOUS_TAG"
"${COMPOSE[@]}" up -d --remove-orphans

if wait_for_ready; then
  echo "==> Rolled back to ${PREVIOUS_TAG}. The schema is still at ${TAG}'s migrations."
else
  echo "!!! Rollback to ${PREVIOUS_TAG} did not become ready either." >&2
fi
exit 1
