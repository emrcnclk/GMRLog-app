# Platform Event Matrix

**Document:** `docs/03_EVENTS/PLATFORM_EVENT_MATRIX.md`  
**Status:** **Frozen — Platform Infrastructure Freeze v1.0** (Sprint 15.1)  
**Rule:** Platform emits **operational** signals only — never domain lifecycle SoT events

---

## Principles

1. Platform **does not** publish `user.*`, `review.*`, `game.*`, `moderation.*`, `search.*`, `notification.*`, `analytics.*` domain lifecycle events.  
2. Domains remain publishers of product events via `DomainEventPublisher`.  
3. Platform “events” in V1 are primarily **structured logs** and optional future internal hooks — not a second event bus.  
4. No invented public webhook catalog in Module 15 V1.

---

## V1 allowlist (operational)

| Signal | Kind | Publisher | Consumers | Notes |
|--------|------|-----------|-----------|-------|
| Rate limit exceeded | Log / metric hook | Platform rate-limit layer | Ops logs | Include class + key hash — no raw tokens |
| Mail send attempted / failed | Log | Mail transport | Ops logs | No body/PII; template id + recipient hash optional |
| Storage put/delete failed | Log | Storage abstraction | Ops logs | Object key prefix only |
| Health check degraded | Log / probe | HealthModule | Orchestrators | DB/Redis/storage flags — no secrets |
| Cron job started / completed / failed | Log | Schedule handlers (BC or Platform host) | Ops logs | Job name + duration |
| Config validation failed at boot | Fatal log | Config module | Process exit | No secret values |

---

## Explicitly not in matrix (forbidden / deferred)

| Item | Status |
|------|--------|
| Domain aggregate lifecycle events | **Forbidden** for Platform |
| `platform.user.deleted.v1` style product events | **Forbidden** |
| Kafka/RabbitMQ topic catalog | **Deferred** |
| Outbox relay events | **Deferred** (post-MVP backlog) |
| FeatureFlag changed domain event | **Deferred** (Admin Phase 2) |

---

## Interaction with domain buses

- Platform may **observe** failures when hosting cron that *calls* Analytics/Auth ports — still BC-owned work.  
- Best-effort `DomainEventPublisher` remains domain-owned transport until outbox unlock.

---

## Related

- Freeze: [`PLATFORM_INFRASTRUCTURE_FREEZE_v1.md`](../00_PROJECT/PLATFORM_INFRASTRUCTURE_FREEZE_v1.md)  
- Architecture: [`PLATFORM_ARCHITECTURE.md`](../01_ARCHITECTURE/PLATFORM_ARCHITECTURE.md)
