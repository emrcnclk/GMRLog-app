#!/usr/bin/env bash
# Generate everything GMRLog's production deploy needs: the SSH keypair GitHub
# Actions uses to reach the host, the host's own known_hosts pin, and the
# host-side application secrets (via the existing, already-audited
# scripts/deploy/gen-secrets.mjs — this script does not reimplement that logic,
# it orchestrates it alongside the two things gen-secrets.mjs deliberately
# doesn't handle: SSH material and the GitHub-secrets side of the picture).
#
# See GITHUB_SECRETS.md for what each output secret is for.
#
# Usage:
#   ./DEPLOY_SECRETS_GENERATOR.sh --domain api.gmrlog.com --email ops@gmrlog.com \
#       --host api.gmrlog.com [--app-origin https://app.gmrlog.com] [--force]
#
# Idempotent: re-running without --force leaves any file that already exists
# untouched and reports what it skipped, rather than silently overwriting live
# secrets. This mirrors gen-secrets.mjs's own refusal-to-overwrite behavior —
# deliberately, not by accident.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DOMAIN=""
EMAIL=""
HOST=""
APP_ORIGIN=""
IMAGE=""
FORCE="false"
OUT_DIR="./.deploy-secrets-output"

while [ $# -gt 0 ]; do
  case "$1" in
    --domain) DOMAIN="$2"; shift 2 ;;
    --email) EMAIL="$2"; shift 2 ;;
    --host) HOST="$2"; shift 2 ;;
    --app-origin) APP_ORIGIN="$2"; shift 2 ;;
    --image) IMAGE="$2"; shift 2 ;;
    --force) FORCE="true"; shift ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^#//'
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "usage: $0 --domain <api-hostname> --email <letsencrypt-email> [--host <ssh-host, defaults to --domain>] [--app-origin https://app.example.com] [--image ghcr.io/owner/repo/backend] [--force]" >&2
  exit 1
fi
if [ -z "$IMAGE" ]; then
  echo "note: --image not given — GMRLOG_IMAGE will be left as the template's OWNER/REPO"
  echo "      placeholder, and preflight (step 4 below) will fail on it until you either"
  echo "      pass --image or edit GMRLOG_IMAGE in .env.deploy.local by hand."
fi

HOST="${HOST:-$DOMAIN}"
mkdir -p "$OUT_DIR"

echo "=============================================================================="
echo " GMRLog production secrets generator"
echo "=============================================================================="

# --- 1. SSH keypair for DEPLOY_SSH_KEY / DEPLOY_SSH_KEY.pub -----------------------
KEY_PATH="$OUT_DIR/gmrlog_deploy_key"
if [ -f "$KEY_PATH" ] && [ "$FORCE" != "true" ]; then
  echo "==> [skip] $KEY_PATH already exists (use --force to regenerate — this invalidates"
  echo "           the previous key everywhere it was authorized)."
else
  echo "==> Generating deploy SSH keypair -> $KEY_PATH"
  rm -f "$KEY_PATH" "$KEY_PATH.pub"
  ssh-keygen -t ed25519 -f "$KEY_PATH" -C "gmrlog-deploy" -N "" -q
fi

# --- 2. Known-hosts pin for DEPLOY_SSH_KNOWN_HOSTS --------------------------------
KNOWN_HOSTS_PATH="$OUT_DIR/known_hosts"
if [ -f "$KNOWN_HOSTS_PATH" ] && [ "$FORCE" != "true" ]; then
  echo "==> [skip] $KNOWN_HOSTS_PATH already exists."
else
  echo "==> Scanning $HOST for its SSH host key -> $KNOWN_HOSTS_PATH"
  echo "    Verify this fingerprint out-of-band (your cloud provider's console, etc.)"
  echo "    before trusting it — ssh-keyscan itself has no way to authenticate the host."
  if ssh-keyscan -H "$HOST" > "$KNOWN_HOSTS_PATH" 2>/dev/null && [ -s "$KNOWN_HOSTS_PATH" ]; then
    cat "$KNOWN_HOSTS_PATH"
  else
    echo "    !! Could not reach $HOST — is it provisioned and DNS-resolvable yet?"
    echo "    !! Run this step again once the host exists: ssh-keyscan -H $HOST > $KNOWN_HOSTS_PATH"
    rm -f "$KNOWN_HOSTS_PATH"
  fi
fi

# --- 3. Host-side application secrets, via the existing generator ----------------
# STEAM_WEB_API_KEY cannot be generated — it's issued by Steam per-account.
# https://steamcommunity.com/dev/apikey. gen-secrets.mjs leaves it blank on
# purpose and preflight-deploy-env.mjs (step 4 below) will refuse to pass until
# a real one is filled in by hand. Same for SMTP credentials and SENTRY_DSN.
ENV_LOCAL="infrastructure/deploy/.env.deploy.local"
GEN_ARGS=(--domain "$DOMAIN" --email "$EMAIL")
if [ -n "$APP_ORIGIN" ]; then
  GEN_ARGS+=(--app-origin "$APP_ORIGIN")
