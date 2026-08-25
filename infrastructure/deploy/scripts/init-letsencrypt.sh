#!/usr/bin/env bash
# Issue the FIRST Let's Encrypt certificate for the deploy stack. Run once per
# host, from infrastructure/deploy/. Renewal after this is automatic — the
# `certbot` service in the compose file runs `certbot renew` twice a day and
# nginx reloads itself every six hours to pick up a renewed certificate.
#
#   ./scripts/init-letsencrypt.sh
#
# The bootstrap exists because of a circular dependency: nginx will not start
# without a certificate file at the path its config names, and certbot's HTTP-01
# challenge cannot be answered without nginx running. The way out is a throwaway
# self-signed certificate at that exact path, just long enough for nginx to bind
# :80 and serve /.well-known/acme-challenge/.
#
# Before running, confirm both are true — Let's Encrypt rate-limits failures
# (5 per account/hostname/hour), so a wrong DNS record costs an hour:
#   * ${API_DOMAIN} resolves to this host's public IP
#   * ports 80 and 443 reach this host from the internet
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE=".env.deploy.local"
COMPOSE=(docker compose -f docker-compose.deploy.yml --env-file "$ENV_FILE")

if [ ! -f "$ENV_FILE" ]; then
  echo "error: $ENV_FILE not found." >&2
  echo "Generate one with: node scripts/deploy/gen-secrets.mjs --domain <your-domain>" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
. "./$ENV_FILE"
set +a

: "${API_DOMAIN:?API_DOMAIN must be set in $ENV_FILE}"
: "${LETSENCRYPT_EMAIL:?LETSENCRYPT_EMAIL must be set in $ENV_FILE}"

# LETSENCRYPT_STAGING=1 issues from Let's Encrypt's staging CA: untrusted by
# browsers, but effectively unlimited. Use it to prove the plumbing works before
# spending a real rate-limit slot.
STAGING_FLAG=""
if [ "${LETSENCRYPT_STAGING:-0}" = "1" ]; then
  STAGING_FLAG="--staging"
  echo "==> Using the Let's Encrypt STAGING CA. The resulting certificate is NOT trusted by browsers."
fi

LIVE_DIR="/etc/letsencrypt/live/${API_DOMAIN}"

if [ -n "$("${COMPOSE[@]}" ps -q nginx 2>/dev/null || true)" ]; then
  echo "==> Stopping nginx so the bootstrap starts from a known state."
  "${COMPOSE[@]}" stop nginx >/dev/null 2>&1 || true
fi

echo "==> Writing a throwaway self-signed certificate to ${LIVE_DIR}"
"${COMPOSE[@]}" run --rm --entrypoint sh certbot -c "
  set -e
  mkdir -p '${LIVE_DIR}'
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout '${LIVE_DIR}/privkey.pem' \
    -out '${LIVE_DIR}/fullchain.pem' \
    -subj '/CN=${API_DOMAIN}' >/dev/null 2>&1
  cp '${LIVE_DIR}/fullchain.pem' '${LIVE_DIR}/chain.pem'
"

echo "==> Starting nginx so it can answer the ACME challenge"
"${COMPOSE[@]}" up -d nginx

# Give nginx a moment to bind :80 before Let's Encrypt is told to come knocking.
for _ in $(seq 1 20); do
  if "${COMPOSE[@]}" exec -T nginx wget -q --spider http://127.0.0.1/healthz 2>/dev/null; then
    break
  fi
  sleep 1
done

echo "==> Removing the throwaway certificate"
# certbot will not write into a live/ directory it does not own, and the
# renewal config must not describe the self-signed placeholder.
"${COMPOSE[@]}" run --rm --entrypoint sh certbot -c "
  rm -rf '/etc/letsencrypt/live/${API_DOMAIN}' \
         '/etc/letsencrypt/archive/${API_DOMAIN}' \
         '/etc/letsencrypt/renewal/${API_DOMAIN}.conf'
"

echo "==> Requesting the real certificate for ${API_DOMAIN}"
"${COMPOSE[@]}" run --rm --entrypoint certbot certbot \
  certonly --webroot -w /var/www/certbot \
  ${STAGING_FLAG} \
  --email "${LETSENCRYPT_EMAIL}" \
  --agree-tos --no-eff-email \
  --rsa-key-size 4096 \
  -d "${API_DOMAIN}"

echo "==> Reloading nginx onto the issued certificate"
"${COMPOSE[@]}" exec -T nginx nginx -s reload

echo
echo "Done. Verify from another machine:"
echo "  curl -sS https://${API_DOMAIN}/api/v1/health/live"
