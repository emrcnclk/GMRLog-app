# Module 12 — Moderation & Safety Scope Report

**Document:** `docs/00_PROJECT/MODULE_12_SCOPE_REPORT.md`  
**Date:** 2026-07-19  
**Role:** Principal Software Architect / CTO  
**Type:** Architecture discovery only — **no code, no migrations, no Prisma edits, no OpenAPI edits, no endpoint implementation**  
**Product roadmap ref:** `docs/01_PRODUCT/ROADMAP.md` (no separate `PROJECT_ROADMAP.md` in repo)  
**Backlog / matrix refs:** `docs/00_PROJECT/PRODUCT_BACKLOG.md`, `docs/01_PRODUCT/FEATURE_MATRIX.md` (Domain 15 — Moderation)

**SSOT precedence applied:**

1. `docs/00_PROJECT/NORTH_STAR.md`  
2. `docs/01_PRODUCT/ROADMAP.md` + Product Backlog + Feature Matrix  
3. Database Freeze / existing Prisma Moderation domain  
4. OpenAPI (`ADMIN_API.yaml`, domain report paths, `AI_API.yaml` — **read only**)  
5. Existing Freezes: Communication, Notification, Search, Reviews (Sprint 4.5), Admin Architecture  
6. Prior module reports (Modules 9–11) — Moderation must not violate their ownership locks

---

## Executive Summary

Moderation & Safety is **partially implemented inside Reviews BC**, with a **second write path** from Communication message reports into the same Freeze tables. There is **no Moderation bounded-context Nest module**, **no cross-entity resolve pipeline**, **no real WARN/SUSPEND/BAN application**, **no Appeals HTTP**, and **no AI assist**.

Database Freeze already provides: `ReportReason`, `Report`, `ModerationQueueItem`, `ModerationAction`, `ModeratorNote`, `Appeal`, `AuditLog`, plus User flags (`isSuspended`, `isBanned`, `strikeCount`) and `PlatformRole` (`MODERATOR`, `ADMIN`). There is **no** `ReportTarget`, `ModerationLog`, `Warning`, `Ban`, or `Suspension` table — polymorphic targeting uses `entityType` + `entityId`.

**Module 12 MVP** must deliver a **human-in-the-loop Trust & Safety foundation** for gaming-culture UGC:

- Cross-entity **Reporting Core** (reuse Freeze models; unify intake policy)  
- **Moderation Queue** (list / detail / resolve for MVP entity types)  
- **Policy actions** that mutate the correct SoT (content hide via domains; warn/suspend/ban via **Users**)  
- **Appeals** (schema-ready; HTTP contract to be locked in Freeze — prefer minimal OpenAPI change-control, not invent)  
- **Audit trail** (append-only `AuditLog` + existing action rows)

**Explicitly out of Module 12 MVP:** AI moderation / toxicity / image / voice / auto-spam ML, trust/reputation scores, community moderators, auto-escalation engines, `adminBatchScanModeration`, `POST /ai/moderation`.

**Recommended path:** Introduce a thin **Moderation BC** that **owns** report policy, queue lifecycle, resolve orchestration, appeals, and audit correlation — while **delegating** entity mutations to owning domains (Reviews, Communication, Collections, Lists, Tier Lists, Users). Prefer **no new Prisma models** for MVP. Prefer **no OpenAPI invent** in discovery; Freeze may authorize a narrowly scoped change-control for Appeals + entity-type alignment if required.

**Implementation must not start** until Sprint **12.0 Architecture + Freeze** is accepted.

---

## Goals

### Primary

Make GMRLOG a **safe digital home for gaming culture**: players can report harmful UGC/users; moderators can review a queue and apply proportionate actions — without Moderation becoming a second SoT for Reviews, Messages, or Users, and without shipping AI judgment as the default.

### Success criteria (Module 12 MVP complete)

