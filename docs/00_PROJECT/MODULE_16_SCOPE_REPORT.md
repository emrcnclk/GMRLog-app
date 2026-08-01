# Module 16 — Backend MVP Completion Scope Report

**Document:** `docs/00_PROJECT/MODULE_16_SCOPE_REPORT.md`  
**Date:** 2026-07-21  
**Role:** Principal Software Architect / CTO  
**Type:** Architecture discovery only — **no code, no migrations, no Prisma edits, no OpenAPI edits, no implementation**  
**Product roadmap ref:** `docs/01_PRODUCT/ROADMAP.md`  
**Matrix ref:** `docs/01_PRODUCT/FEATURE_MATRIX.md`  
**North Star:** `docs/00_PROJECT/NORTH_STAR.md`  
**Prior gate:** Platform Module V1 COMPLETE (`SPRINT_15_5_FINAL_AUDIT.md`)

**SSOT precedence applied:**

1. `docs/00_PROJECT/NORTH_STAR.md`  
2. `docs/01_PRODUCT/ROADMAP.md` + Feature Matrix  
3. Existing Freezes (Notification · Search · Moderation · Admin · Analytics · Platform + prior domain Freezes)  
4. OpenAPI / Prisma — **read only**  
5. Runtime: `apps/api`  

**Naming clarity:** Feature Matrix **DOMAIN 16 = Premium** (Future / V2). Sprint **Module 16 = Backend MVP Completion** (engineering declaration gate) — **not** Premium BC.

---

## Executive Summary

Modules **1–15** have delivered a coherent **API-first backend**: identity, gaming identity surfaces, catalog, reviews, logs, feed aggregation, containers (collections/lists/tier-lists), communication REST, and platform Freezes for Notification → Search → Moderation → Admin → Analytics → Platform Infrastructure. Platform Freeze’s explicit gate (“Backend MVP declaration — No until Module 15 audit”) is **cleared** by Sprint 15.5.

**Backend MVP COMPLETE** is therefore an **engineering declaration**, not a new product bounded context and not Feature Matrix Premium (DOMAIN 16). It means: the Nest API + Prisma + OpenAPI Freeze surface is **operable and consumable** for Internal Alpha / Closed Alpha API clients (future React Native / iOS / Android), without inventing AI, UI, Phase 2/3 product, or Production Engineering backlog items.

The largest **product-roadmap gap** vs Phase 1 Internal Alpha deliverables is **Text Posts** (Prisma `Post` exists; Social HTTP for posts is missing — feed today is activity/log-driven). Remaining work is mostly **hygiene, Alpha-critical Social Post surface (if locked in), ops wiring, test stability, and a formal declare document** — not reopening Freezes 10–15.

| Dimension | Assessment |
|-----------|------------|
| Engineering Freezes 10–15 | **Complete** (APPROVED WITH MINOR CHANGES each) |
| Shared Platform infra (rate limit, SMTP, health, env) | **Complete** for V1 |
| Product Phase 1 Alpha API parity | **Near-complete** — **Posts** primary gap |
| Clients (web / mobile / admin UI) | **Out of Module 16** (stubs only — correctly excluded) |
| Production Engineering backlog | **Out** (`POST_MVP_PRODUCTION_BACKLOG.md`) |

**Recommended path:** Narrow Module 16 closeout — Freeze the Backend MVP definition, close Alpha-critical API gaps (or explicitly defer Posts with product sign-off), run release gates, declare **BACKEND MVP COMPLETE**. No new BC invent.

**Implementation must not start** until this Scope Report is accepted (**16.0**). Do **not** start Sprint 16.1 from this document alone without an accepted 16.1 plan.

---

## Goals

| Goal | Why (North Star) |
|------|------------------|
| Declare Backend MVP honestly | Digital home needs a trustworthy, operable API before belonging surfaces ship to devices |
| Close Alpha-critical API holes | Phase 1 “minimum playable” must not silently omit Posts if Alpha requires them |
| Preserve all Freezes | No reopen of Notification/Search/Moderation/Admin/Analytics/Platform ownership |
| Gate mobile readiness | RN/iOS/Android consume stable Auth + domain APIs — not UI work in Module 16 |
| Separate Premium DOMAIN 16 | Avoid Feature Matrix naming collision |

---

## Non-goals (Module 16)

