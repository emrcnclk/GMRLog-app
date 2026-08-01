# Analytics Platform Freeze v1.0

**Document:** `docs/00_PROJECT/ANALYTICS_PLATFORM_FREEZE_v1.md`  
**Date:** 2026-07-20  
**Status:** **FROZEN**  
**Preceded by:** Module 14 Scope Report (`APPROVED WITH MINOR CHANGES`) + Sprint 14.0 architecture  
**Unlocks:** Sprint 14.1 Event Ingestion

---

## What is frozen

The Analytics Platform documentation set below is the **normative SSOT** for Sprint 14.1+. Implementors must not reinterpret these decisions in code reviews.

| Artifact | Role |
|----------|------|
| [`docs/01_ARCHITECTURE/ANALYTICS_ARCHITECTURE.md`](../01_ARCHITECTURE/ANALYTICS_ARCHITECTURE.md) | Bounded context & pipeline |
| [`docs/01_ARCHITECTURE/ADR/ADR_Analytics_Platform.md`](../01_ARCHITECTURE/ADR/ADR_Analytics_Platform.md) | ADR-ANL-001 Accepted |
| [`docs/03_EVENTS/ANALYTICS_EVENT_MATRIX.md`](../03_EVENTS/ANALYTICS_EVENT_MATRIX.md) | Consumer allowlist |
| [`docs/04_CACHE/ANALYTICS_CACHE_STRATEGY.md`](../04_CACHE/ANALYTICS_CACHE_STRATEGY.md) | Redis keys & invalidation |
| [`docs/05_SECURITY/ANALYTICS_PERMISSION_MATRIX.md`](../05_SECURITY/ANALYTICS_PERMISSION_MATRIX.md) | AuthZ |
| [`docs/05_SECURITY/ANALYTICS_VISIBILITY_MATRIX.md`](../05_SECURITY/ANALYTICS_VISIBILITY_MATRIX.md) | Privacy / GDPR |
| [`docs/08_API/ADMIN_API.yaml`](../08_API/ADMIN_API.yaml) | `adminGetAnalyticsDashboard` — **do not invent paths**; **no OpenAPI edit without change-control** |

**Historical / product:** [`docs/13_ANALYTICS/*`](../13_ANALYTICS/) is **non-normative on conflict** — Freeze set wins for Module 14+.

**Database schema:** Reuse existing `AnalyticsEvent`, `DailyMetric`, `RetentionMetric` (and view facts only when client telemetry is later unlocked). This Freeze **does not authorize** new analytics tables/enums for Module 14 V1.

**Prior Freezes intact:** Admin, Moderation, Communication, Notification, Search, Reviews, Games ownership locks are not reopened.

---

## Twelve locked decisions (non-negotiable for 14.1+)

### 1. Ownership

Analytics owns **only**:

- `AnalyticsEvent`  
- `DailyMetric`  
- `RetentionMetric`  
- **Derived analytics** read models / cache projections of the above  

Everything else remains owned by domain BCs.

### 2. Domains remain SoT — Analytics never mutates domain entities

| Domain | Remains SoT for |
|--------|-----------------|
| **Users** | Profiles, privacy, sanctions, `PlatformRole` |
| **Games** | Catalog entities |
| **Reviews** | Review bodies, hide/restore |
| **GameLogs** | Logs, progress, play sessions |
| **Feed** | Feed items / fanout |
| **Search** | `SearchEvent`, SERP, Discover, trending queries |
| **Notifications** | Inbox / delivery |
| **Moderation** | Reports, queue, appeals, resolve policy |
| **Collections / Lists / TierLists** | Entity lifecycle |

### 3. Event-driven + append-only

- MVP ingestion = **consume** allowlisted domain events.  
- `AnalyticsEvent` is **append-only** (except retention/GDPR unlink purge).  
- Analytics **does not publish** replacement domain lifecycle events.

### 4. Allowed events

Only events listed in [`ANALYTICS_EVENT_MATRIX.md`](../03_EVENTS/ANALYTICS_EVENT_MATRIX.md).  
**No future / speculative events** in V1 consumers.

### 5. Allowed metrics (`DailyMetric` keys)

| metricKey | Definition (MVP) | Source |
|-----------|------------------|--------|
| `malp_proxy` | Distinct non-null `userId` on approved GameLog **events** (`gamelog.created.v1`, `game.progress.completed.v1`) in rolling 30d (UTC). **Never** GameLogs SQL. Proxy until client analytics SDK. | `AnalyticsEvent` only |
| `dau_proxy` | Unique `userId` on allowlisted analytics events in UTC day | `AnalyticsEvent` |
| `wau_proxy` | Unique `userId` in rolling 7d | `AnalyticsEvent` |
| `reviews_created` | Count `review.created.v1` in UTC day | `AnalyticsEvent` |
| `gamelogs_created` | Count `gamelog.created.v1` in UTC day | `AnalyticsEvent` |
| `search_executed` | Count search-executed allowlist events in UTC day | `AnalyticsEvent` |
| `feed_items_created` | Count `feed.item.created.v1` in UTC day | `AnalyticsEvent` |
| `reports_created` | Count `moderation.report.created.v1` in UTC day | `AnalyticsEvent` |
| `moderation_resolved` | Count `moderation.resolved.v1` in UTC day | `AnalyticsEvent` |
| `notifications_created` | Count `notification.created.v1` in UTC day | `AnalyticsEvent` |

