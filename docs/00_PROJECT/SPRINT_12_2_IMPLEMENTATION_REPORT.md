# Sprint 12.2 — Moderation Queue Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_12_2_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-19  
**Role:** Principal Software Architect / CTO  
**Scope:** Moderation Queue only — list / filter / pagination / detail / assignment / status transitions / audit / events  
**Freeze:** [`MODERATION_PLATFORM_FREEZE_v1.md`](./MODERATION_PLATFORM_FREEZE_v1.md)  
**Architecture:** [`SPRINT_12_0_MODERATION_ARCHITECTURE.md`](./SPRINT_12_0_MODERATION_ARCHITECTURE.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 12.2 moves the **centralized human moderation queue** into the Moderation BC. Moderators can list, filter, paginate, inspect detail (report / related reports / audit timeline), claim / assign / escalate, and resolve queue items. Resolve records `ModerationAction`, closes open reports, appends audit, and emits `moderation.resolved.v1`. **WARN / SUSPEND / BAN Users flags are not applied** (deferred to 12.3). No appeals, AI, Prisma migrations, or OpenAPI edits.

| Item | Result |
|------|--------|
| Queue ownership | Moderation BC (`AdminModerationQueueController`) |
| States | Freeze only: `PENDING` → `IN_REVIEW` → (`ESCALATED`) → `RESOLVED` |
| Events | `moderation.resolved.v1` only (no invented `queue.*` events) |
| Punishments | **Not executed** |
| Quality gates | prisma ✅ · typecheck ✅ · build ✅ · eslint ✅ · unit ✅ · e2e ⏭ env |

---

## Queue endpoints

| # | Method | Path | OpenAPI | Notes |
|---|--------|------|---------|-------|
| 1 | `GET` | `/admin/moderation/queue` | Yes | Filters: `page`, `pageSize`, `entityType`, `priority`, `status` |
| 2 | `GET` | `/admin/moderation/queue/{itemId}` | Yes | Detail + related reports + audit timeline |
| 3 | `POST` | `/admin/moderation/queue/{itemId}/resolve` | Yes | Terminal resolve; no Users sanction apply |
| 4 | `POST` | `/admin/moderation/queue/{itemId}/claim` | **Gap** | `PENDING`/`ESCALATED` → `IN_REVIEW`, assignee = self |
| 5 | `POST` | `/admin/moderation/queue/{itemId}/assign` | **Gap** | Sets `assignedTo`; `PENDING` → `IN_REVIEW` |
| 6 | `POST` | `/admin/moderation/queue/{itemId}/escalate` | **Gap** | `PENDING`/`IN_REVIEW` → `ESCALATED` |

**Permissions:** `ADMIN` \| `MODERATOR` only (Jwt + Roles). Anonymous → **401**; authenticated non-staff → **403**. Missing item → **404**.

Claim / assign / escalate are **runtime OpenAPI-gap** endpoints (same debt class as review hide/restore). Freeze + Permission Matrix authorize assignment / escalate fields; no OpenAPI invent of new contracted schemas this sprint.

---

## Queue lifecycle

```text
PENDING ──► IN_REVIEW ──► RESOLVED
                │
                └──► ESCALATED ──► IN_REVIEW (claim) / assign / RESOLVED
```

| Transition | Trigger | Audit action |
|------------|---------|--------------|
| → `IN_REVIEW` | claim / assign (from `PENDING`) | `moderation.queue.claim` / `moderation.queue.assign` |
| → `ESCALATED` | escalate | `moderation.queue.escalate` |
| → `RESOLVED` | resolve | `moderation.resolve` |

**Sorting:** `status=PENDING` → oldest first (`createdAt ASC`). Otherwise priority `DESC` then oldest.

**Resolve side-effects (12.2):**

- Write `ModerationAction`; mark queue `RESOLVED`
- Close related `OPEN`/`IN_REVIEW` reports (`DISMISSED` for APPROVE/EDIT_APPROVE, else `RESOLVED`)
- Append-only `AuditLog` (`banApplied` / `suspensionApplied` / `warnApplied` = **false**)
- Emit `moderation.resolved.v1`
- REVIEW content hide/restore/edit via Reviews port (`ModuleRef` → `ReviewModerationService`) — not Users punishments

---

## Events

| Event | When |
|-------|------|
| `moderation.resolved.v1` | After successful resolve |

No invented events (`moderation.queue.updated.v1`, `moderation.queue.review.started.v1`, etc.). Status transitions are **audit-only** until Event Matrix lists dedicated names.

Payload: `queueItemId`, `entityType`, `entityId`, `action`, `reasonCode`, `moderatorId`.

---

## Cache

Per [`MODERATION_CACHE_STRATEGY.md`](../04_CACHE/MODERATION_CACHE_STRATEGY.md):

| Key | TTL | Invalidate |
|-----|-----|------------|
| `moderation:queue:{hash}` | ~20s (env override) | TTL expiry only (no KEYS / FLUSH) |
| `moderation:item:{id}` | ~20s | `DEL` on claim / assign / escalate / resolve |

No `FLUSHALL`. No O(N) wildcard wipe.

---

## Files created

| File | Role |
|------|------|
| `apps/api/src/moderation/admin-moderation-queue.controller.ts` | Admin queue HTTP |
| `apps/api/src/moderation/moderation-queue.service.ts` | Queue workflow |
| `apps/api/src/moderation/moderation-queue.repository.ts` | Prisma queue / report / audit |
| `apps/api/src/moderation/moderation-queue-cache.service.ts` | Short-TTL cache-aside |
| `apps/api/src/moderation/queue.dto.ts` | Query / resolve / assign DTOs |
| `apps/api/src/moderation/queue.entities.ts` | Domain DTOs |
| `apps/api/src/moderation/queue.exceptions.ts` | Problem+json errors |
| `apps/api/src/moderation/queue.mapper.ts` | Mapping + redaction |
| `apps/api/src/moderation/moderation-queue.service.spec.ts` | Unit |
| `apps/api/test/moderation-queue.e2e-spec.ts` | Queue e2e |
| `docs/00_PROJECT/SPRINT_12_2_IMPLEMENTATION_REPORT.md` | This report |

## Files updated

| File | Change |
|------|--------|
| `apps/api/src/moderation/moderation.module.ts` | Register queue providers + controller |
| `apps/api/src/moderation/moderation.constants.ts` | Queue statuses / events / cache keys (from 12.2 prep) |
| `apps/api/src/reviews/reviews.module.ts` | Remove Reviews `AdminModerationController` |
| `apps/api/src/reviews/moderation/review-moderation.service.ts` | Queue removed; keep hide/restore + `applyEditApprove` port |
| `apps/api/src/reviews/moderation/review-moderation.service.spec.ts` | Drop resolve tests; cover edit approve |

## Files deleted

| File | Reason |
|------|--------|
| `apps/api/src/reviews/moderation/admin-moderation.controller.ts` | Queue HTTP moved to Moderation BC |

---

## Validation results

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| `pnpm --filter @gmrlog/api typecheck` | ✅ |
| `pnpm --filter @gmrlog/api build` | ✅ |
| eslint (Sprint 12.2 scoped, `--max-warnings 0`) | ✅ |
| Unit (`src/moderation` + review moderation / report façades) | ✅ **23/23** |
| E2E `moderation-queue` (+ related) | ⏭ **Blocked** — local Postgres rejects `gmrlog:gmrlog`; Docker CLI not on PATH. Redis healthy. Specs ready under `test/moderation-queue.e2e-spec.ts`. |

To run e2e when infra matches `.env`:

```bash
pnpm docker:up
pnpm db:migrate:deploy
pnpm --filter @gmrlog/api exec vitest run --config vitest.e2e.config.ts test/moderation-queue.e2e-spec.ts
```

---

## Deferred work

| Item | Sprint / Phase |
|------|----------------|
| WARN / SUSPEND / BAN via Users port | **12.3** |
| Appeals HTTP | **12.3** (+ OpenAPI change-control) |
| MESSAGE / UGC content resolve ports beyond REVIEW | Later / 12.2 residual polish |
| Claim / assign / escalate OpenAPI hygiene | Later (no invent this sprint) |
| `LIST` / COMMENT / POST reports | After Database Freeze |
| AI / toxicity / trust / voice | Phase 2 |
| Prisma / OpenAPI edits | Forbidden this sprint |

---

## Architecture compliance

| Requirement | Status |
|-------------|--------|
| Queue in Moderation BC | ✅ |
| Freeze queue states only | ✅ |
| Assignment supported (`assignedTo`) | ✅ |
| Append-only audit on transitions | ✅ |
| Event Matrix only (`moderation.resolved.v1`) | ✅ |
| Targeted cache invalidate | ✅ |
| Moderator-only; 401/403/404 | ✅ |
| No Users punishment execution | ✅ |
| No appeals / AI / migrations / OpenAPI edits | ✅ |

---

## Gate

**SPRINT 12.2 COMPLETE**

Stop. Do **not** continue to Sprint 12.3.
