# Admin Visibility Matrix

**Document:** `docs/05_SECURITY/ADMIN_VISIBILITY_MATRIX.md`  
**Status:** **Frozen — Admin Platform Freeze v1.0** (Sprint 13.0)

---

## Visibility classes

| Class | Meaning |
|-------|---------|
| Staff-only | `MODERATOR` / `ADMIN` JWT required |
| Admin-only | `ADMIN` only (export, roles, CMS, flags, jobs) |
| Own-staff-filter | Optional later: Moderator sees own audit actions only |
| Suppressed / redacted | PII minimized in list/export |
| Public | **Never** for Admin Platform resources |

Admin Platform is **not** a player-facing surface.

---

## 404 vs 403 (normative)

| Situation | Status | Rationale |
|-----------|--------|-----------|
| ANON hits `/admin/*` or `apps/admin` API | **401** | Unauthenticated |
| Authenticated USER hits staff Admin routes | **403** | Role insufficient |
| MODERATOR hits Admin-only export/roles/CMS/flags | **403** | Role insufficient |
| Admin user id / audit id not found | **404** | Do not leak existence patterns beyond staff |
| Non-staff probing user admin detail | **403** or **404** | Prefer **403** if role missing; **404** if resource lookup after role gate fails existence — match existing Nest pattern consistently per controller |
| Compose Moderation/Reports routes | Follow [`MODERATION_VISIBILITY_MATRIX.md`](./MODERATION_VISIBILITY_MATRIX.md) | Do not fork |

---

## Users admin

| Audience | Visible |
|----------|---------|
| MODERATOR / ADMIN | Staff user list/detail including T&S flags, role, strike/suspend/ban state |
| USER / ANON | Never |
| Email / phone / secrets | Minimize; never refresh tokens; hash/redact where export includes IP |

Private player profile fields may appear on admin detail **only** for staff — still subject to need-to-know and audit.

---

## Audit

| Audience | Visible |
|----------|---------|
| MODERATOR | List (full or own-filter — product choice; default V1 = full staff list OK) |
| ADMIN | List + export |
| End users | Never |
| Public | Never |

Export columns: actor, action, resourceType, resourceId, timestamps, minimized metadata — **no** raw message bodies.

---

## Dashboard

| Audience | Visible |
|----------|---------|
| Staff | Nav links to allowed modules only (hide Admin-only tiles from Moderators) |
| Metrics (Phase 2+) | Aggregate only — no PII in dashboard cards |

---

## Composed T&S / Catalog

| Surface | Visibility owner |
|---------|------------------|
| Queue / appeals / reports | Moderation Visibility Matrix |
| Review hide/restore | Reviews staff rules + soft-delete 404 for public |
| Catalog admin | Staff-only; public catalog remains Games public APIs |

Admin UI must not show Moderators Admin-only configuration tiles (CMS/flags) even if deep-linked — server AuthZ is authoritative.

---

## Feature flags / CMS (Phase 2)

| Audience | Visible |
|----------|---------|
| ADMIN | Full |
| MODERATOR | Never |
| Players | Runtime evaluation only — not Admin list |

---

## Notification / Search

| Audience | Rule |
|----------|------|
| Admin V1 | No Notification/Search admin lists |
| Phase 3 ops | Domain ports + staff AuthZ; never expose other users’ private notification bodies broadly |

---

## Blocked / banned users (as subjects)

| Context | Behavior |
|---------|----------|
| Appear in `adminListUsers` | Yes for staff (ops need) |
| Player-facing Search/SERP | Search Freeze suppression unchanged |
| Subject appealing while sessions revoked | Follow Moderation Visibility / product debt — Admin may still resolve appeals as staff |

---

## Explicit bans

1. Public caching of admin user/audit payloads.  
2. Returning Admin-only fields to Moderators.  
3. Confirming existence of staff resources to non-staff via differentiated timing **when avoidable** — use consistent 401/403.  
4. Dumping full DM / notification content into audit export.
