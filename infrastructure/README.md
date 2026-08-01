# GMRLOG Infrastructure

Canonical local development stack:

```bash
pnpm docker:up
pnpm docker:logs
pnpm docker:down
```

Compose file: `infrastructure/docker/docker-compose.yml`

Services: PostgreSQL 17, Redis 7, MinIO, Mailpit, PgAdmin  
Network: `gmrlog-network`  
Volumes: `gmrlog_*_data`
