# Module 13 — Admin Platform Scope Report

**Document:** `docs/00_PROJECT/MODULE_13_SCOPE_REPORT.md`  
**Date:** 2026-07-20  
**Role:** Principal Software Architect / CTO  
**Type:** Architecture discovery only — **no code, no migrations, no Prisma edits, no OpenAPI edits, no endpoint implementation**  
**Product roadmap ref:** `docs/01_PRODUCT/ROADMAP.md` (no separate `PROJECT_ROADMAP.md` in repo)  
**Backlog / matrix refs:** `docs/00_PROJECT/PRODUCT_BACKLOG.md`, `docs/01_PRODUCT/FEATURE_MATRIX.md` (Domain 15 — Moderation adjacent), `docs/01_PRODUCT/FEATURE_FLAGS.md`  
**Admin SSOT:** `docs/15_ADMIN/ADMIN_ARCHITECTURE.md`, `docs/08_API/ADMIN_API.yaml`

**SSOT precedence applied:**

1. `docs/00_PROJECT/NORTH_STAR.md`  
2. `docs/01_PRODUCT/ROADMAP.md` + Feature Matrix + Feature Flags  
3. `docs/15_ADMIN/ADMIN_ARCHITECTURE.md`  
4. Existing Freezes (Moderation V1 complete, Communication, Notification, Search, Reviews, Games)  
5. OpenAPI (`ADMIN_API.yaml` — **read only**) + domain admin gaps  
6. Prisma (existing `AuditLog`, `CmsContent`, `FeatureFlag*`, `UserAdminRole`, Moderation models)  
7. Prior module reports — especially Module 12 (Moderation) and Games Catalog Admin runtime  

---

## Executive Summary

Admin Platform is the **internal operator surface** for GMRLOG — not a player product. `ADMIN_API.yaml` already defines a broad contract (moderation, CMS, users, jobs, analytics, feature flags, audit). Runtime today is **uneven**:

| Area | OpenAPI | Schema | Nest HTTP | `apps/admin` UI |
|------|---------|--------|-----------|-----------------|
| Moderation queue / resolve / appeals | Partial (gaps both ways) | Yes | **Implemented** (Module 12) | Stub only |
| Reports list/update | Yes | Yes | **Implemented** (Reviews façade) | Stub |
| Review hide/restore | Gap | Review soft-delete | **Implemented** | Stub |
| Games catalog admin | **Gap** | Games | **Implemented** (`/admin/catalog`) | Stub |
| Users admin | Yes | User + `UserAdminRole` | **Missing** (sanctions via Users port only) | Stub |
| Audit list/export | Yes | `AuditLog` | Write-only | Stub |
| CMS | Yes | `CmsContent` | **Missing** | Stub |
| Feature flags | Yes | `FeatureFlag` + approval | **Missing** | Stub |
| Jobs / analytics | Yes | No Job model / `AnalyticsEvent` | **Missing** | Stub |
| Notifications / Search / System Settings admin | **No ADMIN_API paths** | Domain tables / no `SystemSetting` | **Missing** | Stub |

`apps/admin` exists as a Next.js package stub (`GMRLOG Admin` heading only). `ADMIN_ARCHITECTURE.md` phases: Alpha/Beta moderation+audit → **V1 CMS / users / jobs** → **V1.5 flags / analytics / MFA**.

**Module 13 MVP** should deliver a **thin Admin Platform foundation**:

1. **Admin shell** (`apps/admin`) — auth + role gate + navigation to operator workflows  
2. **User Management** — list / get / update (T&S fields) / roles / session revoke per `ADMIN_API`  
3. **Admin Audit** — append-only **read** list (+ export if cheap) over existing `AuditLog`  
4. **Compose Module 12** — Dashboard links + Reports + Queue + Appeals + Review hide/restore UI against **existing** APIs (no second Moderation BC)  
5. **Game Catalog Management** — consume existing `/admin/catalog` (+ import); OpenAPI hygiene deferred to Freeze change-control  
6. **Admin Roles / Permissions** — lock dual-model disposition (`PlatformRole` JWT vs `UserAdminRole` / `AdminRole`) and enforce Moderator vs Admin matrix

