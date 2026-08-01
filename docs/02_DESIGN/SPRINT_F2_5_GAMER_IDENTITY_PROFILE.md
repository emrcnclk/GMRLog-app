# GMRLOG — Sprint F2.5: Gamer Identity Profile Architecture

**Document:** `docs/02_DESIGN/SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md`  
**Version:** 1.1  
**Status:** **LOCKED** · **Amended by MVP Final Integration Amendment** (§18)  
**Sprint:** F2.5 (Profile architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director / UX Architecture  
**Classification:** Frozen Gamer Identity Profile experience

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) |
| 4 | [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) |
| 5 | [`SPRINT_F2_3_HOME_FEED.md`](./SPRINT_F2_3_HOME_FEED.md) + [`SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md`](./SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) |
| 6 | [`SPRINT_F2_4_GAME_EXPERIENCE.md`](./SPRINT_F2_4_GAME_EXPERIENCE.md) + [`SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md`](./SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md) |
| 7 | **This document** — Gamer Identity Profile freeze |
| 7a | [`SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md`](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) — **LOCKED amendment** (Digital Home, DNA, Legacy, Known For reputation) |

**Profile SSOT** = this document + F2.5.1 identity refinement. Section order remains F2.5.

**Scope:** Definitive Profile product architecture — hierarchy, philosophy, section intent.  
**Out of scope:** React Native, Figma pixels, backend, algorithms, layout grids, Sprint F2.6+.

**Placement (F2.1):** `ProfileStack` · self via tab `profile` · other via `gmrlog://user/{username}`.  
**Signature (F1):** Gamer Identity Header composes Hero + Identity chrome.

**Amendment note:** Section order is **identity / journey first** (Current Journey · Favorites before vanity social). This refines earlier F2.1 Profile IA listings; **this document wins** for Profile hierarchy.

**Gate:** Stop after freeze. Do **not** continue to the next sprint in this deliverable.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Philosophy |
| 2 | Hero |
| 3 | Identity |
| 4 | Current Journey |
| 5 | Favorites |
| 6 | Statistics |
| 7 | Activity |
| 8 | Collections |
| 9 | Tier Lists |
| 10 | Achievements |
| 11 | Game Graph |
| 12 | Social |
| 13 | Creator |
| 14 | Premium Expansion |
| 15 | Return Hooks · Emotional Design |
| 16 | Identity Audit Checklist |

---

# 1. Philosophy

## 1.1 What the Profile is

| Not | Is |
|-----|-----|
| Social profile / Instagram page | **Player’s gaming identity** |
| Steam showcase of owned SKUs | **Gaming story** — journey, taste, memory |
| Follower vanity wall | Identity home (Master Digital Home) |

People should think:

> “This person has a **gaming story**.”

Not:

> “This is another social media account.”

## 1.2 Core principles (LOCKED)

| Principle | Meaning |
|-----------|---------|
| **Identity before popularity** | Taste and selfhood outrank follower counts |
| **History before vanity** | Journey / memory before flex metrics |
| **Journey before numbers** | Living relationship with games before dashboards |
| **Collections before followers** | Shelves and tiers are identity; social is secondary |

## 1.3 Success criterion

Without reading body text, the Profile should communicate:

> “This is a **unique gamer**.”

Screenshot-recognizable as GMRLOG via Identity Header, shelves, journey, graph — not a generic social chrome.

## 1.4 Self vs other

| Surface | Difference |
|---------|------------|
| **Self** | Settings · Premium · Creator tools · return hooks · edit identity |
| **Other** | Follow / Message · mutual context · no settings; same story hierarchy |

---

# 2. Profile Structure (hierarchy)

## 2.1 Locked order

```
1.  Hero
2.  Identity (Gaming Identity)
3.  Current Journey
4.  Favorites
5.  Statistics
6.  Activity
7.  Reviews
8.  Posts
9.  Collections
10. Tier Lists
11. Achievements
12. Game Graph
13. Friends / Social
14. Creator
15. Future Premium
(+ Settings entry for self — chrome, not a story section)
```

## 2.2 Why each section

