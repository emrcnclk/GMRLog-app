# GMRLOG — Sprint F2.7: Home Feed & Discovery Architecture

**Document:** `docs/02_DESIGN/SPRINT_F2_7_HOME_FEED.md`  
**Version:** 1.1  
**Status:** **LOCKED** · **Amended by MVP Final Integration Amendment** (§16)  
**Sprint:** F2.7 (Home Feed & Discovery experience freeze)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** Home Feed Experience Freeze · Discovery Architecture

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) |
| 4 | [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) |
| 5 | [`SPRINT_F2_3_HOME_FEED.md`](./SPRINT_F2_3_HOME_FEED.md) + [`SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md`](./SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) |
| 6 | [`SPRINT_F2_4_GAME_EXPERIENCE.md`](./SPRINT_F2_4_GAME_EXPERIENCE.md) |
| 7 | [`SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md`](./SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md) |
| 8 | [`SPRINT_F2_6_LIBRARY_COLLECTIONS.md`](./SPRINT_F2_6_LIBRARY_COLLECTIONS.md) |
| 9 | **This document** — Home heartbeat + Discovery architecture |

### Relationship to F2.3 / F2.3.1

| Layer | Authority |
|-------|-----------|
| Feed anatomy, card priority, interactions, FAB, empty states, rhythm **hard rules** | **F2.3** |
| Gaming Pulse, living activity, game graph, momentum, ≈60/25/15 mix, explainability | **F2.3.1** |
| Home as culture heartbeat, six feed pillars framing, Discovery philosophy, recommendation types, pacing sections, Discover-tab relationship | **This document (F2.7)** |

On conflict of *composition mechanics*: F2.3 wins.  
On conflict of *identity pulse/graph/explainability*: F2.3.1 wins.  
On conflict of *Discovery intent / recommendation vocabulary / pacing sections*: **F2.7 wins** if compatible with F2.3 rhythm.

**Scope:** Architecture only.  
**Out of scope:** React Native, backend, algorithms, Figma, new navigation, new card designs, Sprint F2.7.1+.

**Placement:** Home tab feed (F2.1 `HomeStack`) · Discovery also informs Discover tab hub (same philosophy, different density).

**Gate:** Stop after freeze. Do **not** continue to Sprint F2.7.1.

---

# 1. Mission

Home Feed is the **living heartbeat** of GMRLOG.

| Not | Is |
|-----|-----|
| Twitter timeline | Daily place where **gaming culture lives** |
| Reddit frontpage | Walking through the community |
| Steam activity feed | Discover games · people · stories · opinions · collections · creators |
| Discord chat | Magazine of living culture |
| TikTok endless scroll | Taste- and journey-first discovery |

Every scroll should feel like walking through the gaming community — not consuming an addiction loop.

---

# 2. Core Principle

Users should **discover**:

- games  
- people  
- stories  
- opinions  
- collections  
- creators  

not simply **consume** content.

---

# 3. Feed Philosophy — Six Equal Content Pillars

The feed is built around **six equal content pillars**. No pillar permanently dominates. Each contributes to the ecosystem.

| Pillar | Meaning on Home |
|--------|-----------------|
| **Reviews** | Long-form opinions — **not** bare ratings |
| **Posts** | Short thoughts, questions, updates, conversations |
| **GameLogs** | “I’m playing…” / “I’m finished.” / “I’m returning.” — living journey |
| **Collections** | Curated museums — **not** playlists |
| **Tier Lists** | Taste visualization — **not** competitive rankings |
| **Discovery** | Recommendations, friends activity, new releases, trending discussions, developer highlights |

Maps to Master’s six product pillars without forcing one-to-one UI chrome. **No content type permanently occupies most of the feed** (reinforces F2.3 rhythm).

---

# 4. Feed Rhythm

Never repeat identical card types excessively.

**Good (directional):**  
Review → Post → Collection → GameLog → Tier List → Post → Review → Recommendation → Friend Activity → Review  

**Bad:** Review ×5  

**Hard rules remain F2.3:** max **2** consecutive same type; magazine heights; sparse recommendations; Ember Rail only on story/log.

---

# 5. Feed Sections (not tabs)

