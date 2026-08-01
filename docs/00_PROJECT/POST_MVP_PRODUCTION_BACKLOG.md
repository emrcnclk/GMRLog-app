# Post-MVP Production Engineering Backlog

**Document:** `docs/00_PROJECT/POST_MVP_PRODUCTION_BACKLOG.md`  
**Date:** 2026-07-21  
**Updated by:** Sprint 16.5 — Backend MVP Final Audit  
**Scope:** Operational / distributed systems / documentation hygiene **deferred after Backend MVP feature freeze**  
**Related:** Module 16 Scope · Platform Freeze · Analytics Final Cleanup · Sprint 16.3–16.5 reports

Every item below is **engineering-only**. Do **not** treat as open Backend MVP product debt.

> Sprint 16.5 closed Moderation M1 foreign soft-delete (Collection / TierList / Message / Post) via domain `hideForModeration` ports. Remaining items below are post-MVP only.

---

## Phase 1.1 — Production Engineering (Platform / Ops)

| Item | Notes | Status |
|------|-------|--------|
| Transactional Outbox | Durable domain-event delivery beyond in-process `DomainEventPublisher` | Deferred after MVP |
| Distributed dedupe | DB unique index / lock on Analytics ingest `sourceEventId` across nodes | Deferred after MVP |
| Event replay tooling | Ops tooling to re-drive allowlisted events into Analytics | Deferred after MVP |
| Cron monitoring | Heartbeats / missed-job alerts for Analytics / Platform UTC crons | Deferred after MVP |
| Multi-node consumers | Avoid duplicate cron/aggregate on horizontally scaled API replicas | Deferred after MVP |
| Horizontal scaling | Partitioned aggregation / worker pool / BullMQ fleets | Deferred after MVP |
| Observability stack | Prometheus / Grafana / OTEL traces — ingest lag, aggregation, purge | Deferred after MVP |
| Operational alerting | Page on aggregation / retention / GDPR / health job failure | Deferred after MVP |
| Secrets Manager / Vault | Beyond Zod env validation for Alpha | Deferred after MVP |
| Trusted-proxy / XFF allowlist | Deploy config for rate-limit correctness | Deferred after MVP |
| Full `RATE_LIMITING.md` progressive classes | Abuse classes / progressive IP block | Deferred after MVP |
| S3 health beyond MinIO-specific probes | Multi-provider readiness | Deferred after MVP |

---

## OpenAPI / Docs hygiene (explicit deferrals)

| Item | Notes | Status |
|------|-------|--------|
| Register public `/health`, `/health/live`, `/health/ready` | Ops surface; runtime exists | Deferred after MVP |
| Admin shell `/admin/me`, `/admin/dashboard`, `/admin/health` | Residual Admin OpenAPI | Deferred after MVP |
| Appeals public + admin OpenAPI register | Freeze change-control | Deferred after MVP |
| Auth sessions / devices / MFA / change-email OpenAPI polish | Partial AUTH_API coverage | Deferred after MVP |
| Catalog admin + import OpenAPI | Staff-only | Deferred after MVP |
| SOCIAL YAML discover/following/trending stubs vs Nest `GET /feed` only | Spec ahead of runtime — do not invent endpoints | Deferred / keep deferred |
| `AI_API.yaml` without Nest controller | Spec-only Phase 2+ — correct | Deferred (product) |
| CI: frozen YAML ↔ controller path diff | Prevent dual-source drift | Deferred after MVP |
| Client integration note | Auth headers, Problem Details, rate-limit headers for RN | Deferred after MVP |

---

## Runtime engineering polish (non-MVP)

| Item | Notes | Status |
|------|-------|--------|
| Meilisearch / vector search Nest | Search Freeze Phase 2 | Deferred |
| Push / Email notification send | Notification Freeze Phase 2 | Deferred |
| WebSocket messaging | Communication deferred | Deferred |
| Friends product APIs | Phase 2 Closed Beta | Deferred |
| Unified cursor exception family | Mix of `INVALID_CURSOR` vs `VALIDATION_FAILED`+field — clients already tolerate | Deferred after MVP |
| Shared `resolveLimit` helper package | Three clamp variants remain; behavior equivalent | Deferred after MVP |
| Auth security-log raw UUID cursor → base64url | Align with container wire | Deferred after MVP |
| Communication cursor field semantic rename | Wire `createdAt` overloaded — opaque OK | Deferred after MVP |
| Feed home post-filter page fill | Visibility filter in SQL `where` | Deferred after MVP |
| Posts / Moderation list cache broad invalidation | Targeted keys + TTL today; no KEYS | Deferred after MVP |
| `playSession.*` → kebab event names | Event Matrix rename campaign | Deferred after MVP |
| `game.game.viewed.v1` double-segment cleanup | Historical alias | Deferred after MVP |
| Engagement constants single source | Duplicate reaction weight files | Deferred after MVP |
| Moderation queue e2e history pagination flake | Stabilize smoke pack | Deferred after MVP |
| Catalog / discovery e2e mock flakes | Non-blocking for MVP declare | Deferred after MVP |
| Alpha smoke curated suite | Auth/profile/games/reviews/logs/feed/notifications/search/posts/health | Deferred after MVP |
| Perf sample API &lt;250ms | ROADMAP Alpha aspiration | Deferred after MVP |
| Dual Admin KPI surfaces | Ops live counts vs Analytics DailyMetric dashboards | Deferred after MVP |

---

## Explicitly out of Backend MVP

Kafka · RabbitMQ · Blue-Green · Serverless · Premium (Feature Matrix DOMAIN 16) · AI Nest · Recommendations · UI / RN / Web / Admin console product · Analytics warehouse/BI extensions · Schema expansion for bookmarks/pins/quotes/polls

---

## Ownership

Product/engineering schedules Phase 1.1 after **BACKEND MVP COMPLETE** (this Sprint 16.5 audit). Backend MVP feature surface was frozen at Sprint 16.4; 16.5 audit remediation closed Moderation domain-port hide paths only.
