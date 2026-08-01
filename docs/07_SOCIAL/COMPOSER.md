# Composer (D3.24)

**Document:** `docs/07_SOCIAL/COMPOSER.md`  
**Status:** **PLANNED** — D3.24 v1.3 Composer++  
**Authority:** F5.2 · F2.3 FAB · [`SOCIAL_POSTS_V2.md`](./SOCIAL_POSTS_V2.md)

---

## Mission

One compose surface to share gaming life — text plus culture attachments — without becoming a content-farm dashboard.

Prompt: **What’s happening?** (F3.11 voice).

---

## Entry points

Home FAB · Game Hub · Community · Event · Profile · Quote/Reply.  
**No new bottom tab.**

---

## Composer++ attach matrix

```
Compose
  Text
  + Game
  + Screenshot
  + Review
  + Collection
  + Guide
  + Poll
  + Achievement
  + Event
```

| Attach | Behavior |
|--------|----------|
| Text | Body |
| Game | Sets `gameId` → Game Hub fan-in |
| Screenshot | Media upload → screenshot kind |
| Review | Handoff to Reviews BC **or** attach existing review ref |
| Collection | Attach existing collection |
| Guide | Create/attach guide post |
| Poll | Inline poll |
| Achievement | Pick earned achievement |
| Event | Attach existing **or** create-event handoff |
| Community | Optional target (`communityId`) |
| Spoiler | Flag |

Owning BCs remain SoT; composer **links / handoffs**, does not steal Review/Event aggregates.

---

## Drafts

Client drafts OK. Server drafts optional.

---

## Anti-patterns

Forced game attach · boost toggles · casino send motion · engagement-bait prompts.
