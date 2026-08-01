# Communities 2.0 (D3.24)

**Document:** `docs/07_SOCIAL/COMMUNITIES_2.md`  
**Status:** **PLANNED** — D3.24 · Revision R5  
**Authority:** F2.11 · F5.1 (Discover / deep-link — **not** a new bottom tab) · [`D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md`](./D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md)

---

## Mission

Communities gather around a **shared object of passion** — Steam Community + Reddit magazine mix. Not a Discord clone.

Gaming remains the protagonist (F2.11). **Realtime chat is out of D3.24.**

---

## Community tabs (R5)

A community is **not** only a post list. Community-internal sections:

| Tab | Content |
|-----|---------|
| **Posts** | Community posts / discussions |
| **Reviews** | Member reviews linked to community theme/games |
| **Collections** | Shared / tagged collections |
| **Guides** | Guide posts |
| **Events** | Community events |
| **Pinned** | Moderator/owner pinned objects |
| **Wiki** | Curated community knowledge pages |

Experience target: Steam Community hub + Reddit structure — without realtime channels.

API examples:

- `GET /communities/:id/feed?tab=posts|reviews|collections|guides|events|pinned`  
- `GET /communities/:id/wiki` · `GET|PUT /communities/:id/wiki/:slug`

---

## Wiki

| Rule | Detail |
|------|--------|
| Pages | Slug · title · body · updatedBy · version |
| AuthZ | Members read (if join allows); Moderator+ edit (configurable) |
| Not | Live chat · collaborative CRDT editor required in D3.24 |

Table: `community_wiki_pages`.

---

## Pinned

Community-scoped pins (distinct from user profile pin). Cap: product constant (e.g. small N).  
Table: `community_pins` (`communityId` · `objectType` · `objectId` · `position`).

---

## Roles

| Role | Powers (summary) |
|------|------------------|
| **Owner** | Full control · transfer · delete |
| **Admin** | Settings · roles · wiki · pins · events |
| **Moderator** | Remove posts · mute · approve joins · pin |
| **Member** | Post · RSVP · react · read wiki |

Prisma adds **`admin`** to `CommunityRole`.

---

## Join types

Public · Private · Invite Only (`joinType` column).

---

## Tags (closed catalog v1)

Soulslike · RPG · FPS · MMO · Strategy · Indie

---

## Permissions matrix (test gate)

| Action | Member | Moderator | Admin | Owner |
|--------|--------|-----------|-------|-------|
| Post | ✓ | ✓ | ✓ | ✓ |
| Edit wiki | * | ✓ | ✓ | ✓ |
| Pin | | ✓ | ✓ | ✓ |
| Delete others’ posts | | ✓ | ✓ | ✓ |
| Create event | ✓* | ✓ | ✓ | ✓ |
| Change roles / join type | | | ✓ | ✓ |
| Delete community | | | | ✓ |

\*Settings-dependent.

---

## Community reputation badges (v1.3)

In-community role/flair badges (distinct from global [`REPUTATION.md`](./REPUTATION.md)):

| Badge | Meaning |
|-------|---------|
| Founder | Community creator / owner |
| Moderator | Mod role |
| Top Contributor | Deterministic contribution score in community (posts · guides · wiki) |
| Verified Creator | Creator badge holders who contribute here |

Not paid. Not Discord nitro. Display on member list / posts.

---

## Notifications

`community_invite` · `community_accept` · `community_role` · `community_event` · `community_milestone`

---

## Explicit non-goals

Discord realtime chat · Voice · Guilds · Marketplace shops · AI digests.
