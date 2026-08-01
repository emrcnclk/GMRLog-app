# Admin Platform Freeze v1.0

**Document:** `docs/00_PROJECT/ADMIN_PLATFORM_FREEZE_v1.md`  
**Date:** 2026-07-20  
**Status:** **FROZEN**  
**Preceded by:** Module 13 Scope Report (`APPROVED WITH MINOR CHANGES`) + Sprint 13.0 architecture  
**Unlocks:** Sprint 13.1 Admin Shell + Audit Read

---

## What is frozen

The Admin Platform documentation set below is the **normative SSOT** for Sprint 13.1+. Implementors must not reinterpret these decisions in code reviews.

| Artifact | Role |
|----------|------|
| [`docs/08_API/ADMIN_API.yaml`](../08_API/ADMIN_API.yaml) | REST contracts — **do not invent paths**; **do not edit OpenAPI in implementation sprints without change control** |
| [`docs/01_ARCHITECTURE/ADMIN_ARCHITECTURE.md`](../01_ARCHITECTURE/ADMIN_ARCHITECTURE.md) | Bounded context & MVP allowlist |
| [`docs/01_ARCHITECTURE/ADR/ADR_Admin_Platform.md`](../01_ARCHITECTURE/ADR/ADR_Admin_Platform.md) | ADR-ADM-001 Accepted |
| [`docs/03_EVENTS/ADMIN_EVENT_MATRIX.md`](../03_EVENTS/ADMIN_EVENT_MATRIX.md) | Events |
| [`docs/04_CACHE/ADMIN_CACHE_STRATEGY.md`](../04_CACHE/ADMIN_CACHE_STRATEGY.md) | Redis keys & invalidation |
| [`docs/05_SECURITY/ADMIN_PERMISSION_MATRIX.md`](../05_SECURITY/ADMIN_PERMISSION_MATRIX.md) | AuthZ |
| [`docs/05_SECURITY/ADMIN_VISIBILITY_MATRIX.md`](../05_SECURITY/ADMIN_VISIBILITY_MATRIX.md) | Privacy / 404 vs 403 |

**Historical:** [`docs/15_ADMIN/ADMIN_ARCHITECTURE.md`](../15_ADMIN/ADMIN_ARCHITECTURE.md) is **non-normative on conflict** — Freeze set wins.

**Database schema:** Reuse existing `AuditLog`, User/`PlatformRole`, optional `UserAdminRole` mirror, Games catalog, Moderation tables, and (Phase 2 only) `CmsContent` / `FeatureFlag*`. This Freeze **does not authorize** new tables (`SystemSetting`, Job persistence, etc.) or new enums for Module 13 V1.

**Prior Freezes intact:** Moderation, Communication, Notification, Search, Reviews, Games ownership locks are not reopened.

---

## Twelve locked decisions (non-negotiable for 13.1+)

### 1. Admin is orchestration only

- Admin coordinates **Dashboard**, **Management**, **Operations**, **Monitoring**, **Configuration**.  
- Admin **never** becomes SoT for Users, Games, Moderation policy, Notifications, or Search aggregates.  
- Thin controllers; domain ports execute mutations.

### 2. Domains remain source of truth

| Domain | Remains SoT for |
|--------|-----------------|
| **Users** | Profiles, privacy, `strikeCount` / `isSuspended` / `isBanned`, `PlatformRole` |
| **Games** | Catalog entities, media, provider import |
| **Moderation** | Reports, queue, appeals, resolve policy |
| **Reviews** | Review bodies, hide/restore semantics |
| **Notifications** | Inbox / delivery |
| **Search** | SearchEvent, SERP, Discover composition |

### 3. Do not reimplement Moderation

- Module 12 APIs are the T&S backend.  
- Admin UI **composes** queue / appeals / reports / review moderation.  
- No parallel queue tables or shadow resolve paths.

### 4. MVP allowlist (Module 13 V1)

**In:**

- `apps/admin` shell (auth + `MODERATOR`/`ADMIN` gate + nav)  
- Users admin: `adminListUsers`, `adminGetUser`, `adminUpdateUser`, `adminUpdateUserRoles`, `adminRevokeUserSessions`  
- Audit: `adminListAuditLog` (+ `adminExportAuditLog` if rate-limit ready)  
- Compose: Moderation queue/appeals, reports, review hide/restore, Games `/admin/catalog` (+ import)

