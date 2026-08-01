# Posts Permission Matrix

**Document:** `docs/05_SECURITY/POSTS_PERMISSION_MATRIX.md`  
**Status:** **Frozen — Posts Platform Freeze v1.0** (Sprint 16.1)  
**AuthN:** Bearer JWT (same Auth issuer)  
**AuthZ:** resource ownership + `Visibility` + Social block/follow ports; staff via existing Moderation/Admin roles

---

## Roles

| Role | Meaning |
|------|---------|
| `ANON` | Unauthenticated |
| `USER` | Authenticated non-staff |
| `MODERATOR` / `ADMIN` | Staff (`PlatformRole`) |
| `SYSTEM` | Workers / consumers |

---

## Operations (logical — OpenAPI ids land in 16.2+)

| Action | ANON | USER (other) | Author | STAFF | SYSTEM |
|--------|------|--------------|--------|-------|--------|
| Create post | — | ✅ | ✅ | ✅ | — |
| Edit post | — | — | ✅ | —* | — |
| Soft-delete own post | — | — | ✅ | — | — |
| Soft-delete / hide via moderation port | — | — | — | ✅ | ✅ (job) |
| Get post (visible) | ✅** | ✅ | ✅ | ✅ | ✅ |
| Get post (not visible / deleted) | — | — | —† | ✅‡ | — |
| List author timeline (visible posts) | ✅** | ✅ | ✅ | ✅ | — |
| Reply / like / repost / mention | — | ✅*** | ✅ | ✅ | — |
| Report post | — | ✅ | — (self 403) | ✅ | — |
| Admin hard policy beyond soft-delete | — | — | — | ✅ (compose) | — |

\* Staff edit of body content **not** MVP — prefer hide + user edit.  
\** ANON only for `PUBLIC` posts; FOLLOWERS/PRIVATE → treat as missing.  
\*** Subject to block + visibility of parent post.  
† Author may GET own soft-deleted in MVP **optional** — default **404** for simplicity unless product unlocks “my deleted”. Freeze default: **404 for all non-staff** including author after delete.  
‡ Staff redacted preview via Moderation/Admin ports only.

---

## Cross-cutting rules

1. Rate limiting applies (Platform) — AuthZ ≠ unlimited posts.  
2. Uploads use Platform storage policy; Posts only stores references.  
3. No public “create notification” or “write FeedItem” API from Posts.  
4. SYSTEM consumers may read ids for fan-out/index without elevating to author.

---

## Related

- Visibility: [`POSTS_VISIBILITY_MATRIX.md`](./POSTS_VISIBILITY_MATRIX.md)  
- Freeze: [`POSTS_PLATFORM_FREEZE_v1.md`](../00_PROJECT/POSTS_PLATFORM_FREEZE_v1.md)
