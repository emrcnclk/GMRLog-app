# Communication Platform — Freeze v1.1 Architecture Review

**Document:** `docs/00_PROJECT/COMMUNICATION_FREEZE_V1_1_REVIEW.md`  
**Date:** 2026-07-18  
**Status:** Complete  
**Subject:** `COMMUNICATION_FREEZE_V1_1_AMENDMENT.md`  
**Compared against:**

| Artifact | Role |
|----------|------|
| `NORTH_STAR.md` | Product direction |
| `COMMUNICATION_PLATFORM_FREEZE_v1.md` | Locked Freeze v1.0 decisions |
| `COMMUNICATION_ARCHITECTURE.md` | Aggregates, sync rules, BC bounds |
| `COMMUNICATION_API.yaml` | 9.3 contract surface |
| `ADR_Communication_Platform.md` | Community vs Communication split |

**Review type:** Architecture / Database Freeze amendment only  
**Out of scope:** Code, migrations, Prisma edits, OpenAPI edits, endpoint design

---

## Verdict summary

The amendment correctly fills the DB gap Freeze v1.0 deferred for Sprint 9.3. Aggregate map, ownership split, DIRECT isolation, and additive migration posture align with Architecture and OpenAPI.

Residual issues are **lock-down wording** (soft-delete, FK `onDelete`, naming) — not a redesign of Groups → Channels → Conversation.

---

## Checklist results

### Domain boundaries preserved?

**Pass.**

| Boundary | Amendment behavior | SSOT |
|----------|-------------------|------|
| Communication owns Groups / Channels / threads / pins / polls | Proposed tables stay in Communication | Architecture BC diagram |
| Must NOT own Notification / Feed / Search / Moderation admin / Profile | Not introduced | Architecture + ADR |
| Community (clubs, forums, discovery UX) separate | Explicit non-goal; Forums out | ADR-COMM-001 § Community |
| Engagement reuse Social polymorphic tables | Explicit reuse; no duplicate like/react tables | Architecture + Freeze engagement ownership |

No cross-domain table invention. No merge of Community into Communication.

---

### Existing Conversation model broken?

**Pass — additive only.**

| Existing | Change |
|----------|--------|
| `Conversation` columns | None |
| `ConversationMember` | None (sync rules remain application-level) |
| `Message` | Nullable `parentMessageId` only |
| Reads / attachments / typing | Untouched |

New `Conversation.type = GROUP` rows are created only via Channel create — does not mutate existing DIRECT rows. Architecture already reserved `ConversationType.GROUP`.

---

### DIRECT conversations affected?

**Pass — isolated.**

Amendment restates Freeze v1.0:

- DIRECT never uses `GroupMember`
- DIRECT has no `Channel`
- Participant add/remove rejected for DIRECT (app rule; schema does not force GROUP onto DIRECT)

No required FK from `Conversation` → `Group`. Bridge is `Channel.conversationId` only — DIRECT cannot accidentally gain a group link without an illicit Channel row (app invariant: `type = GROUP` iff Channel exists).

---

### Backward compatibility preserved?

**Pass.**

- Nullable column + empty new tables; no backfill
- No renames, drops, or enum narrowing
- 9.1 leave/archive/mute and 9.2 engagement paths unchanged
- OpenAPI `future` flags intentionally left in place (correct gate)

Clients of shipped APIs see no contract change from this DB proposal alone.

---

### Cascade risks?

**Pass with minor locks required.**

| Risk | Amendment stance | Review finding |
|------|------------------|----------------|
| Group → Conversation hard-delete cascade | Explicitly avoided (no Group→Conversation FK) | Correct |
| Group → Channel `Cascade` | Listed | **Safe only if Group delete is soft (`deletedAt`)** — hard delete would remove Channel rows and orphan Conversations |
| Channel → Conversation | 1:1 unique FK; soft-delete Channel; do not destroy Conversation | Correct intent; **`onDelete` must be `Restrict`** (not Cascade) |
| Message parent FK | Recommends `SET NULL` | Acceptable; message hard-delete is rare (soft `deletedAt` is normative) |
| Pin / Poll → Conversation Cascade | OK for rare admin destroy path | Aligns with “no public conversation destroy” |
| User delete → GroupMember Cascade | Listed | Consistent with existing membership patterns; product soft-delete User may still apply upstream |

**Cascade conclusion:** Model is safe if soft-delete of Group/Channel is **normative** and Channel→Conversation is **Restrict**. These must be locked before migration authoring — not left as “preferred / TBD”.

---

### Relation directions correct?

**Pass.**

Matches Architecture aggregate map:

```text
Group
 └── Channel ──conversationId──► Conversation
                                   ├── ConversationMember[]  (derived)
                                   └── Message[]
```

| SoT | Derived | Amendment |
|-----|---------|-----------|
| `GroupMember` (roles) | — | Correct |
| — | `ConversationMember` on channel conversations | Correct; sync documented, not new tables |
| `Channel` owns bridge | Conversation remains message aggregate | Correct; no `Conversation.groupId` dual SoT |

Self-FK `Message.parentMessageId` matches OpenAPI thread model (no separate Thread table) — correct.

Optional `Poll.messageId` matches Architecture (“Optionally linked to a Message”) and OpenAPI nullable `messageId`.

---

### Nullable fields sufficient?

**Pass.**

