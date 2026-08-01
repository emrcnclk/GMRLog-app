# GMRLOG — Sprint F2.5.1: Gamer Identity Refinement

**Document:** `docs/02_DESIGN/SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F2.5.1 (Identity refinement only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director / Product Philosophy  
**Classification:** Amendment to Gamer Identity Profile SSOT

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) |
| 4 | [`SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md`](./SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md) — **base Profile freeze** |
| 5 | **This amendment** — Digital Home & lifelong identity depth |

### Amendment rules

- **F2.5 remains the authority** for section hierarchy, Hero, Current Journey, Favorites, Stats placement, Social non-dominance, and structural composition.
- This document **strengthens identity philosophy** until the Profile is unmistakably GMRLOG.
- On conflict of *Digital Home / DNA / Legacy / Seasons / Known For reputation / Identity Shelf*: **this amendment wins**.
- On conflict of *section order / screens / stacks*: **F2.5 + F2.1 win** — **do not move sections or create new screens**.
- **Do not** redesign the Profile, invent scoring algorithms, add AI, or continue to F2.6.

**Out of scope:** UI, layout, React Native, Figma, backend, progression algorithms, recommendation logic.

---

## Mission

The Profile is **not** a social profile, statistics page, or Steam profile.

It is the **permanent home of a player’s gaming life**.

Everything the player creates eventually **lives here**.

### Core principle (LOCKED)

| Is | Is not |
|----|--------|
| **Home** | Dashboard |
| **Identity** | Popularity |
| **Journey** | Numbers |

**Emotional goal:** After years, opening the Profile should feel:

> “This is **my gaming life**.”

Not:

> “This is my account.”

**Success:** Without showing follower count, the Profile still feels deeply personal — history, taste, identity, growth.

---

# 1. Digital Home

## 1.1 Concept

Introduce **Digital Home** (Master language made Profile-concrete):

The Profile is the **permanent destination** for everything the player creates in GMRLOG.

## 1.2 What lives here (architecture)

| Lives on Profile | Phase |
|------------------|-------|
| Reviews · Posts · Collections · Tier Lists · Achievements | Core (F2.5) |
| Future Articles · Guides · Videos · Creator Spaces | Reserved |
| Journey moments · Legacy · Seasons · Memories | This amendment (conceptual) |

## 1.3 Rules

- Create elsewhere (Home compose, Game Detail) → **resolve and archive to Profile**.  
- Profile is not a mirror of Feed; it is the **lasting home**.  
- No new top-level screens — depth attaches to existing F2.5 sections (Activity, Collections, Creator, etc.).  
- Aligns North Star “digital home of gaming culture” at the **person** scale.

## 1.4 Why

Without Digital Home, GMRLOG fragments into disposable posts. With it, the Profile becomes return gravity for a lifetime.

---

# 2. Identity Evolution

## 2.1 Philosophy

Players **evolve**. Profiles should reflect evolution — not a frozen signup persona.

Directional arc (illustrative, not a forced path):

```
Collector → Reviewer → Creator → Community Veteran
```

Other arcs exist (Explorer → Completionist, etc.). Evolution is **descriptive**, not gamified rank.

## 2.2 Rules

| Rule | Freeze |
|------|--------|
| No progression algorithm | No XP ladder, no forced “level up identity” |
| Evidence over decree | Evolution inferred from what they create over time — presentation philosophy only |
| Multiplicity | A player may hold several identity facets at once (F2.5 Gaming Identity chips) |
| Continuity | Onboarding Gaming Style (F2.2.1) is the seed; Profile is the garden |

## 2.3 Why

Steam profiles stagnate as badge walls; social apps chase clout. GMRLOG shows **growth of taste and craft**.

---

# 3. Gamer DNA

## 3.1 Concept

**Gaming DNA** describes **how** the player enjoys games — not only **what** they played.

## 3.2 Example dimensions (architecture)

- Favorite genres  
- Favorite mechanics  
- Favorite themes  
- Favorite pacing  
- Favorite studios  
- Favorite worlds  
- Favorite difficulty  

## 3.3 Rules

- **No AI** generation in this freeze.  
- **No recommendation logic** here — DNA is identity language, not an engine brief.  
- Player-authored and/or community-reflected over time — implementation deferred.  
- Surfaces conceptually under **Identity** / **Favorites** (F2.5) — no new section slot, no reorder.  
- Complements Game “Known For” (F2.4.1): Known For = game personality; DNA = **player** personality.

## 3.4 Why

Transforms Profile from library inventory into **taste physics** — Letterboxd-depth behavior without copying UI.

---

# 4. Identity Shelf

## 4.1 Concept

A **permanent showcase** curated by the player — the pride shelf of Digital Home.

## 4.2 Examples

- Favorite Review  
- Favorite Collection  
- Favorite Tier List  
- Favorite Game  
- Future Favorite Article  
- Future Favorite Screenshot  

## 4.3 Philosophy

| Prefer | Avoid |
|--------|-------|
| Player-curated meaning | Auto-top by likes |
| Few permanent pins | Infinite featured spam |
| Story (“why this is mine”) | Vanity metrics on the shelf |

## 4.4 Rules

- Architecture only — may live inside **Favorites** / Featured Collection / Hero-adjacent showcase **without moving F2.5 section order**.  
- Kinship with F2.5 Featured Collection / Featured Tier List.  
- Premium may expand pin count later — core shelf exists without paywall (Creator Economy ethics).

## 4.5 Why

Gives every Profile a unique silhouette even when follower count is hidden.

---

# 5. Legacy

## 5.1 Philosophy

The Profile **preserves history** — Digital Home includes the first chapter, not only the latest.

## 5.2 Examples (architecture)

- First Game Logged  
- First Review  
- Longest Journey  
- Oldest Collection  
- First Platinum  
- 100th Review  
- 5-Year Anniversary  

## 5.3 Rules

- Emotional Moments date language (F2.4.1).  
- Surfaces as identity moments inside **Activity** / Achievements / return hooks — no new screen.  
- Never bury legacy behind Premium.

## 5.4 Why

Years later, Legacy is what makes “my gaming life” feel true.

---

# 6. Seasons

## 6.1 Philosophy

Gaming changes over time. Profiles should hold **seasonal memories** — chapters of taste.

## 6.2 Examples (directional)

- Summer 2025 — Mostly JRPG  
- Winter 2026 — Horror Marathon  
- Spring 2027 — Indie Exploration  

## 6.3 Rules

- Conceptual chapters over calendar eras — not a forced check-in product.  
- May summarize Favorites / Activity / DNA shifts — **no algorithm specified**.  
- Presentation later inside Activity or Memory surfaces — **no section reorder**.

## 6.4 Why

Seasons make evolution visible without a rank ladder.

---

# 7. Memories (“On This Day”)

## 7.1 Concept

Introduce **On This Day** memory cues — private-first, shareable optional.

## 7.2 Examples

- Two years ago — You completed Elden Ring.  
- Three years ago — You published your first review.  
- One year ago — You created your favorite collection.  

## 7.3 Rules

- **No implementation** in this sprint.  
- Architecture: soft return hook / Activity identity moment (F2.5 return hooks kinship).  
- Calm, never notification harassment.  
- Spoiler care when surfacing story beats.

## 7.4 Why

Transforms Profile from static page into a place that **remembers with you**.

---

# 8. Reputation

## 8.1 Replace popularity philosophy

Followers **remain** (F2.5 Social — non-dominant).

Identity reputation comes from **Known For** — not follower score.

## 8.2 Examples

- Known for Reviews  
- Known for RPG Collections  
- Known for Community Help  
- Known for Horror Lists  
- Known for Great Guides  

## 8.3 Rules

| Rule | Freeze |
|------|--------|
| No scoring system | No reputation points, no Elo, no public grade |
| Qualitative | Labels / facets, community- and craft-reflected over time |
| Placement | Under Identity / Social tertiary — never Hero primary |
| Align | F2.4.1 Known For (games) · F2.5 Gaming Identity (self) — Reputation = **how others know you** |

## 8.4 Why

Identity before popularity — success test without follower count still feels personal.

---

# 9. Creator Evolution

## 9.1 Rule

The Profile must naturally expand toward **Creator Economy**.

**The profile grows vertically, never sideways.**

| Vertical growth | Forbidden sideways growth |
|-----------------|---------------------------|
| Deeper Creator section content | New bottom tabs for creators |
| More craft types in the same home | Separate “Creator app” chrome |
| Articles → Guides → Series under Creator | Parallel competing profile products |

## 9.2 Reserved (no redesign)

Articles · Guides · Video Essays · Walkthroughs · Developer Diaries · Lore  

Same Content object family (Master · F2.3.1 · F2.4 · F2.5). Premium enhances spaces — never locks the Digital Home story.

## 9.3 Why

Creator is a **chapter of identity evolution**, not a bolt-on product.

---

# 10. Emotional Audit

Before Profile UI sign-off:

- [ ] Feels like Digital Home — permanent destination for creations  
- [ ] Home / Identity / Journey — not Dashboard / Popularity / Numbers  
- [ ] Identity Evolution expressible without progression algorithm  
- [ ] Gamer DNA: how they enjoy games — no AI / no reco engine in this freeze  
- [ ] Identity Shelf: player-curated showcase philosophy  
- [ ] Legacy moments preserve firsts and anniversaries  
- [ ] Seasons as taste chapters  
- [ ] On This Day memories architected (unimplemented)  
- [ ] Reputation = Known For — no scoring; followers non-dominant  
- [ ] Creator grows vertically, never sideways  
- [ ] “My gaming life” emotional goal holds after years  
- [ ] Deeply personal **without** follower count  
- [ ] F2.5 section order **unchanged** — no new screens  
- [ ] Communicates history, taste, identity, growth  

---

## Amendment summary vs F2.5

| Area | Change |
|------|--------|
| Digital Home | **New** permanent-destination framing |
| Identity Evolution | **New** growth philosophy (no algo) |
| Gamer DNA | **New** how-they-play identity |
| Identity Shelf | **New** curated showcase philosophy |
| Legacy · Seasons · Memories | **New** lifelong memory layer |
| Reputation | **Refine** Known For over popularity |
| Creator Evolution | **Strengthen** vertical growth rule |
| Section hierarchy / screens | **Unchanged** |

---

## Final gate

### APPROVED

**Sprint F2.5.1 Gamer Identity Refinement LOCKED**

Part of the **Gamer Identity Profile SSOT** together with F2.5.

Stop. Do **not** continue to Sprint F2.6.

---

## Related documents

| Doc | Role |
|-----|------|
| [SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md](./SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md) | Base Profile freeze |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Digital Home · Creator Economy |
| [SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md](./SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md) | Journey · Known For · Memories kinship |
| [SPRINT_F2_2_1_AUTH_POLISH.md](./SPRINT_F2_2_1_AUTH_POLISH.md) | Gaming Style seed |
| [SPRINT_F2_13_REPUTATION_RECOGNITION.md](./SPRINT_F2_13_REPUTATION_RECOGNITION.md) | Known For expansion · anti-gamification |
| [SPRINT_F2_20_SETTINGS_PERSONALIZATION.md](./SPRINT_F2_20_SETTINGS_PERSONALIZATION.md) | Digital Home personalization · identity controls |
| [SPRINT_F2_14_ACHIEVEMENT_LEGACY.md](./SPRINT_F2_14_ACHIEVEMENT_LEGACY.md) | Legacy · journey · achievement-as-memory |
| [SPRINT_F2_21_EXTERNAL_INTEGRATIONS_ECOSYSTEM.md](./SPRINT_F2_21_EXTERNAL_INTEGRATIONS_ECOSYSTEM.md) | Native identity · not borrowed Steam profile |
| [F3_7_PROFILE_IDENTITY_LIBRARY_EXPERIENCE.md](../03_UX/F3_7_PROFILE_IDENTITY_LIBRARY_EXPERIENCE.md) | Digital Home experience feel |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Digital Home, evolution, DNA, Identity Shelf, Legacy, Seasons, Memories, Known For reputation, vertical creator growth |
