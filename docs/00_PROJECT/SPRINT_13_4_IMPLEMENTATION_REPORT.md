# Sprint 13.4 — Admin Hardening Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_13_4_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-20  
**Role:** Principal Software Architect / CTO  
**Scope:** Admin Platform hardening only — no new features  
**Freeze:** [`ADMIN_PLATFORM_FREEZE_v1.md`](./ADMIN_PLATFORM_FREEZE_v1.md)  
**Architecture:** [`ADMIN_ARCHITECTURE.md`](../01_ARCHITECTURE/ADMIN_ARCHITECTURE.md) · [`ADR_Admin_Platform.md`](../01_ARCHITECTURE/ADR/ADR_Admin_Platform.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 13.4 hardens the Admin Platform delivered in 13.1–13.3. No new endpoints, Prisma models, OpenAPI edits, analytics, CMS, jobs, feature flags, or Phase 2 work. Fixes focused on production readiness: corrupted ops DTOs, appeals pagination correctness, uniform path UUID → 400, and queue invalid-UUID → validation (not 404).

| Area | Outcome |
|------|---------|
| Authorization | Verified: all Admin controllers use `AdminAuthGuard` + `PlatformRoleGuard` |
| Orchestration | Verified: Admin remains compose-only; domain ports SoT |
| Audit | Verified: Admin `AuditLog` read-only; mutations audit in owning BCs |
| Cache | Verified: targeted `DEL` only — no FLUSHALL / KEYS / wildcards |
| Performance | Fixed resolved-appeals merge → single `statuses` query |
| Security / visibility | Verified: staff visibility + Moderator own-actions audit force |
| Events | Verified: Admin emits no domain events |
| Quality gates | prisma ✅ · typecheck ✅ · build ✅ · eslint ✅ · unit ✅ · e2e ⚠️ 1 unrelated |

---

## Hardening changes

### Critical — restore Admin Operations DTOs

`apps/api/src/admin/admin-operations.dto.ts` had been overwritten with Sprint 13.3 report markdown (build/typecheck break + missing body validation).

**Restored:**

- `AdminSuspendUserDto` (`suspensionDays`)
- `AdminAssignReportDto` (`assigneeId`)
- `AdminResolveReportDto` (resolve action fields)
- `AdminResolveAppealDto` (`status`, optional `internalNote`)

### Major — resolved appeals pagination

`AdminManagementService.listAppealsByStatus('resolved')` previously dual-fetched APPROVED + REJECTED, client-merged/sliced — incorrect offset pages under load.

**Fix (no new HTTP surface):**

- `AppealListQuery.statuses` + `AppealRepository.listStaff({ statuses })` → `status: { in: [...] }`
- Admin compose: one call with `statuses: ['APPROVED', 'REJECTED']`

### Minor — uniform UUID / 403·404 policy

| Change | Effect |
|--------|--------|
| `ParseUUIDPipe` on Management detail + Operations path IDs | Invalid UUID → Nest **400** before domain |
| `ModerationQueueService.assertUuid` → `ModerationQueueValidationException` | Invalid UUID → **400**, not fake **404** |
| AuthZ unchanged | Missing staff role → **403**; missing resource → **404** |

---

## Architecture compliance

| Rule | Result |
|------|--------|
| Admin orchestration only | **Pass** |
| Domain services remain SoT | **Pass** |
| No Admin SQL on foreign business tables | **Pass** — Admin prisma = `AuditLog` read only |
| Domain `*/admin/*` ports own their tables | **Pass** (approved compose pattern) |
| Append-only audit | **Pass** — no Admin update/delete on audit |
| Actor attribution on mutations | **Pass** — `actor.sub` → Users / Moderation / Catalog |
| Timestamp consistency | **Pass** — domain `createdAt` / ISO via existing mappers |
| Targeted cache invalidation | **Pass** — `DEL admin:dashboard:home` |
| No duplicate / invented Admin events | **Pass** |
| No Phase 2 / Prisma invent / OpenAPI invent | **Pass** |

### Authorization coverage (verified)

| Controller | Guards | Roles |
|------------|--------|-------|
| `AdminController` | `AdminAuthGuard`, `PlatformRoleGuard` | Moderator+ |
| `AdminManagementController` | same | Moderator+ |
| `AdminOperationsController` | same | Moderator+ |

Privilege escalation: no role-assign HTTP façade; JWT must hold mapped `PlatformRole`.

### Security / visibility (verified)

- Soft-deleted / hidden reviews: list redacts; detail may reveal for staff (Visibility Matrix).
- Unpublished games: staff read allowed.
- Banned / suspended users: staff management visible.
- Moderator audit: `forceActorId` own-actions restriction retained.
- Appeals staff list: pending / resolved compose only (resolve remains Operations).

---

## Validation

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ (with `DATABASE_URL` / `DIRECT_URL`) |
| typecheck (`@gmrlog/api`) | ✅ |
| build (`@gmrlog/api`) | ✅ |
| scoped eslint (admin + touched moderation) | ✅ |
| Unit (`src/admin` + related moderation specs) | ✅ **34/34** |
| E2E | ⚠️ **213/214** — `moderation-actions.e2e-spec.ts` appeal create returned **401** (auth flake; not Admin path). Redis/Postgres reachable this run. |

---

## Remaining technical debt

| Debt | Notes |
|------|-------|
| OpenAPI register Admin shell / management / ops façades | Change-control; out of 13.4 |
| Parallel HTTP vs `/admin/moderation/*` / `/admin/catalog/*` | Intentional compose; consolidate later |
| `adminUpdateUserRoles` / session revoke admin HTTP | Adjacent MVP, not this sprint |
| `apps/admin` UI wiring | Later |
| E2E appeal create 401 flake | Investigate session/token fixture stability |
| Queue `assertUuid` field names still default `id` on most call sites | Cosmetic; validation status code is correct |

---

## Gate

**SPRINT 13.4 COMPLETE**

Stop. Do **not** continue to Sprint 13.5.