**Explicitly out of Module 13 MVP:** full CMS product, Feature Flags runtime/SDK, System Settings store, Jobs/BullMQ ops console, Analytics embeds, Notification/Search admin suites, AI batch-scan, Enterprise four-eyes / MFA / VPN hardening as product features.

**Recommended path:** Treat Admin as an **orchestration + presentation BC** (API façades + `apps/admin` UI) that **delegates** to owning domains (Users, Games, Moderation, Reviews). Prefer **no new Prisma models** for MVP. Prefer **no OpenAPI invent**; Freeze may authorize minimal change-control for catalog paths already live and for role-model clarity.

**Implementation must not start** until Sprint **13.0 Architecture + Freeze** is accepted.

---

## Goals

### Primary

Give internal Moderators and Admins a **credible digital home for operations**: manage users and trust actions, review reports/queue, maintain game catalog, and inspect audit — without Admin becoming a second SoT for Users, Games, Reviews, Notifications, or Search, and without shipping AI or enterprise CMS as the first step.

### Success criteria (Module 13 MVP complete)

| Criterion | Measure |
|-----------|---------|
| Admin shell | Authenticated `apps/admin` with `MODERATOR`/`ADMIN` gate; no player-app session sharing in prod guidance |
| User management | Staff can search/list users, view admin detail, update T&S fields / roles per matrix, revoke sessions |
| Compose T&S | Staff UI (or documented API-first views) consume Module 12 queue/appeals + reports + review hide/restore |
| Catalog ops | Staff can create/update/archive games & taxonomies via existing catalog admin (UI or API-first) |
| Audit read | Staff can list `AuditLog` with filters; Admin can export (rate-limited) if in allowlist |
| Roles / permissions | Moderator vs Admin separation matches `ADMIN_ARCHITECTURE` + Security matrices; no privilege escalation |
| North Star | Safer gaming-culture home via human ops tooling — Admin is infrastructure for belonging, not a consumer social surface |
| BC clarity | Domains remain SoT; Admin orchestrates privileged HTTP + UI only |
| Freeze respect | Moderation / Games / Users / Notification / Search ownership preserved |

### Non-goals (this module MVP)

- AI moderation assist, toxicity UI, `adminBatchScanModeration`, `POST /ai/moderation`  
- Full CMS (announcements, legal, discover rails) — schema exists; product later  
- Feature Flags product + Redis eval + `@gmrlog/analytics` SDK (documented V1.5)  
- System Settings / kill-switch config store (no `SystemSetting` model)  
- BullMQ jobs console, PostHog/Grafana analytics embeds  
- Notification Admin / Search Admin suites (not in `ADMIN_API.yaml`)  
- Enterprise MFA enforcement, four-eyes production toggles, hash-chain audit, VPN productization  
- Re-implementing Moderation BC or inventing parallel queue APIs  

---

## Scope analysis — capability inventory

