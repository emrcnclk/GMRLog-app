# Pre-deployment verification checklist

Run through this before pushing a release tag. Each section names the exact command to
run and the doc that explains the full context if something fails. Check items off as
you go — this is meant to be worked top to bottom on the actual release, not read once
and remembered.

## Code

- [ ] All tests pass: `pnpm turbo run test`
      Record the actual pass count in the release notes (e.g. `1535/1535`) — don't assume a
      prior run's count still holds; the suite changes every release.
- [ ] Typecheck clean: `pnpm turbo run typecheck`
- [ ] Lint clean: `pnpm turbo run lint`
- [ ] Build succeeds: `pnpm turbo run build`
- [ ] The tagged commit is on `main` and has a green `CI` workflow run for that exact
      SHA — `deploy.yml`'s `guard` job enforces this automatically and will refuse to
      deploy otherwise, but confirm it yourself before tagging to avoid a failed CI run
      burning the deploy attempt:
      `bash
  gh api "repos/<owner>/<repo>/actions/runs?head_sha=$(git rev-parse HEAD)&status=completed" \
    --jq '[.workflow_runs[] | select(.name == "CI")] | first | .conclusion'
  `

## Docker

- [ ] Image builds cleanly: `docker build -f apps/backend/Dockerfile -t gmrlog-backend:verify .`
- [ ] All services start on the local production-parity stack:
      `pnpm docker:prod:up` (see [`STAGING_TEST.md`](STAGING_TEST.md) for the full
      walkthrough — prerequisites, env setup, teardown)
- [ ] Health checks pass for every service:
      `docker compose -f infrastructure/docker/docker-compose.yml -f infrastructure/docker/docker-compose.prod.yml ps`
      — every row should read `healthy`, not `starting` or `unhealthy`

## Database

- [ ] Migrations run without error against a throwaway database — the `migrate`
      one-shot service in `docker-compose.deploy.yml` does this automatically on every
      deploy, but verify it locally first: it uses `prisma migrate deploy`, which is
      **forward-only** — there is no down-migration path in this stack (see the
      rollback section in [`PRODUCTION_DEPLOY.md`](PRODUCTION_DEPLOY.md)). Treat any
      migration that drops or renames a column as a one-way door, not something a
      rollback will undo.
- [ ] Schema matches Prisma: `pnpm --filter @gmrlog/database exec prisma migrate status`
      — should report "up to date," not "pending migrations"
- [ ] If you touched `packages/database/src`: rebuilt it and restarted the backend
      before testing — the backend loads `@gmrlog/database` from `dist`, and a source
      edit with no rebuild is silently invisible at runtime (see this repo's
      `CLAUDE.md`, "Known environment traps")

## Nginx

- [ ] Deploy-stack config validates. The template only renders inside the container
      (envsubst runs at container start), so validate it rendered, not the raw
      template:
      `bash
  docker run --rm \
    -e API_DOMAIN=api.gmrlog.com -e S3_BUCKET=gmrlog \
    -v "$(pwd)/infrastructure/deploy/nginx/templates:/etc/nginx/templates:ro" \
    -v "$(pwd)/infrastructure/deploy/nginx/proxy.inc:/etc/nginx/conf.d/gmrlog-proxy.inc:ro" \
    nginx:1.27-alpine nginx -t
  `
- [ ] TLS certificate ready: either `./scripts/init-letsencrypt.sh` has already been run
      successfully on this host (repeat deploys), or DNS + firewall are confirmed ready
      for it to run for the first time (see the prerequisites in
      [`PRODUCTION_DEPLOY.md`](PRODUCTION_DEPLOY.md) — a wrong DNS record here burns a
      Let's Encrypt rate-limit attempt, so this is worth double-checking rather than
      assuming)

## Secrets

- [ ] All required keys present in `.env.deploy.local`: `node scripts/deploy/preflight-deploy-env.mjs`
      exits 0. This checks **16 required keys** (`API_DOMAIN`, `LETSENCRYPT_EMAIL`,
      `GMRLOG_IMAGE`, `CORS_ORIGINS`, `POSTGRES_USER`, `POSTGRES_PASSWORD`,
      `POSTGRES_DB`, `JWT_SECRET`, `MEILI_API_KEY`, `MINIO_ROOT_USER`,
      `MINIO_ROOT_PASSWORD`, `S3_BUCKET`, `SMTP_HOST`, `SMTP_FROM`,
      `PASSWORD_RESET_URL_BASE`, `STEAM_WEB_API_KEY`) — not a round number, that's the
      actual list the deploy compose file dereferences with `:?`.
- [ ] None are placeholders — the same preflight script rejects `CHANGE_ME` and a set of
      known-weak defaults (`gmrlog`, `minioadmin`, `password`, ...) by value, not just by
      presence.
- [ ] The five GitHub Actions secrets are set on the `production` Environment
      (`DEPLOY_SSH_KEY`, `DEPLOY_SSH_KNOWN_HOSTS`, `DEPLOY_HOST`, `DEPLOY_USER`,
      `DEPLOY_PATH`) plus the `API_DOMAIN` variable — see
      [`GITHUB_SECRETS.md`](GITHUB_SECRETS.md) for what each one does and why the list
      is intentionally short (application secrets deliberately never touch GitHub — see
      that doc's "what is not a GitHub secret" table before assuming something is
      missing).
- [ ] `SENTRY_DSN` is set if you want error monitoring live from the first request (see
      [`MONITORING_SETUP.md`](MONITORING_SETUP.md)) — optional, but the pipeline gives
      you no other error visibility until it is.

## DNS

- [ ] A record points to the host: `dig +short api.gmrlog.com` returns the host's public
      IP
- [ ] Domain actually resolves from outside your own network — a resolver on the same
      network as the host can return a stale/local answer that masks a real propagation
      problem; check from a different network or `dig @8.8.8.8 api.gmrlog.com`

## Firewall

- [ ] Ports 80 and 443 open to the internet — required for Let's Encrypt's HTTP-01
      challenge and for all real traffic
- [ ] Ports 5432 (Postgres), 6379 (Redis), 9000 (MinIO), 7700 (Meilisearch) **not**
      published to the internet at all. Confirm this is actually true rather than
      assumed — `docker-compose.deploy.yml` doesn't declare host `ports:` for any of
      these services (unlike the local dev compose, which does, on purpose, for
      developer convenience), so a correctly-deployed host has nothing listening on
      those ports outside the Docker network:
      `bash
      ssh deploy@api.gmrlog.com "sudo ss -tlnp | grep -E ':5432|:6379|:9000|:7700'"
  # expect no output
  `

## Sign-off

- [ ] [`STAGING_TEST.md`](STAGING_TEST.md) run end to end on the current release
      candidate, including the rollback/restore test
- [ ] [`BACKUP_RESTORE_RUNBOOK.md`](BACKUP_RESTORE_RUNBOOK.md)'s dry-run restore
      rehearsed within the last month
- [ ] Rollback plan reviewed — know the previous good tag before you deploy the new one:
      `cat` the current `.deployed-tag` on the host, or `git tag --sort=-creatordate | head -5`
