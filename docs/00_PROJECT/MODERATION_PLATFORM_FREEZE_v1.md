# Moderation Platform Freeze v1.0

**Document:** `docs/00_PROJECT/MODERATION_PLATFORM_FREEZE_v1.md`  
**Date:** 2026-07-19  
**Status:** **FROZEN**  
**Preceded by:** Module 12 Scope Report (`APPROVED WITH MINOR CHANGES`) + Sprint 12.0 architecture  
**Unlocks:** Sprint 12.1 Reporting Core

---

## What is frozen

The Moderation & Safety documentation set below is the **normative SSOT** for Sprint 12.1+. Implementors must not reinterpret these decisions in code reviews.

| Artifact | Role |
|----------|------|
| [`docs/08_API/ADMIN_API.yaml`](../08_API/ADMIN_API.yaml) + domain report OpenAPI | REST contracts — **do not invent paths**; **do not edit OpenAPI in implementation sprints without change control** |
| [`docs/01_ARCHITECTURE/MODERATION_ARCHITECTURE.md`](../01_ARCHITECTURE/MODERATION_ARCHITECTURE.md) | Bounded context & lifecycles |
| [`docs/01_ARCHITECTURE/ADR/ADR_Moderation_Platform.md`](../01_ARCHITECTURE/ADR/ADR_Moderation_Platform.md) | ADR-MOD-001 Accepted |
| [`docs/03_EVENTS/MODERATION_EVENT_MATRIX.md`](../03_EVENTS/MODERATION_EVENT_MATRIX.md) | Events |
| [`docs/04_CACHE/MODERATION_CACHE_STRATEGY.md`](../04_CACHE/MODERATION_CACHE_STRATEGY.md) | Redis keys & invalidation |
| [`docs/05_SECURITY/MODERATION_PERMISSION_MATRIX.md`](../05_SECURITY/MODERATION_PERMISSION_MATRIX.md) | AuthZ |
| [`docs/05_SECURITY/MODERATION_VISIBILITY_MATRIX.md`](../05_SECURITY/MODERATION_VISIBILITY_MATRIX.md) | Privacy / 404 vs 403 |

**Database schema:** `ReportReason`, `Report`, `ModerationQueueItem`, `ModerationAction`, `ModeratorNote`, `Appeal`, `AuditLog`, User sanction flags, and `ModerationEntityType` already exist in Database Freeze. This Freeze **does not authorize new tables or enum values** for Module 12 V1.

---

## Twelve locked decisions (non-negotiable for 12.1+)

### 1. Moderation never owns domain aggregates

- Users, Reviews, Communication, Notifications, Feed, Search remain authoritative for their data.  
- Moderation stores reports, queue items, actions, appeals, and audit correlation only.  
- Moderation **only enforces policy**.

### 2. Domains remain source of truth for content & users

- Hide / restore / edit → **domain ports**.  
- WARN / SUSPEND / BAN → **Users port** mutating `strikeCount` / `isSuspended` / `isBanned`.  
- No parallel ban tables.

### 3. Centralized human queue

- Single `ModerationQueueItem` pipeline for all MVP entity types.  
- Extract ownership from Reviews BC into Moderation Nest module.

### 4. Reporting lifecycle (immutable intake)

- Authenticated create only; no self-report of own content.  
- One **OPEN** report per `(reporterId, entityType, entityId)`.  
- Reporter **cannot mutate** description/reason after create.  
- Create always enqueues a queue item (unless Freeze later allows collapse — V1: always enqueue).

### 5. Queue states & resolve lifecycle

- States: `PENDING` → `IN_REVIEW` → (`ESCALATED`) → `RESOLVED`.  
- Resolve writes `ModerationAction`, closes related open reports, appends `AuditLog`, emits `moderation.resolved.v1`.  
- Terminal `RESOLVED` is immutable (compensating new actions only).

### 6. Soft-delete policy

- “Hide” = domain `deletedAt` soft-delete (no separate hide column required).  
- Public surfaces treat hidden as **404**; staff queue may show redacted previews.

### 7. Visibility & 404 vs 403