fi
if [ -n "$IMAGE" ]; then
  GEN_ARGS+=(--image "$IMAGE")
fi
if [ "$FORCE" = "true" ]; then
  GEN_ARGS+=(--force)
fi

if [ -f "$ENV_LOCAL" ] && [ "$FORCE" != "true" ]; then
  echo "==> [skip] $ENV_LOCAL already exists (use --force to regenerate — this rotates"
  echo "           every secret in it, including JWT_SECRET, which signs every user out)."
else
  echo "==> Generating $ENV_LOCAL via scripts/deploy/gen-secrets.mjs"
  node scripts/deploy/gen-secrets.mjs "${GEN_ARGS[@]}"
fi

# --- 4. Verify: no placeholders left in what CAN be auto-generated ---------------
echo ""
echo "==> Checking $ENV_LOCAL for remaining placeholders (preflight-deploy-env.mjs)"
set +e
node scripts/deploy/preflight-deploy-env.mjs "$ENV_LOCAL"
PREFLIGHT_STATUS=$?
set -e
if [ "$PREFLIGHT_STATUS" -ne 0 ]; then
  echo ""
  echo "    ^ Expected to fail here on STEAM_WEB_API_KEY / SMTP_* — those cannot be"
  echo "      generated and must be filled in by hand in $ENV_LOCAL before deploying."
  echo "      Re-run 'node scripts/deploy/preflight-deploy-env.mjs' after editing it."
fi

# --- 5. GitHub secrets summary -----------------------------------------------------
SUMMARY_JSON="$OUT_DIR/github-secrets.generated.json"
DEPLOY_SSH_KEY_CONTENT=""
DEPLOY_SSH_KNOWN_HOSTS_CONTENT=""
[ -f "$KEY_PATH" ] && DEPLOY_SSH_KEY_CONTENT="$(cat "$KEY_PATH")"
[ -f "$KNOWN_HOSTS_PATH" ] && DEPLOY_SSH_KNOWN_HOSTS_CONTENT="$(cat "$KNOWN_HOSTS_PATH")"

# Written as JSON (jq-friendly) rather than a flat .env — a private key and a
# known_hosts file both legitimately contain newlines, which a KEY=VALUE line
# format mangles.
node -e '
  const fs = require("fs");
  const [keyPath, khPath, out, domain] = process.argv.slice(1);
  const key = fs.existsSync(keyPath) ? fs.readFileSync(keyPath, "utf8") : null;
  const kh = fs.existsSync(khPath) ? fs.readFileSync(khPath, "utf8") : null;
  const doc = {
    DEPLOY_SSH_KEY: key,
    DEPLOY_SSH_KNOWN_HOSTS: kh,
    DEPLOY_HOST: "REPLACE_ME (e.g. " + domain + ")",
    DEPLOY_USER: "REPLACE_ME (e.g. deploy)",
    DEPLOY_PATH: "REPLACE_ME (e.g. /opt/gmrlog/deploy)",
  };
  fs.writeFileSync(out, JSON.stringify(doc, null, 2) + "\n", { mode: 0o600 });
' "$KEY_PATH" "$KNOWN_HOSTS_PATH" "$SUMMARY_JSON" "$DOMAIN"

echo ""
echo "=============================================================================="
echo " Output (in $OUT_DIR/, gitignored — do not commit):"
echo "   $KEY_PATH           (private key -> DEPLOY_SSH_KEY secret)"
echo "   $KEY_PATH.pub       (-> add to the host's ~/.ssh/authorized_keys)"
echo "   $KNOWN_HOSTS_PATH   (-> DEPLOY_SSH_KNOWN_HOSTS secret)"
echo "   $SUMMARY_JSON       (all four SSH-related secrets, JSON — DEPLOY_HOST/"
echo "                        DEPLOY_USER/DEPLOY_PATH still need your real values)"
echo "   $ENV_LOCAL          (host-side app secrets — copy to the host, never commit)"
echo ""
echo " Load into GitHub with the CLI once the JSON above has real DEPLOY_HOST/USER/PATH:"
echo "   gh secret set DEPLOY_SSH_KEY --env production < $KEY_PATH"
echo "   gh secret set DEPLOY_SSH_KNOWN_HOSTS --env production < $KNOWN_HOSTS_PATH"
echo "   gh secret set DEPLOY_HOST --env production --body '<your host>'"
echo "   gh secret set DEPLOY_USER --env production --body '<your ssh user>'"
echo "   gh secret set DEPLOY_PATH --env production --body '/opt/gmrlog/deploy'"
echo "   gh variable set API_DOMAIN --env production --body '$DOMAIN'"
echo ""
echo " Then copy $ENV_LOCAL to the host at DEPLOY_PATH/.env.deploy.local (0600),"
echo " fill in STEAM_WEB_API_KEY / SMTP_* / SENTRY_DSN by hand, and re-run:"
echo "   node scripts/deploy/preflight-deploy-env.mjs"
echo " until it exits 0. See GITHUB_SECRETS.md and PRODUCTION_DEPLOY.md for the rest."
echo "=============================================================================="
