# Monitoring setup — Sentry, logs, alerts, dashboards

Covers what's actually wired in this codebase today (`apps/backend/src/main.ts`,
`infrastructure/metrics/`, `infrastructure/logging/`) plus what a real alerting setup
needs on top of it. Error-rate and latency alerting (§5) is backed by a labeled request
counter and a duration histogram in `metrics.service.ts` — both were added specifically
so those two alert types are real Prometheus queries, not aspirational ones. What's
still genuinely not exported is noted inline where it applies (Prisma connection-pool
metrics, §5; sourcemap-aware Sentry stack traces, §1) rather than glossed over.

## 1. Sentry

### DSN acquisition

1. Create (or open) the project at <https://sentry.io> → **Settings → Projects →
   (your project) → Client Keys (DSN)**.
2. Copy the DSN — format:
   `https://<public_key>@o<org_id>.ingest.sentry.io/<project_id>`
3. Set it in `infrastructure/deploy/.env.deploy.local` on the host:
   ```
   SENTRY_DSN=https://examplePublicKey@o123456.ingest.sentry.io/4501234567890
   SENTRY_TRACES_SAMPLE_RATE=0.1
   ```

### How it's wired

`main.ts` calls `Sentry.init()` **only if `SENTRY_DSN` is non-empty** — an empty DSN
disables Sentry entirely rather than erroring, so leaving it blank in staging is safe
and intentional, not an oversight to fix. Two things worth knowing when you set it:

- `environment` is set from `APP_ENV` (`production`/`staging`/etc.) automatically —
  don't point a staging DSN's events at the production Sentry project by accident;
  use separate Sentry projects or at minimum separate DSNs per environment.
- `release` is set from `SENTRY_RELEASE`, which the deploy compose file populates from
  `GMRLOG_IMAGE_TAG` (i.e. the git tag, e.g. `v1.0.0`) automatically — every Sentry
  issue is attributable to the exact release that shipped it with zero extra
  configuration.
- `SENTRY_TRACES_SAMPLE_RATE` (0–1, default `0`) controls performance-transaction
  sampling, not error capture — errors are always captured once the DSN is set. Start
  low (0.1 or lower) on a busy API; every sampled transaction is a Sentry event you pay
  for.

**Not currently wired:** sourcemap/release upload via `sentry-cli` in CI. Backend
TypeScript compiles to plain JS without sourcemaps in the production build, so a
production stack trace in Sentry shows compiled output, not original source lines.
Adding that is a `deploy.yml` change (a `sentry-cli releases new` + upload step), out of
scope here — flagged so it isn't assumed to already exist.

## 2. Where logs actually go

The backend logs through `pino` (`infrastructure/logging/app-logger.service.ts`), the
one sanctioned logging surface in the codebase — nothing constructs its own transport.

- **`LOG_FILE` unset (the deploy stack's default — it isn't set in
  `docker-compose.deploy.yml`)**: structured JSON to stdout only. This is what
  `docker compose logs` reads.
- **`LOG_FILE` set** to a path: pino additionally writes through `pino-roll`
  (rotating file transport) to that path inside the container. Since the container's
  filesystem isn't durable across recreates, this only matters if you also bind-mount
  that path to the host — the deploy stack as shipped does not, so leave `LOG_FILE`
  unset unless you add that mount yourself.

```bash
# Live tail
ssh deploy@api.gmrlog.com \
  "cd /opt/gmrlog/deploy && docker compose -f docker-compose.deploy.yml logs -f --tail 100 api worker"

# Errors only, last hour
ssh deploy@api.gmrlog.com \
  "cd /opt/gmrlog/deploy && docker compose -f docker-compose.deploy.yml logs --since 1h api | grep -i '\"level\":50'"
```

(pino's numeric levels: 50 = error, 40 = warn, 30 = info.)

**Log aggregation beyond `docker logs`** (Loki, CloudWatch, Datadog, etc.) is not
configured in this repo. If you need centralized log search rather than SSH + grep,
that's a separate piece of infrastructure to add (e.g. a `docker` logging driver change
in `docker-compose.deploy.yml`, or a log-shipping sidecar) — not something this package
assumes exists.

## 3. Health check endpoints

Exactly three exist (`apps/backend/src/health/health.controller.ts`) — **there is no
`/health/startup` endpoint**; don't configure a probe against one.

