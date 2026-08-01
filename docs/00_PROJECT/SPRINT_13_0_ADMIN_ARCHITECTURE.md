# Sprint 13.0 — Admin Platform Architecture & Freeze

**Document:** `docs/00_PROJECT/SPRINT_13_0_ADMIN_ARCHITECTURE.md`  
**Date:** 2026-07-20  
**Role:** Principal Software Architect / CTO  
**Type:** Documentation only — **no code, no Prisma, no migrations, no OpenAPI edits, no endpoint implementation**  
**Freeze:** [`ADMIN_PLATFORM_FREEZE_v1.md`](./ADMIN_PLATFORM_FREEZE_v1.md)  
**Scope precursor:** [`MODULE_13_SCOPE_REPORT.md`](./MODULE_13_SCOPE_REPORT.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 13.0 establishes **Admin Platform Freeze v1.0**: Admin is an **orchestration & presentation BC** for Dashboard, Management, Operations, Monitoring, and Configuration. **Users, Games, Moderation, Notifications, and Search remain SoT.** Module 12 T&S is composed, not rebuilt. MVP is narrowed to shell + Users admin + Audit read + compose Catalog/T&S. CMS, Feature Flags, Jobs, Analytics, System Settings invent, AI, and Enterprise controls are phased out of Module 13 V1.

JWT AuthZ SoT = **`PlatformRole`**. BAN policy aligns with Moderation Freeze (Moderator may BAN + mandatory audit). Historical [`docs/15_ADMIN/ADMIN_ARCHITECTURE.md`](../15_ADMIN/ADMIN_ARCHITECTURE.md) is non-normative on conflict.

Implementation unlock: **Sprint 13.1 Admin Shell + Audit Read only**.

---

## Artifacts generated

| # | Document | Role |
|---|----------|------|
| 1 | `docs/01_ARCHITECTURE/ADMIN_ARCHITECTURE.md` | BC, allowlist, delegation |
| 2 | `docs/01_ARCHITECTURE/ADR/ADR_Admin_Platform.md` | ADR-ADM-001 |
| 3 | `docs/00_PROJECT/ADMIN_PLATFORM_FREEZE_v1.md` | Normative freeze |
| 4 | `docs/03_EVENTS/ADMIN_EVENT_MATRIX.md` | Reuse-first events |
| 5 | `docs/04_CACHE/ADMIN_CACHE_STRATEGY.md` | Targeted Redis / bans |
| 6 | `docs/05_SECURITY/ADMIN_PERMISSION_MATRIX.md` | AuthZ |
| 7 | `docs/05_SECURITY/ADMIN_VISIBILITY_MATRIX.md` | Privacy / 404 vs 403 |
| 8 | This report | Validation + approval |

**Not modified:** Prisma, OpenAPI, code, migrations.

---

## Architecture

| Topic | Decision |
|-------|----------|
| Ownership | Admin owns shell + privileged façades + Audit **read**; Phase 2 CMS/Flags services |
| Non-ownership | Users, Games, Moderation policy, Reviews bodies, Notifications, Search |
| Pillars | Dashboard · Management · Operations · Monitoring · Configuration |
| Engine | Human operators; AI deferred |
| Schema | Reuse `AuditLog` / Users / Games / Moderation; no SystemSetting invent |
| Events | Reuse `user.*` / `moderation.*` / domain; no Admin spam in V1 |
| Cache | Optional short TTL; no FLUSHALL; no O(N) wipe |

Admin **only orchestrates**.

---

## Freeze Decisions (locked)

| Decision | Lock |
|----------|------|
| Orchestration-only Admin | Yes |
| Domain SoT unchanged | Users / Games / Moderation / Notifications / Search |
| No Moderation reimplement | Compose Module 12 |
| MVP allowlist | Shell; Users admin; Audit read/export; compose T&S + Catalog |
| Phase 2 | CMS; Flags; Jobs; Moderation stats; OpenAPI hygiene |
| Phase 3 | Analytics; System Settings if needed; Notif/Search ops; MFA |
| AI / Enterprise | Out of V1 |
| Role SoT | `PlatformRole`; `UserAdminRole` mirror or unused |
| BAN | MODERATOR + ADMIN with mandatory audit |
| Role assign / export / CMS / flags | ADMIN only |
| Audit | Append-only writes (domains); Admin read/export only |
| OpenAPI | No invent; catalog gaps = change-control hygiene |
| Cache / Events | Matrices only |

Scope Report blockers **C1** (no Freeze) and **C2** (role dual-model) are closed. **H3** BAN conflict resolved toward Moderation matrix.

---

## MVP / Phase 2 / Phase 3 (normative summary)

| Bucket | Includes |
|--------|----------|
| **MVP** | `apps/admin` shell; `adminList/Get/UpdateUser`; roles; session revoke; `adminListAuditLog` (+ export); UI compose queue/appeals/reports/review hide/catalog |
| **Phase 2** | CMS; Feature Flags runtime; Jobs console; `adminGetModerationStats`; OpenAPI registration for live catalog + Module 12 gaps |
| **Phase 3** | Analytics dashboards; System Settings (only if flags insufficient); Notification/Search ops; GDPR/Premium; Admin MFA |
| **AI** | `adminBatchScanModeration`; risk overlays |
| **Enterprise** | Four-eyes; SIEM; hash-chain; ABAC; legal hold |

---

## Compatibility

| Source | Result |
|--------|--------|
| North Star | Ops enables safe digital home — **compatible** |
| ROADMAP / FEATURE_MATRIX | Audit P1 V1; Queue already Module 12 — **compatible** |
| Moderation Freeze v1.0 | Compose only — **compatible** |
| Notification / Search Freezes | No SoT takeover — **compatible** |
| Games catalog runtime | Compose `/admin/catalog` — **compatible** |
| OpenAPI / Prisma | No edits this sprint — **compatible** |
| `docs/15_ADMIN` older V1=CMS/jobs | **Rephased** — Freeze wins |

**No Freeze conflicts** requiring redesign of Module 12 or domain SoTs.

---

## OpenAPI consistency review (read-only)

| Area | Assessment |
|------|------------|
| `adminList/Get/UpdateUser`, roles, revoke | MVP — implement against ADMIN_API |
| `adminListAuditLog` / export | MVP |
| Moderation queue/reports/resolve | Compose existing; claim/assign/escalate/appeals = known gaps |
| Catalog `/admin/catalog` | Runtime > OpenAPI — hygiene backlog |
| Review hide/restore | Runtime > OpenAPI — hygiene backlog |
| CMS / flags / jobs / analytics | Phase 2+ — do not implement under V1 |
| Notification / Search admin paths | Absent — correctly out of V1 |
| `adminBatchScanModeration` | AI phase |

---

## Runtime inventory (as-of Freeze)

| Surface | Status |
|---------|--------|
| Moderation queue / appeals | Implemented (Module 12) |
| Reports admin | Implemented (Reviews façade) |
| Review hide/restore | Implemented |
| Games catalog + import | Implemented |
| Users admin HTTP | Missing → 13.2 |
| Audit read/export | Missing → 13.1 |
| `apps/admin` | Stub → 13.1 |
| CMS / Flags / Jobs / Stats | Missing → Phase 2+ |

---

## Risks

| Risk | Severity | Mitigation in Freeze |
|------|----------|----------------------|
| Admin becomes second Users/Games SoT | High | Orchestration-only + port rule |
| Dual role tables diverge | High | PlatformRole SoT; mirror/unused |
| Scope creep to full ADMIN_API | High | MVP allowlist |
| Catalog OpenAPI drift | Medium | Change-control hygiene |
| Audit export PII | Medium | Admin-only + rate limit + redaction |
| Loosen Moderation AuthZ via Admin UI | Medium | Defer to Moderation Permission Matrix |

---

## Residual Debt

| ID | Item | Disposition |
|----|------|-------------|
| D1 | Catalog paths not in ADMIN_API | Change-control hygiene (not MVP blocker) |
| D2 | Hide/restore / appeals / claim OpenAPI gaps | Inherited Module 12 debt |
| D3 | Reports still under Reviews module | Phase 2 cleanup |
| D4 | `UserAdminRole` operational mirror procedure | Implementers sync PlatformRole in 13.2 |
| D5 | `docs/15_ADMIN` text still says V1=CMS/jobs | Point readers to Freeze; optional later docs amend |
| D6 | Export optional if rate-limit not ready | Prefer ship list first |
| D7 | No Admin-owned events in V1 | Intentional |
| D8 | FeatureFlag/CmsContent schema idle until Phase 2 | Intentional |

---

## Sprint unlock

| Sprint | May start after Freeze accept? |
|--------|--------------------------------|
| **13.1 Admin Shell + Audit Read** | **Yes** (this Freeze) |
| 13.2 User Management | After 13.1 |
| 13.3 Ops Compose (T&S + Catalog UI) | After 13.2 APIs (UI may track) |
| 13.4 Hardening | After 13.3 |
| 13.5 Final Audit | After 13.4 |
| Phase 2 CMS / Flags / Jobs | **No** under Module 13 V1 without Phase unlock |
| AI / Enterprise | **No** |

---

## Approval

**APPROVED**

Admin Platform Freeze v1.0 is complete and consistent with North Star, Module 13 Scope Report, Moderation/Notification/Search Freezes, OpenAPI (as-is), and Database Freeze. Minor residual debt (D1–D8) is tracked — not a reason to withhold Freeze acceptance.

---

## Gate

**Sprint 13.0 Architecture & Freeze complete.**

- No code  
- No Prisma changes  
- No OpenAPI changes  
- No migrations  
- No endpoint implementation  

**Stop.** Do **not** start Sprint 13.1 until this Freeze is explicitly accepted by stakeholders; when accepted, 13.1 may begin **Admin Shell + Audit Read only**.
