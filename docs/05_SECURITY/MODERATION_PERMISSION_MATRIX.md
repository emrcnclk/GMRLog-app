# Moderation Permission Matrix

**Document:** `docs/05_SECURITY/MODERATION_PERMISSION_MATRIX.md`  
**Status:** **Frozen — Moderation Platform Freeze v1.0** (Sprint 12.0)  
**AuthN:** Bearer JWT  
**AuthZ model:** Public users report; staff moderate; own-only appeals; no anonymous T&S

---

## Roles

| Role | Runtime mapping |
|------|-----------------|
| `ANON` | Unauthenticated |
| `USER` | Authenticated `PlatformRole=USER` (and other non-staff roles acting as community) |
| `REPORTER` | Same principal as USER when performing report ops (capability, not separate JWT role) |
| `MODERATOR` | `PlatformRole=MODERATOR` |
| `SENIOR_MODERATOR` | **Process title only** — same JWT as `MODERATOR` in V1 (no new enum) |
| `ADMIN` | `PlatformRole=ADMIN` |
| `SYSTEM` | Internal workers / future jobs (no public HTTP) |

Guards today: `JwtAuthGuard` + `RolesGuard` with `@Roles('ADMIN','MODERATOR')` for staff routes.

---

## Community reporting

| Action / operationId | ANON | USER / REPORTER | MODERATOR | ADMIN | SYSTEM |
|----------------------|------|-----------------|-----------|-------|--------|
| `reportReview` | — | ✅ | ✅ | ✅ | — |
| `reportMessage` | — | ✅ (conversation ACL) | ✅ | ✅ | — |
| `reportContent` (Social) — MVP types only | — | ✅ | ✅ | ✅ | — |
| `reportList` | — | **Deferred** (no enum) | — | — | — |
| Report own content | — | — | — | — | — |
| Report duplicate OPEN same entity | — | — (409/conflict) | — | — | — |

Rate limiting: mandatory for reporters (platform edge / API gateway).

---

## Staff reports & queue (`ADMIN_API`)

| Action / operationId | ANON | USER | MODERATOR / SENIOR_MOD | ADMIN | SYSTEM |
|----------------------|------|------|------------------------|-------|--------|
| `adminListReports` | — | — | ✅ | ✅ | — |
| `adminUpdateReport` | — | — | ✅ | ✅ | — |
| `adminListModerationQueue` | — | — | ✅ | ✅ | — |
| `adminGetModerationItem` | — | — | ✅ | ✅ | — |
| `adminResolveModerationItem` | — | — | ✅ | ✅ | — |
| Assign / escalate queue (fields on item) | — | — | ✅ | ✅ | — |
| `adminGetModerationStats` | — | — | Deferred | Deferred | — |
| `adminBatchScanModeration` | — | — | — | Phase 2 | Phase 2 |

---

## Resolve actions

| Resolve action | MODERATOR / SENIOR_MOD | ADMIN | Notes |
|----------------|------------------------|-------|-------|
| `APPROVE` | ✅ | ✅ | May restore content via domain port |
| `REJECT` | ✅ | ✅ | Hide via domain port |
| `EDIT_APPROVE` | ✅ | ✅ | Domain edit port when supported |
| `WARN` | ✅ | ✅ | Users `strikeCount++` |
| `SUSPEND` | ✅ | ✅ | Users `isSuspended=true` |
| `BAN` | ✅ (allowed) | ✅ | Prefer ADMIN for irreversible policy; both roles permitted in V1 **with mandatory audit** |

Controllers must not embed extra AuthZ beyond roles + passing `user.sub` as actor.

---

## User sanctions via Admin Users (adjacent)

| Action / operationId | MODERATOR | ADMIN |
|----------------------|-----------|-------|
| `adminGetUser` (moderation view) | ✅ | ✅ |
| `adminUpdateUser` (warn/suspend/ban fields) | ✅ | ✅ |
| `adminUpdateUserRoles` | — | ✅ |
| `adminRevokeUserSessions` | ✅ (after ban preferred) | ✅ |

These ops are **Users/Admin** surfaces that Moderation resolve may call via ports — Moderation does not own Users.

---

## Appeals (Sprint 12.3 — after OpenAPI change-control)

| Action | ANON | USER (subject) | MODERATOR | ADMIN |
|--------|------|----------------|-----------|-------|
| Create appeal (own sanction / linked report) | — | ✅ | — | — |
| List own appeals | — | ✅ | — | — |
| List all appeals | — | — | ✅ | ✅ |
| Resolve appeal | — | — | ✅ | ✅ |
| Read another user’s appeals | — | — | ✅ | ✅ |

Until OpenAPI exists: **do not implement HTTP**; permissions above are frozen for when change-control unlocks paths.

---

## Audit

| Action / operationId | MODERATOR | ADMIN |
|----------------------|-----------|-------|
| Append audit on resolve/hide/sanction | system | system |
| `adminListAuditLog` | ✅ | ✅ |
| `adminExportAuditLog` | — / policy | ✅ |

End users never read raw `AuditLog` via public APIs in V1.

---

## AI / Phase 2

| Action | All community | Staff |
|--------|---------------|-------|
| `moderateContent` / batch AI scan | — | Phase 2 Admin/SYSTEM only |

---

## Explicit denials

| Action | Rule |
|--------|------|
| Anonymous report / queue / audit | Forbidden |
| Cross-user appeal access | Forbidden → 404 |
| Reporter reading other reporters’ identities on public APIs | Forbidden |
| Moderation writing Notification rows as SoT | Forbidden |
| Casual schema invent for LIST/USER enums | Forbidden |

---

## Controllers

Thin controllers: validate DTO, apply guards, pass `actorId`. Policy lives in Moderation services + domain ports.
