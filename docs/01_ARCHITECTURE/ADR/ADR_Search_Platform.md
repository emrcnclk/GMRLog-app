# ADR — Search Platform

**ADR ID:** ADR-SEARCH-001  
**Date:** 2026-07-19  
**Status:** **Accepted** (Sprint 11.0 — Search Platform Freeze v1.0)  
**Deciders:** Architecture / API / Backend  
**Preceded by:** [`MODULE_11_SCOPE_REPORT.md`](../../00_PROJECT/MODULE_11_SCOPE_REPORT.md)

---

## Context

GMRLOG Phase 1 Roadmap includes **Search**. OpenAPI `SEARCH_API.yaml` already describes global search, entity search, autocomplete, discover, recent/trending, and advanced/AI-adjacent surfaces. Runtime already has **fragmented** entity search inside Games, Collections, Lists, and Tier Lists (SQL `ILIKE` / contains), plus shared `common/discovery` helpers. There is **no** Search Nest module, **no** global aggregator, and **no** User/Review search.

`VECTOR_SEARCH.md` and `AI_API.yaml` describe semantic/NL search. Product Backlog places AI Search / recommendations in **Phase 2**. Module 11 Scope Report (`APPROVED WITH MINOR CHANGES`) required locking: SQL-first MVP, orchestration ownership, and AI deferral.

## Decision

1. Treat Search as its **own bounded context** that **orchestrates** discovery UX — not as a data owner for games, users, or UGC.  
2. **Domains remain source of truth.** Search composes SERP/discover cards; detail pages stay on domain APIs.  
3. **Delegation:** Every entity keeps (or gains) its own search implementation; Search calls those services.  
4. **SQL-first MVP:** Use existing PostgreSQL/Prisma keyword queries for V1. Do not block Internal Alpha on Meilisearch.  
5. **Meilisearch** is a **future keyword engine upgrade** (optional Phase 1.5 / Phase 2 infra), not MVP.  
6. **Vector / AI Search / Recommendations** are **Phase 2** (`AI_API`, `VECTOR_SEARCH.md`, Product Backlog).  
7. **Discover is composition only** of existing domain featured/trending surfaces — Search does not invent Feed ranking.  
8. **No Feed ownership** and **no Communication ownership**.  
9. Prefer **OpenAPI-first** `SEARCH_API.yaml` — implement MVP ops; do not invent undeclared endpoints; do not implement advanced/AI paths in Module 11 V1.  
10. Reuse Freeze tables `SearchEvent` / `SavedSearch` / `SearchEntityType` — **no new Prisma models** for V1 without Database Freeze amendment.  
11. Analytics events follow existing `*.search.executed.v1` pattern; do not invent business-state events.  
12. Match platform patterns: thin controllers, services, repositories/adapters, targeted Redis invalidation.

## Why Search remains an orchestration layer

- Entity visibility, publication, and indexing rules differ per BC (Games catalog ≠ Reviews ACL ≠ User `searchVisibility`).  
- Putting SQL/Meilisearch documents inside Search would duplicate SoT and create sync lag bugs.  
- Domain modules already own search for Games/Collections/Lists/Tier Lists — rewrite would risk regressions.  
- Global SERP and Discover need a single UX owner without absorbing Feed or Chat.

## Why SQL-first (not Meilisearch now)

- Entity search already ships on SQL for several domains.  
- Meilisearch requires infra, indexing pipelines, and event consumers not yet frozen for Search.  
- Internal Alpha needs searchable surfaces sooner than a new search cluster.  
- API shapes stay the same when/if Meilisearch replaces the query engine behind domain ports.

## Why defer Vector / AI Search

- North Star is AI Native **long-term**, but Product Backlog and Scope Report place AI Search in Phase 2.  
- Semantic ranking without keyword baseline creates spam/privacy risk and couples AI ops to MVP.  
- `AI_API` / `VECTOR_SEARCH.md` already own the future NL/KNN path — keep deterministic search in `SEARCH_API`.

## Consequences

- Sprint 11.1 can ship global fan-out without a new index.  
- Users/Reviews search must be implemented in those domains (or adapters) before global completeness (11.2).  
- Trending is heuristic over `SearchEvent`, not ML.  
- OpenAPI contains advanced ops that stay unimplemented until Phase 2 / later Freezes.  
- Introducing Meilisearch later requires an architecture amendment + indexing Event Matrix rows — not inventing entity CRUD events.

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Search owns denormalized entity copies | Violates SoT; sync hell |
| Meilisearch required for MVP | Infra/index lag; SQL paths already exist |
| Put global search inside Games module | Wrong BC; users/reviews/UGC orphaned |
| Absorb Feed discover into Search | Couples social ranking; Freeze forbids Feed ownership |
| Ship AI search in Module 11 | Phase 2 backlog; Scope Report explicit deferral |
| New search tables beyond Freeze | Forbidden without Database Freeze amendment |

## Status

**Accepted** with Search Platform Freeze v1.0.