| Section | Why |
|---------|-----|
| **Hero** | Orient who this gamer is — face, name, presence |
| **Identity** | Archetype / taste labels — “what kind of gamer” (Master) |
| **Current Journey** | Answer *what are they doing now?* — never static |
| **Favorites** | Permanent taste anchors before ephemeral activity |
| **Statistics** | Identity numbers — selective, not a dashboard hero |
| **Activity** | Living timeline of the story |
| **Reviews · Posts** | Voice artifacts (reviews as taste; posts as social) |
| **Collections · Tiers** | Curated identity — shelves before follower theater |
| **Achievements** | Identity milestones — not trophy case flex |
| **Game Graph** | Explicit hub of connected games/culture |
| **Friends / Social** | Belonging — never dominates |
| **Creator** | Future craft portfolio — reserved |
| **Premium** | Enhances identity expression — does not reorder story |

**Why Journey + Favorites before Activity:** Presence and taste beat infinite scroll of deeds.  
**Why Social late:** Identity before popularity.  
**Why Stats mid (not top):** Numbers support identity; they don’t define the first glance (aligns F1 Profile Header: taste over vanity counts).

---

# 3. Profile Hero

Hierarchy only — no layout.

| Element | Role |
|---------|------|
| **Avatar** | Primary identity mark (+ optional Completion Arc overall — F1) |
| **Banner** | Atmosphere / taste signal (art or calm surface) |
| **Display Name** | Human name |
| **Username** | Handle / deep link identity |
| **Bio** | Short self-story (not a resume dump) |
| **Current Status** | Presence / mood / “in a game” signal |
| **Platform badges** | Where they play — subtle |
| **Country · Languages** | Optional context — never required for belonging |
| **Member Since** | Emotional moment language preferred (F2.4.1) when shown |
| **Current Playing** | Live journey hook |
| **Current Completion** | Arc / progress on active title when relevant |

Composes **Gamer Identity Header** (F1). Actions: Follow / Message (other); Edit / Settings (self).

---

# 4. Identity (Gaming Identity)

## 4.1 Reframe

Prefer **Gaming Identity** over “Profile Information.”

This answers Master’s question: **What kind of gamer is this?**

## 4.2 Examples (architecture — not an algorithm)

Directional archetypes / chips (multi-select; player- and taste-derived):

- Explorer  
- Completionist  
- Reviewer  
- Collector  
- Builder  
- Story Lover  
- Strategy Fan  
- RPG Veteran  

Kinship with Auth onboarding **Gaming Style** (F2.2.1) and Game **Known For** (player language) — Profile holds the **person’s** identity vocabulary.

## 4.3 Rules

- No ranking algorithm in this freeze.  
- Editable in settings / onboarding revisit.  
- Purple identity accents only for Premium/Creator signals (Master color discipline) — archetypes themselves stay calm.

---

# 5. Current Journey

## 5.1 Job

Profile should immediately answer:

> **What is this player doing now?**

Journey never feels static (align F2.4.1 Journey philosophy).

## 5.2 Example blocks

| Block | Intent |
|-------|--------|
| Currently Playing | Active relationship |
| Recently Finished | Closure / memory |
| Review in Progress | Voice underway |
| Latest Collection | Fresh curation |
| Latest Tier List | Fresh ranking taste |
| Recent Achievement | Identity moment |

## 5.3 Rules

- Compact Presence-class rows / cards (F1 Activity DNA).  
- Living Activity sentence style (F2.3.1).  
- Emotional Moments date language (F2.4.1).  
- Empty: hopeful “Start a journey” / Log CTA for self — not barren.

---

# 6. Favorites

## 6.1 Philosophy

Favorites are **permanent taste anchors** — the bookshelf of identity — not trending widgets.

| Surface | Role |
|---------|------|
| Favorite Games | Core showcase (covers + Completion Arc where relevant) |
| Favorite Genres | Taste map |
| Favorite Developers | Authorship affinity |
| Favorite Characters | Future |
| Favorite Soundtracks | Future (culture OS — game music) |

## 6.2 Ordering

| Rule | Freeze |
|------|--------|
| Player-defined order | Default — identity is authored |
| Cap visible | Preview strip; “See all” for full |
| Games first | Strongest visual identity signal |
| Genres / developers | After games or as chips under Identity |

---

# 7. Statistics

## 7.1 Philosophy

Statistics are **identity**, not dashboards.

No charts in this sprint.

## 7.2 Examples (selective)

