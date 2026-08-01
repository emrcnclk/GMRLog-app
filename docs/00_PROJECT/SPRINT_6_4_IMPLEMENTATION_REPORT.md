# GMRLOG Sprint 6.4 — Collection Collaboration Implementation Report

**Sprint:** 6.4 — Collection Collaboration  
**Date:** 2026-07-16  
**Status:** **COMPLETE — Awaiting review**  
**Contracts:** `COLLECTION_API.yaml` + Database Freeze v1.0.3 + ADR-0007  

**Out of scope:** accept/decline invitation (not in OpenAPI), ownership transfer (not documented), comments, export/duplicate, statistics/activity, Lists, messaging, notifications (direct)

---

## Database Freeze decision

`CollectionMember` **already exists** under Freeze:

* Roles: `OWNER` | `EDITOR` | `VIEWER`
* Unique `(collectionId, userId)`
* No invitation status / pending state

**No migration added.** Collaboration is modeled with the existing table.

---

## Implemented endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/collections/{id}/members` | JWT | Owner or member; includes synthetic OWNER |
| POST | `/collections/{id}/members` | JWT | Invite → `201` empty; roles EDITOR\|VIEWER |
| PATCH | `/collections/{id}/members/{userId}` | JWT | Update role → `CollectionMember` |
| DELETE | `/collections/{id}/members/{userId}` | JWT | Remove → `204` |

No accept/decline/transfer endpoints in OpenAPI — none implemented.

---

## Architecture

```text
CollectionsController
        │
        └── CollectionCollaborationService
               ├── CollectionPermissionService
               ├── CollectionMemberRepository
               ├── CollectionMemberQueryRepository
               ├── CollectionCacheService
               ├── SocialGraphService (block)
               └── DomainEventPublisher
```

Permission checks also wired into:

* `CollectionService.update` — EDITOR may edit metadata; visibility/slug → OWNER only; delete → OWNER
* `CollectionItemService` add/remove — OWNER or EDITOR
* `CollectionVisibilityService` — members may view regardless of visibility

---

## Permission model

| Role | Capabilities |
|------|----------------|
| OWNER | Full control, manage members, delete collection |
| EDITOR | Modify collection (name/description/collaborative), manage items |
| VIEWER | Read (via membership visibility bypass) |

Rules:

* Owner unique (`collections.user_id`); OWNER member row created on collection create
* Owner cannot remove/demote themselves
* Invite cannot target owner
* Duplicate invite → `409 COLLECTION_MEMBER_EXISTS`
* Block relationship blocks invite

---

## OpenAPI ↔ Freeze gap: `ADMIN`

OpenAPI `UpdateCollectionMemberRequest` / `CollectionMember.role` include **ADMIN**.  
Prisma enum has **no ADMIN**.

**Decision:** reject `ADMIN` with `400 VALIDATION_FAILED` (do not invent Freeze role). Documented as OpenAPI modeling issue for next revision.

Invite roles remain EDITOR | VIEWER only (matches both OpenAPI invite + Freeze).

---

## Cache

| Key | Behavior |
|-----|----------|
| `collectionMembers:{collectionId}` | Member list page |
| `collection:{id}` / `userCollections:{userId}` | Invalidated on invite/remove/role change |

---

## Events

| Event | When |
|-------|------|
| `collection.member.invited.v1` | After invite |
| `collection.member.role.updated.v1` | After role patch |
| `collection.member.removed.v1` | After remove |

`collection.owner.transferred.v1` — **not emitted** (no transfer endpoint).  
No direct Notification / Feed calls.

---

## Security

* JWT on all member endpoints  
* Owner-only member management  
* Block check on invite  
* ProblemDetails for not found / forbidden / conflict / validation  

---

## Performance

* Member list: one query with user profile include (batched)  
* OpenAPI `CollectionMemberPage` is CursorPage but GET members has **no cursor params** — returns full list, `hasNext: false`

---

## Known limitations

1. **ADMIN role** — OpenAPI-only; rejected.  
2. **No pending invitations** — invite creates membership immediately (no Freeze invite state).  
3. **No accept/decline / transfer** — not in COLLECTION_API.  
4. **Member list pagination params** — schema is CursorPage but operation has no cursor/limit.  
5. Sprint 6.5+ (comments/export/etc.) not started.

---

## Test summary

| Suite | Coverage | Result |
|-------|----------|--------|
| Unit permission / collaboration / visibility | invite, duplicate, ADMIN reject, owner protect, EDITOR items | ✅ |
| Integration | invite → collaborative, list, role update, remove, cache, events | ✅ |
| Collections suite | 42 unit+integration | ✅ |
| E2E | invite, PRIVATE member view, 403/409/400, owner protect, remove | ✅ |

### Verification (2026-07-16)

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| `typecheck` / `build` | ✅ |
| eslint `src/collections/**` | ✅ |
| unit + integration | 42/42 |
| e2e collaboration | 1/1 |

**Do not begin Sprint 6.5 until reviewed.**
