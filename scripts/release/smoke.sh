#!/usr/bin/env sh
# D3.20 — Release smoke runner (Unix).
# Usage: ./scripts/release/smoke.sh [--skip-perf] [--skip-backup] [--skip-docker]
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

SKIP_PERF=0
SKIP_BACKUP=0
SKIP_DOCKER=0
for arg in "$@"; do
  case "$arg" in
    --skip-perf) SKIP_PERF=1 ;;
    --skip-backup) SKIP_BACKUP=1 ;;
    --skip-docker) SKIP_DOCKER=1 ;;
  esac
done

PASS=1
run() {
  name="$1"
  shift
  echo ""
  echo "=== $name ==="
  if node "$@"; then
    echo "RESULT $name PASS"
  else
    echo "RESULT $name FAIL"
    PASS=0
  fi
}

export GMRLOG_API_BASE="${GMRLOG_API_BASE:-http://127.0.0.1:4000/api/v1}"
export REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379}"
export DATABASE_URL="${DATABASE_URL:-postgresql://gmrlog:gmrlog@127.0.0.1:5432/gmrlog?schema=public}"
export S3_ENDPOINT="${S3_ENDPOINT:-http://127.0.0.1:9000}"
export MEILI_HOST="${MEILI_HOST:-http://127.0.0.1:7700}"
export MAILPIT_API="${MAILPIT_API:-http://127.0.0.1:8025}"

if [ "$SKIP_DOCKER" -eq 0 ]; then
  echo "=== docker-infra ==="
  if command -v docker >/dev/null 2>&1; then
    docker compose -f infrastructure/docker/docker-compose.yml up -d postgres redis minio meilisearch mailpit || PASS=0
  else
    echo "docker not found — skipping compose up"
  fi
fi

run infra scripts/release/smoke-infra.mjs
run health scripts/release/smoke-health.mjs
run upload scripts/release/smoke-upload.mjs
run password scripts/release/smoke-password.mjs
run search scripts/release/smoke-search.mjs
run queue scripts/release/smoke-queue.mjs
run security scripts/release/smoke-security.mjs

if [ "$SKIP_PERF" -eq 0 ]; then
  run perf scripts/release/smoke-perf.mjs
fi

if [ "$SKIP_BACKUP" -eq 0 ]; then
  run backup scripts/release/smoke-backup.mjs
fi

echo ""
if [ "$PASS" -eq 1 ]; then
  echo "PASS"
  exit 0
fi
echo "FAIL"
exit 1