| Endpoint                   | Checks                                                                                                                                                  | Use for                                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/health`       | Nothing external — reports uptime, version, environment                                                                                                 | Human "is this the right build" sanity check                                                                                                |
| `GET /api/v1/health/live`  | Nothing external — process-alive only                                                                                                                   | Liveness probe / "should this container be restarted"                                                                                       |
| `GET /api/v1/health/ready` | Postgres (`SELECT 1`), Redis (`PING`), MinIO (`ping`), Meilisearch (`health`) — 503 with `INTEGRATION_UNAVAILABLE` if any configured dependency is down | Readiness probe / "should this container receive traffic" — this is what `deploy.sh` and the deploy pipeline's smoke-test step both gate on |

```bash
curl -fsS https://api.gmrlog.com/api/v1/health/ready | jq .
```

## 4. The `/metrics` endpoint — what it exposes today

`GET /api/v1/metrics` (`infrastructure/metrics/metrics.controller.ts`), Prometheus text
format, protected by `METRICS_TOKEN` when set (send it as `X-Metrics-Token`; leave the
env var empty only if genuinely nothing scrapes it — an empty token means the endpoint
is unauthenticated):

```bash
curl -fsS -H "X-Metrics-Token: $METRICS_TOKEN" https://api.gmrlog.com/api/v1/metrics
```

As implemented (`metrics.service.ts`), it exports:

```
gmrlog_http_requests_total{method,route,status_code}                    # counter
gmrlog_http_request_duration_seconds_bucket{method,route,le}            # histogram
gmrlog_http_request_duration_seconds_sum{method,route}
gmrlog_http_request_duration_seconds_count{method,route}
process_uptime_seconds                                                  # gauge
process_resident_memory_bytes                                           # gauge
```

`route` is the route _pattern_ (`/api/v1/users/:id`), not the raw URL, so label
cardinality stays bounded by the number of route definitions rather than growing with
every distinct ID a client requests. Both series are populated by
`RequestLoggingInterceptor` on every request, success or failure — an error path now
records its actual status code (`HttpException.getStatus()`, or 500 for anything else)
instead of going unrecorded.

## 5. Alert rules — what you can build today

The brief for this deployment package asked for "API error rate > 1%" and "response
time > 2s" alerts. Both are now real Prometheus queries against `/api/v1/metrics` —
this was previously a documented gap (a single undifferentiated request counter with no
status-code label and no latency histogram) and has since been closed by labeling the
counter and adding the histogram above. Two ways to get there, both live:

**Path A — Sentry, no scrape infrastructure required.** Sentry already receives every
unhandled exception (DSN configured) and, with `SENTRY_TRACES_SAMPLE_RATE > 0`, a
sampled set of transaction timings. Sentry's own **Alerts** UI can trigger on:

- Issue frequency (a proxy for error rate — not request-normalized, but real signal)
- `Alerts → Create Alert → Performance` → p95 transaction duration threshold (e.g. > 2s)

Live the moment `SENTRY_DSN` and a non-zero `SENTRY_TRACES_SAMPLE_RATE` are set.

**Path B — Prometheus/Grafana against `/api/v1/metrics`, request-normalized and exact.**
Requires a Prometheus scrape target pointed at the endpoint (not provisioned by this
repo's compose files — see the dashboard section below), then real PromQL:

```promql
# Error rate over 5m, all routes combined
sum(rate(gmrlog_http_requests_total{status_code=~"5.."}[5m]))
  / sum(rate(gmrlog_http_requests_total[5m])) > 0.01

# p95 latency over 5m, all routes combined
histogram_quantile(0.95,
  sum(rate(gmrlog_http_request_duration_seconds_bucket[5m])) by (le)
) > 2
```

Narrow either query with a `{route="..."}` matcher to alert per-endpoint instead of
API-wide.

**Database connection pool exhaustion** — the readiness check confirms Postgres is
reachable, but nothing currently exports the Prisma pool's active/idle/waiting
connection counts. Prisma's `connection_limit` is set to 10 (`api`) / 5 (`worker`) in
`docker-compose.deploy.yml`'s `DATABASE_URL` — the practical alert until pool metrics
are exported is Postgres's own `pg_stat_activity`:

```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'gmrlog';
-- alert if this approaches (connection_limit × running containers), e.g. > 25
```

## 6. Dashboard — what to actually watch day to day

Given the state above, a realistic first dashboard is:

| Signal                              | Source                                                                                                                    | Why                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Error count / issue trend           | Sentry                                                                                                                    | Only real per-error signal available today                                                             |
| p50/p95 transaction duration        | Sentry (needs `SENTRY_TRACES_SAMPLE_RATE > 0`) or `histogram_quantile()` on `gmrlog_http_request_duration_seconds_bucket` | Two independent sources now — Sentry needs no scrape setup, Prometheus is exact and request-normalized |
| Error rate by route/status          | `gmrlog_http_requests_total{status_code=~"5.."}`                                                                          | Now labeled — a per-route 5xx rate is a real query, not an approximation                               |
| `process_resident_memory_bytes`     | `/api/v1/metrics`                                                                                                         | Memory leak detection over days, not minutes                                                           |
| `/health/ready` check breakdown     | Polling the endpoint itself                                                                                               | Which specific dependency (db/redis/storage/meili) is degraded, when it happens                        |
| `pg_stat_activity` connection count | Direct Postgres query                                                                                                     | Prisma pool exhaustion — still not exported as a metric (see below)                                    |

No Grafana/Prometheus server is provisioned by this repo's Docker Compose files — if
you want the `/metrics` series in a dashboard rather than curled/PromQL'd by hand,
standing up a Prometheus scrape target + Grafana is infrastructure to add, not something
already running. The endpoint itself is ready to be scraped the moment one exists.