| Capability | Schema | OpenAPI | Runtime | Classification |
|------------|--------|---------|---------|----------------|
| Admin Dashboard (shell + nav) | N/A | Partial (`adminGetModerationStats`, analytics) | Stub page only | **Missing** (MVP shell) |
| Moderation stats | N/A | `adminGetModerationStats` | **Missing** | **Phase 2** (nice-to-have; deferred in Module 12) |
| Analytics dashboards | `AnalyticsEvent` | `adminGetAnalyticsDashboard` | **Missing** | **Phase 3** |
| User list/get/update | User flags + profile | `adminListUsers`, `adminGetUser`, `adminUpdateUser` | Sanctions port **Partial**; HTTP **Missing** | **MVP** |
| Session revoke | Auth sessions | `adminRevokeUserSessions` | Used on BAN/SUSPEND path; dedicated admin HTTP **Missing** | **MVP** |
| Role assign | `UserAdminRole` + `PlatformRole` | `adminUpdateUserRoles` | JWT `@Roles` uses **PlatformRole**; dual model **unclear** | **MVP** (lock in Freeze) |
| Game Catalog Management | Games domain | **Gap** (not in ADMIN_API) | `/admin/catalog` + import **Implemented** | **MVP** (compose + OpenAPI hygiene later) |
| Review Moderation UI API | Review soft-delete | Hide/restore **gap** | `admin-review-moderation` **Implemented** | **MVP** (compose; no redesign) |
| Report Management | `Report` | `adminListReports`, `adminUpdateReport` | Reviews façade **Implemented** | **MVP** (compose; optional BC move polish) |
| Queue / Appeals | Moderation models | Partial + runtime gaps | Module 12 **Complete** | **MVP** (UI compose only) |
| Feature Flags | `FeatureFlag`, `FeatureFlagApproval` | List/update | Nest/SDK **Missing** | **Phase 2** (align ADMIN_ARCHITECTURE V1.5 → may slip Phase 2) |
| System Settings | **No model** | **No paths** | **Missing** | **Phase 3** / invent only under Freeze |
| Admin Audit list/export | `AuditLog` | `adminListAuditLog`, `adminExportAuditLog` | Write-only today | **MVP** |
| CMS | `CmsContent` | Full CRUD/publish | **Missing** | **Phase 2** |
| Jobs console | No Job table | List/retry | **Missing** | **Phase 2** |
| Notification Admin | Notification models | **None** | **Missing** | **Phase 3** |
| Search Admin | `SearchEvent` | **None** | **Missing** | **Phase 3** |
| AI batch scan | N/A | `adminBatchScanModeration` | **Missing** | **AI** |
| `apps/admin` product | N/A | Documented tree | Stub | **MVP** (shell + priority views) |
| Post admin delete | Feed/Post | `adminDeletePost` | **Missing** | **Phase 2** (depends Feed ownership) |
| GDPR export / Premium grant | User | Implied in ADMIN_ARCHITECTURE | **Missing** | **Enterprise** / Phase 3+ |

---

## Requested surfaces — phase split

### Admin Dashboard

| Phase | Scope |
|-------|-------|
| **MVP** | `apps/admin` shell: login/JWT, role gate, home with deep-links to Users / Reports / Queue / Catalog / Audit |
| **Phase 2** | `adminGetModerationStats` (queue depth, volume, SLA-ish aggregates) |
| **Phase 3** | `adminGetAnalyticsDashboard` embeds (platform health, DAU proxies) |
| **AI** | AI spend / flag-rate panels |
| **Enterprise** | Multi-tenant org dashboards, custom KPI packs |

### User Management

| Phase | Scope |
|-------|-------|
| **MVP** | `adminListUsers`, `adminGetUser`, `adminUpdateUser` (warn/suspend/ban + safe admin fields), `adminRevokeUserSessions` |
| **Phase 2** | Force password reset, richer private-profile staff view |
| **Phase 3** | GDPR export trigger, manual Premium grant |
| **AI** | Risk scoring overlays on user detail |
| **Enterprise** | Legal hold, advanced PII redaction policies |

### Game Catalog Management

| Phase | Scope |
|-------|-------|
| **MVP** | Consume existing catalog admin + provider import; document OpenAPI gap in Freeze; optional thin UI |
| **Phase 2** | ADMIN_API / GAME_API change-control to register paths; media workflow polish |
| **Phase 3** | Bulk import ops console, provider health UI |
| **AI** | Auto-metadata enrichment jobs |
| **Enterprise** | Multi-locale catalog governance, studio self-serve (out of internal Admin) |

### Review Moderation UI API

| Phase | Scope |
|-------|-------|
| **MVP** | UI/API compose of existing hide/restore + queue resolve (Reviews remain SoT) |
| **Phase 2** | OpenAPI hygiene for hide/restore; staff preview improvements |
| **Phase 3** | Bulk review actions |
| **AI** | Toxicity / spoiler assist on review detail |
| **Enterprise** | Publisher dispute workflows |

