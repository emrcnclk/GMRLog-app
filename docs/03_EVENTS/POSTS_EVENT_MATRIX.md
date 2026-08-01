# Posts Event Matrix

**Document:** `docs/03_EVENTS/POSTS_EVENT_MATRIX.md`  
**Status:** **Frozen — Posts Platform Freeze v1.0** (Sprint 16.1) + Sprint 16.2 runtime names  
**Bus:** `DomainEventPublisher` (in-process v1; outbox deferred)  
**Rule:** Posts publishes **post lifecycle + engagement** only. Peers consume. Do not invent undeclared names.

---

## Rules

1. Runtime names in this matrix are normative once implementation ships.  
2. Payload = **ids + enums + counts** — never secrets, tokens, raw email, or full media binaries.  
3. Body text may be omitted from events; consumers that need preview use Posts read port with AuthZ.  
4. Notifications **must not** be sync-written from Posts services.  
5. Feed / Search / Analytics **consume** — they do not publish `post.*` as SoT.  
6. Gap protocol: missing consumer need → amend this matrix — do not invent ad hoc.

---

## Publisher events — Posts BC (MVP)

| Versioned name | When | Normative payload fields |
|----------------|------|--------------------------|
| `post.created.v1` | After post persist | `postId`, `authorId`, `visibility`, `postType`, `gameId?`, `createdAt` |
| `post.updated.v1` | After author edit | `postId`, `authorId`, `visibility`, `updatedAt` |
| `post.deleted.v1` | After soft-delete | `postId`, `authorId`, `deletedAt` |
| `post.restored.v1` | After staff restore (Moderation port) | `postId`, `authorId`, `visibility`, `restoredAt` |
| `post.visibility.changed.v1` | After visibility change on update | `postId`, `authorId`, `from`, `to` |
| `post.liked.v1` | After like insert | `postId`, `actorId`, `likeCount` |
| `post.unliked.v1` | After like remove | `postId`, `actorId`, `likeCount` |
| `post.replied.v1` | After post comment create | `postId`, `replyId`, `authorId`, `parentId?`, `postAuthorId` |
| `post.reposted.v1` | After repost persist | `postId` (original), `repostId`, `actorId`, `shareCount` |
| `post.mention.created.v1` | After mention row(s) | `postId`, `authorId`, `targetUserId` |

Optional (may skip if not needed):

| Versioned name | When |
|----------------|------|
| `post.hashtag.attached.v1` | After hashtag link (analytics optional) |

---

## Consumers

| Consumer | May consume | Must not |
|----------|-------------|----------|
| **Feed** | `post.created.v1`, `post.updated.v1`, `post.deleted.v1`, `post.restored.v1`, `post.reposted.v1` | Store post body as Feed SoT; invent ranking ML |
| **Search** | `post.created.v1`, `post.updated.v1`, `post.deleted.v1` | Own Post table |
| **Notifications** | `post.mention.created.v1`, `post.replied.v1`, `post.reposted.v1`, optional `post.liked.v1` | Sync-write from Posts; ignore prefs/blocks |
| **Moderation** | Indirect via reports; hide/restore via PostsModerationAdapter | Re-own post CRUD |
| **Analytics** | Allowlisted `post.*` after Analytics matrix amendment | Mutate Posts |
| **Achievements** | Optional later | Block Posts MVP |

Feed emits its own `feed.item.created.v1` after fan-out (Feed-owned) — not a Posts event.

---

## Explicit non-events (Freeze v1.0)

| Idea | Why forbidden |
|------|----------------|
| `post.ai.moderated.v1` | AI deferred |
| `post.translated.v1` | Deferred |
| `post.scheduled.v1` | Scheduling deferred |
| `post.quote.created.v1` | Quote deferred |
| `social.post.created.v1` duplicate | Use `post.created.v1` only |
| Sync Notification creates | Notification Freeze |
| `post.reply.created.v1` / `post.reply.deleted.v1` | Superseded by Sprint 16.2 `post.replied.v1` (delete reply deferred) |

---

## Related

- Freeze: [`POSTS_PLATFORM_FREEZE_v1.md`](../00_PROJECT/POSTS_PLATFORM_FREEZE_v1.md)  
- Architecture: [`POSTS_ARCHITECTURE.md`](../01_ARCHITECTURE/POSTS_ARCHITECTURE.md)
