# GMRLOG — Sprint F2.6: Library & Collections Architecture

**Document:** `docs/02_DESIGN/SPRINT_F2_6_LIBRARY_COLLECTIONS.md`  
**Version:** 1.1  
**Status:** **LOCKED** · **Amended by MVP Final Integration Amendment** (§17)  
**Sprint:** F2.6 (Library architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director / Information Architecture  
**Classification:** Frozen Library & Collections experience

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) |
| 4 | [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) |
| 5 | [`SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md`](./SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md) + [`SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md`](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) |
| 6 | [`SPRINT_F2_4_GAME_EXPERIENCE.md`](./SPRINT_F2_4_GAME_EXPERIENCE.md) + [`SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md`](./SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md) |
| 7 | **This document** — Library & Collections freeze |

**Scope:** Complete Library experience architecture — hierarchy, philosophies, collection/tier relationships.  
**Out of scope:** React Native, Figma pixels, backend, storefront/pricing, launcher behavior, Sprint F2.6.1+.

**Placement (F2.1):** Tab `library` · `LibraryStack` · deep links `gmrlog://library`, wishlist/backlog paths.  
**Signatures (F1):** Game Card · Collection Shelf · Tier List Card · Completion Arc.

**Relationship to Profile:** Profile is **Digital Home** (identity story). Library is the **personal gaming archive** (operational + curated archive). Same objects; different jobs. Profile showcases identity; Library manages and browses the archive.

**Gate:** Stop after freeze. Do **not** continue to Sprint F2.6.1 in this deliverable.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Philosophy |
| 2 | Library Hierarchy |
| 3 | Continue Playing |
| 4 | Current Journey |
| 5 | Favorites |
| 6 | Backlog |
| 7 | Wishlist |
| 8 | Collections |
| 9 | Tier Lists |
| 10 | Hidden Archive |
| 11 | Search & Filters |
| 12 | Statistics |
| 13 | Game Graph |
| 14 | Creator Expansion |
| 15 | Premium Expansion |
| 16 | Library Audit Checklist |

---

# 1. Philosophy

## 1.1 What the Library is

| Not | Is |
|-----|-----|
| Game launcher | **Personal gaming archive** |
| Purchase history | **Games that define and accompany you** |
| Steam library clone | Culture OS **Library pillar** — ownership optional, meaning required |

## 1.2 Core question

The Library answers:

> **What games define me?**

Not:

> What games do I own?

Ownership may exist as a signal; it is never the organizing purpose.

## 1.3 Success criterion

Without the logo, Library communicates:

> “This is a **personal gaming archive**.”

Not:

> “This is another game launcher.”

## 1.4 Pillars

| Pillar | Role in Library |
|--------|-----------------|
| Library | Primary home |
| Logging | Continue Playing · Journey · statuses |
| Identity | Favorites · shelves · tiers (archive side) |
| Discovery | Wishlist aspiration · related via graph |
| Social | Collaborative collections (future) — never launcher social |

---

# 2. Library Hierarchy

## 2.1 Locked order

```
1.  Continue Playing
2.  Current Journey
3.  Favorites
4.  Recently Logged
5.  Recently Completed
6.  Backlog
7.  Wishlist
8.  Collections
9.  Tier Lists
10. Hidden Archive
11. Statistics
```

Hub may use segments/scroll sections; order of meaning stays locked.

## 2.2 Why each section

| Section | Why |
|---------|-----|
| **Continue Playing** | Always first — living relationship, resume journey (not “launch”) |
| **Current Journey** | Answers *what am I living right now?* before the whole archive |
| **Favorites** | Permanent identity anchors — define-me games |
| **Recently Logged** | Fresh logging pulse — archive feels alive |
| **Recently Completed** | Closure & memory — Journey kinship |
| **Backlog** | Intentional future play — not shame pile |
| **Wishlist** | Aspiration — not commerce |
| **Collections** | Curated museum — player authorship |
| **Tier Lists** | Opinion structures — taste, not leaderboards |
| **Hidden Archive** | Soft-private history — never delete identity |
| **Statistics** | Summarize **the library**, not the person (Profile keeps player identity stats) |

**Why Continue + Journey before Favorites:** Presence before permanence.  
**Why Hidden near end:** Available, not centered.  
**Why Stats last:** Facts after meaning — same pattern as Game Detail.

---

# 3. Continue Playing

## 3.1 Always first

| Include | Intent |
|---------|--------|
| Current sessions | What is in motion |
| Progress | Completion Arc / % / status |
| Last played | Emotional Moments language preferred |
| Resume Journey | Primary CTA → Game Detail Personal / Log — **not** “Launch game” |

## 3.2 Anti-launcher rule

No install/run/store CTA as the defining verb. GMRLOG resumes **relationship** (log, review, continue journey), not an executable.

---

# 4. Current Journey

## 4.1 Job

Immediately show:

> **What am I living right now?**

