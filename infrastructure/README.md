# GMRLOG Infrastructure

Three stacks live here. They are separate on purpose — merging them would mean
relaxing the production one to whatever a laptop needs.

| Directory           | Stack                   | Builds from | TLS           |
| ------------------- | ----------------------- | ----------- | ------------- |
| `docker/`           | Local development       | source      | none          |
| `docker/` + `.prod` | Local production-parity | source      | self-signed   |
| `deploy/`           | Remote production       | a registry  | Let's Encrypt |

## Local development

```bash
pnpm docker:up
pnpm docker:down
```

Compose file: `infrastructure/docker/docker-compose.yml`

Services: PostgreSQL 17, Redis 7, MinIO, Mailpit, Meilisearch, pgAdmin
Network: `gmrlog-network`
Volumes: `gmrlog_*_data`

## Local production-parity

```bash
pnpm docker:prod:init      # write .env.production.local from the example
pnpm docker:prod:up        # preflights the env file, then brings the stack up
pnpm docker:prod:down
```

Overlay: `infrastructure/docker/docker-compose.prod.yml`. Takes the datastores
off the host, requires real secrets, and terminates TLS with the self-signed
cert `nginx/generate-certs.sh` writes.

Note that this overlay removes Redis's and Postgres's published host ports. Unit
specs that connect to `127.0.0.1:6379` (the jobs race-repro spec, among others)
time out while it is up — that is the stack, not the test.

## Remote production

```bash
# on the host
./scripts/init-letsencrypt.sh    # once
./scripts/deploy.sh v1.0.0       # every release
```

Compose file: `infrastructure/deploy/docker-compose.deploy.yml`. Pulls a
published image rather than building, exposes nothing but 80/443, and is driven
by `.github/workflows/deploy.yml`.

Full procedure: [docs/10_DEVOPS/PRODUCTION_DEPLOYMENT.md](../docs/10_DEVOPS/PRODUCTION_DEPLOYMENT.md).
