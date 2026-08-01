# ADR-0007: Collection does not own user game state

**Status:** Accepted  
**Date:** 2026-07-16  
**Deciders:** GMRLOG Core Team  
**Related:** Sprint 6.2 Collection Items, Database Freeze v1.0.3, `COLLECTION_API.yaml`

---

## Context

OpenAPI `AddGameRequest` documents optional fields such as `favorite` and `completed` alongside collection membership fields (`gameId`, `note`, `order`).

`CollectionGame` under Database Freeze models only membership of a Game inside a Collection (`collectionId`, `gameId`, `sortOrder`, `note`, `createdAt`). It does not store user play state.

Persisting favorite / completion / progress on Collection rows would duplicate data owned by other domains and create conflicting sources of truth (for example Game Log `completed = true` vs CollectionGame `completed = false`).

---

## Decision

**CollectionItem is responsible only for membership of a game inside a collection.**

Fields such as the following belong to Game Log / Game Progress / User (Gaming Identity) domains — not Collections:

- `favorite`
- `completed`
- `playStatus`
- `hoursPlayed`
- `progress`
- `achievements`

Rules:

1. Collection never persists duplicated user game state.
2. Collection responses may be enriched from those domains when a future API contract requires it.
3. Wire-level OpenAPI fields that imply play state (`favorite`, `completed` on `AddGameRequest`) may be accepted for client compatibility but must not be written to `collection_games`.
4. No Prisma columns and no migrations are added to CollectionGame for user game state.

### Domain ownership

| Concern | Owning domain |
|---------|----------------|
| Organization of games (membership, note, order) | Collection |
| Play state (status, hours, completion, progress) | Game Log / Game Progress |
| Personal preferences (favorites) | User / Gaming Identity |
| Achievements | Achievements |

**Principle:** Collection = organization of games. Game Log = play state. Gaming Identity = personal preferences. Each domain owns its own data.

---

## Consequences

### Positive

- **Single Source of Truth preserved** — play state and preferences live in one place each.
- **No synchronization issues** — Collection cannot drift from Game Log / Identity.
- **Better scalability** — Collection hot paths stay membership-only; enrichment is optional and composable.
- **Easier maintenance** — clear boundaries reduce coupling and accidental dual-writes.

### Negative / follow-ups

- OpenAPI `AddGameRequest.favorite` / `completed` are a **modeling inconsistency** until the next OpenAPI revision removes or re-documents them.
- Clients must not assume Collection stores or returns play-state fields unless a future enrichment contract is explicitly added.

---

## Alternatives considered

1. **Mirror favorite/completed on `CollectionGame`** — Rejected: SSOT violation and sync risk.
2. **Reject favorite/completed with 400** — Possible but breaks OpenAPI wire compatibility; silent ignore preferred until OpenAPI is revised.
3. **Embed Game Log snapshots in Collection responses by default** — Deferred: requires an explicit API contract; not part of Sprint 6.2.

---

## References

- `docs/00_PROJECT/SPRINT_6_2_IMPLEMENTATION_REPORT.md`
- `docs/08_API/COLLECTION_API.yaml` (`AddGameRequest`)
- `docs/07_DATABASE/DATABASE_FREEZE_REPORT.md` (Collection / CollectionGame)
- `packages/database/prisma/schema.prisma` (`CollectionGame`)
