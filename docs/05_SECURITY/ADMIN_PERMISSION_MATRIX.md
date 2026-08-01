# Admin Permission Matrix

**Document:** `docs/05_SECURITY/ADMIN_PERMISSION_MATRIX.md`  
**Status:** **Frozen — Admin Platform Freeze v1.0** (Sprint 13.0)  
**AuthN:** Bearer JWT (same Auth issuer; Admin shell on separate subdomain guidance)  
**AuthZ model:** Staff-only Admin Platform; JWT SoT = `PlatformRole`

---

## Roles

| Role | Runtime mapping |
|------|-----------------|
| `ANON` | Unauthenticated |
| `USER` | Authenticated non-staff |
| `MODERATOR` | `PlatformRole=MODERATOR` |
| `SENIOR_MODERATOR` | Process title — same JWT as `MODERATOR` |
| `ADMIN` | `PlatformRole=ADMIN` |
| `SYSTEM` | Internal workers (no public Admin UI) |

Guards: `JwtAuthGuard` + `RolesGuard` with `@Roles('ADMIN','MODERATOR')` unless row says Admin-only.

**`UserAdminRole` / `AdminRole`:** must not grant access independently of `PlatformRole` in V1.

---

## Admin shell

| Action | ANON | USER | MODERATOR | ADMIN |
|--------|------|------|-----------|-------|
| Open `apps/admin` | — | — | ✅ | ✅ |
| Player app as Admin host | — | — | — | — (guidance: separate profile/subdomain) |

---

## Dashboard / monitoring

| Action / operationId | MODERATOR | ADMIN | Phase |
|----------------------|-----------|-------|-------|
| Dashboard home (nav links) | ✅ | ✅ | MVP |
| `adminGetModerationStats` | ✅ | ✅ | Phase 2 |
| `adminGetAnalyticsDashboard` | — / limited | ✅ | Phase 3 |
| Jobs list / retry | — | ✅ | Phase 2 |

---

## User management (`ADMIN_API`)

| Action / operationId | MODERATOR | ADMIN | Phase |
|----------------------|-----------|-------|-------|
| `adminListUsers` | ✅ | ✅ | MVP |
| `adminGetUser` | ✅ | ✅ | MVP |
| `adminUpdateUser` (warn / suspend / ban fields + safe admin fields) | ✅ | ✅ | MVP |
| `adminUpdateUserRoles` | — | ✅ | MVP |
| `adminRevokeUserSessions` | ✅ | ✅ | MVP |
| Force password reset | — | ✅ | Phase 2 |
| GDPR export / Premium grant | — | ✅ | Phase 3 / Enterprise |

Sanction field updates **must** call Users ports so Moderation/Users events and audit remain correct.

---

## Roles & permissions administration

| Action | MODERATOR | ADMIN |
|--------|-----------|-------|
| Assign/remove `MODERATOR` / `ADMIN` PlatformRole | — | ✅ |
| Elevate self beyond current role | — | — |
| Use `UserAdminRole` without PlatformRole sync | — | — (forbidden) |

---

## Audit

| Action / operationId | MODERATOR | ADMIN | Phase |
|----------------------|-----------|-------|-------|
| `adminListAuditLog` | ✅ (own actions filter optional later) | ✅ | MVP |
| `adminExportAuditLog` | — | ✅ | MVP (rate-limited) |

---

## Compose — Moderation / Reports / Reviews (existing Module 12)

Permissions remain governed by [`MODERATION_PERMISSION_MATRIX.md`](./MODERATION_PERMISSION_MATRIX.md). Summary for Admin UI:

| Action | MODERATOR | ADMIN |
|--------|-----------|-------|
| List/update reports | ✅ | ✅ |
| Queue list/detail/claim/assign/escalate/resolve | ✅ | ✅ |
| Appeals staff resolve | ✅ | ✅ |
| Review hide/restore | ✅ | ✅ |
| BAN on resolve | ✅ (mandatory audit) | ✅ |

Admin Platform must **not** loosen or tighten these in a second matrix without Freeze amendment.

---

## Compose — Games catalog (runtime)

| Action | MODERATOR | ADMIN | Phase |
|--------|-----------|-------|-------|
| Catalog create/update/archive/restore/media/taxonomies | ✅ | ✅ | MVP compose |
| Provider import | ✅ | ✅ | MVP compose |

OpenAPI registration is hygiene — permissions above match current Nest `@Roles('ADMIN','MODERATOR')`.

---

## Configuration (not MVP)

| Action / operationId | MODERATOR | ADMIN | Phase |
|----------------------|-----------|-------|-------|
| CMS list/create/update/publish/archive | — | ✅ | Phase 2 |
| `adminListFeatureFlags` / `adminUpdateFeatureFlag` | — | ✅ | Phase 2 |
| System Settings | — | ✅ | Phase 3 |
| `adminBatchScanModeration` | — | ✅ | AI |
| `adminDeletePost` | ✅ / policy | ✅ | Phase 2 (Feed ownership) |

---

## Notification / Search admin

| Action | All roles | Phase |
|--------|-----------|-------|
| Invent Notification Admin SoT | — | Forbidden in V1 |
| Invent Search Admin SoT | — | Forbidden in V1 |
| Future ops via domain ports | ADMIN preferred | Phase 3 |

---

## Rate limiting

- Mandatory for audit export and bulk user search (edge / gateway / Nest throttler).  
- Platform concern; Admin must not skip.

---

## Explicit bans

1. Privilege escalation via `UserAdminRole` without `PlatformRole`.  
2. Moderator assigning Admin role.  
3. Anonymous Admin API access.  
4. Admin writing Notification/Search aggregates directly.  
5. Skipping audit on BAN / role change / session revoke.
