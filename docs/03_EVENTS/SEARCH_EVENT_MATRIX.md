# Search Event Matrix

**Document:** `docs/03_EVENTS/SEARCH_EVENT_MATRIX.md`  
**Status:** **Frozen — Search Platform Freeze v1.0** (Sprint 11.0)  
**Contract:** `SEARCH_API.yaml`  
**Bus:** `DomainEventPublisher` (in-process v1; platform outbox/BullMQ later)  
**Rule:** Search publishes **analytics / execution** events only. Domains publish entity lifecycle events. **No invented business-state events.**

---

## Rules

1. Search does **not** invent events that mutate Games/Users/Reviews/UGC.  
2. Prefer existing runtime names; extend only with the established `*.search.executed.v1` pattern.  
3. Payload prefers **ids + counts + query string length-safe fields** — never secrets, emails, tokens.  
4. `SearchEvent` table rows are the durable analytics log; domain events are the bus signal.  
5. SQL MVP does **not** consume entity CRUD events for indexing.  
6. Meilisearch/vector indexing consumers are **Phase 2** — document only, do not emit `search.embed.*` in V1.  
7. **Runtime event names win** over speculative docs.

---

## Publisher events (Search BC + domain search services)

### Already live (runtime)

| Versioned name | Publisher | When | Payload (normative fields) |
|----------------|-----------|------|----------------------------|
| `game.search.executed.v1` | Games | After game search/autocomplete execution | `query`, `resultCount`, `viewerId?` |
| `list.search.executed.v1` | Lists | After list search | `query`, `resultCount`, `viewerId?` |
| `tierlist.search.executed.v1` | Tier Lists | After tierlist search | `query`, `resultCount`, `viewerId?` |

### Parity / MVP additions (allowed — same pattern, not business invent)

| Versioned name | Publisher | Sprint | Notes |
|----------------|-----------|--------|-------|
| `collection.search.executed.v1` | Collections | 11.1 | Match list/tierlist parity |
| `user.search.executed.v1` | Users / Search adapter | 11.2 | After user search |
| `review.search.executed.v1` | Reviews / Search adapter | 11.2 | After review search |
| `search.global.executed.v1` | Search BC | 11.1 | After global fan-out; include `types[]`, `resultCount` |

### Search-owned meta (optional V1)

| Versioned name | When | Notes |
|----------------|------|-------|
| `search.recent.cleared.v1` | After `DELETE /search/recent` | Optional analytics |
| `search.trending.refreshed.v1` | After trending cache rebuild | Optional; may skip if on-read only |

---

## Consumer events

### Module 11 V1 (SQL-first)

| Upstream | Search consumes? | Why |
|----------|------------------|-----|
| `game.*` / `review.*` / `collection.*` / … lifecycle | **No** | No external index to sync |
| Notification / Feed / Communication events | **No** | Out of BC |

### Phase 2 (Meilisearch / vector) — documented only

| Upstream | Future consumer | Purpose |
|----------|-----------------|---------|
| Domain `*.created.v1` / `*.updated.v1` / `*.deleted.v1` | Search indexer worker | Upsert/delete keyword docs |
| Same + embed jobs | Vector pipeline | `VECTOR_SEARCH.md` — **not V1** |

Do **not** invent `search.embed.*` names in Module 11 V1 code.

---

## Analytics events vs SearchEvent table

| Mechanism | Role |
|-----------|------|
| `SearchEvent` row | Durable query log (`userId?`, `query`, `resultCount`, `filters?`, `createdAt`) |
| `*.search.executed.v1` | In-process bus for stats/trending refresh hooks |
| Trending API | Reads aggregates from `SearchEvent` and/or Redis counters derived from those writes |

**Write path (normative):**

1. Execute search (domain or global).  
2. Persist `SearchEvent` (best-effort; failure must not fail the HTTP search).  
3. Publish matching `*.search.executed.v1`.  
4. Optionally push authenticated recent list.

---

## Explicit non-events (Freeze v1.0)

| Idea | Why forbidden in V1 |
|------|---------------------|
| `search.entity.indexed.v1` as required MVP | No Meilisearch yet |
| Fake “trending content” business events | Discover composes domain discovery |
| Cross-BC notify/search hybrid events | Keep analytics pure |
| AI rerank events | Phase 2 |

---

## Sprint availability

| Sprint | Events live |
|--------|-------------|
| 11.1 | Global executed + collection parity + existing game/list/tierlist |
| 11.2 | User + review executed |
| 11.3 | Recent cleared (optional); trending refresh (optional) |
| Phase 2 | Indexer consumers for Meilisearch/vector |
