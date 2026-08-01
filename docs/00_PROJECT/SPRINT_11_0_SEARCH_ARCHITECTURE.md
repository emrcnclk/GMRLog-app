# Sprint 11.0 — Search Platform Architecture & Freeze

**Document:** `docs/00_PROJECT/SPRINT_11_0_SEARCH_ARCHITECTURE.md`  
**Date:** 2026-07-19  
**Role:** Principal Software Architect / CTO  
**Type:** Documentation only — **no code, no Prisma, no migrations, no OpenAPI edits, no endpoint implementation**  
**Freeze:** [`SEARCH_PLATFORM_FREEZE_v1.md`](./SEARCH_PLATFORM_FREEZE_v1.md)  
**Scope precursor:** [`MODULE_11_SCOPE_REPORT.md`](./MODULE_11_SCOPE_REPORT.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive summary

Sprint 11.0 establishes **Search Platform Freeze v1.0**: Search is an **orchestration BC** that composes global search, autocomplete, recent/trending queries, and Discover — while **domains remain SoT** for entity data and entity search. **SQL-first MVP** is locked; Meilisearch, vector/AI search, and recommendations are **Phase 2**.

Implementation unlock: **Sprint 11.1** (Global + Autocomplete only).

---

## Artifacts generated

| # | Document | Role |
|---|----------|------|
| 1 | `docs/01_ARCHITECTURE/SEARCH_ARCHITECTURE.md` | BC, flows, delegation |
| 2 | `docs/01_ARCHITECTURE/ADR/ADR_Search_Platform.md` | ADR-SEARCH-001 |
| 3 | `docs/00_PROJECT/SEARCH_PLATFORM_FREEZE_v1.md` | Normative freeze |
| 4 | `docs/03_EVENTS/SEARCH_EVENT_MATRIX.md` | Analytics events + SearchEvent |
| 5 | `docs/04_CACHE/SEARCH_CACHE_STRATEGY.md` | Redis keys / TTL / bans |
| 6 | `docs/05_SECURITY/SEARCH_PERMISSION_MATRIX.md` | AuthZ |
| 7 | `docs/05_SECURITY/SEARCH_VISIBILITY_MATRIX.md` | Privacy |
| 8 | This report | Validation + OpenAPI review |

**Not modified:** Prisma, OpenAPI, code, migrations.

---

## Locked architecture (summary)

| Topic | Decision |
|-------|----------|
| Ownership | Search owns global / autocomplete / recent / trending / discover |
| Non-ownership | Games, Reviews, Collections, Lists, Tier Lists, Feed, Recs, AI |
| Delegation | Entity queries stay in domain services |
| Engine | SQL-first V1; Meilisearch later; vector/AI Phase 2 |
| Discover | Composition of domain discovery only |
| Events | `*.search.executed.v1` + `SearchEvent` rows; no business invent |
| Cache | Targeted keys; no global flush |

---

## OpenAPI consistency review (`SEARCH_API.yaml`)

**Contract file:** `docs/08_API/SEARCH_API.yaml` (v1.0.0) — **reviewed, not modified**.

### Compatible with Freeze V1

| Area | Assessment |
|------|------------|
| Global `GET /search` | Exists; public `security: []` — aligns with Permission Matrix (rate-limit required) |
| Entity paths `/search/{games\|users\|reviews\|collections\|lists\|tierlists}` | Exist; MVP allowlist maps cleanly |
| Autocomplete | Exists; supports `types` — Freeze requires multi-type MVP (runtime today games-only = **implementation gap**, not contract error) |
| Recent GET/DELETE | Exist; Auth implied by default security — aligns with own-only recent |
| Trending | Exists |
| Discover `GET /discover` | Exists; public — aligns |
| `SearchEntityType` enum | Superset of MVP allowlist — OK if implementors ignore non-MVP types |
| `SavedSearch` / `SearchEvent` models in DB | Match optional/advanced OpenAPI surfaces |

### Mismatches / gaps (documentation debt — no OpenAPI edit this sprint)

| ID | Mismatch | Severity | Disposition |
|----|----------|----------|-------------|
| O1 | No `x-gmrlog-sprint` / `x-gmrlog-status` tags (unlike Notification API) | Medium | Optional future OpenAPI hygiene; Freeze uses sprint lock table instead |
| O2 | Runtime autocomplete is **games-only**; OpenAPI allows multi-type | Medium | Close in Sprint 11.1 |
| O3 | `popularSearches` duplicates `trendingSearches` | Low | Freeze: implement trending only in V1 |
| O4 | Advanced/AI-adjacent ops present (`advancedSearch`, `suggestions`, `recommendations`, `analytics`, metadata searches, `explore`) | Low | Explicitly **out of V1**; do not implement |
| O5 | Docs elsewhere mention Meilisearch; OpenAPI does not mandate engine | Info | ADR SQL-first resolves |
| O6 | Users/Reviews paths in OpenAPI but **no runtime** | High (product) | Sprint 11.2 — not an OpenAPI defect |
| O7 | Global / discover / recent / trending in OpenAPI but **no runtime** | High (product) | 11.1 / 11.3 |
| O8 | Default file-level `security: [BearerAuth]` vs many ops `security: []` | Info | Correct for public search; recent should remain authenticated |

**Verdict:** OpenAPI is a **valid superseding contract**. Freeze V1 subsets it. No blocking inconsistency that requires OpenAPI modification before 11.1.

---

## Validation checklist

| Check | Result |
|-------|--------|
| North Star alignment | ✅ Gaming discovery home; AI Native deferred to Phase 2 |
| Bounded contexts | ✅ Orchestration vs domain SoT explicit |
| Event ownership | ✅ Analytics-only; existing `*.search.executed.v1` preserved |
| Cache ownership | ✅ Search keys + domain keys separated; no global flush |
| Security ownership | ✅ Public search + own recent; admin analytics deferred |
| Privacy / visibility | ✅ Per-entity rules + block/suspend/soft-delete |
| OpenAPI compatibility | ✅ Implement subset; no invented paths |
| Scope Report alignment | ✅ SQL-first, delegation, sprint map 11.1–11.4 |
| Product Backlog | ✅ AI/semantic/rec deferred |
| No Feed / Communication ownership | ✅ Frozen |

---

## Future (Phase 2 only — documented)

- Meilisearch keyword engine behind domain ports  
- pgvector / hybrid search (`VECTOR_SEARCH.md`)  
- AI Search (`AI_API.yaml`)  
- Recommendation Engine / personalized ranking  
- Trending ML, voice, OCR  

---

## Unlock

| Next | Allowed after Freeze acceptance |
|------|----------------------------------|
| **Sprint 11.1** | `globalSearch` + multi-type `autocomplete` + Search module + SearchEvent writes |
| **Not yet** | 11.2 Users/Reviews, 11.3 Discover/recent/trending, Phase 2 AI |

---

## Decision

**APPROVED**

Search Platform Freeze v1.0 is coherent with North Star, Module 11 Scope Report, and `SEARCH_API.yaml`. OpenAPI mismatches are **runtime gaps / tagging hygiene**, not redesign drivers.

---

## Gate

Sprint **11.0 Search Platform Architecture & Freeze complete.**

Do **not** implement Sprint 11.1 in this turn.

- No code  
- No migrations  
- No Prisma  
- No OpenAPI edits