**Out of MVP:**

- CMS, Feature Flags runtime, Jobs console, Analytics dashboards  
- `adminGetModerationStats` (Phase 2)  
- System Settings invent  
- Notification Admin / Search Admin suites  
- AI `adminBatchScanModeration`  
- Enterprise MFA / four-eyes / VPN productization  

### 5. Role SoT = PlatformRole

- JWT `@Roles` uses **`PlatformRole`**.  
- `AdminRole` / `UserAdminRole`: **mirror or unused** — no second permission engine.  
- Senior Moderator = process title under `MODERATOR`.

### 6. BAN & destructive policy

- **BAN:** `MODERATOR` and `ADMIN` may BAN **with mandatory audit** (Moderation Freeze alignment). Prefer Admin for irreversible policy in ops runbooks — not a separate JWT enum.  
- **Role assign:** **ADMIN only**.  
- **Audit export / CMS / flags / job pause:** **ADMIN only** (when those surfaces exist).

### 7. Audit append-only

- Domains continue to **append** `AuditLog`.  
- Admin provides **read/export** only — no update/delete of audit rows.  
- No silent rewrite of history.

### 8. Visibility & 404 vs 403

- Staff-only Admin surfaces.  
- Insufficient role → **403**.  
- Missing resources → **404** (do not leak existence to non-staff).  
- Full rules: Visibility Matrix.

### 9. OpenAPI discipline

- Implement only Freeze MVP allowlist ops from `ADMIN_API.yaml` (or documented live gaps for compose).  
- **Do not invent** undeclared admin endpoints in 13.1–13.4 without change-control.  
- Live `/admin/catalog` and Module 12 OpenAPI gaps = **hygiene backlog**, not schema invent.

### 10. Events & cache

- Prefer reuse of domain/`user.*`/`moderation.*` events — Event Matrix.  
- Targeted Redis only — **no FLUSHALL**, **no KEYS** namespace wipe — Cache Strategy.

### 11. No schema invent in Module 13 V1

- No `SystemSetting`, no Job table, no new role enums.  
- Phase 2 may activate existing `CmsContent` / `FeatureFlag*` without new invent if Freeze Phase 2 unlocks.

### 12. No AI / Enterprise in V1

- Forbidden in Module 13 V1: AI batch-scan UI as default, toxicity engines, MFA enforcement product, four-eyes production toggles, SIEM/hash-chain as MVP.

---

## Phase summary

| Bucket | Includes |
|--------|----------|
| **MVP** | Shell; Users admin; Audit read/export; compose T&S + Catalog; Roles/Permissions |
| **Phase 2** | CMS; Feature Flags; Jobs; Moderation stats; OpenAPI hygiene |
| **Phase 3** | Analytics; System Settings (only if needed); Notif/Search ops; GDPR/Premium; Admin MFA |
| **AI** | Batch scan; risk overlays; auto-triage |
| **Enterprise** | Four-eyes; SIEM; hash-chain; ABAC; legal hold |

---

## Compatibility checklist

| Source | Result |
|--------|--------|
| North Star | Ops tooling enables safe belonging — **compatible** |
| Module 13 Scope Report | Allowlist + orchestration — **compatible** |
| Moderation Freeze v1.0 | Compose only; BAN audit — **compatible** |
| Notification / Search Freezes | No SoT takeover — **compatible** |
| OpenAPI / Prisma | No edits in 13.0 — **compatible** |

---

## Unlock

| Sprint | May start after Freeze accept? |
|--------|--------------------------------|
| **13.1 Admin Shell + Audit Read** | **Yes** (this Freeze) |
| 13.2 User Management | After 13.1 |
| 13.3 Ops Compose (T&S + Catalog UI) | After 13.2 (or parallel UI if API-ready) |
| 13.4 Hardening | After 13.3 |
| 13.5 Final Audit | After 13.4 |
| Phase 2 CMS / Flags / Jobs | **No** under Module 13 V1 Freeze without Phase unlock |
| AI / Enterprise | **No** |

---

## Status

**FROZEN — Admin Platform Freeze v1.0**
