# Decision: Shared Discovery Infrastructure

**Date:** 2026-07-18  
**Status:** APPROVED — first consumer live (Sprint 8.3 Tier Lists)  
**Path:** `apps/api/src/common/discovery/`

## Decision

Create a **minimal** `common/discovery` package **before** Tier List discovery (Sprint 8.3).
Tier Lists discovery now composes these builders/cache helpers; Collections/Lists remain on their own stacks until a dedicated migration sprint.

## Scope (done)

| Component | Role |
|-----------|------|
| `CursorBuilder` | encode/decode + desc(createdAt,id) where + limit |
| `VisibilityQueryBuilder` | `publicAlive` / `alive` / `mergeAnd` |
| `DiscoveryQueryBuilder` | featured / trending / popular / recent orderBy proxies |
| `DiscoveryCacheService` | `{prefix}:featured` + `{prefix}:discover:{hash}` |
| `AbstractDiscoveryRepository` | optional base for domain query repos |

## Explicit non-goals (now)

- **Do not** migrate Collections or Lists
- **Do not** change public API behavior
- **Do not** cross-module refactor of working discovery code

## First consumer

**Sprint 8.3 — Tier Lists discovery** uses this layer.

## Follow-up

After Sprint 8.3, evaluate a **dedicated** migration sprint for Collections + Lists (optional). Goal was to prevent a third hand-rolled discovery stack, not to risk a big-bang refactor.
