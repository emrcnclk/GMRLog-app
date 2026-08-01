# Admin Architecture

**Document:** `docs/01_ARCHITECTURE/ADMIN_ARCHITECTURE.md`  
**Status:** **Frozen — Admin Platform Freeze v1.0** (Sprint 13.0)  
**SSOT contracts:** [`ADMIN_API.yaml`](../08_API/ADMIN_API.yaml) + live domain admin paths (catalog, review hide/restore, moderation appeals — gaps documented)  
**Freeze declaration:** [`ADMIN_PLATFORM_FREEZE_v1.md`](../00_PROJECT/ADMIN_PLATFORM_FREEZE_v1.md)  
**Related:** [ADR_Admin_Platform.md](./ADR/ADR_Admin_Platform.md)  
**Scope:** [`MODULE_13_SCOPE_REPORT.md`](../00_PROJECT/MODULE_13_SCOPE_REPORT.md)

> **Supersedes normative conflicts** with the older product overview [`docs/15_ADMIN/ADMIN_ARCHITECTURE.md`](../15_ADMIN/ADMIN_ARCHITECTURE.md). That file remains a historical UI/ops sketch; **this document + Freeze win** on Module 13+ decisions.

---

## Purpose

GMRLOG Admin Platform is the **internal orchestration & presentation bounded context** for operators (Moderator / Admin): dashboard shell, privileged management façades, operational tooling, monitoring read models, and configuration surfaces.

Admin **never owns** Users, Games, Moderation policy aggregates, Notifications, or Search as source of truth. Domains remain authoritative. Admin **coordinates**:

| Pillar | Meaning |
|--------|---------|
| **Dashboard** | Shell, navigation, operational home (stats deferred Phase 2+) |
| **Management** | Users admin HTTP; compose T&S + catalog UIs against domain APIs |
| **Operations** | Session revoke, role assign, audit read/export |
| **Monitoring** | Jobs / analytics embeds — **Phase 2 / 3** |
| **Configuration** | Feature flags / CMS / system settings — **Phase 2 / 3** |

---

## Bounded context

```text
Admin Platform
  ├── apps/admin (Next.js shell + staff UI)           [Sprint 13.1+]
  ├── Privileged HTTP façades under /api/v1/admin/*   [13.1–13.3]
  ├── AuditLog READ / export                          [13.1]
  ├── Users admin orchestration → Users / Auth ports  [13.2]
  ├── Compose Moderation / Reports / Review hide UI   [13.3]
  └── Compose Games catalog admin UI                  [13.3]

Does NOT own (hard rule)
  ├── User aggregates / privacy / sanction flag SoT   → Users
  ├── Game catalog aggregates / import SoT            → Games
  ├── Report / Queue / Appeal / resolve policy        → Moderation
  ├── Review bodies / hide semantics                  → Reviews
  ├── Notification inbox delivery                     → Notifications
  ├── Search indexes / SERP / Discover                → Search
  ├── Feed ranking / posts SoT                        → Feed
  └── AI / ML scoring engines
```

**Explicit non-ownership:**

| BC | Admin must not |
|----|----------------|
| **Users** | Become SoT for profile or flags; may **request** list/update/roles/revoke via Users/Auth ports |
| **Games** | Duplicate catalog tables; catalog mutations stay in Games services (`/admin/catalog` already Games-owned) |
| **Moderation** | Reimplement queue/appeals/report create; UI + optional thin re-export only |
| **Notifications** | Write inbox rows; invent Notification Admin SoT |
| **Search** | Own SearchEvent / trending; invent Search Admin SoT in MVP |

Admin **only orchestrates** privileged operator workflows.

---

## Domain boundaries & delegation

| Concern | Owner | Admin role |
|---------|-------|------------|
| `AuditLog` **read** / export | **Admin Platform** (read façade) | Writers remain domains (Moderation, Auth, Games, Users sanctions, …) |
| `CmsContent` CRUD (Phase 2) | **Admin Platform** service | Not player UGC SoT |
| `FeatureFlag*` (Phase 2) | **Admin Platform** + runtime eval | Config SoT for flags only |
| User list / admin update / roles | **Users** (+ Auth for sessions) | Thin `/admin/users*` controllers |
| Catalog create/update/archive/media/import | **Games** | Existing `/admin/catalog*` — Admin UI composes |
| Queue / resolve / appeals / report policy | **Moderation** | Compose existing Module 12 APIs |
| `adminListReports` / `adminUpdateReport` | **Moderation** (long-term); Reviews façade OK for MVP | No second report store |
| Review hide/restore | **Reviews** | Compose existing staff routes |
| Notification delivery | **Notifications** | Never sync-write from Admin |
| Search privacy / indexes | **Search** | Never mutate from Admin |

HTTP may live under `/admin/*` for operator UX while **business mutation** executes in the owning BC.

---

## Role model (locked)

| Concept | Lock |
|---------|------|
| JWT AuthZ SoT | `User.platformRole` / `PlatformRole` (`USER`, `MODERATOR`, `ADMIN`, …) via existing `JwtAuthGuard` + `RolesGuard` |
| `AdminRole` + `UserAdminRole` tables | **Secondary / legacy schema** — must not diverge from `PlatformRole` in V1. Freeze: **sync or treat as unused**; do not invent a second permission engine. Prefer writing `PlatformRole` on role-assign; if `UserAdminRole` rows are written, they **mirror** PlatformRole only |
| Senior Moderator | Process title → same JWT as `MODERATOR` (Moderation Freeze) |
| Staff entry | `MODERATOR` \| `ADMIN` only for Admin shell |

