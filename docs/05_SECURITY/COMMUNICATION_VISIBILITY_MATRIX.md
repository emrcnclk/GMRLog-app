# Communication Visibility Matrix

**Document:** `docs/05_SECURITY/COMMUNICATION_VISIBILITY_MATRIX.md`  
**Status:** **Frozen — Communication Platform Freeze v1.0** (Sprint 9.0.1)

---

## Visibility classes

| Class | Meaning |
|-------|---------|
| Private Conversation | DIRECT or private group channel — only participants |
| Public Group | Discoverable; join open |
| Invite Only Group | Limited/no discover card; join via invite |
| Hidden Group | Not discoverable; members only (stricter than invite-only) |
| Muted | User suppresses notifications; content still readable if participant |
| Blocked | Social block either direction — no DM create/send; private reads behave as non-participant |
| Archived | Hidden from default inbox; still readable via id if participant |

### Group visibility product semantics (9.3+)

| Visibility | Discover (`/groups/discover`) | Join |
|------------|-------------------------------|------|
| `PUBLIC` | Listed | Self-join |
| `PRIVATE` | Omitted | Invite or approval only (same join gate as invite-only for v1) |
| `INVITE_ONLY` | Optional limited card / omitted | Valid invite required |
| `HIDDEN` | Omitted | Members only; invite may still exist but never listed |

---

## Normative decision — DM / block privacy (Freeze v1.0)

**Single rule:** For private communication resources, if the caller is not an authorized active participant **or** a Social block exists in either direction that denies the action, respond with **404** (ProblemDetails `CONVERSATION_NOT_FOUND` / `MESSAGE_NOT_FOUND` as applicable).

| Attempt | HTTP | Notes |
|---------|------|-------|
| Get conversation / messages as non-participant | **404** | Never 403 |
| Create DIRECT when blocked (either direction) | **404** | Never 403 that reveals a block |
| Send message when blocked / left | **404** | Same as non-participant |
| List inbox | Omit blocked/left threads | No error |

**Friend-gate:** Not required in Sprint 9.1. Primary spam control = rate limits + block. Optional friend-only DM is a future product flag — not assumed by implementors.

This matches Lists/Tier Lists private-resource convention (404 over 403).

---

## Read visibility

| Resource | Who can read |
|----------|--------------|
| DIRECT conversation | Active participants only |
| Group channel messages | Group members who can access that channel (via derived ConversationMember) |
| Public group profile | Anyone (authenticated or public discover) |
| Private / invite-only / hidden group profile | Members (+ limited invite holder card where documented) |
| Message search hits | Same as message read scope — never cross-tenant |

---

## Write visibility

| Attempt | Result |
|---------|--------|
| Create DIRECT with blocked user | **404** |
| Send after block / leave | **404** |
| Mention muted user | Allow write; suppress notification |
| Discover PRIVATE/HIDDEN groups | Omitted from `/groups/discover` |

---

## Channel kind nuances

| Kind | Visibility notes |
|------|------------------|
| GENERAL | All members |
| ANNOUNCEMENTS | All members read; write restricted to MOD/OWNER |
| MEDIA / STRATEGY / LFG | All members (LFG transport only — Community owns matching/lobby product) |
| VOICE | Future; membership same as channel |

---

## Archive / mute / leave

| State | Inbox | History | Notifications |
|-------|-------|---------|---------------|
| Muted | Visible | Readable | Off |
| Archived | Hidden (default list) | Readable via id | Off unless unmuted |
| Left (`leftAt` set) | Hidden | Not readable (404) | Off |

Archived + new message: conversation may reappear in inbox on next read refresh if product chooses “unarchive on activity”; **9.1 default:** stay archived until user clears `archived` (no auto-unarchive). Unread may still increment in DB for badge logic in 9.5.

---

## Cross-domain rule

DM and private channel **message bodies must never** appear in Feed or public Search. Mentions notify only the mentioned user (and respect mute/block).
