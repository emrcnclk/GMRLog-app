# Admin Event Matrix

**Document:** `docs/03_EVENTS/ADMIN_EVENT_MATRIX.md`  
**Status:** **Frozen — Admin Platform Freeze v1.0** (Sprint 13.0)  
**Contracts:** `ADMIN_API.yaml` + domain admin surfaces  
**Bus:** `DomainEventPublisher` (in-process v1; platform outbox/BullMQ later)  
**Rule:** Prefer **reuse**. Admin is orchestration — **do not invent** domain lifecycle events. Domains publish entity/sanction events; Admin must not fake them.

---

## Rules

1. Admin does **not** invent events that mutate Games / Users / Moderation / Notifications / Search as SoT.  
2. **Runtime event names win** when already shipped (especially Moderation + Users sanction events).  
3. Payload prefers **ids + enums + counts** — never secrets, tokens, raw private message bodies, or full UGC dumps.  
4. Notifications **consume** events — Admin must not sync-write Notification rows.  
5. Do **not** emit AI score / toxicity events from Admin in Module 13 V1.  
6. Gap protocol: if a consumer needs an event that is not listed, file upstream work — do not invent.

---

## Already live (reuse — do not duplicate publishers)

| Versioned name | Publisher | When | Admin disposition |
|----------------|-----------|------|-------------------|
| `user.warned.v1` / `user.suspended.v1` / `user.banned.v1` | Users | Sanction apply | Admin `adminUpdateUser` **must** go through Users port so these still emit |
| `user.unsuspended.v1` / `user.unbanned.v1` | Users | Lift | Same |
| `moderation.report.created.v1` | Moderation | Report create | Admin UI does not re-publish |
| `moderation.resolved.v1` | Moderation | Queue resolve | Compose only |
| `moderation.appeal.created.v1` / `moderation.appeal.resolved.v1` | Moderation | Appeals | Compose only |
| `review.hidden.v1` / `review.restored.v1` | Reviews | Hide/restore | Compose only |
| Catalog / Auth audit-related domain events (if any) | Owning BC | Existing | Admin does not fork |

---

## Publisher events — Admin Platform (MVP)

| Versioned name | Sprint | When | Notes |
|----------------|--------|------|-------|
| *(none required)* | 13.1–13.3 | — | Audit **read** needs no event. Role/session changes: prefer Users/Auth-owned events if/when they exist; **do not invent** `admin.*` spam for MVP. |

Optional later if Users lacks a role event and consumers need it (requires Freeze amendment — not invent in code sprints):

| Versioned name | When | Normative fields |
|-----------------|------|------------------|
| `user.role.updated.v1` | After successful `adminUpdateUserRoles` | `userId`, `actorId`, `fromRole`, `toRole` |

Preferred publisher for that optional event: **Users BC**, not Admin.

---

## Publisher events — Phase 2 (not Module 13 V1)

| Versioned name | When | Notes |
|----------------|------|-------|
| `admin.feature_flag.updated.v1` | After flag toggle | `flagKey`, `actorId`, `enabled`, `environment?` |
| `admin.cms.published.v1` | After CMS publish | `contentId`, `contentType`, `actorId` |
| `admin.job.retried.v1` | After job retry | `queueName`, `jobId`, `actorId` |

Do not implement these under Module 13 V1 Freeze.

---

## Explicitly forbidden (Module 13 V1)

| Invented / AI names | Why |
|---------------------|-----|
| `admin.user.banned.v1` (parallel to Users) | Duplicate SoT signal |
| `admin.moderation.resolved.v1` | Moderation already publishes |
| `admin.search.reindex.v1` | Search ownership |
| `admin.notification.blast.v1` | Notification ownership |
| Toxicity / AI score admin events | AI phase |

---

## Consumers (informative)

| Consumer | May react to |
|----------|--------------|
| Notifications | `user.*` sanction / lift (existing policy) |
| Search | User flag changes via existing Users → Search suppression paths |
| Audit analytics (future) | Append-only `AuditLog` reads — not necessarily domain events |
| Admin UI | HTTP responses; optional realtime later — out of V1 |

---

## Sprint notes

| Sprint | Event work |
|--------|------------|
| 13.1 | None new — audit read only |
| 13.2 | Ensure Users port emits existing sanction events on admin update |
| 13.3 | Compose only — no Admin publishers |
| Phase 2 | Flag/CMS/job events per table above |
