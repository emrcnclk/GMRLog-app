# D2.4 Completion Report — Review Domain Foundation

**Status:** LOCKED
**Completed:** 2026-07-26
**Scope:** Review domain only — D2.5 was not started.

---

## 1. Files created / modified

### Backend — `apps/backend/src/reviews/` (new domain)

| File | Role |
| --- | --- |
| `reviews.module.ts` | Domain module — binds Review / Game / User repositories |
| `reviews.tokens.ts` | DI tokens |
| `reviews.service.ts` | Domain service — CRUD, uniqueness, visibility, spoilers |
| `reviews.controller.ts` | `GET/POST/PATCH/DELETE /reviews` |
| `game-reviews.controller.ts` | `GET /games/{id}/reviews` |
| `dto/review.dto.ts` | Zod-backed create / patch / path DTOs |
| `mappers/review.mapper.ts` | Persistence → S1 §15.4 · visibility gate |
| `testing/fake-repositories.ts` | In-memory fakes (build-excluded) |
| `reviews.service.spec.ts` · `reviews.controller.spec.ts` | Domain tests |

### Packages

| File | Change |
| --- | --- |
| `packages/database/.../review.repository.ts` | `findActiveById` · `findActiveByAuthorAndGame` |
| `packages/database/.../user.repository.ts` | `findManyByIds` for author projections |
| `packages/database/.../repositories.spec.ts` | Active lookup / soft-delete coverage |
| `packages/types/src/index.ts` | `ReviewResponse` · `UserPublicResponse` · `ContentVisibilityValue` |
| `packages/validators/src/index.ts` | `reviewCreateSchema` · `reviewPatchSchema` · rating 1–10 · visibility |

### Cross-cutting

- `app.module.ts` — mounts `ReviewsModule`
- `users/testing/fake-repositories.ts` — `findManyByIds` for updated `UserRepository` contract

## 2. Endpoints implemented (S1 dialect)

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/reviews/{id}` | P\|G | Soft-gate · visibility filtered |
| POST | `/reviews` | P | Create · 201 |
| PATCH | `/reviews/{id}` | P | Author only |
| DELETE | `/reviews/{id}` | P | Soft-delete · 204 |
| GET | `/games/{id}/reviews` | P\|G | Soft-gate · visibility filtered |

**Not implemented (forbidden):** comments, reactions, likes, moderation, reports, feed.

## 3. Review architecture

Controllers → `ReviewsService` → repository interfaces (`Review` · `Game` · `User`) → Prisma. No Prisma in controllers/services. Writes use `JwtAuthGuard`; soft-gate reads use `OptionalGuestGuard`. Author-only mutations return S1 `authz`/`FORBIDDEN`; missing or invisible reviews return `not_found` (no existence leak for private rows).

## 4. Rating model

- Persistence: S2 `Review.rating` as `Int`
- Closed product scale: **integer 1–10** (`REVIEW_RATING_MIN` / `MAX` in `@gmrlog/validators`)
- Source: fits Int + product-documented 1–10 bound (`docs/01_PRODUCT/RECOMMENDATION_ENGINE.md`); half-star / weighted / recommendation scores not invented
- Out-of-range values → S1 `validation` envelope

## 5. Spoiler behavior

- Field: `containsSpoilers` (default `false` on create)
- Persist + return on API only — no spoiler filtering engine, no blur rendering
- Author may toggle via PATCH

## 6. Validation summary

- Single source: `@gmrlog/validators` — create (§14.7) · patch allowlist · path params · `ContentVisibility` enum
- `.strict()` objects; no controller-side business validation
- Visibility optional on create (domain default `public`); editable on patch

## 7. Test summary

- **Unit** — create defaults · (author, game) uniqueness · re-create after soft-delete · spoiler persistence · private/followers fail-closed · author-only update/delete · game list filtering
- **Controller** — Nest+Fastify: guest 401 on write · 201 create · rating validation · 409 conflict · guest public read · author patch · 403 other · 204 soft-delete
- **Repository** — active-by-id / active-by-author-game · soft-delete exclusion from lists
- Workspace: backend 79/79 · all packages green

## 8. Verification

`pnpm build` ✅ · `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ · `pnpm format:check` ✅

## 9. Deferred to D2.5+

- Comments / comment threads on reviews
- Reactions · likes · `reactionSummary` · `viewerState`
- Follow-aware `followers` visibility (currently author-only fail-closed)
- Partial unique index `(authorId, gameId) WHERE deletedAt IS NULL` (S2 §11 does not list it; uniqueness enforced in domain)
- Idempotency-Key replay for POST
- Moderation / reports / ranking / trending / search
- Avatar/cover URL resolution (uploads foundation)

---

## Lock statement

All acceptance criteria pass: one active review per `(user, game)`, soft-delete per S2, repository pattern and S1 dialect intact, spoiler flag persistence-only. **D2.4 is LOCKED.** D2.5 was not started.
