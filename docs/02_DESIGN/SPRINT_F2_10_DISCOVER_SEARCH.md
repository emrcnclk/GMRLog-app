# GMRLOG — Sprint F2.10: Discover & Search Ecosystem

**Document:** `docs/02_DESIGN/SPRINT_F2_10_DISCOVER_SEARCH.md`  
**Version:** 1.1  
**Status:** **LOCKED** · **Amended by MVP Final Integration Amendment** (§15)  
**Sprint:** F2.10 (Discover & Search Ecosystem — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** Discover & Search Experience Freeze

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) |
| 4 | [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) |
| 5 | [`SPRINT_F2_3_HOME_FEED.md`](./SPRINT_F2_3_HOME_FEED.md) + [`SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md`](./SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) |
| 6 | [`SPRINT_F2_7_HOME_FEED.md`](./SPRINT_F2_7_HOME_FEED.md) |
| 7 | [`SPRINT_F2_6_LIBRARY_COLLECTIONS.md`](./SPRINT_F2_6_LIBRARY_COLLECTIONS.md) |
| 8 | [`SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md`](./SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md) + [`SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md`](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) |
| 9 | [`SPRINT_F2_8_SOCIAL_COMMUNICATION.md`](./SPRINT_F2_8_SOCIAL_COMMUNICATION.md) |
| 10 | **This document** — Discover & Search Ecosystem |

**Scope:** Entire Discover ecosystem + Universal Search philosophy.  
**Out of scope:** React Native, backend, algorithms, ranking formulas, recommendation engines, database, Figma, implementation, UI, Sprint F2.10.1+.

**Compose only existing architecture:** Discover tab · DiscoverStack · F1 cards · F2.7 Discovery philosophy (denser on Discover).  

**Do NOT redesign:** Navigation · Home · Library · Profile · Game Detail.

### Relationship to Home (F2.7)

| Surface | Answers |
|---------|---------|
| **Home** | “What happened?” / what is happening **now** |
| **Discover** | “What should I **explore** next?” |

Discover is the platform’s **exploration engine** — not another content feed clone of Home.

**Gate:** Stop after freeze. Do **not** continue to Sprint F2.10.1.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Discover Philosophy |
| 3 | Search Philosophy |
| 4 | Discovery Pillars |
| 5 | Universal Search |
| 6 | Search Scopes |
| 7 | Discovery Surfaces |
| 8 | Recommendation Philosophy |
| 9 | Taste-first Discovery |
| 10 | Explainability |
| 11 | Relationship Graph |
| 12 | Future Ready |
| 13 | Emotional Goal |
| 14 | Audit Checklist |

---

# 1. Mission

Discover exists for **intentional exploration**.

| Home | Discover |
|------|----------|
| What happened? | What should I explore next? |
| Living heartbeat | Exploration engine |
| Following-weighted culture | Taste- and curiosity-weighted exploration |

Not another infinite content feed. Exploration should replace scrolling-as-addiction.

---

# 2. Discover Philosophy

| Discover is NOT | Discover IS |
|-----------------|-------------|
| Steam Store | Gaming culture explorer |
| TikTok / YouTube | Taste explorer |
| Reddit / Google Search | Community explorer |
| App Store | Creator explorer |
| Infinite recommendation engine | Idea · Game · Collection · Opinion explorer |

Story Ember: calm curiosity — never storefront pressure or dopamine traps.

---

# 3. Search Philosophy

**Universal Search is one search** — not multiple isolated search products.

Everything should be searchable:

| Entities |
|----------|
| Games · Players · Reviews · Posts · Collections · Tier Lists |
| Developers · Studios · Series · Genres · Mechanics · Themes · Tags |
| Creators · Universes |
| Articles · Guides · Communities · Events | Future |

Search should understand **gaming** — not filenames.  
Library search remains **archive-scoped** (F2.6); Discover hosts the **platform-universal** entry (F2.1). One ecosystem, intentional scope narrowing (§6).

---

# 4. Discovery Pillars

Discover balances exploration pillars — **no pillar permanently dominates**. Discovery always feels fresh.

| Pillar |
|--------|
| Games · Reviews · Posts · Collections · Tier Lists |
| Creators · Developers · Community · Editorial |
| Events | Future |

Kinship with F2.7 six feed content pillars; Discover may densify Discovery / Highlights without breaking Home rhythm rules when content is also shown on Home.

---

# 5. Universal Search