### Report Management

| Phase | Scope |
|-------|-------|
| **MVP** | Compose `adminListReports` / `adminUpdateReport`; align with Module 12 report policy |
| **Phase 2** | Move admin reports HTTP fully under Moderation BC (debt cleanup); richer filters |
| **Phase 3** | Cross-entity reporter analytics |
| **AI** | Auto-triage / priority suggestion |
| **Enterprise** | Legal export of report packs |

### Feature Flags

| Phase | Scope |
|-------|-------|
| **MVP** | **Out** — schema + OpenAPI only; no Nest eval |
| **Phase 2** | `adminListFeatureFlags` / `adminUpdateFeatureFlag` + Redis-backed runtime + audit |
| **Phase 3** | Per-user overrides, client min-version, percentage rollout UI |
| **AI** | Experimentation / bandit allocation |
| **Enterprise** | Four-eyes production toggles (already documented), environment promotion gates |

### System Settings

| Phase | Scope |
|-------|-------|
| **MVP** | **Out** — no `SystemSetting` model / ADMIN_API |
| **Phase 2** | Kill-switch subset only if Feature Flags covers `ops.*` (prefer flags over new settings table) |
| **Phase 3** | First-class System Settings under Freeze + schema amendment if still needed |
| **AI** | Auto-tuning thresholds |
| **Enterprise** | Region/compliance policy packs |

### Admin Audit

| Phase | Scope |
|-------|-------|
| **MVP** | `adminListAuditLog` filters; append-only guarantee preserved; prefer `adminExportAuditLog` if rate-limit ready |
| **Phase 2** | Actor/resource advanced search; retention tooling |
| **Phase 3** | Hash-chain / tamper-evident (ADMIN_ARCHITECTURE V2 note) |
| **AI** | Anomaly detection on privileged actions |
| **Enterprise** | SIEM export, immutable WORM storage |

### Admin Roles

| Phase | Scope |
|-------|-------|
| **MVP** | Lock single source of truth for staff roles: prefer **`PlatformRole` on User** for JWT guards; decide fate of `AdminRole` / `UserAdminRole` (map, sync, or deprecate path) |
| **Phase 2** | `adminUpdateUserRoles` fully wired + UI |
| **Phase 3** | Custom role packs (beyond Moderator/Admin) |
| **AI** | N/A |
| **Enterprise** | Fine-grained RBAC / ABAC, break-glass roles |

### Admin Permissions

| Phase | Scope |
|-------|-------|
| **MVP** | Enforce `ADMIN_ARCHITECTURE` matrix: Moderator = T&S queue/users warn-suspend; Admin = ban preferred, CMS/flags/jobs/export |
| **Phase 2** | Align BAN Admin-only vs Freeze “MODERATOR may BAN + audit” (document conflict; do not invent silently) |
| **Phase 3** | Permission catalog resource beyond two roles |
| **AI** | Auto-approval limits |
| **Enterprise** | Dual-control destructive actions, MFA step-up |

---

## Ownership model (recommended)

```text
apps/admin (Next.js)
        │
        ▼
 /api/v1/admin/*  (Admin Platform façades — thin)
        │
   ┌────┼──────────────┬──────────────┬─────────────┐
   ▼    ▼              ▼              ▼             ▼
Users  Games        Moderation     Reviews      AuditLog
 (SoT) (SoT)         (policy BC)    (SoT)       (append-only)
```

| Concern | Owner |
|---------|-------|
| Staff JWT / PlatformRole | Auth + Users |
| Sanctions / flags | Users (already Module 12) |
| Queue / appeals / report create policy | Moderation |
| Admin reports HTTP | Prefer Moderation long-term; Reviews façade OK for MVP compose |
| Catalog mutations | Games |
| Review hide/restore | Reviews |
| CMS / FeatureFlags tables | Admin Platform services (when scheduled) — still not player SoT |
| Notifications / Search | **Never** owned by Admin; Phase 3 ops only via domain ports if ever needed |