## 4.2 Examples

| State | Meaning |
|-------|---------|
| Playing | Active |
| Paused | Intentional pause (not abandoned) |
| Review Pending | Voice unfinished — gentle prompt |
| Near Completion | Momentum without guilt |
| Recently Finished | Soft bridge to Recently Completed |

Aligns Profile Current Journey and Game Journey philosophy — Library is the **operational mirror**.

---

# 5. Favorites

## 5.1 Permanent identity

Favorites are **define-me** games — not a ranked pressure board.

| Surface | Role |
|---------|------|
| Favorite Games | Core |
| Favorite Series | Franchise identity |
| Favorite Universes | Future culture OS |

## 5.2 Rules

- Player-authored order; no forced ranking competition.  
- Shared with Profile Favorites conceptually (one identity, two surfaces).  
- Covers + Completion Arc where meaningful (F1).

---

# 6. Backlog

## 6.1 Philosophy

Backlog is **intentional**, not forgotten.

| Differentiate | Meaning |
|---------------|---------|
| **Planned** | I mean to play this |
| **Waiting** | Blocked (sequel, friends, mood, release) |
| **Paused** | Started; resting on purpose |
| **Abandoned** | Soft end — may move toward Hidden Archive; identity preserved |

## 6.2 Rules

- No shame copy (“you’ll never finish”).  
- Abandoned ≠ deleted.  
- Filters may use these intents (architecture).

---

# 7. Wishlist

## 7.1 Philosophy

Wishlist is **aspiration**, not commerce.

## 7.2 Rules

| Forbidden | Required spirit |
|-----------|-----------------|
| Pricing | Desire & curiosity |
| Storefront language | “Want to experience” |
| Buy CTAs as primary | Add to backlog / notify cultural cues later — not shop |

Purchase links, if ever, stay outside Library core identity (Master: not a store).

---

# 8. Collections

## 8.1 Role

Collections are the player’s **curated museum** — Collection Shelf signature (F1).

## 8.2 Visibility & modes

| Mode | Intent |
|------|--------|
| **Private** | Personal archive only |
| **Public** | Shared taste |
| **Collaborative** | Future co-curation |
| **Featured** | Pride shelf / Identity Shelf kinship (F2.5.1) |

## 8.3 Types (architecture)

| Type | Intent |
|------|--------|
| **Series** | Franchise arcs |
| **Seasonal** | Seasons memory (F2.5.1) |
| **Theme** | Mood / motif |
| **Challenge** | Self-set journeys |

## 8.4 Relationships

- Collection ↔ Games (graph required).  
- Collection ↔ Profile Digital Home (permanent home of creations).  
- Collection ↔ Game Detail “Appears in”.  
- Collection ↔ Feed Collection Shelf cards.  
- Featured ↔ Identity Shelf favorite collection.

---

# 9. Tier Lists

## 9.1 Philosophy

Tier Lists are **opinions**, not rankings-as-competition.

No leaderboard energy. S-tier ember underline remains taste punctuation (F1).

## 9.2 Modes

| Mode | Intent |
|------|--------|
| **Personal** | My opinion structure |
| **Community** | Surfaced public tiers about sets of games |
| **Featured** | Showcase on Library / Profile |
| **Collaborative** | Future |

## 9.3 Relationships

Tier ↔ Games graph · Profile Tier section · Game Detail “ranked in” · Feed Tier Card.

---

# 10. Hidden Archive

## 10.1 Purpose

Reserve space for soft-private history **without deleting identity**.

| May include | |
|-------------|-|
| Dropped | |
| Hidden | |
| Embarrassing backlog | |
| Private memories | |

## 10.2 Rules

- Never hard-delete journey by default — hide / archive.  
- Accessible to owner; not public by default.  
- Calm entry — not a guilt folder at the top of Library.

---

# 11. Search & Filters

Architecture only — universal Library search within tab.

| Filter examples | |
|-----------------|-|
| Genre · Platform · Year | |
| Completion · Rating · Status | |
| Developer · Series · Tags | |
| Mood | Future |

Compose with Discover universal search (F2.1) — Library search is **archive-scoped**; Discover is platform-scoped.

---

# 12. Statistics

## 12.1 Split from Profile

| Library Statistics | Profile Statistics |
|--------------------|--------------------|
| Summarize **the library** (counts by status, completion in archive, shelf totals) | Summarize **the player identity** (taste, reputation facets, life metrics) |

No charts required in this sprint. Stats section stays last.

---

# 13. Game Graph

Library remains fully connected:

Reviews · Posts · Collections · Tier Lists · Achievements · Articles (future) · Guides (future)

Every row/card → Game Detail hub (F2.4). No isolated launcher tiles.

---

# 14. Creator Expansion

Reserve without redesign:

| Reserved | |
|----------|-|
| Curated Shelves | |
| Editorial Collections | |
| Reading Lists | |
| Challenge Lists | |

