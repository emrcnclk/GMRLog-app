# Social Actions (D3.24)

**Document:** `docs/07_SOCIAL/SOCIAL_ACTIONS.md`  
**Status:** **PLANNED** — D3.24 v1.2 · Quote System v2  
**Authority:** Posts Freeze amendment · [`SOCIAL_POSTS_V2.md`](./SOCIAL_POSTS_V2.md)

---

## Repost

```
POST  →  REPOST
```

Idempotent per (actor, originalPost). Notify `repost`.  
API: `POST /posts/:id/repost` · Table: `reposts`.

---

## Quote System v2

Quote is **not limited to posts**.

Any supported culture object can be the **quote target**:

| Target | SoT |
|--------|-----|
| Post | Posts |
| Review | Reviews |
| Collection | Collections |
| Guide | Guide posts |
| Achievement | Achievements |
| Screenshot | Screenshot posts |
| Tier List | Tier lists |

```
Original (any target)
    ↓
Quote (+ commentary)
    ↓
Appears as User Generated in Hybrid Feed
```

### Examples

```
Original Review  →  Quote: "I completely disagree."
Original Tier List  →  Quote: "My own ranking"
```

Purpose: strengthen debate with first-class culture objects — not empty dunk threads.

### Rules

| Rule | Detail |
|------|--------|
| Target | Required `targetType` + `targetId` from catalog above |
| Body | Non-empty commentary (product min length) |
| AuthZ | Quoter must see target; readers resolve target with their AuthZ |
| Depth | Quote-of-quote capped |
| Notify | `quote` → target owner (**default ON**) |
| Ownership | Quote references target — never mutates it |
| Repost vs Quote | Repost = post-only amplify; Quote = multi-target + commentary |

### Physical model (prefer)

Dedicated quote row or Post with:

- `targetType` · `targetId` (polymorphic)  
- `body`  
- optional `quotedQuoteId` for nesting  

Do **not** invent parallel SoT for Review/Collection. Document in S2 gap.

API options (pick one at OpenAPI change-control):

- `POST /quotes` `{ targetType, targetId, body }`  
- or `POST /posts/:id/quote` for posts + `POST /reviews/:id/quote` etc. — prefer **single `/quotes`** to avoid path sprawl.

Event matrix: `post.quote.created.v1` generalized or `quote.created.v1` — amend `POSTS_EVENT_MATRIX` / social events under change-control.

---

## Bookmark

Private. `GET /bookmarks`.  
Notify: **default OFF**.

---

## Share

Copy Link · Native · Discord · X · Reddit (client).

---

## Pin Post

1 pinned post per user on profile.

---

## Blocks / mutes

No quote/repost notify across blocks.

---

## Test Gate

Repost · Quote each target type · Bookmark · Pin.