---

## Alignment with existing docs

| Source | Alignment |
|--------|-----------|
| North Star | Admin enables a safe digital home; not a consumer product surface |
| ROADMAP | Human moderation called out in later phases; no dedicated “Admin app” milestone — Module 13 is the missing ops tranche after Moderation V1 |
| FEATURE_MATRIX Domain 15 | Admin Queue + Audit Logs **P1 / V1** — Queue already Module 12; **Audit read** is Module 13 MVP |
| FEATURE_FLAGS.md | Admin panel integration documented; runtime deferred — **Phase 2** |
| ADMIN_ARCHITECTURE phases | V1 = CMS/users/jobs; V1.5 = flags/analytics/MFA — Module 13 **narrows V1**: Users + Audit + shell + compose existing T&S/catalog; CMS/jobs → Phase 2 |
| Moderation Freeze / Sprint 12.5 | Do not reopen Moderation redesign; compose only |
| PROJECT_SCOPE §12 Administration | Reports, queue, user mgmt, content review, analytics, audit, flags, system health — **phased**, not all MVP |

---

## Risks

| Risk | Severity | Notes |
|------|----------|-------|
| Dual role models (`PlatformRole` vs `UserAdminRole`) diverge | **Critical** | Privilege bugs / orphan admin access |
| Admin becomes second SoT for Users/Games | **High** | Controllers must stay thin; mutate via domain services |
| Shipping full ADMIN_API as “MVP” | **High** | Scope explosion; CMS/jobs/flags not required for V1 ops |
| Catalog remains OpenAPI-undocumented | **Medium** | Docs drift; Freeze change-control needed |
| BAN permission conflict (ADMIN_ARCHITECTURE vs Moderation Freeze) | **Medium** | Lock in Admin Platform Freeze |
| Audit export PII / volume abuse | **Medium** | Rate limit + redaction |
| `apps/admin` auth sharing with player browser profiles | **Medium** | Security guidance + separate subdomain |
| Feature-flag schema unused → pressure to invent settings | **Low–Medium** | Prefer flags Phase 2 over SystemSettings invent |

---

## Blockers

### Critical

| ID | Blocker | Impact |
|----|---------|--------|
| C1 | **No Admin Platform Freeze** (ownership, MVP allowlist, role dual-model) | Cannot implement safely |
| C2 | **Role SoT ambiguity** (`PlatformRole` vs `AdminRole`/`UserAdminRole`) | Role assign / JWT guards may conflict |

### High

| ID | Blocker | Impact |
|----|---------|--------|
| H1 | Users admin HTTP missing (`adminListUsers` / `adminUpdateUser` / roles / revoke) | Admin shell cannot manage users end-to-end |
| H2 | Audit **read** API missing | Feature Matrix P1 Audit incomplete |
| H3 | BAN / Admin-only vs Moderator-allowed policy conflict across docs | Permission matrix must be locked once |

### Medium

| ID | Blocker | Impact |
|----|---------|--------|
| M1 | Catalog admin OpenAPI gap | Hygiene only; runtime exists |
| M2 | Reports still under Reviews module | Debt; compose OK for MVP |
| M3 | No Event/Cache/Permission matrices for Admin Platform | Sprint 13.0 should produce them |

### Can implementation begin?

**No.** Architecture discovery is complete; **coding is blocked** until Sprint **13.0 Freeze** resolves C1–C2 and locks H1–H3 approach. Prefer starting **13.0 documentation only** when explicitly authorized.

---

## Sprint proposal (documentation-gated)

| Sprint | Focus | Outcome |
|--------|-------|---------|
| **13.0** | Architecture + Freeze | ADR, Admin Architecture amendment (MVP allowlist), Event/Cache/Permission/Visibility matrices, role dual-model disposition, OpenAPI gap register — **no code** |
| **13.1** | Admin Shell + Audit Read | `apps/admin` auth/nav; `adminListAuditLog` (+ export if locked) |
| **13.2** | User Management | List/get/update/roles/session revoke; wire Users ports; permission matrix |
| **13.3** | Ops Compose | UI for Reports / Queue / Appeals / Review hide-restore / Catalog against existing APIs |
| **13.4** | Hardening | Rate limits, audit completeness, role tests, OpenAPI hygiene PRs only if Freeze-authorized |
| **13.5** | Final Audit | Production-readiness; declare Admin Platform V1 complete — **stop** |