Additional keys require Freeze amendment. `RetentionMetric` writers are **optional / deferred** past core MVP.

### 6. Allowed APIs (MVP)

| Surface | Notes |
|---------|-------|
| Analytics Nest module (internal consumers + aggregation jobs) | Required |
| Analytics dashboard **read port** (staff) | Required |
| `adminGetAnalyticsDashboard` with `dashboard=platform` | Allowed (Admin compose over Analytics) |
| Optional light `dashboard=moderation` **volume** series | Allowed if sourced from Analytics metrics only |

### 7. Deferred APIs / products

| Deferred | Notes |
|----------|-------|
| `adminGetAnalyticsDashboard` `ai` / `releases` | Phase 2+ |
| Client `POST /api/v1/analytics/events` SDK path | Phase 1.5 / Phase 2 (change-control if OpenAPI) |
| `searchAnalytics` (`SEARCH_API`) | Search deferred ops |
| Future BI / warehouse / Studio Analytics Products | Monetization / Feature Matrix Future |
| Player-facing analytics suites | Out of Module 14 V1 |

### 8. Privacy

- Properties: **IDs, enums, counts only** — no email, phone, raw IP, tokens, raw UGC bodies, DM text.  
- Anonymous/system actors: `userId` nullable.  
- Full rules: Visibility Matrix.

### 9. Retention

- Align with [`DATA_RETENTION.md`](../13_ANALYTICS/DATA_RETENTION.md): analytics events **24 months** target.  
- On account deletion: unlink/`userId` null on analytics rows; do not resurrect PII.  
- Implementation may start with soft unlink before partition drops.

### 10. Aggregation

- Idempotent upsert into `DailyMetric` on `(metricDate, metricKey)`.  
- UTC day boundaries.  
- Exclude banned/deleted users from uniqueness metrics when cheaply available (Quality Guardrails in PRODUCT_METRICS).  
- Best-effort event bus: aggregation must tolerate missing events (document as V1 limitation).

### 11. Dashboard ownership

| Dashboard | Authoritative store |
|-----------|---------------------|
| Admin shell `GET /admin/dashboard` | Domain stats ports (Admin Freeze) |
| Platform KPI dashboard | `DailyMetric` (+ event-backed series) via Analytics |
| Moderation queue triage | Moderation / Admin compose — **not** Analytics |

### 12. SearchEvent boundary

- `SearchEvent` table + trending = **Search BC**.  
- Analytics may consume `search.global.executed.v1` and domain `*.search.executed.v1` into `AnalyticsEvent`.  
- Analytics must **not** write `SearchEvent` or own trending.

### 13. Admin dashboard compose rule

- Admin may **read** Analytics ports for KPI embeds.  
- Admin must **not** write `AnalyticsEvent` / `DailyMetric` from Admin services.  
- Do not dual-implement the same KPI with divergent formulas without documenting SoT (see §5 / §11).

### 14. PostgreSQL-first — AI & third parties deferred

- V1 store = PostgreSQL.  
- Explicitly deferred: AI analytics, funnels, cohorts, recommendation analytics, heatmaps, session replay, A/B testing, ML dashboards, revenue analytics, third-party analytics providers as required runtime.

---

## Phase summary

| Bucket | Includes |
|--------|----------|
| **MVP** | Consumers, `AnalyticsEvent`, `DailyMetric` allowlist, platform dashboard read, privacy/cache baseline |
| **Phase 1.5 / 2** | Client ingest SDK, view facts, RetentionMetric jobs, OpenAPI hygiene, moderation volume polish |
| **Phase 3+** | Warehouse, BI embeds, Studio Analytics Products |
| **AI** | Toxicity / risk / predictive / ML dashboards |
| **Deferred UX** | Funnels, cohorts product UI, heatmaps, session replay, A/B |

---

## Compatibility checklist

| Source | Result |
|--------|--------|
| North Star | Internal metrics enable healthier belonging — **compatible** |
| Module 14 Scope Report | Consumer BC + PG-first + deferrals — **compatible** |
| Admin Freeze | Compose KPIs; do not replace ops dashboard — **compatible** |
| Search / Moderation / Notification Freezes | Consume only — **compatible** |
| OpenAPI / Prisma | Reuse; no invent in 14.0 — **compatible** |

---

## Unlock

| Sprint | May start after Freeze accept? |
|--------|--------------------------------|
| **14.1 Event Ingestion** | **Yes** (this Freeze) |
| 14.2 Aggregation | After 14.1 |
| 14.3 Dashboard Metrics | After 14.2 |
| 14.4 Hardening | After 14.3 |
| 14.5 Final Audit | After 14.4 |
| AI / third-party / Studio Analytics | **No** under Module 14 V1 Freeze without Phase unlock |

---

## Status

**FROZEN — Analytics Platform Freeze v1.0**
