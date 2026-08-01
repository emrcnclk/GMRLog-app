# D2.3 Completion Report — Library Domain Foundation

**Status:** LOCKED
**Completed:** 2026-07-26
**Scope:** Library domain only — D2.4 was not started.

---

## 1. Files created / modified

### Backend — `apps/backend/src/library/` (new domain)

| File | Role |
| --- | --- |
| `library.module.ts` | Domain module — binds LibraryEntry / GameLog / Game repositories |
| `library.tokens.ts` | DI tokens |
| `library.service.ts` | Domain service — uniqueness, status lifecycle, GameLog foundation |
| `library.controller.ts` | S1 §13.9 surfaces |
| `dto/library.dto.ts` | Zod-backed upsert / query / path DTOs |
| `mappers/library.mapper.ts` | Persistence → S1 §15.7 / hub projections |
| `testing/fake-repositories.ts` | In-memory fakes (build-excluded) |
| `library.service.spec.ts` · `library.controller.spec.ts` | Domain tests |

### Packages

| File | Change |
| --- | --- |
| `packages/database/.../game-log.repository.ts` | New `GameLogRepository` (`create` / `listByLibraryEntry` / `deleteByLibraryEntry`) |
| `packages/database/.../library-entry.repository.ts` | `listByUser(filter)` · `countByUserGroupedByStatus` |
| `packages/database/.../game.repository.ts` | `findManyByIds` for shelf projections |
| `packages/database/.../repositories.spec.ts` | Status filter · hub counts · GameLog cascade |
| `packages/types/src/index.ts` | `LibraryEntryResponse` · `LibraryHubResponse` · `LibraryGameSummary` · status/source/log kinds |
| `packages/validators/src/index.ts` | `libraryEntryUpsertSchema` (§14.9) · `libraryEntriesQuerySchema` (`filter[status]`) · path param |

### Cross-cutting

- `apps/backend/src/auth/player-id.ts` — `playerIdOf` moved out of users so Library/User share identity narrowing without domain coupling
- `app.module.ts` — mounts `LibraryModule`

## 2. Endpoints implemented (S1 dialect)

| Method | Path | S1 source | Notes |
| --- | --- | --- | --- |
| GET | `/library` | §13.9 | Hub summary — counts per closed `LibraryStatus` + total |
| GET | `/library/entries` | §13.9 | Shelf list; optional `filter[status]` |
| GET | `/library/entries/{gameId}` | §13.9 | Single relationship |
| PUT | `/library/entries/{gameId}` | §13.9 / §14.9 | Upsert status/log |
| DELETE | `/library/entries/{gameId}` | §13.9 | Hard delete · 204 |

**Not implemented (forbidden / deferred):** `POST/GET /import-jobs*` — Steam sync and import domain.

## 3. Library architecture

Controllers → `LibraryService` → repository interfaces (`LibraryEntry` · `GameLog` · `Game`) → Prisma. No Prisma in controllers/services. All routes use `JwtAuthGuard` + `CurrentUser`; guests receive S1 `authn`/`UNAUTHENTICATED`. Catalog `Game` is read for projections and existence checks — Library never owns Game writes.

## 4. Status lifecycle

Closed vocabulary only: `owned` · `playing` · `completed` · `wishlist` · `backlog` · `hidden`.

| Event | Behavior |
| --- | --- |
| Create (PUT, no row) | One `(userId, gameId)` row · `source = manual` (client `steam_import` overridden) · append `GameLog.status_change` · optional `note` log |
| Update status | Any closed status allowed (no invented transition graph in F5/S2) · bump `version` · append `status_change` when status differs |
| Update note | Persist note · append `GameLog.note` when a non-empty note is set/changed |
| Preserve authorship | Existing `steam_import` source is never rewritten by player PUT (S1 §15.3) |
| Delete | Hard delete · GameLog cascades (S2 §13). Soft-delete not defined for LibraryEntry |

**Favorite / visibility:** not on `LibraryEntry` in S2/S1 §14.9 — not invented; deferred.

**GameLog `session`:** constitutional kind exists; play-session engine deferred (forbidden in D2.3).

## 5. Validation summary

- Single source: `@gmrlog/validators` — `libraryEntryUpsertSchema` (`.strict()`), closed status/source enums, `filter[status]` preprocess for Fastify flat bracket keys.
- No duplicated schemas; DTOs use existing `createZodDto` + global pipe.
- Unknown status / non-allowlisted fields (e.g. `favorite`) → S1 `validation` envelope.

## 6. Test summary

- **Unit (`library.service.spec.ts`)** — hub zeros/aggregates · create/update uniqueness · manual source override · steam_import preservation · status_change/note logs · filter · 404s · hard delete
- **Controller (`library.controller.spec.ts`)** — Nest+Fastify pipeline: guest 401 · envelope · upsert · validation · not_found · `filter[status]` · 204 delete
- **Repository** — status filter · grouped counts · GameLog cascade on entry delete
- Workspace: backend 59/59 · database green · all packages green

## 7. Verification

`pnpm build` ✅ · `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ · `pnpm format:check` ✅

## 8. Deferred to D2.4+

- Steam library import / `import-jobs` / sync
- GameLog `session` play-session engine · statistics · streaks · achievements
- Favorite / visibility (requires S1/S2 amendment — not on LibraryEntry today)
- Cover URL resolution (uploads foundation)
- Platform existence validation beyond FK
- Collections / tier-list indexes under Library tab
- Reviews / feed / discovery / search (forbidden domains)

---

## Lock statement

All acceptance criteria pass: one LibraryEntry per `(user, game)`, repository pattern respected, S1 dialect and F6.3 layering intact, closed status vocabulary only. **D2.3 is LOCKED.** D2.4 was not started.