Adjustments allowed by Freeze: demote Catalog UI to API-only; demote export; pull minimal CMS later into Phase 2 instead of V1.

---

## Recommended Freeze decisions (lock in 13.0)

1. **Admin Platform** owns privileged façade HTTP + `apps/admin` UI; domains remain entity SoT.  
2. **Do not reimplement Moderation** — Module 12 is SoT for queue/appeals/report policy.  
3. **MVP allowlist:** Shell, Users admin, Audit read, compose T&S + Catalog; **exclude** CMS, Flags, Jobs, Analytics, System Settings, Notification/Search admin.  
4. **Role SoT:** Lock `PlatformRole` as JWT authority; decide `UserAdminRole` sync/deprecate.  
5. **BAN policy:** Single matrix row (Admin-only vs Moderator+audit) — resolve ADMIN_ARCHITECTURE vs Moderation Freeze conflict.  
6. **No new tables** for MVP (`SystemSetting` invent forbidden).  
7. **Feature Flags** stay Phase 2 (schema already ready).  
8. Prefer **no OpenAPI invent**; authorize change-control only for live catalog paths + documented Module 12 gaps if Admin UI depends on them.  
9. **AI / batch-scan** remain AI phase.  
10. **Enterprise** MFA / four-eyes / VPN / SIEM deferred.

---

## Phase summary (MVP → Enterprise)

| Bucket | Includes |
|--------|----------|
| **MVP** | Admin shell; User Management; Audit list (+ export if locked); compose Report / Queue / Appeals / Review moderation; compose Game Catalog; Roles/Permissions lock |
| **Phase 2** | CMS; Jobs console; Feature Flags runtime; Moderation stats; OpenAPI catalog registration; reports BC cleanup |
| **Phase 3** | Analytics embeds; System Settings (if still needed); Notification/Search ops; GDPR/Premium admin; Admin MFA |
| **AI** | Batch scan; toxicity/risk overlays; auto-triage |
| **Enterprise** | Four-eyes, SIEM, hash-chain audit, ABAC, legal hold, break-glass |

---

## Alignment checks

| Check | Result |
|-------|--------|
| North Star Question | Ops tooling that protects gaming-culture belonging — yes |
| Prior Freezes intact | Yes — Moderation/Games/Users/Notification/Search ownership preserved |
| Prefer composition | Yes — thin Admin + domain ports |
| No schema invent in discovery | Observed; SystemSettings explicitly deferred |
| No OpenAPI invent in discovery | Observed; gaps registered |

---

## Decision

**APPROVED WITH MINOR CHANGES**

Minor changes to lock before coding (Sprint 13.0):

1. **MVP allowlist** narrowed vs full `ADMIN_API` / full `ADMIN_ARCHITECTURE` V1 (Users + Audit + shell + compose; CMS/jobs → Phase 2).  
2. **Role dual-model** disposition (`PlatformRole` vs `UserAdminRole`).  
3. **BAN permission** single policy across Admin Architecture and Moderation Freeze.  
4. **Catalog OpenAPI** change-control plan (runtime already exists).  
5. **Feature Flags / System Settings** stay out of MVP (flags Phase 2; settings Phase 3 or absorb into flags).

No redesign of Moderation Module V1 is required; Admin Platform is the next composition layer.

---

## Gate

**Module 13 Scope Report complete.**

- No code  
- No Prisma changes  
- No OpenAPI changes  
- No migrations  
- No endpoint implementation  
- No future flags unlocked  

**Stop.** Do **not** start Sprint 13.0 (architecture Freeze docs may proceed only when explicitly authorized as the next documentation sprint).
