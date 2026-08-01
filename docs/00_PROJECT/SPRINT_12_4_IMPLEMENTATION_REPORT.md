# Sprint 12.4 — Moderation Hardening Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_12_4_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-20  
**Role:** Principal Software Architect / CTO  
**Scope:** Consistency / security / resilience / parity only — **no new product features**  
**Freeze:** [`MODERATION_PLATFORM_FREEZE_v1.md`](./MODERATION_PLATFORM_FREEZE_v1.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 12.4 hardens Reporting, Queue, Actions, Appeals, Audit, Events, Cache, Permissions, and Visibility against Freeze matrices. No AI, no schema/OpenAPI invent, no new product endpoints beyond existing surfaces.

| Area | Outcome |
|------|---------|
| Resolve races | Atomic claim + sibling collapse |
| Appeals | Conditional resolve; sanction-scoped lift |
| Users | Suspend session revoke; fail if target missing |
| Visibility | Uniform appeal 404; no report reopen |
| Cache | Still targeted only (no FLUSH/KEYS) |
| Quality gates | prisma ✅ · typecheck ✅ · build ✅ · eslint ✅ · unit ✅ · e2e ⏭ env |

---

## Hardening fixes

| ID | Severity | Fix |
|----|----------|-----|
| H1 | Critical | `resolveQueueItem` uses `updateMany` where `status != RESOLVED`; concurrent second resolve → 409 |
| H2 | Critical | Users/content side-effects run **after** successful claim |
| H3 | Critical | Sibling open queue items for same entity collapsed to `RESOLVED` in same tx |
| H4 | Critical | Appeal `APPROVED` lifts only matching sanction (`SUSPEND`→unsuspend, `BAN`→unban, `WARN`→no flag lift) |
| H5 | High | Appeal resolve via `updateMany` `status=PENDING`; race → `AppealAlreadyResolvedException` |
| H6 | High | WARN/SUSPEND/BAN abort if target user unresolved (no silent recording-only) |
| H7 | High | REJECT/BAN soft-delete MESSAGE/COLLECTION/TIERLIST via `deletedAt` (REVIEW still Reviews port) |
| H8 | High | `applySuspend` revokes sessions (parity with BAN enforcement) |
| H9 | High | Appeal create in transaction with duplicate re-check |
| H10 | Medium | Report create re-checks active duplicate inside tx → 409 |
| H11 | Medium | Queue list batches report counts (`countReportsByEntityBatch`) |
| H13 | Medium | `EDIT_APPROVE` rejected for non-REVIEW |
| H14 | Medium | Terminal reports cannot reopen to `OPEN`/`IN_REVIEW` |
| H15 | Medium | Assign requires assignee `MODERATOR`/`ADMIN` |
| H16 | Medium | Appeal create missing report uses same generic 404 as non-owner |
| H17 | Low | Claim/assign/escalate use expected-status `updateMany` |
| H18 | Low | Resolve JSDoc corrected for 12.3+ sanction apply |

---

## Security fixes

- Resolve/appeal idempotency under concurrency (claim-first).  
- No Users sanction without resolvable subject.  
- Suspended users lose refresh/session (cannot keep full API surface).  
- Assignee privilege check.  
- Appeal ownership oracle reduced (uniform 404).  
- Report status reopen blocked.

---

## Cache review

| Check | Result |
|-------|--------|
| FLUSHALL / FLUSHDB | **Absent** |
| KEYS / O(N) wipe | **Absent** |
| Item invalidate on transition/resolve | `DEL moderation:item:{id}` |
| List keys | Short TTL only |
| Sanction | Profile cache targeted invalidate |

---

## Event parity

| Event | Status |
|-------|--------|
| `moderation.report.created.v1` | OK (single publisher) |
| `moderation.resolved.v1` | OK — once per successful claim |
| `user.warned/suspended/banned.v1` | OK — Users BC only |
| `user.unsuspended/unbanned.v1` | OK — scoped lift |
| `moderation.appeal.created/resolved.v1` | OK — once per claim |
| Invented `moderation.warning.*` etc. | **Not present** |

Domain `review.hidden.v1` / `review.restored.v1` remain Reviews-owned.

---

## Audit review

| Trail | Append-only |
|-------|-------------|
| Report create / update | ✅ |
| Queue claim / assign / escalate / resolve | ✅ |
| User warn / suspend / ban / lift | ✅ |
| Appeal create / resolve | ✅ |

No update/delete of `AuditLog` or `ModerationAction` history.

---

## Validation

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| typecheck | ✅ |
| build | ✅ |
| scoped eslint | ✅ |
| Unit (moderation + sanctions + report façade) | ✅ |
| E2E moderation suites | ⏭ **Blocked** — Postgres `gmrlog:gmrlog` auth failure; Docker CLI unavailable. Redis healthy. Specs unchanged/ready. |

---

## Remaining technical debt

| Debt | Notes |
|------|-------|
| Appeals OpenAPI change-control | Paths remain runtime gap |
| DB unique indexes for report/appeal dedupe | Needs Database Freeze amendment |
| Domain event ports for MESSAGE/UGC hide | Soft-delete applied; rich domain events optional later |
| WARN strike decrement on appeal APPROVED | Explicitly deferred since 12.3 |
| JWT guard live flag check | Session revoke preferred for perf |
| Full `adminUpdateUser` HTTP | Adjacent Users admin surface |

---

## Files touched (primary)

- `apps/api/src/moderation/moderation-queue.service.ts`
- `apps/api/src/moderation/moderation-queue.repository.ts`
- `apps/api/src/moderation/appeal.service.ts`
- `apps/api/src/moderation/appeal.repository.ts`
- `apps/api/src/moderation/moderation-report.repository.ts`
- `apps/api/src/moderation/report-create.service.ts`
- `apps/api/src/users/sanctions/user-sanction.service.ts`
- `apps/api/src/reviews/moderation/report.service.ts`
- Specs under `src/moderation/*`, `src/users/sanctions/*`
- `docs/00_PROJECT/SPRINT_12_4_IMPLEMENTATION_REPORT.md`

---

## Gate

**SPRINT 12.4 COMPLETE**

Stop. Do **not** continue to Sprint 12.5.