| Field | Nullable | Why sufficient |
|-------|----------|----------------|
| `Message.parentMessageId` | Yes | All existing messages; top-level messages |
| `Poll.messageId` | Yes | Polls without card message; defers `MessageType.POLL` |
| `Group.slug` / description / rules / media | Yes | Matches OpenAPI optionality |
| `GroupInvite.maxUses` | Yes | Matches create request |
| `GroupMember.leftAt` | Yes | Active vs left |
| `Channel` / `Group` `deletedAt` | Yes | Soft delete |
| `Poll.endsAt` | Yes | OpenAPI |

No mandatory new columns on existing DIRECT-facing tables except the nullable parent FK on `Message`.

**Deferral of `MessageType.POLL`:** Acceptable for Freeze v1.1. OpenAPI does not require a poll message type for CRUD; a later enum amendment can add card rendering without redesigning Poll tables.

---

### Compatible with future sprints?

**Pass.**

| Sprint | Dependency on this schema | Conflict? |
|--------|---------------------------|-----------|
| 9.4 Realtime / typing / attachments API | `TypingStatus` + existing `MessageAttachment` untouched; voice session tables still out | No |
| 9.5 Presence / read receipts | `MessageRead` unchanged | No |
| 9.6 Search / forward / audit | No forward-graph table invented prematurely | No |
| Voice rooms | `ChannelKind.VOICE` enum parity only; no voice-room tables | No — correct non-goal |
| Rich `MessageType` cards | Transport remains Message; Poll link optional | No |

Phased unlock (9.3a/b/c) after a single additive migration is coherent with OpenAPI tagging.

---

### North Star conflict?

**Pass — no conflict.**

| North Star | Amendment |
|------------|-----------|
| Gaming culture digital home / communities | Groups/channels as Communication transport |
| Never generic social network | Forums / Community product explicitly out |
| Not competing with Discord (combine best parts, gaming-specific) | Bounded group spaces ≠ Discord-clone scope; voice rooms deferred |
| Community before monetization | No monetization schema; membership/invite model only |

ADR already separates Community discovery/clubs from Communication transport — amendment respects that split.

---

## Freeze v1.0 five locked decisions

| Decision | Held by amendment? |
|----------|-------------------|
| Leave ≠ Delete | Yes — Conversation destroy avoided; Channel/Group soft-delete; `ConversationMember.leftAt` retained |
| GroupMember → ConversationMember ownership | Yes — core of proposal |
| O(N) cache ban | Out of DB scope; rollout correctly points at existing cache rules |
| Block → 404 | Restated as app invariant |
| 9.1 scope lock | Not reopened; amendment does not clear OpenAPI `future` |

---

## OpenAPI coverage (9.3)

All 32 future ops in Scope Report map to proposed tables/columns. No invented aggregates outside the contract. Documented OpenAPI follow-ups (`GroupInvite` use counters on response, slug rules, `PollOption.sortOrder`) are contract hygiene — not blockers for DB shape.

---

## Minor changes required (before migration / Freeze bump)

These do **not** change the aggregate design. They must be reflected when Freeze v1.1 is finalized and when migration is authored:

1. **Normative soft-delete** for `Group` and `Channel` (`deletedAt`) — not “preferred”. Application MUST NOT hard-delete Group/Channel in 9.3–9.6 product paths.
2. **`Channel.conversationId` → `Conversation`:** `onDelete: Restrict` (never Cascade). Deleting/soft-deleting a channel must not destroy the Conversation aggregate or its messages.
3. **`Group.createdById` → `User`:** lock `onDelete: Restrict` (close the TBD).
4. **`GroupMember.leftAt`:** lock as required pattern for leave/kick/rejoin (same row; clear `leftAt` on rejoin) — not optional vs hard-delete membership.
5. **Pin entity name:** lock `ConversationPinnedMessage` / `conversation_pinned_messages` (remove “TBD”).
6. **`Message.parentMessageId`:** document that soft-delete (`deletedAt`) does not remove FK targets; choose `onDelete: SetNull` for rare hard deletes, or `Restrict` — either is acceptable if message hard-delete remains non-product.
7. **Hard-delete note:** Prisma `onDelete: Cascade` on `Channel` → `Group` only fires on SQL hard delete; with normative soft-delete this is dormant — still document “do not `DELETE FROM groups` in app code.”

Optional (non-blocking): document that `Conversation.groupId` remains **out** of v1.1 unless a measured inbox-query need appears later.

---

## What would have forced REQUIRES REDESIGN (not found)

- Putting `groupId` on `Conversation` as SoT instead of Channel bridge
- Treating leave conversation as hard-delete
- Merging Forums/Community tables into this amendment
- Requiring `MessageType.POLL` before polls can exist
- Cascading Group delete into Conversation/Message destruction
- Breaking DIRECT with mandatory GroupMember

None of these appear in the proposal.

---

## Gate

| Step | Status after this review |
|------|--------------------------|
| Architecture Review of DB amendment | **Complete** |
| Apply minor locks above into Freeze v1.1 declaration | Next (docs only) |
| Migration / Prisma | Still blocked until Freeze bump + explicit authorization |
| OpenAPI clear `future` | Still blocked |
| Sprint 9.3 implementation | Still blocked |

---

## Decision

**APPROVED WITH MINOR CHANGES**