Architecture only — capabilities reserved:

| Capability |
|------------|
| Instant Search |
| Recent Searches |
| Saved Searches |
| Suggested Searches |
| Trending Searches |
| Related Searches |
| Context-aware Search |
| History |
| Semantic Search | Future |
| Mood Search | Future |

No UI. No ranking formulas.

---

# 6. Search Scopes

Users may **intentionally** narrow exploration — still **one** search ecosystem.

| Scope |
|-------|
| All |
| Games · People · Reviews · Posts · Collections · Tier Lists |
| Creators · Developers |
| Articles · Communities · Events | Future |

No duplicated search systems (no separate “game search app” vs “people search app”).

---

# 7. Discovery Surfaces

Possible surfaces (architecture — not a mandatory always-on list):

| Surface family | Examples |
|----------------|----------|
| Culture pulse | Trending · Hidden Gems · Recently Revived · Community Favorites |
| Personal taste | Because You Played / Reviewed / Collected · Friend Taste · Friends Recently Loved |
| Spotlight | Developer · Creator · Collection · Review |
| Time & season | Upcoming Releases · Seasonal Picks · Editorial Picks |
| Structure | Series Journey · Genre / Mechanic / Theme Exploration |

**No popularity-first thinking.** Popularity may appear as one signal among many (F2.7).

Compose F1 signatures only (Game Card, Review Card, Collection Shelf, Tier Card, Recommendation Card, Activity, etc.).

---

# 8. Recommendation Philosophy

Recommendations prioritize **meaning**.

Signals may include (architecture vocabulary — **not** an engine):

| Signal family |
|---------------|
| Shared taste · Shared DNA · Shared reviews · Shared collections |
| Journey continuation · Series continuation |
| Developer / Genre / Mechanic / Theme affinity |
| Community overlap · Identity similarity |

**Popularity alone is never sufficient.**

Align F2.7 recommendation types (Because you liked…, Hidden gem, Continue your series, etc.).

---

# 9. Taste-first Discovery

Always prioritize, in order of spirit:

**Taste → Journey → Identity → Curiosity → Discovery → Community**

before:

**Popularity → Virality → Clicks → Engagement → Session length**

Identity before popularity (Profile / Social) applies to exploration too.

---

# 10. Explainability

Every recommendation should answer:

> **Why am I seeing this?**

Directional explanations:

- Because you enjoyed…  
- Because your friends…  
- Because it matches your collection…  
- Because it continues your journey…  
- Because similar reviewers loved…  
- Because your gaming DNA suggests…  

**Trust > mystery** (F2.3.1). Hide / Not interested remains available where recommendations appear.

---

# 11. Relationship Graph

Discover connects the entire ecosystem — **nothing in isolation**.

```
Games → Reviews → Collections → Tier Lists
  → Players → Creators → Developers → Communities
  → Future Articles → Future Guides
```

Same mandatory gaming graph (F2.3.1 · F2.4 · F2.6). Every result/card resolves to a real destination (Game, Profile, Collection, …).

---

# 12. Future Ready

Reserve architecture only — no implementation:

| Reserved |
|----------|
| AI Discovery · Semantic Search · Mood Search · Discovery Assistant |
| Gaming DNA Search |
| Community / Guild Discovery · Events |
| Creator / Developer Discovery |
| Streaming · Video Essays · Walkthroughs · Editorial |
| Knowledge Graph |

Vertical growth into Discover Hub — **no new bottom tabs** without F2.1 amendment.

---

# 13. Emotional Goal

Discover should feel like:

> **“I found something I didn’t know I wanted.”**

Never:

> **“The algorithm trapped me.”**

Curiosity replaces addiction. Exploration replaces scrolling.

---

# 14. Audit Checklist

- [ ] Discover feels different from Home (explore next ≠ what happened)  
- [ ] Search is universal — one ecosystem  
- [ ] Search is gaming-first — not filenames  
- [ ] Explores games, people, and ideas  
- [ ] Discovery pillars balanced — no permanent monoculture  
- [ ] Taste-first philosophy preserved  
- [ ] Popularity never dominates  
- [ ] Explainability exists on recommendations  
- [ ] Relationship Graph maintained — no isolation  
- [ ] Search scopes intentional; no duplicate search systems  
- [ ] Discovery surfaces taste- and journey-led  
- [ ] Future systems reserved — not designed  
- [ ] Compatible with F2.7 / F2.3.1 / F2.1 DiscoverStack  
- [ ] No redesign of Nav · Home · Library · Profile · Game Detail  
- [ ] Compose F1 only  
- [ ] No UI · algorithms · backend · RN · Figma · F2.10.1  
- [ ] MVP hubs (Communities · Events) and semantic recommendations stay Discover-owned without new tabs (§15)  