Vertical growth inside Collections / Creator-adjacent types — not new Library tabs that fork the product (F2.5.1 vertical rule kinship).

---

# 15. Premium Expansion

Reserve **without changing architecture hierarchy**:

| Enhancement | |
|-------------|--|
| Smart Shelves | |
| Advanced Filters | |
| Pinned Shelves | |
| Custom Ordering | |

Enhances archive power; core archive complete without paywall. No storefront Premium.

---

# 16. Library Audit Checklist

- [ ] Personal gaming archive — not launcher / Steam / purchase history  
- [ ] Answers “What games define me?”  
- [ ] Hierarchy: Continue Playing first → … → Hidden → Stats  
- [ ] Resume Journey — no launcher primary CTA  
- [ ] Current Journey shows living-now states  
- [ ] Favorites permanent; no ranking pressure  
- [ ] Backlog intentional (Planned / Waiting / Paused / Abandoned)  
- [ ] Wishlist aspiration — no pricing / storefront language  
- [ ] Collections as museum (private/public/types/featured)  
- [ ] Tier Lists as opinions, not competitive rankings  
- [ ] Hidden Archive preserves identity  
- [ ] Search/filters archive-scoped  
- [ ] Stats summarize library, not player (Profile split)  
- [ ] Full game graph continuity  
- [ ] Creator + Premium reserved without hierarchy break  
- [ ] Screenshot reads “personal archive” without logo  
- [ ] F1 Shelf / Game Card / Tier / Arc used  
- [ ] F2.1 LibraryStack / deep links respected  
- [ ] Profile Digital Home relationship clear  
- [ ] No RN / Figma / backend / F2.6.1 in this sprint  
- [ ] Library Import optional · consent-based · never overwrites authored meaning (§17)  

---

# 17. MVP Final Integration Amendment — Library Import (Steam)

**Amendment:** MVP Final Integration Amendment (July 2026). Library remains a **personal archive**, never a launcher (§1). Import reduces manual effort; it never becomes the Library's identity.

## 17.1 What exists in MVP

| Element | Role |
|---------|------|
| Library Import entry | A child of the Library hub where the player chooses to import owned games |
| Import task | Consent · honest progress · resolvable conflicts · resumable |
| Imported games | Ordinary archive entries — they enter shelves like any other game |
| Ownership signal | Context only (F2.21 §20.1) — the meaning stays in logging, reviews and collections |

## 17.2 MVP laws

| Law |
|-----|
| Import is optional: a fully manual library is a first-class library |
| Import never overwrites player-authored status, notes, reviews, collections or tier lists |
| Hidden Archive and privacy rules (§10) apply to imported entries identically |
| Wishlist remains aspiration — import never introduces pricing or storefront language (§7) |
| Import bursts are summarized in Home activity, never emitted as one item per game (F5.2 §6.4) |
| Disconnecting a source does not delete the player's archive |

## 17.3 Architecture references

| Reference | Contains |
|-----------|----------|
| F5.1 §34 | Library Import placement |
| F5.3 | Library Import screen · Steam Library Import task |
| F5.4 §42.1.2 | Import behavior contract |
| F2.21 §20.1 | Steam as an optional guest |

---

## Success criteria

| Criterion | Met |
|-----------|-----|
| Archive not launcher | Yes |
| Define-me over own-me | Yes |
| Collections museum + tiers as opinion | Yes |
| Compose from F1 + prior freezes | Yes |

---

## Final gate

### APPROVED

Sprint F2.6 Library & Collections Architecture is **LOCKED**.

Stop. Do **not** continue to Sprint F2.6.1.

---

## Related documents

| Doc | Role |
|-----|------|
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Library pillar |
| [SPRINT_F1_FOUNDATION.md](./SPRINT_F1_FOUNDATION.md) | Collection Shelf · Game Card · Tier |
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | LibraryStack |
| [SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) | Digital Home · Identity Shelf · Seasons |
| [SPRINT_F2_4_GAME_EXPERIENCE.md](./SPRINT_F2_4_GAME_EXPERIENCE.md) | Game hub from every row |
| [SPRINT_F2_21_EXTERNAL_INTEGRATIONS_ECOSYSTEM.md](./SPRINT_F2_21_EXTERNAL_INTEGRATIONS_ECOSYSTEM.md) | Library sync as signal · not ownership |
| [F3_7_PROFILE_IDENTITY_LIBRARY_EXPERIENCE.md](../03_UX/F3_7_PROFILE_IDENTITY_LIBRARY_EXPERIENCE.md) | Library-as-memory experience |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Archive philosophy, hierarchy, backlog/wishlist, collections museum, hidden archive, graph, creator/premium ready |
| 1.1 | July 2026 | **MVP Final Integration Amendment** — §17 added: Library Import (Steam Sync) as an optional consent-based entry with import task; archive-not-launcher philosophy and hierarchy unchanged |