- UI / React Native / Web / Admin console product UI / Design / Animations  
- AI / Recommendations / Meilisearch / vector search  
- Phase 2 Closed Beta product (Friends productization, Push send, Advanced Reviews expansions beyond existing, etc.) unless already Freeze-MVP residual  
- Phase 3 Public Launch checklist completeness (Friends, Developer/Studio *product pages*, etc.) as Module 16 invent  
- Production Engineering backlog (transactional outbox, BullMQ fleets, Prometheus/Grafana/OTEL, Vault, multi-node cron locks, HA)  
- Feature Matrix **Premium (DOMAIN 16)**  
- Kafka / RabbitMQ / Blue-Green / Serverless  
- Reopening domain Freezes or inventing Prisma business tables without change-control  

---

## Completed modules (rollup)

| Module / Domain | V1 status | Evidence |
|-----------------|-----------|----------|
| Users / Profiles | **Complete** | Controllers + privacy/prefs/identity; sanctions ports |
| Auth | **Complete** | Sessions, devices, MFA TOTP, OAuth (Google/Discord/Steam/Apple), SMTP via `PlatformMailService` |
| Games / Catalog | **Complete** | Browse/search/media/import/admin; IGDB path |
| Reviews | **Complete** | CRUD, comments, engagement, spoiler, moderation ports |
| GameLogs | **Complete** | Logs, play sessions, progress, timeline, stats |
| Feed | **Complete*** | Home/user feed aggregation + cache (*activity/log SoT; not Social Post CRUD) |
| Collections | **Complete** | CRUD, items, collaboration, discovery |
| Lists | **Complete** | CRUD, items, comments, discovery |
| TierLists | **Complete*** | CRUD, votes, comments (*like/bookmark junction absent — Minor) |
| Social graph | **Complete*** | Follow/block/mute/relationship (*Posts HTTP absent) |
| Communication | **Complete*** | REST DM/groups V1 (*WebSocket deferred — correct) |
| Notifications | **Complete*** | In-app Activity Center (*Push/Email send Phase 2 — Freeze) |
| Search / Discover | **Complete*** | SQL-first global + discover (*Meili/AI deferred — Freeze) |
| Moderation | **Complete** | Report/queue/appeals/sanctions via Users (`SPRINT_12_5`) |
| Admin | **Complete** | Orchestration + D1/D2 remediation closed (`ADMIN_POST_AUDIT_REMEDIATION.md`) |
| Analytics | **Complete** | Ingest + DailyMetric + staff dashboard (`ANALYTICS_FINAL_CLEANUP.md`) |
| Platform Infrastructure | **Complete** | Rate limit, SMTP, storage, scheduler host, health, logging hooks (`SPRINT_15_5`) |
| Shared infra (Prisma/Redis/S3/CI/Compose) | **Complete** | Sprint 0.1 + Module 15 hardening |

\* = intentional Freeze/Phase deferrals or documented Minor residual — not Module invent.

---

## Remaining backend work (discovery inventory)

### A. Missing MVP functionality (product Alpha vs engineering)

| Item | Classification | Notes |
|------|----------------|-------|
| **Text Posts HTTP** | **Alpha-critical gap** | ROADMAP Phase 1 lists Posts; Prisma `Post` exists; no Social Post controller |
| Friends product APIs | Phase 2 (Closed Beta) | Schema `Friendship` / `FriendRequest` may exist — **out of Module 16** unless product reclassifies |
| Push notification send | Notification Freeze Phase 2 | In-app only for V1 — **out** |
| WebSocket messaging | Communication deferred | REST sufficient for Alpha API — **out** |
| Meilisearch / AI Nest | Search/AI deferred | SQL search V1 — **out** |
| Achievements HTTP | Background consumer only | Not Phase 1 Alpha deliverable — **out** unless product asks |
| TierList like/bookmark | Minor schema gap | Vote exists — **optional Minor** |
| Admin FeatureFlags / Jobs UI | Admin Phase 2 | **out** |
| Analytics `ai`/`releases` dashboards | Analytics deferred 404 | **out** |

### B. Incomplete runtime paths

| Item | Severity | Notes |
|------|----------|-------|
| Moderation M1 — non-REVIEW soft-delete via Moderation Prisma | Major residual | Prefer domain ports (12.5) |
| Moderation M2 — post-claim resolve consistency edge | Major residual | Race/side-effect window |
| Moderation M3 — ban/suspend session vs appeal JWT path | Major residual | Security-adjacent |
| Analytics cron / GDPR unlink → Auth deletion | Minor/ops | Hooks exist; wiring incomplete (14.5 era debt) |
| Social Post create → FeedItem fan-out | Missing with Posts | Required **if** Posts enter Module 16 scope |
| Failed cron → health `degraded` coupling | Minor | Job state in meta; aggregate may stay ok |

