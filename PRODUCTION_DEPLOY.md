# Production deployment playbook

Deploys GMRLog to a real host via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which drives [`infrastructure/deploy/scripts/deploy.sh`](infrastructure/deploy/scripts/deploy.sh)
on the target machine. Read [`GITHUB_SECRETS.md`](GITHUB_SECRETS.md) first — nothing here
works without those five secrets configured.

Estimated time: **first deploy ~20–30 min** (mostly `init-letsencrypt.sh` and DNS
propagation checks); **every deploy after that ~5 min** (image pull + migration +
health gate).

## Prerequisites

- [ ] A Linux host with Docker Engine ≥ 24 and the Compose v2 plugin, reachable over SSH
- [ ] The deploy SSH key's public half in that user's `~/.ssh/authorized_keys`
- [ ] `API_DOMAIN`'s DNS **A/AAAA record already pointing at the host's public IP**
      (required before step 3 — Let's Encrypt validates over HTTP-01, and a wrong
      record burns one of its 5-per-hour rate-limit attempts)
- [ ] Ports 80 and 443 open inbound from the internet; 5432/6379/9000/7700 **not**
      published at all (the deploy compose file doesn't publish them — see
      [`VERIFICATION_CHECKLIST.md`](VERIFICATION_CHECKLIST.md))
- [ ] GitHub Environment `production` has the 5 secrets + `API_DOMAIN` variable set
      (see [`GITHUB_SECRETS.md`](GITHUB_SECRETS.md))
- [ ] `git tag` for the release exists locally, ready to push (tags must match `v*`,
      enforced by the `guard` job)

## Pre-flight checks (run these before the first deploy on a new host, or any time you're

unsure of host state)

```bash
# Host reachable
ssh -i ./gmrlog_deploy_key deploy@api.gmrlog.com "echo ok"

# Docker version
ssh deploy@api.gmrlog.com "docker --version && docker compose version"

# Disk space — the image + Postgres + Redis + Meili volumes need headroom;
# 10GB+ free is a reasonable floor for a small instance
ssh deploy@api.gmrlog.com "df -h /"

# DNS actually resolves to this host
dig +short api.gmrlog.com
# compare against:
ssh deploy@api.gmrlog.com "curl -s ifconfig.me"
```

## One-time host bootstrap

Only needed the very first time this host runs GMRLog.

```bash
ssh deploy@api.gmrlog.com
mkdir -p /opt/gmrlog/deploy
# DEPLOY_PATH in GitHub secrets must match this path exactly
```