---

## MVP allowlist (Module 13 V1)

| Surface | In MVP? | Notes |
|---------|---------|-------|
| `apps/admin` shell (auth, role gate, nav) | **Yes** | Stub → real |
| `adminListUsers` / `adminGetUser` / `adminUpdateUser` | **Yes** | Users port |
| `adminUpdateUserRoles` | **Yes** | Admin-only; PlatformRole SoT |
| `adminRevokeUserSessions` | **Yes** | Auth port |
| `adminListAuditLog` | **Yes** | Read existing `AuditLog` |
| `adminExportAuditLog` | **Yes if cheap** | Admin-only; rate-limited |
| Compose queue / appeals / reports / review hide | **Yes** | Existing Module 12 + Reviews APIs — no redesign |
| Compose Games `/admin/catalog` + import | **Yes** | OpenAPI gap documented; no invent this Freeze |
| Dashboard home (links) | **Yes** | No heavy stats required |
| `adminGetModerationStats` | **Phase 2** | |
| CMS (`/admin/cms/*`) | **Phase 2** | Schema ready |
| Feature flags HTTP + Redis eval | **Phase 2** | Schema ready |
| Jobs console | **Phase 2** | No Job Prisma model — BullMQ ops only |
| Analytics dashboards | **Phase 3** | |
| System Settings table | **Phase 3** | Prefer flags; **no invent** in V1 |
| Notification / Search admin suites | **Phase 3** | Not in ADMIN_API |
| `adminBatchScanModeration` / AI | **AI phase** | |
| MFA / four-eyes / VPN productization | **Enterprise** | |

---

## Lifecycles

### Admin shell session

```text
Staff opens apps/admin
  → JWT (same Auth issuer; separate subdomain guidance)
  → Role gate MODERATOR|ADMIN else 403
  → Navigate to composed operator views
```

### User management (MVP)

```text
adminListUsers / adminGetUser
  → Users query port (staff visibility rules)
adminUpdateUser (T&S fields)
  → Users sanction / admin-update port
  → Append AuditLog; emit existing user.* events when sanctions change
adminUpdateUserRoles
  → ADMIN only; mutate PlatformRole (+ mirror UserAdminRole if kept)
adminRevokeUserSessions
  → Auth port (same as ban/suspend revoke path)
```

### Audit read (MVP)

```text
adminListAuditLog (filters, pagination)
  → Read AuditLog only — never update/delete
adminExportAuditLog
  → Admin-only; rate-limited; PII-minimized columns
```

### Compose T&S / Catalog (MVP)

```text
UI calls existing:
  /admin/moderation/queue*
  /admin/moderation/appeals*
  /admin/reports*
  Reviews hide/restore
  /admin/catalog*
Admin Platform does not fork business rules.
```

---

## Phase map

| Phase | Deliverables |
|-------|--------------|
| **MVP (Module 13)** | Shell; Users admin; Audit read/export; compose Moderation/Reports/Reviews/Catalog; Roles/Permissions lock |
| **Phase 2** | CMS; Feature Flags runtime; Jobs viewer; Moderation stats; OpenAPI hygiene for catalog + Module 12 gaps; optional reports controller move to Moderation |
| **Phase 3** | Analytics embeds; System Settings only if flags insufficient; Notification/Search ops; GDPR/Premium admin; Admin MFA |
| **AI** | Batch scan; risk overlays; auto-triage |
| **Enterprise** | Four-eyes, SIEM, hash-chain audit, ABAC, legal hold |

---

## Controllers & layering

- Thin Nest controllers: guards + DTO + `user.sub` / roles.  
- Application services orchestrate ports only.  
- Repositories for Admin-owned read models (`AuditLog` list) and later CMS/Flags.  
- **No** business rules that mutate Games/Users/Moderation aggregates inside Admin without calling owning services.

---

## Compatibility

| Freeze / BC | Rule |
|-------------|------|
| Moderation Platform Freeze v1.0 | Compose only; BAN policy remains Moderation Permission Matrix (Moderator may BAN + mandatory audit) |
| Notification Freeze | Consume events only |
| Search Freeze | No Search ownership |
| Games | Catalog SoT unchanged |
| Users | User SoT unchanged |
| Database Freeze | No new tables/enums in Module 13 V1 |

---

## Related documents

- [`ADMIN_PLATFORM_FREEZE_v1.md`](../00_PROJECT/ADMIN_PLATFORM_FREEZE_v1.md)  
- [`ADR_Admin_Platform.md`](./ADR/ADR_Admin_Platform.md)  
- [`ADMIN_EVENT_MATRIX.md`](../03_EVENTS/ADMIN_EVENT_MATRIX.md)  
- [`ADMIN_CACHE_STRATEGY.md`](../04_CACHE/ADMIN_CACHE_STRATEGY.md)  
- [`ADMIN_PERMISSION_MATRIX.md`](../05_SECURITY/ADMIN_PERMISSION_MATRIX.md)  
- [`ADMIN_VISIBILITY_MATRIX.md`](../05_SECURITY/ADMIN_VISIBILITY_MATRIX.md)  
- [`MODERATION_ARCHITECTURE.md`](./MODERATION_ARCHITECTURE.md)  