### C. OpenAPI gaps (list only — no invent this sprint)

| Gap | Disposition |
|-----|-------------|
| Public `/health`, `/health/live`, `/health/ready` undocumented | Hygiene backlog |
| Admin shell `/admin/me|dashboard|health` | Admin residual |
| Moderation claim/assign/escalate hygiene | Moderation residual |
| Reviews reaction / hide path drifts (historical) | Hygiene |
| Communication `future` vs live 9.3 drift | Communication residual |
| `DOCUMENTATION_FREEZE_REPORT` inventory lag vs Communication YAML | Docs hygiene |

### D. Infrastructure gaps (Freeze-deferred — **not Module 16 invent**)

| Gap | Source |
|-----|--------|
| Multi-node Nest cron duplication | Platform Critical (accepted) |
| Transactional outbox | Platform Critical / `POST_MVP_PRODUCTION_BACKLOG` |
| BullMQ fleets, OTEL/Prometheus/Grafana, Vault | Platform Major deferred |
| XFF trusted-proxy allowlist; S3 health MinIO-specific | Platform Major |
| Full `RATE_LIMITING.md` class table / progressive IP block | Platform Major |

### E. Operational gaps

| Gap | Notes |
|-----|-------|
| Production runbook / Alpha deploy checklist consolidation | Needed for declare |
| Cron monitoring / alerting | Post-MVP backlog — out |
| Secrets Manager | Deferred — env Zod sufficient for Alpha |
| Full e2e suite flakes (moderation ×3, catalog mock ×1) | Stabilize critical smoke; do not expand suites unboundedly |

### F. Security gaps

| Gap | Notes |
|-----|-------|
| Moderation M3 appeal/session | Consider in Module 16 hygiene if Alpha invites staff T&S |
| Trusted proxy / XFF | Deploy config — document for Alpha hosts |
| Rate limit disabled in Vitest | Intentional; production default enabled — verify env matrix |

### G. Performance gaps

| Gap | Notes |
|-----|-------|
| ROADMAP Alpha “API &lt;250ms” | Not systematically proven — smoke/perf sample recommended before declare |
| Search privacy N-GETs / RL under load | Acceptable V1; watch in Alpha |

### H. Documentation gaps

| Gap | Notes |
|-----|-------|
| No `BACKEND_MVP_COMPLETE` / declaration SSOT yet | **Module 16 deliverable** |
| Naming collision Module 16 vs DOMAIN 16 Premium | This report locks engineering meaning |
| Client integration guide (Auth headers, Problem Details, rate-limit headers) | Recommended for RN readiness |

### I. Testing gaps

| Gap | Notes |
|-----|-------|
| Unit suite healthy (556) | Pass |
| Health e2e pass | Pass |
| Full e2e not fully green | Domain flakes — gate on critical path pack |
| No dedicated “Alpha smoke” curated suite | Recommend for Module 16 |

---

## Release blockers (for declaring BACKEND MVP COMPLETE)

| ID | Blocker | Must clear before declare? |
|----|---------|----------------------------|
| R1 | Formal Backend MVP definition + acceptance checklist SSOT | **Yes** |
| R2 | Product decision: include **Text Posts** in Backend MVP / Alpha API or explicitly defer | **Yes** (either implement or signed deferral) |
| R3 | Auth mail path production-capable (SMTP env — already wired) | **Verify** in target env |
| R4 | Rate limit + health + env validation in Alpha deploy | **Verify** |
| R5 | Critical-path e2e/smoke green (Auth, profile, games, reviews, logs, feed, notifications, search, health) | **Yes** |
| R6 | Moderation M1–M3 | **Should** for Closed Alpha with staff; **not** Freeze reopen — triage in 16.x |
| R7 | Production Engineering (outbox, BullMQ, OTEL) | **No** — excluded |
| R8 | Mobile/Web UI | **No** — excluded |
| R9 | Friends / Push / Meili / AI | **No** — Phase 2+ / Freeze deferred |

---

## Readiness verification (target consumers)

| Target | Ready? | Notes |
|--------|--------|-------|
| React Native application | **API-ready with gaps** | Auth+domain APIs exist; Posts may block Alpha social UX; clients stub |
| iOS / Android | Same as RN | Device apps out of Module 16; backend consumable after R1–R5 |
| Investor demo | **Partial** | API + seed/demo scripts possible; UI stubs limit polish — not Module 16 UI work |
| Closed Alpha | **Near** | After Posts decision + smoke + deploy checklist |
| Production MVP (public v1) | **Not yet** | Feature Matrix public MVP includes Friends, Dev/Studio pages, etc. — **later phases**, not Module 16 |

