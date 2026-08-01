# Moderation Architecture

**Document:** `docs/01_ARCHITECTURE/MODERATION_ARCHITECTURE.md`  
**Status:** **Frozen — Moderation Platform Freeze v1.0** (Sprint 12.0)  
**SSOT contracts:** [`ADMIN_API.yaml`](../08_API/ADMIN_API.yaml) + domain report paths (`REVIEW_API`, `COMMUNICATION_API`, `SOCIAL_API`, `LIST_API`)  
**Freeze declaration:** [`MODERATION_PLATFORM_FREEZE_v1.md`](../00_PROJECT/MODERATION_PLATFORM_FREEZE_v1.md)  
**Related:** [ADR_Moderation_Platform.md](./ADR/ADR_Moderation_Platform.md)  
**Scope:** [`MODULE_12_SCOPE_REPORT.md`](../00_PROJECT/MODULE_12_SCOPE_REPORT.md)

---

## Purpose

GMRLOG Moderation & Safety is the **policy-enforcement bounded context** for Trust & Safety: community reports, a centralized human review queue, proportionate sanctions, appeals, and append-only audit correlation.

Moderation **never owns** Users, Reviews, Communication, Notifications, Feed, or Search aggregates. Domains remain the **source of truth**. Moderation **orchestrates policy**: intake reports, run the queue, decide actions, and **delegate execution** to domain ports (content hide/restore) and the Users BC (warn / suspend / ban flags).

---

## Bounded context

```text
Moderation & Safety
  ├── Report intake policy + dedupe              [Sprint 12.1]
  ├── Centralized ModerationQueueItem lifecycle  [Sprint 12.2]
  ├── Resolve orchestration + ModerationAction   [Sprint 12.2]
  ├── User sanction orchestration → Users port   [Sprint 12.3]
  ├── Appeals workflow (schema-ready)            [Sprint 12.3]
  └── Audit correlation (AuditLog writes)        [Sprint 12.2+]

Does NOT own
  ├── User aggregates / Auth sessions
  ├── Review / Comment / Post bodies
  ├── Communication messages / conversations
  ├── Collection / List / TierList aggregates
  ├── Notification inbox delivery
  ├── Feed ranking / Search indexes
  └── AI / ML scoring engines
```

**Explicit non-ownership (hard rule):**

| BC | Moderation must not |
|----|---------------------|
| **Users** | Become SoT for profile/privacy; may **request** flag mutations via Users port only |
| **Reviews** | Own review bodies; hide/restore via Reviews port (`deletedAt`) |
| **Communication** | Own messages; report ACL stays in Comm; hide via Comm port |
| **Notifications** | Write inbox rows synchronously; publish events for Notifications to consume |

Moderation **only enforces policy**.

---

## Domain boundaries & delegation

| Concern | Owner | Moderation role |
|---------|-------|-----------------|
| `Report`, `ReportReason`, `ModerationQueueItem`, `ModerationAction`, `ModeratorNote`, `Appeal` | **Moderation BC** | Persist + policy |
| `AuditLog` rows for T&S actions | **Moderation BC** (writer) | Append-only; Admin may read later |
| Review hide / restore / body edit | **Reviews** | Port called on resolve |
| Message hide / soft-delete | **Communication** | Port called on resolve |
| Collection / TierList soft-delete | Owning UGC BC | Port called on resolve |
| List soft-delete | **Lists** | **Out of MVP report allowlist** until enum exists |
| `isSuspended` / `isBanned` / `strikeCount` | **Users** | Port called on WARN/SUSPEND/BAN |
| Session revoke after ban | **Auth / Admin Users** | Optional follow-up via existing admin ops |
| SYSTEM notice to sanctioned user | **Notifications** | Consumes user/moderation events |
| Spoiler UX | **Reviews** | Unchanged (not T&S queue) |

HTTP façades may remain on domain paths (`POST /reviews/{id}/report`, `POST .../messages/.../report`, `POST /reports`). Controllers stay thin; **business create** goes to Moderation application services.

---

## Reporting lifecycle

```text
Authenticated reporter
        │
        ▼
Domain façade OR Social POST /reports
        │
        ├─ AuthZ: JWT required; cannot report own content (entity rules)
        ├─ Resolve target via domain existence check → missing → 404
        ├─ Map API entity type → ModerationEntityType (Freeze mapping)
        ├─ Validate ReportReason (active code / id)
        ├─ Dedupe: one OPEN report per (reporterId, entityType, entityId)
        │
        ▼
ModerationReportService.create
        ├─ INSERT Report (status=OPEN) — description immutable after create
        ├─ INSERT ModerationQueueItem (PENDING, priority heuristic)
        ├─ Append AuditLog (optional lightweight) / emit moderation.report.created.v1
        └─ Return CreatedReport (202/created per OpenAPI)
```

**Immutability:** Reporter cannot edit `description` / reason after create. Staff may transition `Report.status` via admin update or as part of resolve.

