# Sprint 12.3 — Moderation Actions & Appeals Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_12_3_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-20  
**Role:** Principal Software Architect / CTO  
**Scope:** WARN / SUSPEND / BAN via Users port + Appeals create/list/resolve  
**Freeze:** [`MODERATION_PLATFORM_FREEZE_v1.md`](./MODERATION_PLATFORM_FREEZE_v1.md)  
**Architecture:** [`SPRINT_12_0_MODERATION_ARCHITECTURE.md`](./SPRINT_12_0_MODERATION_ARCHITECTURE.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 12.3 completes the moderation **decision layer**. Queue resolve for `WARN` / `SUSPEND` / `BAN` now executes through the **Users BC sanction port** (`UserSanctionService`). Users remain SoT for `strikeCount` / `isSuspended` / `isBanned`. Appeals are implemented against the existing `Appeal` model with append-only audit and Event Matrix events. No Prisma migrations, no OpenAPI file edits, no AI.

| Item | Result |
|------|--------|
| Users port | `UserSanctionService` (warn / suspend / ban / lift) |
| Resolve integration | Moderation → Users port → events |
| Appeals | Create / list own / staff list / resolve |
| Invented sanction events | **Rejected** — use `user.warned/suspended/banned.v1` |
| Quality gates | prisma ✅ · typecheck ✅ · build ✅ · eslint ✅ · unit ✅ · e2e ⏭ env |

---

## Actions implemented

| Action | Users mutation | Users event | Notes |
|--------|----------------|-------------|-------|
| `WARN` | `strikeCount += 1` | `user.warned.v1` | Via resolve |
| `SUSPEND` | `isSuspended = true` | `user.suspended.v1` | Requires `suspensionDays` |
| `BAN` | `isBanned = true` | `user.banned.v1` | Revokes sessions (preferred) |
| Content hide on BAN/REJECT | Reviews port (existing) | `review.hidden.v1` | Domain-owned |

Resolve still writes `ModerationAction`, closes reports, appends audit (`warnApplied` / `suspensionApplied` / `banApplied` = true when applied), emits `moderation.resolved.v1`.

**Target user resolution:** PROFILE → `entityId`; REVIEW / MESSAGE / COLLECTION / TIERLIST → owner / author / sender.

Moderation **never** updates `User` rows directly.

---

## Appeals implemented

| Surface | Method | Path | Auth |
|---------|--------|------|------|
| Create | `POST` | `/appeals` | Subject (JWT) |
| List own | `GET` | `/appeals/me` | Subject |
| Get own | `GET` | `/appeals/me/{appealId}` | Subject (else **404**) |
| Staff list | `GET` | `/admin/moderation/appeals` | MODERATOR/ADMIN |
| Staff get | `GET` | `/admin/moderation/appeals/{id}` | Staff |
| Resolve | `POST` | `/admin/moderation/appeals/{id}/resolve` | Staff → `APPROVED` \| `REJECTED` |

**Eligibility:** resolved/dismissed report + subject of reported entity + related queue action in `{WARN,SUSPEND,BAN}` + no duplicate `PENDING` appeal.

**APPROVED:** lifts active suspend and/or ban via Users port (`user.unsuspended.v1` / `user.unbanned.v1` when applied).  
**REJECTED:** audit + event only.  
Terminal appeals are immutable (`APPEAL_ALREADY_RESOLVED`).

**OpenAPI note:** Appeals HTTP paths are **runtime OpenAPI-gap** (Permission Matrix required change-control; no OpenAPI file edits this sprint). Documented as residual debt for later hygiene.

---

## Users integration

```text
ModerationQueueService.resolve (WARN|SUSPEND|BAN)
        ↓
UserSanctionService (Users BC)
        ↓
User aggregate flags (Prisma in Users repo only)
        ↓
user.*.v1 DomainEventPublisher
        ↓
Notifications (consumer; not written by Moderation)
```

Also: profile cache targeted invalidate; BAN → refresh/session revoke.

---

## Events (Event Matrix only)

| Event | Publisher | When |
|-------|-----------|------|
| `moderation.resolved.v1` | Moderation | Resolve |
| `user.warned.v1` | Users | After strike increment |
| `user.suspended.v1` | Users | After suspend |
| `user.banned.v1` | Users | After ban |
| `user.unsuspended.v1` | Users | Appeal APPROVED lift |
| `user.unbanned.v1` | Users | Appeal APPROVED lift |
| `moderation.appeal.created.v1` | Moderation | Appeal insert |
| `moderation.appeal.resolved.v1` | Moderation | Appeal terminal |

**Not used (invented / forbidden):** `moderation.warning.created.v1`, `moderation.suspension.created.v1`, `moderation.ban.created.v1`.

---

## Cache

| Mutation | Invalidate |
|----------|------------|
| Resolve | `DEL moderation:item:{id}` (existing); list TTL |
| Sanction | `ProfileCacheService.invalidateUser(userId)` |
| Appeals | No shared appeal cache (Cache Strategy: prefer none) |

No `FLUSHALL` / no `KEYS` scan.

---

## Audit

| Action | Audit |
|--------|-------|
| Resolve | `moderation.resolve` (+ applied flags) |
| Warn / suspend / ban | `user.warn` / `user.suspend` / `user.ban` |
| Unsuspend / unban | `user.unsuspend` / `user.unban` |
| Appeal create / resolve | `moderation.appeal.create` / `moderation.appeal.resolve` |

Append-only. No history rewrite.

---

## Files created

| File | Role |
|------|------|
| `apps/api/src/users/sanctions/user-sanction.service.ts` | Users sanction port |
| `apps/api/src/users/sanctions/user-sanction.repository.ts` | Flag mutations + audit |
| `apps/api/src/users/sanctions/user-sanction.entities.ts` | Types + event names |
| `apps/api/src/users/sanctions/user-sanction.service.spec.ts` | Unit |
| `apps/api/src/moderation/appeal.service.ts` | Appeals policy |
| `apps/api/src/moderation/appeal.repository.ts` | Appeal persistence |
| `apps/api/src/moderation/appeal.constants.ts` | Events / statuses |
| `apps/api/src/moderation/appeal.entities.ts` | DTOs |
| `apps/api/src/moderation/appeal.exceptions.ts` | Errors |
| `apps/api/src/moderation/appeal.dto.ts` | HTTP DTOs |
| `apps/api/src/moderation/appeals.controller.ts` | Subject HTTP |
| `apps/api/src/moderation/admin-appeals.controller.ts` | Staff HTTP |
| `apps/api/src/moderation/appeal.service.spec.ts` | Unit |
| `apps/api/test/moderation-actions.e2e-spec.ts` | Actions + appeals e2e |
| `docs/00_PROJECT/SPRINT_12_3_IMPLEMENTATION_REPORT.md` | This report |

## Files updated

| File | Change |
|------|--------|
| `apps/api/src/users/users.module.ts` | Export `UserSanctionService` |
| `apps/api/src/moderation/moderation.module.ts` | Import Users; register appeals |
| `apps/api/src/moderation/moderation-queue.service.ts` | Apply sanctions via Users port |
| `apps/api/src/moderation/moderation-queue.service.spec.ts` | WARN port coverage |

---

## Validation results

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| `pnpm --filter @gmrlog/api typecheck` | ✅ |
| `pnpm --filter @gmrlog/api build` | ✅ |
| eslint (Sprint 12.3 scoped, `--max-warnings 0`) | ✅ |
| Unit (`src/moderation` + `src/users/sanctions`) | ✅ **24+** (queue/appeal/report/sanction) |
| E2E `moderation-actions` | ⏭ **Blocked** — local Postgres rejects `gmrlog:gmrlog`; Docker CLI unavailable. Spec ready. |

---

## Deferred work

| Item | Disposition |
|------|-------------|
| Appeals OpenAPI change-control / formal paths | Later hygiene |
| Full `adminUpdateUser` HTTP surface | Adjacent Users admin (port covers resolve path) |
| WARN strike decrement on appeal APPROVED | Not in Freeze — left as-is |
| AI / toxicity / trust / voice | Phase 2 |
| Prisma / OpenAPI edits | Forbidden this sprint |
| Sprint 12.4 hardening | Next |

---

## Architecture compliance

| Requirement | Status |
|-------------|--------|
| Moderation decides; Users executes | ✅ |
| No direct User writes from Moderation | ✅ |
| Event Matrix only | ✅ |
| Append-only audit | ✅ |
| Moderator-only actions; own-only appeals | ✅ |
| 404 for foreign appeals | ✅ |
| Targeted cache only | ✅ |
| No AI / migrations / OpenAPI invent | ✅ |

---

## Gate

**SPRINT 12.3 COMPLETE**

Stop. Do **not** continue to Sprint 12.4.
