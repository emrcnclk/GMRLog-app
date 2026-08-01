# Admin V1 — Post-Audit Remediation

**Document:** `docs/00_PROJECT/ADMIN_POST_AUDIT_REMEDIATION.md`  
**Date:** 2026-07-20  
**Role:** Principal Software Architect / CTO  
**Mode:** Implementation — audit remediation only (D1 + D2)  
**Source:** [`SPRINT_13_5_FINAL_AUDIT.md`](./SPRINT_13_5_FINAL_AUDIT.md)  
**Freeze:** [`ADMIN_PLATFORM_FREEZE_v1.md`](./ADMIN_PLATFORM_FREEZE_v1.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Post-audit remediation closes Freeze MVP gaps **D1** (`adminUpdateUserRoles`) and **D2** (`adminRevokeUserSessions`). Admin remains orchestration-only; Users/Auth own mutations, audit writes, and existing security signals. No Prisma, OpenAPI, Phase 2, or new permissions/roles/events invented.

| Debt | Status |
|------|--------|
| D1 — Update user roles | **Complete** |
| D2 — Revoke user sessions | **Complete** |

**Remaining Major Debt: NONE**

---

## D1 — Admin Update User Roles

| Item | Detail |
|------|--------|
| HTTP | `PATCH /api/v1/admin/users/{userId}/roles` |
| AuthZ | `AdminAuthGuard` + `PlatformRoleGuard` + `@AdminRoles('Admin', 'SuperAdmin')` |
| Body | `{ roles: ('User' \| 'Moderator' \| 'Admin')[] }` (`minItems: 1`) |
| SoT | `User.platformRole` (`PlatformRole`) — highest label wins |
| Domain port | `UsersAdminRoleService.updateRoles` |
| Audit | Users BC `auditLog` action `user.roles.update` (`fromRole`, `toRole`, `roles`) |
| Events | None invented — Event Matrix optional `user.role.updated.v1` not shipped |
| `UserAdminRole` | Left unused (Freeze: mirror or unused; no second AuthZ engine) |

### Primary files

- `apps/api/src/users/admin/users-admin-role.repository.ts`
- `apps/api/src/users/admin/users-admin-role.service.ts`
- `apps/api/src/admin/admin-operations.controller.ts` (`updateUserRoles`)
- `apps/api/src/admin/admin-operations.service.ts`
- `apps/api/src/admin/admin-operations.dto.ts` (`AdminUpdateUserRolesDto`)

---

## D2 — Admin Revoke User Sessions

| Item | Detail |
|------|--------|
| HTTP | `POST /api/v1/admin/users/{userId}/revoke-sessions` (**204**) |
| AuthZ | ADMIN / SuperAdmin only (same pattern as D1) |
| Behavior | Revokes **all** active sessions; does **not** suspend/ban/mutate profile |
| Domain ports | `UsersAdminSessionService` → `SessionManagementService.revokeAllForUser` |
| Auth signals | Existing `AUTH_SESSIONS_REVOKED` security log + `SESSION_REVOKED` notify |
| Audit | Users BC `auditLog` action `user.sessions.revoke` |
| Events | No new event types — reuse Auth security notification path only |

**Path note:** Remediation runtime uses `/revoke-sessions` as specified in this sprint. OpenAPI still documents `/sessions/revoke` (no OpenAPI edit — intentional hygiene gap, same class as other ops façades).

### Primary files

- `apps/api/src/auth/services/session-management.service.ts` (`revokeAllForUser`)
- `apps/api/src/users/admin/users-admin-session.service.ts`
- Admin Operations controller/service (compose)

---

## Architecture compliance

| Rule | Result |
|------|--------|
| Admin orchestration only | **Pass** |
| Users/Auth remain SoT | **Pass** |
| No Admin Prisma on User/Session ownership for business rules | **Pass** — writes live in Users/Auth ports |
| No duplicated role/session business logic in Admin | **Pass** |
| PlatformRole only AuthZ SoT | **Pass** |
| No Admin-invented domain events | **Pass** |
| No Prisma / OpenAPI / Phase 2 / new permissions | **Pass** |

---

## Validation

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| typecheck (`@gmrlog/api`) | ✅ |
| build (`@gmrlog/api`) | ✅ |
| scoped eslint (touched Admin/Users/Auth) | ✅ |
| Unit (Admin + Users admin role/session + SessionManagement) | ✅ **31/31** |
| E2E | ⚠️ **213/214** |

### Environment / unrelated

| Failure | Classification |
|---------|----------------|
| `moderation-actions.e2e-spec.ts` appeal create **401** | Pre-existing Moderation fixture flake — not Admin D1/D2 routes |

---

## Remaining audit debt (re-evaluation)

| ID | Item | After remediation |
|----|------|-------------------|
| D1 | `adminUpdateUserRoles` | **Closed** |
| D2 | Dedicated session revoke | **Closed** |
| D3 | `apps/admin` beyond stub | Residual product UI (not Major API debt) |
| D4–D8 | OpenAPI hygiene, path alias vs `/sessions/revoke`, cache naming, e2e flake | Minor / hygiene |

**Remaining Major Debt: NONE**

---

## Gate

**ADMIN V1 REMEDIATION COMPLETE**

Stop. Do **not** continue to Module 14.
