# ADR — Communication Platform

**ADR ID:** ADR-COMM-001  
**Date:** 2026-07-18  
**Status:** **Accepted** (Sprint 9.0.1 — Communication Platform Freeze v1.0)  
**Deciders:** Architecture / API / Backend

---

## Context

GMRLOG needs 1:1 chat and later groups, channels, LFG, rich shares, realtime, and AI assist. An early sketch referenced a missing `MESSAGE_API.yaml`. Product scope clearly exceeds “send text DMs”. Architecture audit (post–Sprint 9.0) required five decisions locked before any code.

## Decision

1. Name the OpenAPI module **`COMMUNICATION_API.yaml`** (not `MESSAGE_API.yaml`).
2. Treat Communication as its **own bounded context**.
3. Keep **Community** (clubs, public social spaces beyond chat) as a **separate future domain** that may *use* Communication channels but does not merge into this context.
4. Split **REST** (durable CRUD, authz, pagination) from **WebSocket** (ephemeral typing/presence/delivery).
5. Prefer **event-driven** fan-out to Notification / Feed / Search / AI.
6. Remain **OpenAPI-first**: contract before code (Sprint 9.0 → 9.0.1 Freeze → 9.1+).
7. Target **CQRS-ish** read/write services and **Repository** boundaries.
8. Prefer **composition** over Container inheritance for participant authz.

### Freeze v1.0 amendments (Sprint 9.0.1)

9. **Leave ≠ Delete:** `DELETE /conversations/{id}` only sets `ConversationMember.leftAt` and emits `conversation.participant.left.v1`. Archive/mute via PATCH. No public conversation destroy API in 9.1–9.6. `conversation.deleted.v1` is reserved for system/admin cleanup only.
10. **GroupMember owns group identity; ConversationMember is derived participation:** Sync rules in COMMUNICATION_ARCHITECTURE. DIRECT never uses GroupMember.
11. **O(N) inbox cache invalidation is banned** on message write for group-backed conversations. See COMMUNICATION_CACHE_STRATEGY.
12. **DM / block privacy:** Unauthorized or blocked access to private communication resources returns **404** (never 403 that reveals existence or block). Friend-gate deferred; rate limits primary spam control for 9.1.
13. **Sprint 9.1 scope lock:** Only operations tagged `x-gmrlog-sprint: '9.1'` without `future`. Client write `messageType` = **TEXT** only.

## Why not “Messaging”?

“Messaging” implies a single feature. The platform needs conversations, groups, channels, polls, LFG, rich cards, and realtime. Naming the SSOT *Communication* prevents under-scoping and avoids inventing a second API later.

## Why a separate bounded context?

- Different authorization model (participant / roles, not content-owner containers).
- Different privacy rules (DM bodies must never leak to Feed).
- Different consistency and realtime requirements.
- Independent deploy/evolution path inside the modular monolith.

## Why Community stays separate?

Community covers discovery, clubs, events calendars, and public membership UX. Communication owns the transport of messages inside spaces. Coupling them would mix feed/discovery concerns into chat writes.

## Why REST + WebSocket split?

| Concern | Transport |
|---------|-----------|
| Create conversation, send message, list history | REST |
| Typing, presence, delivery ACK, live fan-out | WebSocket |

REST remains the source of truth; sockets project events.

## Why event-driven?

Write path stays fast; Notification/Search/AI fail independently. No cross-domain service calls from Communication services (publish only). Hot-path consumers of `message.created` MUST use async queues (not sync in-process chains) for Search/AI.

## Why OpenAPI first?

Sprint 9.1 was blocked without a contract. Codifying COMMUNICATION_API unlocks Freeze gap analysis and parallel frontend/SDK work.

## Why CQRS / Repository / Composition?

Matches Lists/Tier Lists production patterns: thin controllers, Prisma repos, query services for reads, no god-service inheritance for authz.

## Consequences

- Database Freeze needs follow-up tables for Groups/Channels/Threads/Pins/Polls before 9.3.
- Social entity tables reused for MESSAGE engagement where possible.
- Rate limits and cache keys documented separately; group inbox cache must use versioning, not per-member DEL on every message.
- `MESSAGE_API.yaml` will **not** be created.
- Sprint 9.1 may begin only after Communication Platform Freeze v1.0 is declared (done in 9.0.1).

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Implement from API_SPECIFICATION sketch | Ambiguous, incomplete, conflicts with WS docs |
| Put chat under SOCIAL_API | Wrong ownership; privacy risk |
| Single “Messaging” microservice now | Premature; monorepo modular monolith is SSOT |
| DELETE conversation = hard delete | Destroys shared history; wrong for DM/group |
| 403 on blocked DM create | Leaks block relationship; breaks private-resource 404 convention |
| Invalidate all `conversation:user:*` on every message | O(N) Redis storm at group scale |