The first `git push --tags` will rsync `infrastructure/deploy/` into that directory
(the `deploy` job's "Sync the deploy directory to the host" step) — nothing further to
do by hand except what follows.

### Generate the host's secrets

```bash
cd /opt/gmrlog/deploy   # after the first CI run has rsynced files here
node scripts/deploy/gen-secrets.mjs --domain api.gmrlog.com --email ops@gmrlog.com
```

This writes `.env.deploy.local` (gitignored, 0600) with `POSTGRES_PASSWORD`,
`JWT_SECRET`, `MEILI_API_KEY`, `METRICS_TOKEN`, and `MINIO_ROOT_PASSWORD` generated
randomly. It still needs, filled in by hand:

- `STEAM_WEB_API_KEY` — **required**, the backend refuses to boot without it
- `SMTP_HOST`/`SMTP_USERNAME`/`SMTP_PASSWORD`/`SMTP_FROM` — required for password reset
  email to work at all
- `SENTRY_DSN` — optional but strongly recommended (see [`MONITORING_SETUP.md`](MONITORING_SETUP.md))
- `GOOGLE_*`/`DISCORD_*`/`IGDB_*` — optional, per feature

See [`DEPLOY_SECRETS_GENERATOR.sh`](DEPLOY_SECRETS_GENERATOR.sh) to script this whole
step, including the SSH keypair for `GITHUB_SECRETS.md`.

### Issue the first TLS certificate

```bash
./scripts/init-letsencrypt.sh
```

Bootstraps a throwaway self-signed cert just long enough for nginx to bind `:80` and
answer the HTTP-01 challenge, then swaps it for a real Let's Encrypt certificate.
**Verify DNS and firewall are correct before running this** — failures count against
Let's Encrypt's rate limit (5 failures/account/hostname/hour). If you're not sure DNS
has propagated yet, set `LETSENCRYPT_STAGING=1` in `.env.deploy.local` first, run it
against the untrusted staging CA to prove the plumbing works, then flip it back to `0`
and re-run for the real certificate.

## Deployment sequence (every release, including the first)

This is what `git push origin vX.Y.Z` triggers automatically — included here so you
know what to watch for in the Actions log, and so you can reproduce any step by hand if
CI is unavailable.

1. **`guard`** — confirms the tag matches `v[0-9]*`, is an ancestor of `main`, and that
   a `CI` workflow run for that exact commit SHA completed with `success`. Refuses to
   proceed otherwise — this is what stops a hotfix branch or an unreviewed commit from
   ever reaching production via a tag.
2. **`image`** — builds `apps/backend/Dockerfile` from that commit and pushes it to
   `ghcr.io/<owner>/<repo>/backend` tagged with the release tag, the semver, and the
   full commit SHA. Built once; the exact same image is what runs in production —
   nothing rebuilds on the host.
3. **`deploy`** (the `production` Environment — pauses here if a required reviewer is
   configured):
   - rsyncs `infrastructure/deploy/` to `$DEPLOY_PATH` on the host (excluding
     `.env.deploy.local`, `.deployed-tag`, `backups/`, and `scripts/deploy/`, all of
     which are host-owned state, never overwritten from the repo)
   - `docker login ghcr.io` on the host via the token piped over stdin (never in argv,
     never logged)
   - runs `preflight-deploy-env.mjs` in a throwaway `node:22-alpine` container — hard
     stop if any required var is missing or still a known placeholder value
   - runs `./scripts/deploy.sh <tag>`, which:
     - backs up Postgres + Redis first (skipped only on a true first install, where
       there's nothing yet to back up)
     - `docker compose pull` the new image
     - `docker compose up -d` — this re-runs the one-shot `migrate` service
       (`prisma migrate deploy`) and only recreates containers whose image/config
       actually changed; a migration failure aborts here with the _previous_ API/worker
       containers still serving traffic, so a failed migration is never mid-cutover
     - polls `http://localhost:4000/api/v1/health/ready` **from inside the container**
       (not through nginx — this distinguishes "API not ready" from "edge misconfigured")
       for up to `READY_TIMEOUT_SECONDS` (default 180s)
     - on success: records the tag in `.deployed-tag`, prunes images older than 168h
     - on failure: automatically rolls the image back to whichever tag was previously
       recorded in `.deployed-tag` and waits for readiness again — **the schema is not
       rolled back**, since `prisma migrate deploy` is forward-only (see the rollback
       section below)
4. **Smoke the public endpoint** — curls `https://$API_DOMAIN/api/v1/health/ready`
   through the real DNS name and real certificate, retrying every 6s for up to 10
   attempts. This is the only step that proves DNS, TLS, and the nginx edge are all
   correctly wired — the in-container gate above can pass while this fails if, say,
   nginx's config is stale.
5. **Revoke the registry login** — always runs (`if: always()`), even if earlier steps
   failed, so a stale GHCR credential doesn't sit on the host between deploys.

## Health gate — what "done" means

Deployment is not complete until `https://$API_DOMAIN/api/v1/health/ready` returns
`{"status":"ok","checks":{"database":"up","redis":"up","storage":"up","meili":"up"}}`.
`/health/live` alone is not sufficient — it never touches a dependency and will return
`ok` even if Postgres is unreachable.

## Post-deploy verification

```bash
# Confirm the readiness body in full
curl -fsS https://api.gmrlog.com/api/v1/health/ready | jq .

# Watch API logs for the first few minutes after cutover
ssh deploy@api.gmrlog.com \
  "cd /opt/gmrlog/deploy && docker compose -f docker-compose.deploy.yml logs -f --tail 100 api"

# Confirm the deployed tag matches what you released
ssh deploy@api.gmrlog.com "cat /opt/gmrlog/deploy/.deployed-tag"

# Full smoke test — register + login against the real endpoint
curl -fsS -X POST https://api.gmrlog.com/api/v1/sessions/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke-<timestamp>@smoke.gmrlog.local","handle":"smoke<timestamp>","password":"SmokeTestPass12"}'
```

Use a fresh, obviously-fixture email/handle per run (e.g. suffix with a timestamp) —
this hits the real production database, so don't reuse a handle across runs or leave
test accounts undocumented.

## Rollback procedure

**Image rollback** (code only — the common case, since `deploy.sh` already attempts
this automatically on a failed health gate):

```bash
ssh deploy@api.gmrlog.com
cd /opt/gmrlog/deploy
./scripts/deploy.sh <previous-good-tag>
```

`deploy.sh` re-pulls that tag, re-runs `migrate` (a no-op if the schema hasn't changed
since), and re-gates on readiness. This is safe to run manually any time — it's the
same script CI calls.

**Tagging a rollback release** (if you want the rollback itself to go through the CI
guard rails rather than a manual SSH session):

```bash
git tag v1.0.1-rollback <last-good-commit-sha>
git push origin v1.0.1-rollback
```

**Migration rollback — does not exist, by design.** `prisma migrate deploy` is
forward-only and this stack ships no down-migrations. Rolling the _image_ back after a
migration that dropped or renamed a column lands old code on a new, incompatible
schema — that combination is not survivable by this script. This is exactly why
`deploy.sh` backs up Postgres before every migration: a schema-breaking release has to
be recovered via [`BACKUP_RESTORE_RUNBOOK.md`](BACKUP_RESTORE_RUNBOOK.md), not via
`deploy.sh`. Treat any migration that isn't purely additive as a one-way door and gate
it on a fresh backup you've actually verified restores (see that runbook's "test restore
dry-run" section) — this policy is also recorded as a settled decision in the project's
`CLAUDE.md`.

## Honest limits

- TLS is verified by the deploy pipeline's own smoke-test curl against the real
  certificate, but that only proves the chain validates for `curl` — it has not been
  independently checked against a browser TLS scanner (e.g. SSL Labs) as part of this
  package.
- The automatic image-rollback path (on a failed readiness gate) has not been exercised
  against a real, intentionally-broken production release as part of writing this
  playbook — only read from `deploy.sh`'s logic. Rehearse it once on staging
  (see [`STAGING_TEST.md`](STAGING_TEST.md)) before trusting it under real incident
  pressure.