| Criterion | Measure |
|-----------|---------|
| Report intake | Authenticated users can report MVP entity types into `Report` + queue enqueue |
| Queue | Moderators/Admins list, inspect, and resolve queue items |
| Content actions | Reject/hide (and restore where applicable) applied via **domain ports** |
| User actions | WARN / SUSPEND / BAN mutate **Users** flags (`strikeCount` / `isSuspended` / `isBanned`) with audit |
| Appeals | Affected user can file/list appeal; staff can resolve (scope locked in Freeze) |
| Audit | Resolve / hide / user-state changes append `AuditLog` (and `ModerationAction`) |
| North Star | Protect community quality; preserve legitimate critique/spoilers discourse; AI assists later, not replaces humans |
| BC clarity | Moderation orchestrates policy; domains remain SoT for entities |
| Freeze respect | No conflict with Communication / Notification / Search Freezes |

### Non-goals (this module MVP)

- AI scoring, auto-block, batch AI backfill (`AI_MODERATION.md`, `adminBatchScanModeration`, `moderateContent`)  
- Toxicity / image / voice / OCR moderation pipelines  
- Trust score / reputation / community moderator programs  
- Full Admin CMS, jobs, feature-flags product (adjacent `ADMIN_API` — out of Moderation MVP except audit read if scheduled)  
- Replacing Spoiler UX owned by Reviews (already shipped in 4.5)  
- Feed / Search / Notification ownership of moderation UI

---

## Scope analysis — capability inventory

| Capability | Schema | OpenAPI | Runtime | Classification |
|------------|--------|---------|---------|----------------|
| Report reasons catalog | `ReportReason` + seed | Implicit via reason codes | Seeded; used by Reviews + Comm | **Already implemented** |
| Report Review | `Report` (`REVIEW`) | `reportReview` | Reviews BC | **Already implemented** |
| Report Message | `Report` (`MESSAGE`) | `reportMessage` | Communication BC | **Already implemented** |
| Admin list/update reports | `Report` | `adminListReports`, `adminUpdateReport` | Reviews BC | **Already implemented** |
| Moderation queue list/detail | `ModerationQueueItem` | `adminListModerationQueue`, `adminGetModerationItem` | Reviews BC (all types in DB; UX review-centric) | **Partially implemented** |
| Resolve queue item | `ModerationAction` | `adminResolveModerationItem` | Reviews BC — content side-effects **REVIEW only**; WARN/SUSPEND/BAN **recorded, not applied** | **Partially implemented** |
| Hide/restore review | `Review.deletedAt` | **Missing** (runtime gap vs OpenAPI) | Reviews BC | **Partially implemented** |
| Spoiler safety | `containsSpoilers` | Review surfaces | Reviews BC | **Already implemented** (not Module 12 primary) |
| Report List | Enum **lacks `LIST`** | `reportList` | **Missing** | **Missing** (+ schema mismatch) |
| Report via Social `POST /reports` | Polymorphic | `reportContent` (includes `USER`, `LIST`, …) | **Missing** | **Missing** (+ enum mismatch) |
| Report Collection / TierList | Enum has types | No dedicated paths; Social covers | **Missing** | **Missing** |
| Report User / Profile | Enum has `PROFILE` (not `USER`) | Social uses `USER` | **Missing** | **Missing** (+ naming mismatch) |
| Report Comment / Post | Enum has types | Social includes COMMENT/POST | **Missing** | **Deferred** (unless Feed/Posts MVP requires) |
| Moderator notes | `ModeratorNote` | Not first-class | **Unused** | **Deferred / optional** |
| Appeals | `Appeal` | **None** | **Missing** | **Missing** (MVP candidate if Freeze locks HTTP) |
| User warn/suspend/ban | User flags | `adminUpdateUser` | Flags **read** everywhere; **no admin mutate API** | **Missing** |
| Audit list/export | `AuditLog` | `adminListAuditLog`, `adminExportAuditLog` | Write-only from mod/auth/catalog | **Partially implemented** |
| Moderation stats | — | `adminGetModerationStats` | **Missing** | **Deferred** (nice-to-have) |
| AI batch scan / `moderateContent` | — | Yes | **Missing** | **Deferred** (Phase 2 / AI) |
| Dedicated Moderation Nest module | Shared tables | ADMIN owns dashboard | Code under **Reviews** | **Missing** (architecture) |

---

## Existing database (Freeze — do not invent)

### Models present

| Model | Role |
|-------|------|
| `ReportReason` | Catalog of reason codes |
| `Report` | User-submitted report + status/resolution |
| `ModerationQueueItem` | Human review queue |
| `ModerationAction` | Resolve decision record |
| `ModeratorNote` | Internal notes on queue item |
| `Appeal` | Appeal linked to `reportId` + `userId` |
| `AuditLog` | Append-only platform audit |

