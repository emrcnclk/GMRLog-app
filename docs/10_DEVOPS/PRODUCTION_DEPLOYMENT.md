# Production Deployment Runbook

The operational counterpart to `DEPLOYMENT.md`. That document describes the
target architecture; this one is the procedure that exists in the repository
today, against the files that implement it.

| Concern            | Implemented by                                                         |
| ------------------ | ---------------------------------------------------------------------- |
| Stack definition   | `infrastructure/deploy/docker-compose.deploy.yml`                      |
| TLS                | `infrastructure/deploy/nginx/templates/gmrlog.conf.template` + certbot |
| First certificate  | `infrastructure/deploy/scripts/init-letsencrypt.sh`                    |
| Release            | `infrastructure/deploy/scripts/deploy.sh`                              |
| Backup / restore   | `infrastructure/deploy/scripts/backup.sh`, `restore.sh`                |
| Secrets            | `scripts/deploy/gen-secrets.mjs`, `preflight-deploy-env.mjs`           |
| CI/CD              | `.github/workflows/deploy.yml`                                         |

The local production-parity stack (`pnpm docker:prod:up`,
`infrastructure/docker/`) is a different thing and stays as it is: it builds
from a checkout, publishes ports for a developer and terminates TLS with a
self-signed certificate. Nothing here changes it.

---

## What the host needs

- Linux with Docker Engine and the Compose v2 plugin. Nothing else — no Node,
  no pnpm, no checkout of the repo. The preflight runs in a `node:22-alpine`
  container so the box has one dependency to keep patched instead of three.
- Ports 80 and 443 reachable from the internet. Nothing else should be exposed;
  Postgres, Redis, MinIO and Meilisearch have no host ports in this stack.
- A DNS A/AAAA record for `API_DOMAIN` pointing at the host, **already
  propagated**. Let's Encrypt rate-limits failed authorizations at 5 per
  hostname per hour, so a wrong record costs an hour.
- A deploy user in the `docker` group with an SSH key CI can use.

---

## First install

```bash
# On the host
sudo mkdir -p /opt/gmrlog/deploy && sudo chown "$USER" /opt/gmrlog/deploy
```

Copy `infrastructure/deploy/` and `scripts/deploy/` onto the host at
`/opt/gmrlog/deploy` (CI does this with rsync on every release; the first time,
do it by hand or run the workflow once and let the release step fail on the
missing env file).

```bash
cd /opt/gmrlog/deploy

# 1. Generate real secrets. Never copy .env.deploy.example into place as-is —
#    the preflight rejects its placeholders by value.
docker run --rm -v "$PWD":/w -w /w node:22-alpine \
  node scripts/deploy/gen-secrets.mjs \
    --domain api.gmrlog.com \
    --email ops@gmrlog.com \
    --app-origin https://gmrlog.com \
    --image ghcr.io/<owner>/<repo>/backend

# 2. Fill in what cannot be generated: STEAM_WEB_API_KEY, SMTP_*, SENTRY_DSN,
#    and any OAuth/IGDB keys you use.
vi .env.deploy.local

# 3. Check it before anything starts.
docker run --rm -v "$PWD":/w -w /w node:22-alpine \
  node scripts/deploy/preflight-deploy-env.mjs .env.deploy.local

# 4. Issue the first certificate. Set LETSENCRYPT_STAGING=1 first if you want a
#    dry run against the untrusted staging CA.
chmod +x scripts/*.sh
./scripts/init-letsencrypt.sh

# 5. First release.
docker login ghcr.io -u <user>          # a PAT with read:packages
./scripts/deploy.sh v1.0.0
```

Verify from a machine that is not the host:

```bash
curl -sS https://api.gmrlog.com/api/v1/health/ready
```

---

## TLS

nginx terminates TLS with a Let's Encrypt certificate. Three pieces make that
work, and each exists because of a specific failure:

- **Bootstrap.** nginx will not start without a certificate file at the path its
  config names, and certbot's HTTP-01 challenge cannot be answered without nginx
  running. `init-letsencrypt.sh` breaks the cycle with a throwaway self-signed
  certificate at that exact path, starts nginx, gets the real one, and reloads.
- **Renewal.** The `certbot` service runs `certbot renew` every 12 hours.
  Certificates are valid 90 days and renew inside the last 30, so a host that is
  down for a weekend still renews in time.
- **Reload.** nginx reads a certificate once, at start or reload, so a renewed
  certificate is invisible to a running container. certbot cannot signal across
  the container boundary without a Docker socket — not worth mounting for this —
  so nginx reloads itself every 6 hours.

`/.well-known/acme-challenge/` is the one path served over plaintext; everything
else on :80 is a 301.

The edge also owns the security headers. The API sets them too, via helmet, and
the config strips the upstream copies with `proxy_hide_header` so there is one
writer — including on responses the API never produced (502s, and the 429s from
the rate-limit zones).

---

## Releases

A release is a tag push:

```bash
git tag v1.0.1 && git push origin v1.0.1
```

`deploy.yml` then, in order:

1. **guard** — the tagged commit must be an ancestor of `origin/main`, and CI
   must have a completed successful run for that exact SHA. `ci.yml` does not
   run on tag pushes, so without this check a tag could deploy code whose tests
   never ran on that commit.
2. **image** — builds `apps/backend/Dockerfile` once and pushes it to GHCR.
   The image is built here and deployed as-is; building on the server would make
   "what is running" a function of the server's disk state.
3. **deploy** — gated on the `production` GitHub Environment, rsyncs the deploy
   directory, runs the preflight, then `deploy.sh`.