The feed is **continuous**. Sections influence **pacing**, not navigation.

Directional pacing influences:

- Today  
- Because You Played  
- Friends  
- Trending  
- Hidden Gems  
- Community Picks  
- Recent Reviews  
- Latest Collections  
- Developer Spotlight  

Rules:

- Prefer **implicit** rhythm; headers rare (F2.3).  
- Sections are **signals for composition**, not Home sub-tabs.  
- Discover tab may surface denser versions of the same ideas (F2.1 Discover Hub).

---

# 6. Feed Cards

Compose **only** F1 signature / approved feed components. **No new card designs.**

| Allowed |
|---------|
| Game Card |
| Review Card |
| Post Card |
| Collection Shelf |
| Tier Card |
| Activity Card |
| Recommendation Card |
| Developer Spotlight (Post Card + Developer identity chip composition) |
| Friend Activity (Activity Card) |

Developer Spotlight / Friend Activity are **compositions**, not new visual languages.

---

# 7. Discovery Philosophy

Discovery answers:

> **What should I experience next?**

Not:

> What is popular?

Popularity is **only one signal**.

### Discovery values (architecture — not an algorithm)

| Value | Intent |
|-------|--------|
| Taste similarity | DNA / favorites / ratings kinship |
| Genre | Taste map |
| Community overlap | Shared people |
| Collection overlap | Shared shelves |
| Review similarity | Shared opinions |
| Journey continuation | Next step in a living journey |
| Franchise relationship | Series continuity |
| Developer relationship | Authorship affinity |

Aligns F2.3.1 explainability: **Trust > engagement**. Every recommendation carries a calm “why.”

### Home vs Discover tab

| Surface | Role |
|---------|------|
| **Home** | Heartbeat — Following-weighted culture + sparse Discovery inserts (≈60/25/15 per F2.3.1) |
| **Discover** | Dedicated exploration — denser Discovery / Highlights without replacing Home |

Same philosophy; different density. **No new navigation.**

---

# 8. Recommendation Types

Directional vocabulary (meaningful, not bait):

| Type | Spirit |
|------|--------|
| Because you liked… | Taste continuity |
| Because your friends… | Social trust |
| Hidden gem | Quiet discovery |
| Underrated | Community signal without rage |
| Recently revived | Living culture |
| Newly released | Fresh world |
| Community favorite | Collective taste |
| Complete your journey | Journey-first |
| Continue your series | Franchise continuity |

Never mysterious. Hide / Not interested remains (F2.3).

---

# 9. Feed Tone

| Yes | No |
|-----|-----|
| Warm · Calm · Curious · Inviting | Aggressive |
| Human community | Engagement farming |
| Celebrate play | Outrage bait |
| | Infinite dopamine hacks |

---

# 10. Feed Identity

Must instantly feel like **GMRLOG**.

Signature stack:

- Story Ember  
- Magazine rhythm  
- Cinematic spacing  
- Game artwork  
- Living community  
- Journey-first · Taste-first · Identity-first  

Plus F2.3.1: Gaming Pulse · living activity · game graph · quiet momentum.

---

# 11. Social Philosophy

Encourage: Discuss · Recommend · Review · Share · Curate · Celebrate  

**Not** chase followers (Profile: identity before popularity).

---

# 12. Creator Presence

Creators appear **naturally**. No creator takeover.

Examples: Great Review · Great Collection · Featured Article (future) · Developer Diary (future) · Guide (future)

Creator content **integrates** with everyone else’s — same rhythm rules, same graph, vertical growth (F2.5.1). Premium enhances; never paywalls the culture feed.

---

# 13. Future Ready

Reserve architecture (no UI / no implementation):

- Premium Articles  
- Video Essays  
- Guides  
- Developer Blogs  
- Editorial Picks  
- Community Events  
- Live Activities  

Absorb via existing Content object family + F1 compositions — **no Home redesign**, no new tabs.

---

# 14. Emotional Goal

Opening GMRLOG should feel like:

> “I’m visiting my favorite gaming community.”

Not:

> “I’m checking another social media app.”

---

# 15. Audit Checklist

