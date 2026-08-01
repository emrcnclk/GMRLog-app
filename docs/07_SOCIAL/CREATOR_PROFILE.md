# Creator Profile (D3.24 v1.3)

**Document:** `docs/07_SOCIAL/CREATOR_PROFILE.md`  
**Status:** **PLANNED**  
**Authority:** F2.5 / F2.12 Creator · F5.1 profile-internal · [`PROFILE_V2.md`](./PROFILE_V2.md)

---

## Mission

Default profile is player-first. Some users are content creators — surface that without making every profile a channel.

---

## Surfaces

| Surface | Notes |
|---------|-------|
| Creator Badge | Deterministic eligibility (guides published · collection followers · helpful reviews) — not paid checkmark |
| Creator Followers | May reuse Follow graph; optional `creatorFollow` facet later — prefer single Follow + badge |
| Creator Collections | Filter profile collections flagged/curated as creator work |
| Creator Guides | Guide posts by author |
| Featured Posts | Author-pinned / featured set (cap N) |

---

## Eligibility (deterministic sketch)

Badge when thresholds met (product constants), e.g.:

- N published guides **or**  
- Collection with M followers **or**  
- Reputation `Helpful Reviewer` / `Strategy Expert`  

Revocable on moderation hide. No purchase path in D3.24.

---

## API

Profile payload additive fields: `creatorBadge?` · `featuredPostIds` · tabs already cover guides/collections.

---

## Explicit non-goals

Paid verification · influencer marketplace · ML “for you creators”.