- Games Logged  
- Reviews  
- Hours  
- Completion Rate  
- Average Rating Given  
- Favorite Genre  
- Longest Game  
- Current Streak (calm — never guilt)  
- Years on GMRLOG  
- Community Reputation (future)  

## 7.3 Hierarchy (align F1)

One **primary** stat · few **secondary** · rest tertiary / “More stats.”  
Never a equal-weight vanity grid that screams Instagram.

---

# 8. Activity

## 8.1 Living timeline

Activity is a **living timeline** of the gaming story — not a raw event dump.

Includes: Reviews · Posts · Logs · Collections · Tier Lists · Achievements · Recommendations · **Identity moments** (milestones, anniversaries).

## 8.2 Rules

- Magazine-adjacent rhythm when dense (vary types; don’t review-flood).  
- Ember Rail on story/log deeds.  
- Tap → domain stacks (F2.1).  
- Filters optional (Reviews / Logs / All) — architecture only.

---

# 9. Collections

Collections deserve **visual identity** — Collection Shelf signature (F1).

| Presentation | Role |
|--------------|------|
| **Shelf** | Default physical-shelf metaphor |
| **Mosaic** | Alternate denser preview when many covers — secondary |
| **Featured Collection** | Player- or quality-highlighted |
| **Pinned Collection** | Future — Premium/creator pin |
| **Collection Count** | Calm meta — not hero |

Ordering: Featured / Pinned → Latest updated → Alphabetical (settings later).

---

# 10. Tier Lists

| Surface | Role |
|---------|------|
| **Featured Tier List** | Identity centerpiece |
| **Latest Tier List** | Fresh taste |
| **Community Favorite Tier List** | Social proof of their curation (other’s view / public) |
| **Collaborative lists** | Future |

Uses Tier List Card / Canvas preview (F1). S-tier ember underline discipline unchanged.

---

# 11. Achievements

Achievements are **identity**, not trophy spam.

Examples (directional): 100 Reviews · 1000 Hours · RPG Master · Collector · Reviewer · Community Helper.

| Rule | Freeze |
|------|--------|
| Show meaningful milestones | Not every micro-badge |
| Tie to story when possible | “Reached after…” memory language |
| Horizontal compact strip | Deep list secondary |

---

# 12. Game Graph

## 12.1 Strengthen

Profile is a **person-node** on the gaming graph. Everything connects.

| Connects to | |
|-------------|-|
| Games · Reviews · Posts · Collections · Tier Lists · Friends | Core |
| Developers · Articles · Guides | Future |

No isolated flex content. Outbound always resolves to Game / domain stacks (F2.3.1 · F2.4.1).

## 12.2 Optional “Game Graph” section

Explicit visualization later (constellation / list of top connected games). Architecture: dedicated section **after** Achievements — optional collapse if redundant with Favorites + Activity.

---

# 13. Social

| Element | Role |
|---------|------|
| Followers · Following | Graph size — tertiary |
| Mutual Friends | Bridge for other-profile |
| Shared Games · Reviews · Collections | Relationship glue on other-profile |

**Never dominate the page.** No follower count as Hero primary. Identity before popularity.

Messages: Profile overflow / entry per F2.1 — not a Profile story section.

---

# 14. Creator

Reserve without redesign:

- Articles · Guides · Video Essays · Lore · Developer Blogs · Walkthroughs  

Portfolio strip / tab later under Creator — same Content object family. Soft gate Premium enhance — never hide identity story behind paywall.

---

# 15. Premium Expansion

Reserve **without changing hierarchy**:

| Enhancement | Intent |
|-------------|--------|
| Identity themes | Expression (Master purple restraint) |
| Animated profile | Subtle motion within F1 guidelines |
| Showcases | Highlight shelves / journeys |
| Creator spaces | Craft surface |
| Pinned journeys | Pin Current Journey / memory moments |

Premium **enhances**; core Profile story remains complete for free (Creator Economy ethics).

---

# 16. Return Hooks & Emotional Design

## 16.1 Return hooks (self)

Natural revisit — calm, explainable (kin F2.4.1):

- Continue Journey  
- Your friend reviewed a favorite game  
- You completed 85%  
- Collection updated  
- Review milestone  

No guilt streaks as primary motivation.

## 16.2 Emotional design

Player should feel:

> “This profile tells **my gaming story**.”

Not:

> “This profile lists my statistics.”

