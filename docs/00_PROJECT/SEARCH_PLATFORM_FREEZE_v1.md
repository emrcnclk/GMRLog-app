# Search Platform Freeze v1.0

**Document:** `docs/00_PROJECT/SEARCH_PLATFORM_FREEZE_v1.md`  
**Date:** 2026-07-19  
**Status:** **FROZEN**  
**Preceded by:** Module 11 Scope Report (`APPROVED WITH MINOR CHANGES`) + Sprint 11.0 architecture  
**Unlocks:** Sprint 11.1 Search Core (Global + Autocomplete)

---

## What is frozen

The Search Platform documentation set below is the **normative SSOT** for Sprint 11.1+. Implementors must not reinterpret these decisions in code reviews.

| Artifact | Role |
|----------|------|
| [`docs/08_API/SEARCH_API.yaml`](../08_API/SEARCH_API.yaml) | REST contract (`info.version: 1.0.0`) — **do not invent paths** |
| [`docs/01_ARCHITECTURE/SEARCH_ARCHITECTURE.md`](../01_ARCHITECTURE/SEARCH_ARCHITECTURE.md) | Bounded context & flows |
| [`docs/01_ARCHITECTURE/ADR/ADR_Search_Platform.md`](../01_ARCHITECTURE/ADR/ADR_Search_Platform.md) | ADR-SEARCH-001 Accepted |
| [`docs/03_EVENTS/SEARCH_EVENT_MATRIX.md`](../03_EVENTS/SEARCH_EVENT_MATRIX.md) | Analytics / search-executed events |
| [`docs/04_CACHE/SEARCH_CACHE_STRATEGY.md`](../04_CACHE/SEARCH_CACHE_STRATEGY.md) | Redis keys & invalidation |
| [`docs/05_SECURITY/SEARCH_PERMISSION_MATRIX.md`](../05_SECURITY/SEARCH_PERMISSION_MATRIX.md) | AuthZ |
| [`docs/05_SECURITY/SEARCH_VISIBILITY_MATRIX.md`](../05_SECURITY/SEARCH_VISIBILITY_MATRIX.md) | Privacy / suppression |

**Database schema:** `SearchEvent`, `SavedSearch`, `SearchEntityType` already exist in Database Freeze. This Freeze **does not authorize new tables or enum values** for Module 11 V1.

---

## Ten locked decisions (non-negotiable for 11.1+)

### 1. Search never owns entity data

- Games, Users, Reviews, Collections, Lists, Tier Lists remain authoritative.  
- Search returns composed snapshots / summaries only.  
- No mutating domain aggregates from Search.

### 2. Search composes results

- Global search and Discover are **orchestration** over domain query ports.  
- Prefer composition over rewriting domain search stacks.

### 3. Domains remain source of truth

- Entity search implementation stays in (or is added to) the owning BC.  
- Search delegates; it does not become a second catalog database.

### 4. SQL-first MVP

- V1 query engine = PostgreSQL / Prisma keyword search (existing patterns).  
- Meilisearch is a **future** upgrade, not an MVP blocker.

### 5. AI deferred

- No `AI_API` natural-language search in Module 11 V1.  
- No AI ranking inside autocomplete or Discover.

### 6. Semantic search deferred

- No pgvector / embedding pipeline in Module 11 V1 (`VECTOR_SEARCH.md` = Phase 2).

### 7. Recommendation deferred

- No `/search/recommendations`, no personalized SERP ranking, no Rec Engine.

### 8. Discover is composition only

- `/discover` aggregates existing domain featured/trending/popular/recent surfaces.  
- Search does not invent a new popularity model for V1.

### 9. No Feed ownership

- Do not absorb `/feed/discover` or Feed ranking into Search.  
- Links/composition only if product needs pointers — Feed BC owns feed.

### 10. No Communication ownership

- Message search and group discover stay in Communication.  
- Out of Module 11 V1.

---

## Sprint 11.1 scope lock (implementation unlock)

After this Freeze is accepted, Sprint **11.1** may implement **only**:

| operationId | Method / path |
|-------------|----------------|
| `globalSearch` | GET `/search` |
| `autocomplete` | GET `/search/autocomplete` (multi-type MVP entities) |

Plus: Search Nest module skeleton, domain ports to **existing** Games/Collections/Lists/Tier Lists search, `SearchEvent` write + analytics emit for those executions.

**Not in 11.1:** Users/Reviews search (11.2), recent/trending/discover (11.3), saved searches, advanced/AI/metadata ops.

---

## MVP entity allowlist

`GAME`, `USER`, `REVIEW`, `COLLECTION`, `LIST`, `TIERLIST`

Metadata types in OpenAPI (`DEVELOPER`, `GENRE`, …) are **non-MVP**.

---

## Explicit non-goals until Phase 2 / later Freezes

Meilisearch cluster, vector/hybrid search, AI search, recommendation engine, trending ML, personalized ranking, voice/OCR search, Feed ownership, Communication search, new Prisma models, inventing undeclared endpoints, OpenAPI edits in implementation sprints without change control.

---

## Change control

Breaking changes to frozen decisions require:

1. ADR amendment (ADR-SEARCH-00x), and  
2. Bump Search Platform Freeze minor/major, and  
3. Explicit note in the sprint report.

Cosmetic OpenAPI wording that does not change semantics may land without a new Freeze major.

New search tables/enums require **Database Freeze amendment**.

---

## Gate

**Sprint 11.1 Search Core may begin** after this Freeze is accepted.

Do **not** start AI/Meilisearch/vector work under Module 11 V1.
