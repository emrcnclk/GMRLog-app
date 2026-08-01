# D2.11 Completion Report — Follow Domain Foundation

**Status:** LOCKED  
**Completed:** 2026-07-26  
**Scope:** User follow relationships only — D2.12 was not started.

---

## Dialect note

The sprint brief listed:

- `POST /users/{id}/follow`
- `DELETE /users/{id}/follow`

**S1 §13.4** (LOCKED) defines:

- `POST /follows` (P) — body `FollowCreateRequest` `{ userId }`
- `DELETE /follows/{userId}` (P)
- `GET /users/{id}/followers` · `GET /users/{id}/following` (P\|G)
- `GET /me/followers` · `GET /me/following` (P) — S1 §13.3

Per “never invent endpoints / S1 wins”, **`POST /follows`** and **`DELETE /follows/{userId}`** were implemented. Nested `/users/{id}/follow` was not added. `/me/followers|following` are S1 surfaces (distinct from the forbidden `/follow/me`).

---

## 1. Files created

### Backend — `apps/backend/src/follows/`

| File | Role |
| --- | --- |
| `follows.module.ts` | Domain module · exports `FOLLOW_REPOSITORY` |
| `follows.tokens.ts` | DI tokens |
| `follows.service.ts` | Follow · unfollow · list followers/following |
| `follows.controller.ts` | `POST /follows` · `DELETE /follows/{userId}` |
| `user-follows.controller.ts` | `GET /users/{id}/followers\|following` |
| `me-follows.controller.ts` | `GET /me/followers\|following` |
| `dto/follow.dto.ts` | Zod DTOs |
| `mappers/follow.mapper.ts` | → `FollowResponse` / `UserPublicResponse` |
| `testing/fake-repositories.ts` | Test fakes |
| `follows.service.spec.ts` · `follows.controller.spec.ts` | Tests |

### Packages

| File | Change |
| --- | --- |
| `packages/database/.../follow.repository.ts` | `create` · `findByPair` · `exists` · `listFollowers` · `listFollowing` · `delete` · `deleteByPair` |
| `packages/database/.../repositories.spec.ts` | Ordering · exists · hard-delete by pair |
| `packages/types/src/index.ts` | `FollowResponse` |
| `packages/validators/src/index.ts` | `followCreateSchema` · path param schemas |

`app.module.ts` mounts `FollowsModule`.

### Visibility integration (updated)

| Domain | Change |
| --- | --- |
| Posts · Reviews · Collections · Tier Lists | Import `FollowsModule`; inject `FOLLOW_REPOSITORY`; `followers` visibility via `exists(viewerId, ownerId)` |
| Mappers | `viewerFollowsAuthor` / `viewerFollowsOwner` gate parameter |

---

## 2. Endpoint summary

| Method | Path | Auth | Behavior |
| --- | --- | --- | --- |
| GET | `/users/{id}/followers` | P\|G | Oldest→newest · `UserPublicResponse[]` |
| GET | `/users/{id}/following` | P\|G | Oldest→newest · `UserPublicResponse[]` |
| GET | `/me/followers` | P | Actor’s followers |
| GET | `/me/following` | P | Actor’s following |
| POST | `/follows` | P | Body `{ userId }` · 201 · envelope |
| DELETE | `/follows/{userId}` | P | Hard delete · 204 |

Guests may read public lists. Writes require authentication.

---

## 3. Repository summary

`FollowRepository` (persistence only):

- `create` · `findByPair` · `exists` · `listFollowers` · `listFollowing` · `delete` · `deleteByPair`
- Lists ordered `createdAt` asc, `id` asc (S2 relation)
- Unfollow = hard delete of the relationship row

---

## 4. Service summary

`FollowsService`:

- Follow · unfollow · list followers · list following
- Self-follow → 400
- Duplicate → 409
- Unknown / soft-deleted user → 404
- Missing unfollow edge → 404
- No suggestions · feed · notifications · blocks · private requests

---

## 5. Visibility integration summary

Replaced fail-closed `followers` placeholders in:

- Posts
- Reviews
- Collections
- Tier Lists

Rule: `public` open; `private` owner/author only; `followers` = owner/author **or** `FollowRepository.exists(viewer, owner)`. Guests never pass `followers`/`private`. Non-followers still receive fail-closed 404 (unchanged envelope behavior).

---

## 6. Validation summary

`@gmrlog/validators`:

- `followCreateSchema` — `{ userId }` opaque id · `.strict()`
- `followUserIdParamSchema` — `DELETE /follows/{userId}`
- `followSubjectUserIdParamSchema` — `/users/{id}/…`

---

## 7. Test summary

- Repository: create · exists · oldest-first lists · hard-delete by pair
- Service: follow · unfollow · duplicate · self · unknown · ordering
- Controller: guest 401 write · list envelope/`requestId` · 201 · 204 · 404 · 409 · 400
- Visibility: Posts · Reviews · Collections · Tier Lists follower resolution
- Backend coverage — **167/167** tests

---

## 8. Verification

`pnpm build` ✅ · `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ · `pnpm format:check` ✅

---

## 9. Deferred (D2.12+)

- Friend system · private follow requests · approvals
- Blocks · mutes
- Recommendations · suggestions · mutual ranking · graph analytics
- Activity feed · notification generation from follow events
- Websocket · ranking · mutual friends

---

## Lock statement

**D2.11 is LOCKED.**  
**D2.12 was not started.**