- Missing / non-visible report targets → **404** (match domain GET; reduce oracles).  
- Authenticated but policy-denied staff/user actions → **403** where role is insufficient; non-owners of appeals/reports → **404** (do not confirm existence) when that matches platform pattern.  
- Full rules: Visibility Matrix.

### 8. User action semantics

| Action | Effect (Users SoT) |
|--------|---------------------|
| `WARN` | `strikeCount += 1` |
| `SUSPEND` | `isSuspended = true`; optional `suspensionDays` in action notes + audit metadata only (no Suspension table) |
| `BAN` | `isBanned = true`; typically also hide reported content when applicable |
| Lift suspend/ban | Via Users/Admin user update paths — not invent new tables |

Auth already blocks suspended/banned login — Moderation must not fork Auth rules.

### 9. Report ownership & entity allowlist

- Moderation owns `Report` rows.  
- MVP types: `REVIEW`, `MESSAGE`, `PROFILE`, `COLLECTION`, `TIERLIST`.  
- Map OpenAPI `USER` → `PROFILE`.  
- **`LIST` deferred** (no enum value — no invent).  
- `COMMENT` / `POST` deferred.

### 10. Appeals

- `Appeal` model is SoT for appeal records.  
- Own-only for filing user; staff resolve.  
- Sprint **12.3** product scope; **HTTP requires OpenAPI change-control** before coding (no invent in 12.0/12.1/12.2).

### 11. Audit append-only

- `AuditLog` and `ModerationAction` are append-only decision evidence.  
- No FLUSH of audit; no silent rewrite of resolve history.

### 12. No AI / ML / trust / toxicity / voice in V1

- Forbidden in Module 12 V1: AI moderation, toxicity detection, image moderation, voice moderation, automatic spam ML, trust score, reputation engines, community-moderator programs, auto-escalation ML, `adminBatchScanModeration`, `POST /ai/moderation`.  
- Phase 2 / later Freezes only.

---

## Roles note (Senior Moderator)

`PlatformRole` has `MODERATOR` and `ADMIN` only. **Senior Moderator** is a **process title**, not a new enum. For V1 permissions, map Senior Moderator → `MODERATOR` unless a specific op is Admin-only (see Permission Matrix: BAN may be Admin-preferred).

---

## Sprint 12.1 scope lock (implementation unlock)

After this Freeze is accepted, Sprint **12.1** may implement **only**:

| Area | Work |
|------|------|
| Moderation Nest module skeleton | Move/wrap report create + enqueue |
| Reporting Core | Unified create for allowlisted types behind façades |
| Façades | Keep `reportReview`, `reportMessage`; add Profile/Collection/TierList via Social `reportContent` and/or domain paths **only if already in OpenAPI** |
| Events | `moderation.report.created.v1` (+ keep existing review.reported during migration) |
| Cache | Optional short-TTL keys per Cache Strategy |

**Not in 12.1:** Cross-entity resolve side-effects beyond current Reviews behavior, Users WARN/SUSPEND/BAN apply, Appeals HTTP, AI, LIST reports, stats, batch-scan, OpenAPI edits.

---

## Explicit non-goals until Phase 2 / later Freezes

AI/ML assist, toxicity/image/voice, trust/reputation, community mods, auto-escalation, new Prisma models/enums, inventing undeclared endpoints, OpenAPI edits without change control, Notification SoT writes from Moderation.

---

## Change control

Breaking changes to frozen decisions require:

1. ADR amendment (ADR-MOD-00x), and  
2. Bump Moderation Platform Freeze minor/major, and  
3. Explicit note in the sprint report.

Cosmetic OpenAPI wording that does not change semantics may land without a new Freeze major.

New moderation tables/enums require **Database Freeze amendment**.

Appeals HTTP paths require **OpenAPI change-control** recorded before Sprint 12.3 coding.

---

## Gate

**Sprint 12.1 Reporting Core may begin** after this Freeze is accepted.

Do **not** start AI/ML/trust/toxicity/voice work under Module 12 V1.  
Do **not** start Sprint 12.1 until this Freeze is accepted.
