# D2.5 Completion Report — Comment Domain Foundation

**Status:** LOCKED
**Completed:** 2026-07-26
**Scope:** Comment domain only — D2.6 was not started.

---

## Dialect note

The sprint brief listed flat `/comments` query/PATCH routes and forbade nested paths. **S1 §13.7** (LOCKED) defines:

- `GET /posts/{id}/comments`
- `GET /reviews/{id}/comments`
- `POST /comments`
- `DELETE /comments/{id}`

S1 uses `hostType` / `hostId` (not `targetType` / `targetId`). No `GET /comments/{id}` and no `PATCH /comments/{id}` exist in S1. Per “never invent endpoints / never modify API dialect”, **S1 paths and field names were implemented**.

---

## 1. Files created

### Backend — `apps/backend/src/comments/`

| File | Role |
| --- | --- |
| `comments.module.ts` | Domain module |
| `comments.tokens.ts` | DI tokens |
| `comments.service.ts` | Create · list · soft-delete · reply attach |
| `comments.controller.ts` | `POST /comments` · `DELETE /comments/{id}` |
| `post-comments.controller.ts` | `GET /posts/{id}/comments` |
| `review-comments.controller.ts` | `GET /reviews/{id}/comments` |
| `dto/comment.dto.ts` | Zod DTOs |
| `mappers/comment.mapper.ts` | → `CommentResponse` |
| `testing/fake-repositories.ts` | Test fakes |
| `comments.service.spec.ts` · `comments.controller.spec.ts` | Tests |

### Packages

| File | Change |
| --- | --- |
| `packages/database/.../comment.repository.ts` | `findActiveById` · `listReplies` (+ existing CRUD/listByHost) |
| `packages/database/.../post.repository.ts` | `findActiveById` |
| `packages/database/.../repositories.spec.ts` | Soft-delete · replies · ordering |
| `packages/types/src/index.ts` | `CommentResponse` · `CommentHostTypeValue` |
| `packages/validators/src/index.ts` | `commentCreateSchema` · host enum · trimmed body |

`app.module.ts` mounts `CommentsModule`.

## 2. Endpoint summary

| Method | Path | Auth | Behavior |
| --- | --- | --- | --- |
| GET | `/posts/{id}/comments` | P\|G | Flat active comments · creation order |
| GET | `/reviews/{id}/comments` | P\|G | Flat active comments · creation order |
| POST | `/comments` | P | Create root or reply (`parentCommentId`) |
| DELETE | `/comments/{id}` | P | Soft-delete · author only · 204 |

## 3. Repository summary

`CommentRepository`: `create` · `findById` · `findActiveById` · `listByHost` · `listReplies` · `update` · `softDelete` · `delete`. Host listings and replies exclude `deletedAt != null`. No business logic in the repository.

## 4. Service summary

`CommentsService`: verifies host exists (active post/review) · attaches replies only when parent is active and same host · soft-deletes without cascading replies · maps via `toCommentResponse`. No notifications / feed / reactions.

## 5. Test summary

- Repository: create · soft-delete exclusion · reply list · creation order
- Service: create · reply · invalid host · cross-host parent · flat list · author delete · non-author forbidden
- Controller: guest 401 · envelope/requestId · trim body · unknown hostType · empty body · nested GET · 403 · 204 hide from list
- Backend **92/92**

## 6. Verification

`pnpm build` ✅ · `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ · `pnpm format:check` ✅

## 7. Deferred (D2.6+)

- `GET /comments/{id}` · `PATCH /comments/{id}` · flat `GET /comments?hostType=&hostId=` (not in S1 — require amendment)
- Comment tree building · max reply depth
- Reactions · likes · mentions · moderation · reports
- Notifications · activity · websocket · feed
- Markdown · attachments · uploads · pin · edit history
- Pagination / sort redesign · search

---

## Lock statement

**D2.5 is LOCKED.** D2.6 was not started.
