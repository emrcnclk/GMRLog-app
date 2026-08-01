# D2.15 Completion Report — Search Domain Foundation

**Status:** LOCKED  
**Completed:** 2026-07-27  
**Scope:** Search domain MVP — D2.16 was not started.

---

## Dialect note

S2 §16 documents Meilisearch as a future **projection** (rebuildable, not source of truth). D2.15 implements the constitutional MVP per sprint authority: **database-backed substring search only** — no Meilisearch · Elasticsearch · indexing service · semantic/fuzzy ranking · AI · personalization · caching.

S1 v1.1 §13.5 defines a single search endpoint:

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/search` | P\|G | Search (`q` required) |

S1 §15.15 `SearchResponse`: discriminated hits `{ type, id, summary }` for games · users · reviews · posts · collections · tier-lists · communities · events.

---

## 1. Files created

### Backend — `apps/backend/src/search/`

| File | Role |
| ---- | ---- |
| `search.module.ts` | Domain module · DI for `SearchRepository` |
| `search.tokens.ts` | DI tokens |
| `search.service.ts` | Query orchestration · cursor pagination · projection |
| `search.controller.ts` | S1 §13.5 route (`@Controller('search')`) |
| `dto/search.dto.ts` | `SearchQueryDto` |
| `mappers/search.mapper.ts` | → `SearchHit` summaries (S1 §15.15) |
| `testing/fake-repositories.ts` | Test fakes with visibility stub |
| `search.service.spec.ts` · `search.controller.spec.ts` | Tests |

### Packages

| File | Change |
| ---- | ------ |
| `packages/database/.../search.repository.ts` | `search()` — merged DB substring queries |
| `packages/database/.../repositories/index.ts` | search export |
| `packages/database/.../repositories.spec.ts` | `SearchRepository` — visibility · pagination |
| `packages/types/src/index.ts` | `SearchHit` · `SearchHitType` · per-type summaries · `SearchResponse` |
| `packages/validators/src/index.ts` | `searchQuerySchema` · `SEARCH_LIST_DEFAULT_LIMIT` (20) · `SEARCH_LIST_MAX_LIMIT` (50) · `SEARCH_QUERY_MAX` (100) |

`app.module.ts` mounts `SearchModule`.

---

## 2. Endpoint summary

| Method | Path | Auth | Behavior |
| ------ | ---- | ---- | -------- |
| GET | `/search` | P\|G | `SearchHit[]` — `q` required · cursor pagination · stable `createdAt` desc ordering |

- `OptionalGuestGuard` — guests and authenticated users allowed.
- Hits: `game` · `user` · `review` · `post` · `collection` · `tier-list` · `community` · `event`.
- No relevance score · no ranking metadata · projection-only summaries.

---

## 3. Repository summary

**SearchRepository** (`PrismaSearchRepository`) — persistence only:

| Responsibility | Detail |
| -------------- | ------ |
| `search(params)` | Substring match (`contains` case-insensitive) per S2 §16 projected fields |
| Games | `title` · `slug` |
| Users | `handle` · `displayName` (active users only) |
| Reviews | `body` · related `game.title` + content visibility |
| Posts | `body` + content visibility |
| Collections | `title` · `description` + visibility |
| Tier lists | `title` + visibility |
| Communities | `name` · `description` + community visibility (public · member · followers-of-owner) |
| Events | `title` (active only) |
| Merge sort | `createdAt` desc · type rank · `id` desc |
| Cursor | Keyset on `orderedAt` + `type` + `id` |

No search engine · no indexing · no popularity scoring.

---

## 4. Service summary

- **search** — passes `viewerId` for visibility-aware repository reads · cursor encode/decode (base64url `orderedAt|type|id`) · `PaginatedPayload<SearchHit>`.
- **Projection** — `toSearchHit` maps repository rows to S1 §15.15 summaries (body excerpts capped at 120 chars).

No recommendations · no business intelligence · no caching.

---

## 5. Validation summary

| Schema | Rules |
| ------ | ----- |
| `searchQuerySchema` | `q`: required trimmed string min 1 max 100 |
| | `cursor`: optional trimmed string; invalid opaque cursor → **400** in service |
| | `limit`: optional int 1–50; default **20** in service |
| `SearchQueryDto` | Zod pipe on `GET /search` |

Missing `q` → **400** validation.

---

## 6. Test summary

- **Repository:** public post visible to guests · private post hidden · cursor page 2
- **Service:** match order · empty results · pagination · invalid cursor **400**
- **Controller:** guest envelope · missing `q` **400** · invalid cursor **400** · authenticated search · empty query
- Backend coverage — **249/249** tests
- Database coverage — **47/47** tests

---

## 7. Verification

`pnpm build` ✅ · `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ · `pnpm format:check` ✅

---

## 8. Deferred (D2.16+)

- Meilisearch / Elasticsearch projection (S2 §16 rebuildable index)
- Realtime indexing · event-driven index sync (S2 §18)
- Semantic / fuzzy / relevance ranking
- `GET /recommendations/*` — separate S1 resource
- Search filters beyond `q` (type facet · `platform` — not in S1 §13.5)
- Caching · personalization · ML
- `GET /feed` — Home activity feed

---

## Lock statement

**D2.15 Search Domain Foundation is LOCKED.**  
**D2.16 was not started.**
