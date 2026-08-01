# D2.8 Completion Report — Collection Domain Foundation

**Status:** LOCKED  
**Completed:** 2026-07-26  
**Scope:** Collection domain only — D2.9 was not started.

---

## Dialect note

The sprint brief listed incremental entry routes:

- `POST /collections/{id}/entries`
- `DELETE /collections/{id}/entries/{gameId}`

**S1 §13.8** (LOCKED) defines only:

- `PUT /collections/{id}/entries` — replace/reorder (`CollectionEntriesPutRequest`)

Per “never invent endpoints / S1 wins”, **PUT replace** was implemented. Incremental POST/DELETE entry routes were not added.

`GET /collections` is **P only** (own index; optional `ownerId` for another player’s **public** collections). Guests may only `GET /collections/{id}` when visibility allows.

---

## 1. Files created

### Backend — `apps/backend/src/collections/`

| File | Role |
| --- | --- |
| `collections.module.ts` | Domain module |
| `collections.tokens.ts` | DI tokens |
| `collections.service.ts` | CRUD · soft-delete · list · visibility |
| `collection-entries.service.ts` | PUT replace/reorder · duplicate/game checks |
| `collections.controller.ts` | Collection resource |
| `collection-entries.controller.ts` | `PUT /collections/{id}/entries` |
| `dto/collection.dto.ts` | Zod DTOs |
| `mappers/collection.mapper.ts` | → `CollectionResponse` · visibility gate |
| `testing/fake-repositories.ts` | Test fakes |
| `collections.service.spec.ts` · `collections.controller.spec.ts` | Tests |

### Packages

| File | Change |
| --- | --- |
| `packages/database/.../collection.repository.ts` | New |
| `packages/database/.../collection-entry.repository.ts` | New (`replaceEntries` transaction) |
| `packages/database/.../repositories.spec.ts` | Soft-delete · public list · replace order |
| `packages/types/src/index.ts` | `CollectionResponse` · `CollectionEntryResponse` |
| `packages/validators/src/index.ts` | create/patch/query/entries-put schemas |

`app.module.ts` mounts `CollectionsModule`.

---

## 2. Endpoint summary

| Method | Path | Auth | Behavior |
| --- | --- | --- | --- |
| GET | `/collections` | P | Own index; `?ownerId=` → public-only for others |
| POST | `/collections` | P | Create · default `visibility=public` |
| GET | `/collections/{id}` | P\|G | Soft-gate · visibility filtered |
| PATCH | `/collections/{id}` | P | Owner only · version++ |
| DELETE | `/collections/{id}` | P | Soft-delete · 204 |
| PUT | `/collections/{id}/entries` | P | Replace/reorder · owner only |

---

## 3. Repository summary

**CollectionRepository:** `create` · `findById` · `findActiveById` · `listByOwner` · `listPublicByOwner` · `update` · `softDelete` · `delete`

**CollectionEntryRepository:** `create` · `findById` · `findEntry` · `listByCollection` · `addEntry` · `removeEntry` · `replaceEntries` · `delete`

Persistence only. Soft-deleted collections excluded from active lookups/lists. Entry order = `position` ascending.

---

## 4. Service summary

**CollectionsService:** create/update/soft-delete · own vs public-by-owner lists · ownership · visibility (`followers` fail-closed)

**CollectionEntriesService:** full replace via PUT · unique `gameId` → 409 · missing game → 404 · preserves array order as `position`

No feed · recommendation · collaboration · share links · notifications · websocket · Tier Lists.

---

## 5. Validation summary

`@gmrlog/validators`:

- `title`: trimmed · non-empty · max 100
- `description`: trimmed · max 2000 · nullable
- `visibility`: `public` \| `followers` \| `private`
- `entries[]`: `{ gameId, note? }` · note max 2000
- `.strict()` — unknown fields rejected

---

## 6. Test summary

- Repository: soft-delete · listPublicByOwner · replace order · findEntry · removeEntry
- Service: create · public list for other owner · visibility · ownership · duplicate/missing game
- Controller: guest 401 · envelope/`requestId` · validation · 403 · 204 · PUT 409/404
- Backend coverage increased — **129/129** tests

---

## 7. Verification

`pnpm build` ✅ · `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ · `pnpm format:check` ✅

---

## 8. Deferred (D2.9+)

- Incremental `POST`/`DELETE` entry routes (not in S1 — require amendment)
- Follow-aware `followers` visibility
- Collaboration · sharing links · likes · comments on collections
- Recommendation / Similar Collections
- Search · pagination redesign · analytics · feed · notifications · websocket
- Tier Lists domain

---

## Lock statement

**D2.8 is LOCKED.**  
**D2.9 was not started.**
