# D2.7 Completion Report — Post Domain Foundation

**Status:** LOCKED  
**Completed:** 2026-07-26  
**Scope:** Post domain only — D2.8 was not started.

---

## Dialect note

The sprint brief listed `GET /posts`. **S1 §13.6–13.7** (LOCKED) defines:

- `GET /posts/{id}`
- `POST /posts`
- `PATCH /posts/{id}`
- `DELETE /posts/{id}`
- `GET /games/{id}/posts`

There is **no** flat `GET /posts`. Per “never invent endpoints / S1 wins”, the game-scoped list was implemented instead.

---

## 1. Files created

### Backend — `apps/backend/src/posts/`

| File | Role |
| --- | --- |
| `posts.module.ts` | Domain module |
| `posts.tokens.ts` | DI tokens |
| `posts.service.ts` | Create · update · soft-delete · visibility · ownership |
| `posts.controller.ts` | `GET/POST/PATCH/DELETE /posts[/{id}]` |
| `game-posts.controller.ts` | `GET /games/{id}/posts` |
| `dto/post.dto.ts` | Zod DTOs |
| `mappers/post.mapper.ts` | → `PostResponse` · visibility gate |
| `testing/fake-repositories.ts` | Test fakes |
| `posts.service.spec.ts` · `posts.controller.spec.ts` | Tests |

### Packages

| File | Change |
| --- | --- |
| `packages/database/.../post.repository.ts` | `listByGame` (+ existing soft-delete CRUD) |
| `packages/database/.../repositories.spec.ts` | Soft-delete · author/game lists |
| `packages/types/src/index.ts` | `PostResponse` |
| `packages/validators/src/index.ts` | `postCreateSchema` · `postPatchSchema` · body max 5000 |

`app.module.ts` mounts `PostsModule`. Comment/Reaction test fakes gained `listByGame`.

---

## 2. Endpoint summary

| Method | Path | Auth | Behavior |
| --- | --- | --- | --- |
| GET | `/posts/{id}` | P\|G | Soft-gate · visibility filtered |
| POST | `/posts` | P | Create · default `visibility=public` |
| PATCH | `/posts/{id}` | P | Author only |
| DELETE | `/posts/{id}` | P | Soft-delete · 204 |
| GET | `/games/{id}/posts` | P\|G | Soft-gate · visibility filtered |

---

## 3. Repository summary

`PostRepository`: `create` · `findById` · `findActiveById` · `listByAuthor` · `listByGame` · `update` · `softDelete` · `delete`. Soft-deleted rows excluded from active lookups and lists. No business logic.

---

## 4. Service summary

`PostsService`:

- Optional `gameId` validated against Game catalog
- `communityId` / non-empty `mediaUploadIds` rejected honestly (Communities / Uploads not mounted)
- Visibility gate: `public` open; `followers`/`private` author-only (Follow fail-closed)
- Soft-delete; no comment cascade; no feed/notification/websocket

---

## 5. Validation summary

`@gmrlog/validators`:

- `body`: trimmed · non-empty · max 5000
- `visibility`: `public` \| `followers` \| `private`
- `gameId` / `communityId` / `mediaUploadIds`: OpaqueId allowlist
- `.strict()` — unknown fields rejected

---

## 6. Test summary

- Repository: soft-delete exclusion · listByAuthor · listByGame
- Service: create · deferred community/media · visibility · ownership · soft-delete lists
- Controller: guest 401 · envelope/`requestId` · validation · game list · 403 · 204
- Backend coverage increased — **118/118** tests

---

## 7. Verification

`pnpm build` ✅ · `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ · `pnpm format:check` ✅

---

## 8. Deferred to D2.8+

- Flat `GET /posts` (not in S1 — requires amendment)
- Community association + `community` summary (Communities domain)
- `mediaUploadIds` persistence (Uploads foundation)
- `reactionSummary` / `viewerState`
- Follow-aware `followers` visibility
- Feed · notifications · search · recommendation · moderation · websocket

---

## Lock statement

**D2.7 is LOCKED.**  
**D2.8 was not started.**