### Models / names **absent** (do not invent for MVP)

`ReportTarget`, `ModerationLog`, `Warning`, `Ban`, `Suspension` — use polymorphic `entityType`/`entityId`, `ModerationAction`, `AuditLog`, and **User** flags.

### Enums

| Enum | Values / notes |
|------|----------------|
| `ModerationEntityType` | `REVIEW`, `POST`, `COMMENT`, `PROFILE`, `MESSAGE`, `COLLECTION`, `TIERLIST` — **no `LIST`, no `USER`** |
| `ModerationPriority` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `ModerationQueueStatus` | `PENDING`, `IN_REVIEW`, `ESCALATED`, `RESOLVED` |
| `ModerationResolveAction` | `APPROVE`, `REJECT`, `EDIT_APPROVE`, `WARN`, `SUSPEND`, `BAN` |
| `ReportStatus` | `OPEN`, `IN_REVIEW`, `RESOLVED`, `DISMISSED` |
| `AppealStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `PlatformRole` | includes `MODERATOR`, `ADMIN` |

### User moderation fields

`isSuspended`, `isBanned`, `strikeCount`, `deletedAt`, `platformRole`.

### Indexes (Freeze-rated)

`(status, createdAt)` on reports; `(entityType, entityId)`; queue `(status, priority, createdAt)`; appeals `(userId, status)`; audit `(createdAt)`, `(entityType, entityId)`.

### Hidden content pattern

Soft-delete via domain `deletedAt` (Reviews, Messages, Collections, Lists, Tier Lists, Posts, Comments). No separate `isHidden` column for reviews — hide ≡ soft-delete.

---

## Existing runtime

### Present

| Area | Location | Notes |
|------|----------|-------|
| Report + queue + resolve + admin reports | `apps/api/src/reviews/moderation/**` | Platform moderation **incorrectly housed** in Reviews BC |
| Message report | `communication/message-engagement.*` | Writes `Report` + queue; **no** moderation events |
| Roles gate | `JwtAuthGuard` + `RolesGuard` `@Roles('ADMIN','MODERATOR')` | Matches `PlatformRole` |
| Audit writes | Moderation resolve/hide; Auth security; Games catalog | No admin list HTTP |
| Spoiler helpers | `SpoilerService` | Reviews product, not T&S queue |
| Suspended/banned enforcement | Auth login, profiles, search, social | Read-side only |

### Gaps

1. No top-level `moderation/` Nest module (docs sketch vs Reviews nesting).  
2. Resolve does not apply WARN/SUSPEND/BAN to Users (`banApplied: false` by design in Sprint 4.5).  
3. Resolve content side-effects only for `REVIEW`.  
4. No Collection / TierList / Profile / List / Social unified report runtime.  
5. No Appeals services/controllers.  
6. No `adminUpdateUser` / admin audit list runtime.  
7. No Moderation Event / Cache / Permission / Visibility matrices.  
8. Message reports not visible as first-class resolve actions (queue rows exist; no MESSAGE hide port wired).  
9. `ModeratorNote` unused.

---

## Existing OpenAPI (read-only categorization)

### Implemented (runtime matches contract)

| operationId | Path |
|-------------|------|
| `reportReview` | `POST /reviews/{reviewId}/report` |
| `reportMessage` | `POST /conversations/.../messages/{messageId}/report` |
| `adminListModerationQueue` | `GET /admin/moderation/queue` |
| `adminGetModerationItem` | `GET /admin/moderation/queue/{itemId}` |
| `adminResolveModerationItem` | `POST /admin/moderation/queue/{itemId}/resolve` |
| `adminListReports` | `GET /admin/reports` |
| `adminUpdateReport` | `PATCH /admin/reports/{reportId}` |

### Future / Phase 2 (do not unlock in Module 12 MVP)

| operationId | Why |
|-------------|-----|
| `adminBatchScanModeration` | AI backfill |
| `moderateContent` (`AI_API`) | AI assist |
| Toxicity / image / voice pipelines | `AI_MODERATION.md` |

### Missing runtime (contract exists or partial)

| operationId / surface | Notes |
|----------------------|-------|
| `reportList` | OpenAPI yes; enum lacks `LIST` — **blocker for naïve implement** |
| `reportContent` | Social unified intake; entity enum mismatch (`USER`/`LIST`) |
| `adminGetModerationStats` | Dashboard metrics |
| `adminListUsers` / `adminGetUser` / `adminUpdateUser` / roles / revoke sessions | User admin SoT needed for suspend/ban |
| `adminListAuditLog` / `adminExportAuditLog` | Audit read API |
| Appeals | **No OpenAPI paths** — schema only |
| Collection / TierList dedicated report paths | Absent; Social may cover |
| Review hide/restore | Runtime yes; OpenAPI gap (do not expand OpenAPI in discovery) |

**Constraint:** Do **not** modify OpenAPI in this discovery sprint. Freeze must decide: map mismatches, defer mismatched ops, or authorize change-control.

---

## Ownership (critical)

```text
Moderation & Safety (Module 12)
  ├── Report intake policy + dedupe rules
  ├── Queue lifecycle (assign / escalate / resolve orchestration)
  ├── Appeals workflow
  ├── Audit correlation for T&S actions
  └── Permission gates for moderator surfaces

Does NOT own (SoT stays in domains)
  ├── Review / Comment / Post bodies & soft-delete
  ├── Message bodies & soft-delete (Communication)
  ├── Collection / List / TierList aggregates
  ├── User lifecycle flags (Users BC owns isSuspended / isBanned / strikeCount)
  ├── Auth session revoke (Auth / Admin Users)
  ├── Notification delivery (Notifications consumes events)
  ├── Feed / Search ranking
  └── AI model inference (AI BC — Phase 2)
```

| Concern | Owner | Notes |
|---------|-------|-------|
| `Report`, queue, actions, notes, appeals tables | **Moderation BC** | Persistence + policy |
| `POST /reviews/.../report` façade | Reviews → delegates to Moderation | Keep URL; move logic out of Reviews ownership |
| `POST .../messages/.../report` | Communication → Moderation port | Comm keeps ACL; Moderation owns report row |
| `POST /reports` (Social) | Social façade → Moderation | Prefer single intake service |
| Content hide/restore | **Owning domain** via ports | Moderation calls `hideReview`, etc. |
| WARN / SUSPEND / BAN | **Users BC** port | Moderation never writes User flags directly long-term (may temporarily orchestrate via Users service) |
| Spoiler redaction | Reviews | Unchanged |
| Admin dashboard UI | `apps/admin` | Consumes ADMIN_API |
| AI moderation | AI BC | Deferred |

**Rule:** Moderation returns policy outcomes and queue state. Domains remain authoritative for entity data. Same composition pattern as Search/Notifications.

---

## MVP scope

### Required (Module 12 MVP)

| Item | Rationale |
|------|-----------|
| **Moderation BC extraction** | End Reviews ownership leak; shared queue for MESSAGE already exists |
| **Reporting Core** | Unified create-report + enqueue; reasons from `ReportReason` |
| **Report Review** | Harden existing path into BC |
| **Report Message** | Harden existing path; emit events consistently |
| **Report Profile (user)** | Feature Matrix P0 “Report User”; map OpenAPI `USER` → schema `PROFILE` |
| **Report Collection** | Enum + Social contract |
| **Report TierList** | Enum + Social contract |
| **Moderation Queue** | List / detail / resolve for MVP entity types |
| **Moderation Decision** | APPROVE / REJECT / EDIT_APPROVE (where domain supports) + WARN / SUSPEND / BAN **applied** |
| **Warning** | Via `strikeCount` (+ optional note) — no Warning table |
| **Suspend / Ban** | Via Users flags + Auth enforcement already present |
| **Appeal** | Use `Appeal` model; lock minimal HTTP in Freeze (user create/list + admin resolve) |
| **Audit Trail** | `ModerationAction` + `AuditLog` on resolve / user actions; prefer enabling `adminListAuditLog` if cheap |

### Future (explicitly not Module 12 MVP)

| Item | Source |
|------|--------|
| Report List | OpenAPI vs missing enum — **defer unless Freeze amends schema** |
| Report Comment / Post | Until Posts/Comments product priority demands |
| `ModeratorNote` CRUD productization | Optional polish |
| AI Moderation / toxicity / image / voice / auto-spam | Feature Matrix P2 / Future; `AI_MODERATION.md` |
| Trust score / reputation | Backlog / USER_API reputation mentions |
| Community moderators / mod reputation | Not in Freeze |
| Auto escalation ML | Deferred |
| `adminBatchScanModeration`, `moderateContent` | AI |
| Full Admin Users suite beyond T&S mutations | Broader Admin module |
| Live WebSocket mod queue | `WEBSOCKET_ARCHITECTURE.md` — later |

---

## Explicitly deferred

Only defer (do not invent new programs beyond SSOT):

- AI Moderation & `POST /ai/moderation`  
- Toxicity Detection  
- Image Moderation  
- Voice Moderation  
- Automatic Spam Detection (ML)  
- Trust Score / Reputation System  
- ML Risk Scoring  
- Community Moderators  
- Moderator Reputation  
- Auto Escalation engines  
- CSAM specialized pipelines beyond “human queue + freeze protocol” already noted in AI docs  
- Shadowban product (if not in OpenAPI/schema — do not invent)

---

## Events

### Already live (reuse)

| Event | Publisher today | Module 12 action |
|-------|-----------------|------------------|
| `review.reported.v1` | Reviews | Keep; optionally also emit generic report event if Freeze allows |
| `review.hidden.v1` / `review.restored.v1` | Reviews | Domain-owned; Moderation triggers via port |
| `moderation.resolved.v1` | Reviews moderation | Move publisher to Moderation BC |

### Required MVP (Freeze must lock names — prefer established patterns)

| Proposed / existing | When | Notes |
|---------------------|------|-------|
| `moderation.resolved.v1` | After queue resolve | **Already runtime** — keep |
| `*.reported.v1` per domain or single `moderation.report.created.v1` | After report create | Prefer **one** Moderation event + optional domain echo; **do not invent both without Freeze** |
| User lifecycle | After suspend/ban | Prefer existing Users/Auth patterns if any; else Freeze-approved `user.suspended.v1` / `user.banned.v1` **only if** required for Notifications — do not invent casually |
| `moderation.appeal.*` | Appeal create/resolve | Only if Appeals in MVP |

### Non-events (V1)

Do not invent AI score events, auto-ban events, or Feed ranking events from Moderation.

**Notifications:** Prefer consuming moderation/user events for SYSTEM notices — Notifications remains consumer-only (Module 10 Freeze).

**Gap:** No `docs/03_EVENTS/MODERATION_EVENT_MATRIX.md` yet — **create in Sprint 12.0**.

---

## Cache

No dedicated Search-style cache strategy exists for Moderation today.

### Hard rules

1. **No** `FLUSHALL` / `FLUSHDB` / namespace-wide wipe.  
2. **No** O(N) “invalidate all queues” on single resolve.  
3. Prefer short TTL cache-aside for queue list pages **or** no cache until proven hot.  
4. Targeted keys only.

### Suggested catalog (lock in 12.0)

| Key | Value | TTL | Invalidate |
|-----|-------|-----|------------|
| `moderation:queue:{hash}` | First page of filtered queue | 15–30s | On resolve / assign for that filter hash only — or skip cache |
| `moderation:stats` | Optional stats DTO | 30–60s | On resolve (single key replace) |
| `moderation:report:{id}` | Optional detail | short | On report update |
| Domain content caches | Review/list/etc. | Existing | Domain invalidation on hide/restore |

Recent-style user caches (Search/Notification) must **not** be flushed by Moderation.

---

## Permission Matrix (draft for Freeze)

Roles mapped to runtime `PlatformRole` (+ System). **Senior Moderator** is **not** a schema role — treat as process title under `MODERATOR` or defer; do not invent enum values.

| Action | ANON | USER (Reporter) | MODERATOR | ADMIN | SYSTEM |
|--------|------|-----------------|-----------|-------|--------|
| Create report (own auth) | — | ✅ | ✅ | ✅ | — |
| Report self content | — | — | — | — | — |
| List own reports | — | ✅ optional MVP | ✅ | ✅ | — |
| List all reports / queue | — | — | ✅ | ✅ | — |
| Resolve queue | — | — | ✅ | ✅ | — |
| WARN / SUSPEND | — | — | ✅ | ✅ | — |
| BAN | — | — | ✅ (policy) | ✅ | — |
| Role changes | — | — | — | ✅ | — |
| File appeal (own sanction) | — | ✅ | — | — | — |
| Resolve appeal | — | — | ✅ | ✅ | — |
| Read audit (T&S) | — | — | ✅ | ✅ | — |
| AI batch scan | — | — | — | Future | Future |
| Cross-user report read | — | — | ✅ | ✅ | — |

Reporter cannot see other reporters’ identities beyond policy-safe admin views.

---

## Visibility Matrix (draft for Freeze)

| Surface | Rule |
|---------|------|
| Report create response | 202/created; never leak whether target exists beyond standard 404 domain pattern |
| Non-existent entity report | Prefer **404** (same as domain GET) — avoid oracle where possible |
| Forbidden (blocked target edge cases) | **403** only when authenticated but policy denies; else 404 if platform pattern says so |
| Hidden / soft-deleted content | Public GET 404; moderators see queue snapshot / admin preview |
| Suspended user | Cannot login (Auth); profile hidden per Users rules |
| Banned user | Same / stronger — Auth blocks |
| Block relationships | Reporter may still report; do not expose block graph in report API |
| Moderator queue | Staff only; include redacted previews (Reviews already redacts) |
| Appeal | Own appeals only for users; staff see linked report |
| Audit | Staff only; never public |

---

## Compatibility

| Source | Alignment |
|--------|-----------|
| North Star | Safety enables belonging; AI Native moderation **assistive later**, not MVP replacement of humans |
| ROADMAP | Reports/queue not Phase 1 deliverable list; Feature Matrix places Report P0 at **Beta**, Admin Queue P1 at **V1** — Module 12 is the right tranche after Search (11) |
| FEATURE_MATRIX Domain 15 | Report Content/User/Review P0; Admin Queue + Audit P1; AI P2 — matches MVP vs deferred split |
| Communication Freeze | Comm owns message report engagement ACL; **must not** own Moderation admin — Module 12 respects |
| Notification Freeze | Notifications never SoT; may consume moderation/user events |
| Search Freeze | Search suppresses suspended/banned; Moderation supplies user-state SoT via Users |
| Sprint 4.5 | Explicitly deferred auto-ban — Module 12 is the unlock for **applying** actions correctly via Users |
| Database Freeze | Reuse tables; **do not invent** Warning/Ban tables |
| Module 9–11 | No ownership reversal of Comm / Notifications / Search |

---

## Risks

| Risk | Severity | Notes |
|------|----------|-------|
| Reviews BC ownership leak expands further | **High** | Platform queue living under Reviews invites wrong boundaries |
| OpenAPI ↔ Prisma entity mismatch (`LIST`, `USER` vs `PROFILE`) | **Critical** (for those ops) | Blind implementation violates Freeze “no invent schema” |
| WARN/SUSPEND/BAN recorded but not applied | **High** | Abuse continues; false sense of enforcement |
| Moderator overreach / missing dual-control on BAN | **High** | Security & trust; need audit + role policy |
| Reporter harassment / report spam | **High** | Need rate limits + duplicate open-report guards (partially present) |
| Privacy: queue previews leak private bodies | **Medium** | Redaction rules must extend beyond Reviews |
| Message report without MESSAGE resolve side-effects | **Medium** | Dead-end queue items |
| Scaling: unindexed admin filters / stats | **Medium** | Prefer existing indexes; avoid full scans |
| Performance: N+1 on queue detail hydration | **Medium** | Bound fan-out; snapshot fields |
| Notifications spam on every report | **Low–Medium** | Prefer notify on resolve/sanction, not every report |
| Schema amendment pressure for LIST | **Medium** | Temptation to invent enum — Freeze must decide defer vs amend |

---

## Blockers

### Critical

| ID | Blocker | Impact |
|----|---------|--------|
| C1 | **No Architecture Freeze** (matrices + ADR + ownership) | Implementation cannot start safely |
| C2 | **Entity-type contract mismatch** (`LIST` / `USER` vs `ModerationEntityType`) | Cannot implement `reportList` / Social `USER` without Freeze decision (map, defer, or Database Freeze amendment) |

### High

| ID | Blocker | Impact |
|----|---------|--------|
| H1 | Users admin mutation path (`adminUpdateUser` or Users port) absent | Cannot truthfully ship SUSPEND/BAN |
| H2 | Appeals have schema but **no OpenAPI** | MVP Appeals need Freeze change-control or admin-only temporary surface |
| H3 | Cross-entity resolve ports missing (MESSAGE/COLLECTION/TIERLIST/PROFILE) | Queue resolve incomplete outside Reviews |

### Medium

| ID | Blocker | Impact |
|----|---------|--------|
| M1 | No Event / Cache / Permission / Visibility matrices | Sprint 12.1+ ambiguity |
| M2 | Message reports lack domain events | Analytics / Notifications incomplete |
| M3 | Hide/restore OpenAPI gap | Docs drift (do not fix in discovery) |

### Can implementation begin?

**No.** Architecture discovery is complete; **coding is blocked** until Sprint **12.0 Freeze** resolves C1–C2 and locks H1–H3 approach. Prefer starting **12.0 documentation only**.

---

## Sprint proposal

| Sprint | Focus | Outcome |
|--------|-------|---------|
| **12.0** | Architecture + Freeze | ADR, `MODERATION_ARCHITECTURE`, Event/Cache/Permission/Visibility matrices, entity-type disposition, MVP op allowlist — **no code** |
| **12.1** | Reporting Core | Moderation Nest module; unified report create + enqueue; migrate Review + Message writers behind ports; add Profile/Collection/TierList reports per Freeze allowlist |
| **12.2** | Moderation Queue | Cross-entity queue UX parity; resolve orchestration; domain hide/restore ports; staff report admin remains |
| **12.3** | Actions & Appeals | WARN/SUSPEND/BAN via Users; Appeals MVP; audit completeness; optional `adminListAuditLog` |
| **12.4** | Hardening | Rate limits, cache keys, event parity, notification hooks (consumer-side), redaction, abuse controls |
| **12.5** | Final Audit | Production-readiness audit; declare Moderation Module V1 complete — **stop** |

Adjustments allowed by Freeze: merge 12.2–12.3 if scope shrinks; demote Appeals to post-MVP if OpenAPI change-control slips (then 12.3 = Actions only).

---

## Recommended Freeze decisions (lock in 12.0)

1. **Moderation BC** owns queue/report/appeal policy; domains remain entity SoT.  
2. **No new tables** for MVP; User flags + existing models only.  
3. **Map** Social `USER` → `PROFILE`; **defer `LIST`** until Database Freeze adds `LIST` **or** drop `reportList` from MVP allowlist.  
4. **SUSPEND/BAN/WARN apply** via Users port (end Sprint 4.5 “record only” exception).  
5. **AI / batch-scan** remain Phase 2.  
6. **Senior Moderator** is not a new enum — use `MODERATOR`/`ADMIN` policies.  
7. Prefer **no OpenAPI edits**; if Appeals are MVP-required, authorize **minimal** USER/ADMIN paths under change-control.

---

## Alignment checks

| Check | Result |
|-------|--------|
| North Star Question | Safer home for gaming culture without becoming generic social police-AI |
| Prior Freezes intact | Yes — Comm/Notification/Search ownership preserved |
| Prefer composition | Yes — extract BC; keep domain URLs |
| No schema invent in discovery | Observed; LIST gap documented as blocker |

---

## Decision

**APPROVED WITH MINOR CHANGES**

Minor changes to lock before coding (Sprint 12.0):

1. **Extract Moderation BC** from Reviews; Communication/Social become façades.  
2. **Entity-type disposition** for `LIST` / `USER`↔`PROFILE` without casual schema invent.  
3. **Users port** for real WARN/SUSPEND/BAN.  
4. **Appeals** included only with Freeze-approved HTTP surface (or explicitly deferred).  
5. **AI** remains deferred — human queue first.

No redesign of Database Freeze tables is required; composition and ownership correction are required.

---

## Gate

**Module 12 Scope Report complete.**

- No code  
- No Prisma changes  
- No OpenAPI changes  
- No migrations  
- No endpoint implementation  
- No future flags unlocked  

**Stop.** Do **not** start Sprint 12.0 implementation (architecture Freeze docs may proceed only when explicitly authorized as the next documentation sprint).