---

## Recommended MVP completion scope (Module 16 allowlist)

1. **Backend MVP Freeze / Declaration Criteria** — single SSOT: what “COMPLETE” means; naming lock vs Premium DOMAIN 16; Freeze compatibility statement.  
2. **Alpha Posts decision** — product sign-off:  
   - **Option A (preferred if Alpha = ROADMAP Phase 1):** implement Social Text Posts + FeedItem fan-out (narrow Freeze/amendment).  
   - **Option B:** explicitly defer Posts to Beta with written exception to Phase 1 list.  
3. **Release hygiene pack** — OpenAPI register for public health (change-controlled); client auth/rate-limit note; deploy/env Alpha checklist.  
4. **Security-adjacent Moderation residuals (M1–M3)** — triage/fix if Alpha includes staff T&S; no AI/LIST invent.  
5. **Ops wiring (thin)** — Analytics cron enablement + GDPR unlink call from Auth deletion **if** cheap; no BullMQ/outbox invent.  
6. **Alpha smoke suite** — curated e2e/smoke must pass; document known domain flakes as non-blocking if unrelated.  
7. **Final audit + `BACKEND_MVP_COMPLETE` declaration** — scores + gate phrase.

**Explicitly still out:** UI, RN apps, AI, Meili, Push send, Friends product, Premium, Production Engineering backlog, Admin CMS/Flags/Jobs.

---

## Suggested sprint breakdown

| Sprint | Focus | Outcome |
|--------|-------|---------|
| **16.0** | Scope discovery (this document) | APPROVED WITH MINOR CHANGES → unlock planning |
| **16.1** | Backend MVP Freeze + declaration criteria SSOT | Locked definition; Posts Option A/B decision recorded |
| **16.2** | Alpha-critical API close | Posts+fan-out **or** signed deferral + any Freeze-authorized tiny gaps |
| **16.3** | Hygiene + security residuals | Health OpenAPI register; Moderation M1–M3 triage/fix; thin GDPR/cron wiring |
| **16.4** | Release gates | Alpha smoke green; deploy checklist; env verify (SMTP/RL/health) |
| **16.5** | Final audit | **BACKEND MVP COMPLETE** declaration — stop; do not invent Module 17 product BC here |

Sprints may compress (16.2+16.3) if Posts are deferred (Option B).

---

## Compatibility with all Freeze documents

| Freeze | Compatible? | Notes |
|--------|-------------|-------|
| Notification | **Yes** | Keep in-app only; no Push invent in Module 16 |
| Search | **Yes** | Keep SQL-first; no Meili/AI |
| Moderation | **Yes** | M1–M3 hygiene only; no LIST/AI invent |
| Admin | **Yes** | No CMS/Flags/Jobs Phase 2 invent; D1/D2 already closed |
| Analytics | **Yes** | No warehouse/BI; optional thin cron/GDPR wiring |
| Platform | **Yes** | No BullMQ/OTEL/Vault/outbox invent; declare now unlocked by 15.5 |
| Communication / prior domain Freezes | **Yes** | Posts work (if chosen) stays Social ownership; no Comm reopen |

Module 16 **must not** reinterpret Freezes as incomplete solely because Phase 2 product items remain deferred.

---

## Ownership matrix (Module 16)

| Concern | Owner |
|---------|-------|
| Backend MVP declaration SSOT | Module 16 (CTO / Architecture) |
| Text Posts (if Option A) | **Social** BC (+ Feed fan-out compose) |
| Moderation M1–M3 fixes | **Moderation** (+ Users/Reviews ports) |
| Health OpenAPI register | Docs change-control (OpenAPI) — not Platform invent of new routes |
| Deploy/env Alpha checklist | Platform + Ops docs |
| Client apps | **Out** — separate mobile/web tracks |

---

## Decision

Module 16 is the **correct next engineering gate** after Platform V1: declare Backend MVP, reconcile Phase 1 Posts gap, and ship a narrow hygiene/release pack — without UI, AI, Phase 2/3 product sprawl, or Production Engineering backlog.

Residual ambiguity (Posts Option A vs B; how hard to push M1–M3 before Alpha) is acceptable for a scope report and must be locked in **16.1 Freeze**.

**APPROVED WITH MINOR CHANGES**

Stop. Do **not** start Sprint 16.1 from this message alone without an explicit 16.1 kickoff.