**MVP reportable entity types (schema):** `REVIEW`, `MESSAGE`, `PROFILE`, `COLLECTION`, `TIERLIST`.  
**Deferred:** `LIST` (OpenAPI exists; Prisma enum lacks `LIST` — no schema invent), `COMMENT`, `POST` (until product priority).

**API mapping (locked):**

| OpenAPI / client value | Stored `ModerationEntityType` |
|------------------------|-------------------------------|
| `USER` (Social `reportContent`) | `PROFILE` |
| `REVIEW`, `MESSAGE`, `COLLECTION`, `TIERLIST`, `COMMENT`, `POST` | Same name when in enum |
| `LIST` | **Not MVP** — reject or defer endpoint |

---

## Queue lifecycle

```text
PENDING ──► IN_REVIEW ──► RESOLVED
                │
                └──► ESCALATED ──► IN_REVIEW / RESOLVED
```

| Status | Meaning |
|--------|---------|
| `PENDING` | Awaiting staff |
| `IN_REVIEW` | Claimed / being worked (`assignedTo` optional) |
| `ESCALATED` | Needs senior attention (process; same `MODERATOR`/`ADMIN` roles — no new enum) |
| `RESOLVED` | Terminal; `ModerationAction` written; `resolvedAt` set |

**Centralized queue:** One `moderation_queue` table for all entity types. Reviews BC must **not** remain the long-term owner of queue services (extract to Moderation module in 12.1+).

**Priority:** `LOW` | `MEDIUM` | `HIGH` | `CRITICAL` — heuristic from reason code / reporter count; **no ML**.

---

## Action execution lifecycle

```text
POST /admin/moderation/queue/{itemId}/resolve
        │
        ├─ Roles: MODERATOR | ADMIN
        ├─ Guard: item not already RESOLVED
        ├─ Validate ModerationResolveAction + reasonCode
        │
        ├─ Content side-effects (by entityType) via domain ports:
        │     REJECT / BAN (content) → hide soft-delete
        │     APPROVE → restore if hidden (when domain supports)
        │     EDIT_APPROVE → domain edit port (Reviews only in early sprints)
        │
        ├─ User side-effects via Users port:
        │     WARN → strikeCount += 1
        │     SUSPEND → isSuspended = true (+ audit metadata suspensionDays)
        │     BAN → isBanned = true (and typically hide content)
        │
        ├─ INSERT ModerationAction
        ├─ Close related OPEN reports for entity
        ├─ Append AuditLog (banApplied / suspensionApplied = true when applied)
        ├─ Mark queue RESOLVED
        └─ Emit moderation.resolved.v1 (+ Users emits user.*.v1 when flags change)
```

**Sprint 4.5 exception closed:** Resolve actions that say WARN/SUSPEND/BAN **must apply** Users flags — recording-only is forbidden after Module 12 unlock.

---

## Appeals lifecycle

```text
Sanctioned user (Users flags or content action linked to report)
        │
        ▼
Create Appeal (Appeal.reportId + userId + reason)  [status=PENDING]
        │
        ├─ Own-only create/list for the appealing user
        ├─ Staff resolve → APPROVED | REJECTED + resolvedAt
        └─ Emit moderation.appeal.created.v1 / moderation.appeal.resolved.v1
```

**Schema:** `Appeal` already exists. **HTTP:** No OpenAPI paths in Freeze v1.0 docs set — **Appeals remain MVP for Sprint 12.3** but require **OpenAPI change-control** before coding user/staff appeal routes. Do not invent paths in implementation sprints without that control.

Until HTTP exists, staff may continue using report/queue admin surfaces; Appeals table usage is still the durable SoT once 12.3 lands.

---

## Audit ownership

| Mechanism | Role |
|-----------|------|
| `ModerationAction` | Normative resolve decision row |
| `AuditLog` | Append-only platform audit (`moderation.resolve`, hide/restore, report update, user sanction) |
| Domain events | Bus signal for Notifications / analytics |

**Append-only:** Never update/delete `AuditLog` rows. Corrections = new compensating actions + new audit entries.

---

## Nest module shape (target)

```text
apps/api/src/moderation/
  ├── moderation.module.ts
  ├── report.service.ts / report.repository.ts
  ├── queue.service.ts / queue.repository.ts
  ├── resolve.service.ts
  ├── appeal.service.ts          # 12.3
  ├── audit.writer.ts
  └── ports/                     # interfaces to Reviews, Comm, Users, UGC
```

Domain modules keep thin report controllers; admin queue controllers move under Moderation (or `admin` wiring that injects Moderation services).

---

## Compatibility with other Freezes

| Freeze | Rule preserved |
|--------|----------------|
| Communication | Comm owns message ACL + report engagement entry; Moderation owns report/queue rows and admin resolve |
| Notification | Never SoT; consumes events only |
| Search | Reads Users suspend/ban flags; does not own sanctions |
| Database | No new tables/enums in Module 12 V1 without Database Freeze amendment |

---

## Explicit Phase 2 (out of this architecture V1)

AI moderation, toxicity/image/voice pipelines, trust/reputation scores, community moderators, auto-escalation ML, `adminBatchScanModeration`, `POST /ai/moderation`.
