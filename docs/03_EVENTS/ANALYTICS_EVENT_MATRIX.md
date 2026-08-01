# Analytics Event Matrix

**Document:** `docs/03_EVENTS/ANALYTICS_EVENT_MATRIX.md`  
**Status:** **Frozen — Analytics Platform Freeze v1.0** (Sprint 14.0)  
**Bus:** `DomainEventPublisher` (in-process v1; outbox later)  
**Rule:** Analytics **consumes only**. Runtime names win. **No future / speculative events** in V1 allowlist.

---

## Rules

1. Analytics does **not** invent domain lifecycle events.  
2. Only events in this matrix may be subscribed in Module 14 V1.  
3. Payload stored in `AnalyticsEvent.properties`: **ids + enums + counts** — never secrets, tokens, email, raw IP, raw UGC, DM bodies.  
4. Analytics must **not** re-publish the same domain event under an `analytics.*` alias.  
5. Gap protocol: need another event → Freeze amendment — do not invent in implementation sprints.  
6. High-volume engagement optional events not listed here are **out** (e.g. every reaction update) unless amended.

---

## Consumer allowlist (approved)

### Reviews

| Versioned name | Publisher | Analytics use |
|----------------|-----------|---------------|
| `review.created.v1` | Reviews | `reviews_created` / DAU proxy |
| `review.updated.v1` | Reviews | Activity signal (optional count) |
| `review.edited.v1` | Reviews | Activity signal |
| `review.deleted.v1` | Reviews | Activity signal |
| `review.hidden.v1` | Reviews | T&S / content health |
| `review.restored.v1` | Reviews | T&S / content health |
| `review.reported.v1` | Reviews / Moderation path | Report volume correlate |
| `review.search.executed.v1` | Reviews | `search_executed` |

### GameLogs / progress

| Versioned name | Publisher | Analytics use |
|----------------|-----------|---------------|
| `gamelog.created.v1` | GameLogs | `gamelogs_created` + **MALP proxy** input (events only — never GameLogs SQL) |
| `gamelog.updated.v1` | GameLogs | Activity signal |
| `gamelog.deleted.v1` | GameLogs | Activity signal |
| `gamelog.status.changed.v1` | GameLogs | Engagement |
| `game.progress.completed.v1` | GameLogs | **MALP proxy** input + completion engagement (events only — never GameLogs SQL) |
| `game.progress.updated.v1` | GameLogs | Engagement (may sample in impl if hot) |

### Feed

| Versioned name | Publisher | Analytics use |
|----------------|-----------|---------------|
| `feed.item.created.v1` | Feed | `feed_items_created` |

### Search

| Versioned name | Publisher | Analytics use |
|----------------|-----------|---------------|
| `search.global.executed.v1` | Search | `search_executed` |
| `game.search.executed.v1` | Games search | `search_executed` |
| `list.search.executed.v1` | Lists | `search_executed` |
| `tierlist.search.executed.v1` | TierLists | `search_executed` |
| `collection.search.executed.v1` | Collections | `search_executed` |
| `user.search.executed.v1` | Users search | `search_executed` |

> **Boundary:** These events do **not** authorize Analytics to write `SearchEvent`. Search BC remains query-log SoT.

### Moderation

| Versioned name | Publisher | Analytics use |
|----------------|-----------|---------------|
| `moderation.report.created.v1` | Moderation | `reports_created` |
| `moderation.resolved.v1` | Moderation | `moderation_resolved` |
| `moderation.appeal.created.v1` | Moderation | T&S volume |
| `moderation.appeal.resolved.v1` | Moderation | T&S volume |

### Notifications

| Versioned name | Publisher | Analytics use |
|----------------|-----------|---------------|
| `notification.created.v1` | Notifications | `notifications_created` |

### Collections / Lists / TierLists

| Versioned name | Publisher | Analytics use |
|----------------|-----------|---------------|
| `collection.created.v1` | Collections | Content creation mix |
| `collection.deleted.v1` | Collections | Content creation mix |
| `list.created.v1` | Lists | Content creation mix |
| `list.deleted.v1` | Lists | Content creation mix |
| `tierlist.created.v1` | TierLists | Content creation mix |
| `tierlist.deleted.v1` | TierLists | Content creation mix |

### Users (sanctions — optional T&S series)

| Versioned name | Publisher | Analytics use |
|----------------|-----------|---------------|
| `user.warned.v1` | Users | T&S volume |
| `user.suspended.v1` | Users | T&S volume |
| `user.banned.v1` | Users | T&S volume |
| `user.unsuspended.v1` | Users | T&S volume |
| `user.unbanned.v1` | Users | T&S volume |

---

## Explicitly out of V1 allowlist

| Category | Examples | Why |
|----------|----------|-----|
| Communication / DM | `message.created.v1`, `conversation.*` | Privacy / volume |
| Full reaction churn | `review.reaction.updated.v1` etc. | Event explosion |
| Gaming-identity churn | `user.gaming-identity.*.changed.v1` | Noise |
| Achievements | `achievement.unlocked.v1` | Deferred |
| Play session all | `playSession.*` | Deferred / volume |
| Client page views | Spec `PAGE_VIEW` / SDK | No client path in V1 |
| Invented analytics | `analytics.*.v1` domain aliases | Forbidden |
| AI / toxicity | Any score events | AI deferred |
| Future speculative | Anything not listed above | Forbidden |

---

## Publisher events — Analytics Platform

| Versioned name | Module 14 V1 |
|----------------|--------------|
| *(none)* | Analytics does not publish domain lifecycle events |

Internal job completion logs may use application logging / observability — **not** domain event spam.

---

## Mapping guidance (informative)

| Domain event | Suggested `AnalyticsEventType` |
|--------------|--------------------------------|
| `review.created.v1` | `CUSTOM` + name = event type (or extend usage of existing enum without schema invent) |
| `*.search.executed.v1` | `SEARCH` |
| `gamelog.created.v1` | `CUSTOM` |
| `feed.item.created.v1` | `CUSTOM` |
| `moderation.*` | `CUSTOM` |

Enum invent requires Freeze amendment — prefer `CUSTOM` + `name` = versioned event string in V1.