- [ ] Home feels alive  
- [ ] Six content pillars balanced — no permanent monoculture  
- [ ] Magazine rhythm (F2.3 hard rules honored)  
- [ ] No Twitter / Reddit / Steam / Discord / TikTok clone  
- [ ] Discovery is taste-first — not popularity-first  
- [ ] Recommendations meaningful + explainable  
- [ ] Community feels human  
- [ ] Creator content integrated, not takeover  
- [ ] Future-ready without redesign  
- [ ] Compose only existing F1 components — no new cards  
- [ ] No new navigation  
- [ ] Discover tab shares philosophy, denser exploration  
- [ ] F2.3 / F2.3.1 not contradicted on mechanics / pulse / graph  
- [ ] No backend · No RN · No Figma · No F2.7.1 in this sprint  
- [ ] MVP activity kinds (community · event · achievement · import) stay sparse and pillar-balanced (§16)  

---

# 16. MVP Final Integration Amendment — MVP Activity Kinds & Semantic Similarity Recommendation

**Amendment:** MVP Final Integration Amendment (July 2026). The six equal content pillars (§3), magazine rhythm (§4) and feed identity (§10) are unchanged. Home gains **activity kinds**, not new architecture.

## 16.1 Activity kinds added in MVP

| Kind | What it surfaces | Constraint |
|------|------------------|------------|
| Community activity | Culture from rooms the player belongs to (F2.11 §16) | Never turns Home into a communities feed · respects room visibility |
| Event activity | Meaningful gatherings (F2.15 §19) | Sparse · guests not hosts · no countdown pressure |
| Achievement activity | GMRLOG achievement moments (F2.14 §15) | Reflection, not scoring · no streak pressure |
| Library import activity | Games entering the archive (F2.6 §17) | Summarized · never one card per imported game |

## 16.2 Semantic Similarity Recommendation in Home

| Rule |
|------|
| Recommendation slots present **Semantic Similarity Recommendation** (game · collection · review similarity; semantic embeddings as similarity basis — F2.19 §16) |
| Vocabulary stays meaningful and explainable (§8) — never mysterious, never bait |
| Hide / Not interested remains available (§8 · F2.3) |
| Sparse over endless — recommendations never become the feed's identity (§10) |
| No chat AI · no assistant · no generative system · no algorithm defined in product documents |

## 16.3 MVP laws

| Law |
|-----|
| No new navigation · no new Home section that behaves like a tab (§5) |
| No pillar and no activity kind may permanently dominate (§3) |
| Optional-integration activity disappears silently when the integration is absent |
| Cards compose from existing components (§6) — no bespoke card language per feature |

## 16.4 Architecture references

| Reference | Contains |
|-----------|----------|
| F5.2 §6.1 · §6.4 | Feed object taxonomy and MVP placement law |
| F5.3 | Activity Feed screen · shared destination targets |
| F5.4 §38.1 | Card behavior for the new activity kinds |

---

## Final gate

### APPROVED

**Sprint F2.7 Home Feed & Discovery is LOCKED.**

Stop. Do **not** continue to Sprint F2.7.1.

---

## Related documents

| Doc | Role |
|-----|------|
| [SPRINT_F2_3_HOME_FEED.md](./SPRINT_F2_3_HOME_FEED.md) | Base Home composition |
| [SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md](./SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) | Pulse · graph · 60/25/15 · explainability |
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | HomeStack · DiscoverStack |
| [SPRINT_F2_10_DISCOVER_SEARCH.md](./SPRINT_F2_10_DISCOVER_SEARCH.md) | Discover & Search ecosystem |
| [SPRINT_F1_FOUNDATION.md](./SPRINT_F1_FOUNDATION.md) | Signature cards only |
| [SPRINT_F2_6_LIBRARY_COLLECTIONS.md](./SPRINT_F2_6_LIBRARY_COLLECTIONS.md) | Collections as museums |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Home heartbeat + Discovery architecture; six feed pillars; pacing sections; recommendation types; F2.3/F2.3.1 continuity |
| 1.1 | July 2026 | **MVP Final Integration Amendment** — §16 added: community · event · achievement · library-import activity kinds and Semantic Similarity Recommendation slots; pillars · rhythm · navigation unchanged |