Tone: belonging · journey · memory · identity (Auth / Game identity kinship).

---

# 17. Identity Audit Checklist

- [ ] Not Instagram / Steam / generic social — gaming story  
- [ ] Identity before popularity · Journey before numbers · Collections before followers  
- [ ] Hierarchy locked: Hero → Identity → Current Journey → Favorites → … → Social late  
- [ ] Hero elements defined (no layout)  
- [ ] Gaming Identity archetypes (not “profile info”)  
- [ ] Current Journey answers “what now?”  
- [ ] Favorites philosophy + ordering  
- [ ] Statistics as identity — no charts; no vanity-first  
- [ ] Activity as living timeline  
- [ ] Collections shelf identity · Tier featured/latest  
- [ ] Achievements as identity milestones  
- [ ] Game Graph connections mandatory  
- [ ] Social non-dominant  
- [ ] Creator + Premium reserved without hierarchy break  
- [ ] Return hooks calm  
- [ ] Unique gamer screenshot test passes  
- [ ] F1 Gamer Identity Header / Shelf / Tier used  
- [ ] F2.1 ProfileStack / deep links respected  
- [ ] No RN / Figma / backend / algo in this sprint  
- [ ] Achievements section and Connected Accounts entry respect locked hierarchy (§18)  

---

# 18. MVP Final Integration Amendment — Achievements & Connected Accounts

**Amendment:** MVP Final Integration Amendment (July 2026). The locked profile hierarchy (§2) is unchanged. This section clarifies two MVP elements already anchored in that hierarchy.

## 18.1 Achievements section (MVP)

| Rule |
|------|
| The Achievements section (§11) presents **GMRLOG Achievements** — platform-independent profile progression (F2.14 §15) |
| Achievement detail is a shared destination — the profile holds the index, not the detail |
| Steam achievements remain external metadata — never mirrored as GMRLOG achievements (F2.21 §20.1) |
| No score · no rank · no leaderboard · no comparison pressure — identity before vanity (§1) |
| Visibility follows profile privacy: the player decides what others see |
| Achievements remain **late-hierarchy identity milestones** — they never outrank Journey or Favorites |

## 18.2 Connected Accounts entry (MVP)

| Rule |
|------|
| Profile exposes an entry to Connected Accounts; the controls themselves live in Settings → Account (F2.20) |
| Connections are presented as conveniences, never as identity or status |
| Discord is identity/provider only — never a social layer (F2.21 §20.2) |
| A connected Steam or Discord account never becomes a badge, prestige signal or profile decoration (F2.21 §6) |
| Zero connected accounts is a complete, respected profile state |

## 18.3 Architecture references

| Reference | Contains |
|-----------|----------|
| F5.1 §17.9 · §34 | Achievements index in Profile · Achievement as shared destination |
| F5.3 | Profile Achievements · Settings Connected Accounts screens |
| F5.4 §38.1.3 · §38.1.4 | Achievement and connected-account row behavior |

---

## Success criteria

| Criterion | Met |
|-----------|-----|
| Definitive gamer identity architecture | Yes |
| Story over vanity | Yes |
| Compose from F1 + prior freezes | Yes |
| Creator/Premium ready without redesign | Yes |

---

## Final gate

### APPROVED

Sprint F2.5 Gamer Identity Profile Architecture is **LOCKED**.

Stop. Do **not** continue to the next sprint in this output.

---

## Related documents

| Doc | Role |
|-----|------|
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Profile as identity · six pillars |
| [SPRINT_F1_FOUNDATION.md](./SPRINT_F1_FOUNDATION.md) | Gamer Identity Header · Shelf · Tier · Arc |
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | ProfileStack · deep links |
| [SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md](./SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md) | Journey · emotional moments |
| [SPRINT_F2_2_1_AUTH_POLISH.md](./SPRINT_F2_2_1_AUTH_POLISH.md) | Gaming Style → Identity continuity |
| [SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) | Digital Home · DNA · Legacy · Known For |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Identity/journey-first Profile hierarchy, favorites, stats-as-identity, graph, creator/premium reserved |
| 1.1 | July 2026 | **MVP Final Integration Amendment** — §18 added: GMRLOG achievements section (index + progress) and Connected Accounts entry clarified as MVP scope; locked hierarchy unchanged · connections never identity |
