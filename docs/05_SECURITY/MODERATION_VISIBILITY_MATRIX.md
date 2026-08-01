# Moderation Visibility Matrix

**Document:** `docs/05_SECURITY/MODERATION_VISIBILITY_MATRIX.md`  
**Status:** **Frozen — Moderation Platform Freeze v1.0** (Sprint 12.0)

---

## Visibility classes

| Class | Meaning |
|-------|---------|
| Public | Normal product GET after domain ACL |
| Staff-only | MODERATOR/ADMIN only |
| Own-only | Principal must match resource owner |
| Suppressed | Omitted / redacted |
| Hidden | Soft-deleted (`deletedAt`) — public 404 |

---

## 404 vs 403 (normative)

| Situation | Status | Rationale |
|-----------|--------|-----------|
| Target entity missing or not visible to reporter | **404** | Match domain GET; reduce existence oracle |
| Report id not found / not staff | **404** | Do not confirm report ids to non-staff |
| Appeal not owned by caller (user) | **404** | Same as Notification recipient pattern |
| Authenticated staff without role | **403** | Role insufficient |
| Authenticated user hitting staff queue routes | **403** | Not moderator |
| Self-report attempted | **403** or validation **400** | Policy deny (prefer 403 if authenticated) |
| Duplicate OPEN report | **409** / conflict problem+json | Already used in runtime patterns |

---

## Hidden / deleted content

| Audience | Behavior |
|----------|----------|
| Public / normal USER | Soft-deleted content → **404** on domain GET |
| Reporter | May create report before hide; after hide still **404** on public GET |
| Staff queue detail | May show **redacted preview** (ids, reason, truncated text) — never dump full private DM threads without Comm ACL rules |
| Search / Discover | Already suppress deleted / suspended authors (Search Freeze) |

Hide ≡ soft-delete. Restore clears `deletedAt` via domain port.

---

## Reports

| Audience | Visible |
|----------|---------|
| Reporter | Create response only (id/status/createdAt); optional “my reports” later — not required in 12.1 |
| Other users | Never |
| Staff | Full admin report list/detail including reason, entity refs, resolution |
| ANON | Never |

Reporter identities are **staff-only** on admin surfaces.

---

## Appeals

| Audience | Visible |
|----------|---------|
| Appealing user | Own appeals only |
| Other users | Never (404) |
| Staff | Appeal + linked report context |
| ANON | Never |

---

## Audit

| Audience | Visible |
|----------|---------|
| Staff (`adminListAuditLog` / export) | Yes (Admin export may be Admin-only) |
| End users | Never |
| Public | Never |

Audit is append-only evidence — not a product feed.

---

## Suspended users

| Surface | Rule |
|---------|------|
| Auth login / refresh | Blocked (existing Auth) |
| Public profile | Hidden / unavailable per Users rules |
| Search user results | Suppressed (Search Freeze) |
| Ability to file reports | Blocked if cannot authenticate |
| Existing open reports against them | Remain for staff |

---

## Banned users

| Surface | Rule |
|---------|------|
| Auth | Blocked |
| Stronger than suspend | Treated as permanent until Admin lift |
| Content | Prefer hidden when BAN resolve applied |
| Appeals | May file appeal if product allows authenticated restricted state — **Freeze:** ban implies no normal session; appeals for bans require Admin/session policy defined in 12.3 kickoff (default: appeal before session fully revoked or via support Admin path) |

---

## Blocked users

| Rule |
|------|
| Block does **not** prevent reporting the other party. |
| Report APIs must **not** expose block-graph details. |
| Staff may see both parties’ ids on admin report detail. |

---

## Moderator-only data

| Data | Visibility |
|------|------------|
| Queue list/detail | Staff |
| Internal notes (`ModeratorNote`) | Staff (when productized) |
| Resolve reason codes / internalNote | Staff |
| Redacted content previews | Staff |
| AI scores | Phase 2 only |

---

## Spoiler / legitimate critique

Moderation must not treat unmarked-spoiler UX as automatic BAN. Spoiler flagging remains Reviews product (`SpoilerService`). Report reason `spoiler` enters human queue like other reasons.

---

## Discover / Search interaction

Moderation does not own SERP. After suspend/ban/hide, Search/Users/Reviews rules suppress content on next read — no Moderation search index.