---

# 15. MVP Final Integration Amendment — Community & Event Discovery · Semantic Similarity Recommendation

**Amendment:** MVP Final Integration Amendment (July 2026). Discover philosophy (§2), taste-first order (§9) and explainability (§10) are unchanged. Discover gains **hub entries and one recommendation basis**, not a new architecture.

## 15.1 MVP discovery surfaces

| Surface | Role | Anchor |
|---------|------|--------|
| Communities Hub | Community discovery — find your people (F2.11 §16) | §7 · §11 |
| Events Hub | Upcoming and ongoing gatherings — **Events belong to Discover** (F2.15 §19) | §7 time & season family |
| Semantic Similarity Recommendation surfaces | Game · collection · review similarity (F2.19 §16) | §8 signal families |

## 15.2 MVP laws

| Law |
|-----|
| Both hubs are entries under Discover — never new top-level destinations (F2.1) |
| Neither hub may dominate the Discover surface; pillars stay balanced (§4) |
| Semantic Similarity Recommendation is one signal family among many (§8) — popularity alone remains insufficient |
| No chat AI · no assistant · no generative system |
| Every recommendation stays explainable in human language (§10) |
| Search results may include communities and events as result types — one search ecosystem, no parallel search (§5 · §6) |

## 15.3 Architecture references

| Reference | Contains |
|-----------|----------|
| F5.1 §34 | Hub placement under Discover |
| F5.3 | Communities Hub · Events Hub · Search Results screens |
| F5.4 §38.1 | Card behavior for community · event · recommendation slots |

---

## Final gate

### APPROVED

**Sprint F2.10 Discover & Search Ecosystem LOCKED.**

Stop. Do **not** continue to Sprint F2.10.1.

---

## Related documents

| Doc | Role |
|-----|------|
| [SPRINT_F2_7_HOME_FEED.md](./SPRINT_F2_7_HOME_FEED.md) | Discovery philosophy · Home vs Discover density |
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | DiscoverStack · universal search entry |
| [SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md](./SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) | Explainability · game graph |
| [SPRINT_F2_6_LIBRARY_COLLECTIONS.md](./SPRINT_F2_6_LIBRARY_COLLECTIONS.md) | Archive-scoped search split |
| [SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) | Gaming DNA · taste |
| [SPRINT_F2_11_COMMUNITIES_GUILDS.md](./SPRINT_F2_11_COMMUNITIES_GUILDS.md) | Communities hub & discovery |
| [SPRINT_F2_15_EVENTS_SEASONAL.md](./SPRINT_F2_15_EVENTS_SEASONAL.md) | Events · seasonal culture moments |
| [SPRINT_F1_FOUNDATION.md](./SPRINT_F1_FOUNDATION.md) | SearchField · signature cards |
| [SPRINT_F2_19_INTELLIGENCE_AI_RECOMMENDATION.md](./SPRINT_F2_19_INTELLIGENCE_AI_RECOMMENDATION.md) | Intelligence constitution · explainable reco |
| [SPRINT_F2_25_GROWTH_ADOPTION_ECOSYSTEM_EXPANSION.md](./SPRINT_F2_25_GROWTH_ADOPTION_ECOSYSTEM_EXPANSION.md) | Discover growth = better discovery · not engagement |
| [F3_6_COMPONENTS_FORMS_STATES_SEARCH_EXPERIENCE.md](../03_UX/F3_6_COMPONENTS_FORMS_STATES_SEARCH_EXPERIENCE.md) | Search/filter/sort experience philosophy |
| [F3_8_HOME_DISCOVER_GAME_EXPERIENCE.md](../03_UX/F3_8_HOME_DISCOVER_GAME_EXPERIENCE.md) | Discover exploration experience |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Discover exploration engine, universal search, pillars, surfaces, taste-first, explainability, graph, future reserves |
| 1.1 | July 2026 | **MVP Final Integration Amendment** — §15 added: Communities Hub · Events Hub (Events belong to Discover) · Semantic Similarity Recommendation surfaces; taste-first · explainability · one-search-ecosystem law unchanged |
