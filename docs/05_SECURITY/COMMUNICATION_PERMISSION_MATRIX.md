# Communication Permission Matrix

**Document:** `docs/05_SECURITY/COMMUNICATION_PERMISSION_MATRIX.md`  
**Status:** **Frozen — Communication Platform Freeze v1.0** (Sprint 9.0.1)  
**AuthN:** Bearer JWT  
**AuthZ model:** Participant + GroupRole (not Container owner)

---

## Roles

| Role | Scope |
|------|--------|
| `ANON` | Unauthenticated |
| `USER` | Authenticated |
| `PARTICIPANT` | Active `ConversationMember` (`leftAt` null) |
| `SENDER` | Message author |
| `GROUP_MEMBER` | Group membership (SoT: `GroupMember`) |
| `GROUP_MODERATOR` | Moderator role |
| `GROUP_OWNER` | Owner role |
| `PLATFORM_MOD` | Admin/moderation tooling (ADMIN_API) — not Communication public REST |

---

## Conversation / message actions

| Action | ANON | USER | PARTICIPANT | SENDER | GROUP_MOD | GROUP_OWNER | PLATFORM_MOD |
|--------|------|------|-------------|--------|-----------|-------------|--------------|
| List own inbox | — | ✅ | — | — | — | — | ✅ (admin tooling) |
| Create DIRECT | — | ✅* | — | — | — | — | — |
| Read conversation | — | — | ✅ | ✅ | ✅† | ✅† | ✅ (admin) |
| Send message | — | — | ✅ | ✅ | ✅† | ✅† | — |
| Edit own message | — | — | — | ✅ | — | — | — |
| Soft-delete own message | — | — | — | ✅ | — | — | ✅ |
| Soft-delete others’ message | — | — | — | — | ✅ | ✅ | ✅ |
| Like / react | — | — | ✅ | ✅ | ✅ | ✅ | — |
| Pin message | — | — | —‡ | — | ✅ | ✅ | ✅ |
| Bookmark | — | — | ✅ | ✅ | ✅ | ✅ | — |
| Report | — | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add participant (group-backed) | — | — | — | — | ✅ | ✅ | ✅ |
| **Leave** conversation | — | — | ✅ | ✅ | ✅ | ✅ | — |
| **Destroy** conversation | — | — | — | — | — | — | — (no public API) |

\* Subject to block policy → **404** if blocked (see Visibility Matrix). No friend-gate in 9.1.  
† Via channel membership implying derived conversation participation + GroupRole checks.  
‡ Announcement channels may allow owner-configured member pin — product flag.

Blocked / left: treat as non-participant → **404** on private resources.

---

## Leave vs kick vs delete

| Action | Who | Effect |
|--------|-----|--------|
| Leave | Self (PARTICIPANT) | `leftAt` on own `ConversationMember` |
| Kick / remove | GROUP_MOD / OWNER (9.3) | `leftAt` on target’s `ConversationMember` |
| Soft-delete message | SENDER or MOD | `Message.deletedAt` |
| Destroy conversation aggregate | — | Not exposed on public Communication API |

---

## Group / channel actions

| Action | MEMBER | MODERATOR | OWNER |
|--------|--------|-----------|-------|
| Read public group metadata | ✅ | ✅ | ✅ |
| Join PUBLIC group | ✅ (self) | ✅ | ✅ |
| Join PRIVATE / INVITE_ONLY | invite / approval | invite | invite |
| Invite (INVITE_ONLY / PRIVATE) | — | ✅ | ✅ |
| Create channel | — | ✅ | ✅ |
| Delete channel | — | ✅§ | ✅ |
| Post in GENERAL / LFG / MEDIA / STRATEGY | ✅ | ✅ | ✅ |
| Post in ANNOUNCEMENTS | — | ✅ | ✅ |
| Change member role | — | —¶ | ✅ |
| Transfer ownership | — | — | ✅ |
| Delete group | — | — | ✅ |

§ Moderators cannot delete system GENERAL without owner policy.  
¶ Moderators may kick MEMBERs; cannot demote OWNER.

---

## Polls

| Action | PARTICIPANT | MOD/OWNER |
|--------|-------------|-----------|
| Create poll | ✅ (if channel allows) | ✅ |
| Vote | ✅ | ✅ |
| Close poll early | — | ✅ |

---

## Implementation notes (9.1+)

- Controllers: **zero** authorization logic.
- `CommunicationPermissionService` (name TBD) checks participant membership first; then Social block for DIRECT; then GroupRole when Groups exist.
- GroupRole checks only after Groups land (9.3); until then only DIRECT + `ConversationMember`.
- ProblemDetails: `CONVERSATION_NOT_FOUND`, `MESSAGE_NOT_FOUND`, `FORBIDDEN` (for authenticated-but-wrong-role on **non-private** actions only), validation codes from ERROR_CODES.md.
- Private DM/channel denies use **404**, not `FORBIDDEN`.