`deploy.sh` on the host: back up Postgres → pull → `migrate` (one-shot, and the
API waits on it succeeding) → restart → poll `/api/v1/health/ready` for up to
180s. If readiness never comes, it puts the previous image tag back and exits
non-zero.

### The limit of rollback

`deploy.sh` rolls back the **image**, never the schema. Prisma's `migrate
deploy` is forward-only and there are no down-migrations, so a rollback lands the
previous code on the newer schema. That is survivable only while migrations stay
additive — which is the same rule `CLAUDE.md` already states for DTOs, applied to
the database. **A migration that drops or renames a column makes its release
irreversible**, and the only safety net for it is the backup `deploy.sh` takes
before migrating. Split those into two releases (add the new shape, ship code
that uses it, drop the old shape later) whenever you can.

### Required GitHub configuration

Repository secrets — or better, secrets on the `production` environment, so a
workflow running on a fork branch cannot read them:

| Secret                   | What it is                                            |
| ------------------------ | ----------------------------------------------------- |
| `DEPLOY_HOST`            | Hostname or IP of the server                           |
| `DEPLOY_USER`            | SSH user, in the `docker` group                        |
| `DEPLOY_PATH`            | e.g. `/opt/gmrlog/deploy`                              |
| `DEPLOY_SSH_KEY`         | Private key, no passphrase                             |
| `DEPLOY_SSH_KNOWN_HOSTS` | Output of `ssh-keyscan -H <host>`                      |

`GITHUB_TOKEN` covers the GHCR push; no registry secret is needed.

Repository or environment **variable**: `API_DOMAIN`, used by the post-deploy
public smoke check and the environment URL.

`DEPLOY_SSH_KNOWN_HOSTS` is not optional convenience. Without pinned host keys
the workflow would have to trust whatever answers on the first connection, which
is the entire man-in-the-middle window.

---

## Monitoring

Sentry is wired in `apps/backend/src/main.ts` and initialises **only** when
`SENTRY_DSN` is non-empty — an unset DSN is not a degraded mode, it is no error
reporting at all. The preflight warns about it rather than failing, because a
first bring-up without Sentry is legitimate.

- `SENTRY_DSN` — from the Sentry project's Client Keys page.
- `SENTRY_TRACES_SAMPLE_RATE` — `0` (errors only) by default. `0.1` on a busy
  API is already a lot of events.
- `SENTRY_RELEASE` — set by the compose file to the deployed image tag, so an
  issue names the release it first appeared in.

Health endpoints, all under the `api/v1` prefix:

| Endpoint        | Use                                                              |
| --------------- | ---------------------------------------------------------------- |
| `/health`       | Aggregate                                                        |
| `/health/live`  | Process is up. The container healthcheck.                        |
| `/health/ready` | Dependencies are up. The deploy gate and the uptime monitor.     |

Point an external uptime monitor at `https://<domain>/api/v1/health/ready`.
Nothing inside the stack can tell you the host is unreachable.

`/api/v1/metrics` is guarded by `METRICS_TOKEN`. Leave it empty only if nothing
scrapes it.

---

## Backups

`scripts/backup.sh` covers the two things that cannot be rebuilt:

- **Postgres** — the product.
- **Redis** — not a pure cache here. BullMQ keeps job state in it, so losing
  Redis loses queued metadata and media ingestion work. This is also why the
  deploy stack runs Redis with `appendonly yes --appendfsync everysec` *and* RDB
  save points: the AOF is the durability story, the RDB is what `BGSAVE` and the
  backup script copy.

Not backed up, deliberately: **Meilisearch** is a derived index and
`pnpm repair:index` rebuilds it from Postgres; **MinIO** holds user uploads,
which are large and change slowly — snapshot the `gmrlog_minio_data` volume on
its own schedule.

Cron:

```bash
0 3 * * * cd /opt/gmrlog/deploy && ./scripts/backup.sh >> /var/log/gmrlog-backup.log 2>&1
```

Both archives are verified (`gzip -t`, non-empty) before the script reports
success — a truncated dump nobody notices is worse than no dump.

Set `BACKUP_S3_TARGET` and its credentials to copy offsite. Without it, backups
live only on the host they back up, which survives a bad migration and nothing
else.

Restore is destructive and requires `CONFIRM=yes`:

```bash
CONFIRM=yes ./scripts/restore.sh postgres backups/postgres-20260819T030000Z.sql.gz
CONFIRM=yes ./scripts/restore.sh redis    backups/redis-20260819T030000Z.rdb.gz
```

**Rehearse this on a throwaway host.** A restore that has never been run is an
assumption, not a plan.

---

## Known traps

- **Redis dying silently.** `CLAUDE.md` records four occurrences locally: the
  container stops, the backend's ioredis client never retries, and every
  rate-limited route answers `503 INTEGRATION_UNAVAILABLE`, which reads as an
  auth bug. In this stack Redis has `restart: unless-stopped` and a healthcheck,
  which covers a crash but not a hang. If sign-in starts answering 503, check
  `docker exec gmrlog-redis redis-cli ping` before reading any application code
  — and restart the API after Redis, not just Redis.
- **`.env.deploy.local` is host state.** CI rsyncs with `--delete` and excludes
  it, `.deployed-tag` and `backups/` for exactly that reason. Keep the
  authoritative copy of the secrets in a password manager; the file on the host
  is a cache of it, not the record.
- **`API_DOMAIN` must be a bare hostname**, not a URL. nginx's `server_name` and
  certbot's `-d` both take a name; the preflight rejects a URL.
- **SMTP is not optional.** With `SMTP_HOST` pointing nowhere real, password
  reset mail vanishes silently and the failure presents as a broken reset token.
  The preflight rejects `mailpit`/`localhost` for this reason.
