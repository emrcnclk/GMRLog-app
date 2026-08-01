# Moderation Event Matrix

**Document:** `docs/03_EVENTS/MODERATION_EVENT_MATRIX.md`  
**Status:** **Frozen — Moderation Platform Freeze v1.0** (Sprint 12.0)  
**Contracts:** `ADMIN_API.yaml` + domain report OpenAPI  
**Bus:** `DomainEventPublisher` (in-process v1; platform outbox/BullMQ later)  
**Rule:** Prefer **reuse**. Invent only Freeze-listed names. Moderation publishes **policy/analytics** events; domains publish **entity** lifecycle events; Users publish **sanction** events after applying flags.

---

## Rules

1. Moderation does **not** invent events that mutate Games/Feed/Search as SoT.  
2. **Runtime event names win** when already shipped.  
3. Payload prefers **ids + enums + counts** — never secrets, tokens, raw private message bodies, or full UGC dumps.  
4. Notifications **consume** events — Moderation must not sync-write Notification rows (Notification Freeze).  
5. Do **not** emit AI score / toxicity / trust-score events in Module 12 V1.  
6. Gap protocol: if a consumer needs an event that is not listed, file upstream work — do not invent.

---

## Already live (reuse)

| Versioned name | Publisher today | When | Module 12 disposition |
|----------------|-----------------|------|------------------------|
| `review.reported.v1` | Reviews | After review report create | **Keep** during 12.1 migration; may dual-emit with `moderation.report.created.v1` |
| `review.hidden.v1` | Reviews | After hide | **Keep** — domain-owned |
| `review.restored.v1` | Reviews | After restore | **Keep** — domain-owned |
| `moderation.resolved.v1` | Reviews moderation | After queue resolve | **Move publisher to Moderation BC**; same name |

---

## Publisher events — Moderation BC (MVP)

| Versioned name | Sprint | When | Normative payload fields |
|----------------|--------|------|---------------------------|
| `moderation.report.created.v1` | 12.1 | After `Report` + queue enqueue | `reportId`, `entityType`, `entityId`, `reporterId`, `reasonCode` / `reasonId`, `queueItemId` |
| `moderation.resolved.v1` | 12.2 (exists) | After successful resolve | `queueItemId`, `entityType`, `entityId`, `action`, `reasonCode`, `moderatorId` |
| `moderation.appeal.created.v1` | 12.3 | After Appeal insert | `appealId`, `reportId`, `userId` |
| `moderation.appeal.resolved.v1` | 12.3 | After appeal status terminal | `appealId`, `reportId`, `userId`, `status` |

Optional (may skip if write-through audit is enough):

| Versioned name | When | Notes |
|----------------|------|-------|
| `moderation.report.updated.v1` | Staff `adminUpdateReport` | Optional analytics |

---

## Publisher events — Users BC (after Moderation requests sanction)

| Versioned name | When | Normative fields |
|-----------------|------|------------------|
| `user.warned.v1` | After `strikeCount` increment | `userId`, `strikeCount`, `actorId`, `queueItemId?` |
| `user.suspended.v1` | After `isSuspended=true` | `userId`, `actorId`, `suspensionDays?`, `queueItemId?` |
| `user.banned.v1` | After `isBanned=true` | `userId`, `actorId`, `queueItemId?` |
| `user.unsuspended.v1` / `user.unbanned.v1` | When lift paths exist | Optional; Admin user update |

**Ownership:** Users publishes these events. Moderation must not publish fake user lifecycle events without Users applying flags.

---

## Domain content events (owned by domains)

| Event | Owner | Triggered by |
|-------|-------|--------------|
| `review.hidden.v1` / `review.restored.v1` | Reviews | Resolve REJECT/APPROVE/BAN content path |
| Future message hide / delete event | Communication | Resolve hide message — **reuse Comm runtime name if already exists; do not invent duplicate** |
| Collection / TierList soft-delete events | UGC BCs | When ports hide content |

---

## Consumer guidance

| Consumer | May consume | Must not |
|----------|-------------|----------|
| Notifications | `user.suspended.v1`, `user.banned.v1`, `user.warned.v1`, optional `moderation.appeal.*` for SYSTEM copy | Create notifications without prefs; store private bodies |
| Search | Indirectly via Users flags on next read | Listen for ranking ML |
| Analytics | All `moderation.*` | — |
| Moderation | — | Consume entity CRUD to build a second catalog |

**Prefer notify on sanction / appeal outcome**, not on every `moderation.report.created.v1` (abuse + noise).

---

## Explicit non-events (Freeze v1.0)

| Idea | Why forbidden |
|------|----------------|
| `moderation.ai.scored.v1` | AI deferred |
| `moderation.toxicity.*` | Deferred |
| `moderation.trust.score.updated.v1` | No trust score |
| Auto-ban without queue resolve | Human-in-the-loop MVP |
| Invented Feed/Search hybrid events | Wrong BC |

---

## Sprint availability

| Sprint | Events |
|--------|--------|
| 12.1 | `moderation.report.created.v1` (+ keep `review.reported.v1`) |
| 12.2 | Ensure `moderation.resolved.v1` from Moderation BC; domain hide events via ports |
| 12.3 | Users `user.warned/suspended/banned.v1`; appeal events |
| Phase 2 | AI-related — not listed |

---

## Write path (normative resolve)

1. Staff resolve HTTP.  
2. Domain / Users ports apply SoT mutations (+ their domain events).  
3. Persist `ModerationAction` + report status updates.  
4. Append `AuditLog`.  
5. Publish `moderation.resolved.v1`.  
6. Users publish sanction events when flags changed.
