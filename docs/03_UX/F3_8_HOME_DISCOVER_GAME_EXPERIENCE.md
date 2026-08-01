# GMRLOG — Sprint F3.8: Home, Discover & Game Experience

**Document:** `docs/03_UX/F3_8_HOME_DISCOVER_GAME_EXPERIENCE.md`  
**Version:** 1.1  
**Status:** **LOCKED** · **Amended by MVP Final Integration Amendment** (§17)  
**Sprint:** F3.8 (UX Home, Discover & Game Experience — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** UX Culture Exploration Constitution

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](../02_DESIGN/SPRINT_F1_FOUNDATION.md) |
| 4 | Entire F2 — especially F2.3 / F2.3.1 · F2.4 / F2.4.1 · F2.7 · F2.10 · F2.19 · F2.1 · F2.16 |
| 5 | F3.1–F3.7 — especially F3.2 rooms · F3.3 hierarchy · F3.4–F3.6 states · F3.7 Digital Home contrast |
| 6 | **This document** — Home, Discover & Game Experience |

Never contradict previous freezes.

Never modify F1 · F2 · F3.1–F3.7.

This sprint answers:

> “How should exploring games feel?”

rather than:

> “What should these screens look like?”

| Surface | Emotional job |
|---------|----------------|
| **Home** | Today’s culture |
| **Discover** | Possibility |
| **Game Detail** | Relationship |
| **Library** (contrast · F3.7) | Lifetime memory |

**Boundary:** F2.3 / F2.7 / F2.10 / F2.4 remain product law. F3.2 keeps them as rooms. **F3.8** defines exploration feel across those rooms.

---

## Scope

**In scope:** Home experience & rhythm · content balance · Discover · exploration · search entry · recommendations · taste-first browsing · Game Detail · game identity · relationship-first pages · reviews reading · in-game activity timeline · official info · community/creator/collection/related entry · continue journey · return-to-home · accessibility · future reservations.

**Out of scope:**

| Forbidden in this freeze |
|--------------------------|
| UI mockups |
| Components |
| Visual design |
| Backend |
| Database |
| React Native |
| Algorithms |
| Recommendation algorithms |
| Ranking systems |
| Implementation |
| Sprint F3.8.1+ |

**Gate:** Stop after freeze. Do **not** continue to Sprint F3.8.1.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Home Experience Philosophy |
| 3 | Home Rhythm |
| 4 | Discover Philosophy |
| 5 | Exploration Experience |
| 6 | Recommendation Philosophy |
| 7 | Game Detail Experience |
| 8 | Relationship-first Design |
| 9 | Reading Experience |
| 10 | Cross-Surface Continuity |
| 11 | Accessibility Relationship |
| 12 | Consistency Rules |
| 13 | Anti-Manipulation |
| 14 | Future Ready |
| 15 | Emotional Goal |
| 16 | Audit Checklist |

---

# 1. Mission

Define how players experience gaming culture through **Home**, **Discover**, and **Game Detail**.

Home feels alive.

Never overwhelming.

Discover rewards curiosity.

Never addiction.

Games feel personal.

Never commercial.

Align North Star: culture exploration that strengthens Digital Home — not a storefront OS.

---

# 2. Home Experience Philosophy

Home is the **culture heartbeat** (F2.7) — today’s culture.

| Home should feel | Must never feel |
|------------------|-----------------|
| Alive · magazine · human | Retention casino |
| Orienting (F3.2 living room) | Growth-first layout |
| Sparse suggestions when present | Endless engagement loops |
| Easy return from Game Detail | Captivity after every tap |

Home is not Library (memory) and not Discover (possibility).

Mixing those jobs on first paint breaks the house.

---

# 3. Home Rhythm

Rhythm obeys F2.3 / F2.3.1 magazine law.

| Rhythm law |
|------------|
| Max continuity of same type stays bounded (F2.3) |
| Heights / pacing feel editorial — not infinite scroll personality |
| Content balance: following / discovery / highlights spirit preserved (~60/25/15 kinship) without becoming a KPI dashboard |
| Gaming Pulse / living activity feel present — not frantic |
| Game graph remains mandatory connective tissue |

| Rhythm never |
|--------------|
| Autoplay |
| Infinite novelty pressure |
| Same-type walls that erase orientation |
| Urgency strips as “culture” |

Alive ≠ loud.

---

# 4. Discover Philosophy

Discover is the **exploration wing** (F2.10) — possibility.

| Discover should | Must never |
|-----------------|------------|
| Reward curiosity | Dictate taste |
| Stay interruptible | Become addiction corridor |
| Taste-first | Popularity-first law |
| Explainable when recommending | “Because we want engagement” |

Search entry experience: calm field · clear scope · dignified no-results (F3.6) · lands in named rooms (F3.2).

Browsing behavior: player-led paths · filters as organization · not sold ranking (F2.16).

---

# 5. Exploration Experience

Exploration is voluntary movement through the game graph.

| Exploration may | Must never |
|-----------------|------------|
| Open related games · creators · communities · collections | Force a tour |
| Support mood/intent when offered optionally (F2.19) | Trap in novelty mills |
| Return to Home or Library without shame | Treat exit as failure |

Curiosity is the fuel.

Pressure is forbidden.

---

# 6. Recommendation Philosophy

Recommendations **support taste**.

Never dictate taste.

| Law |
|-----|
| Sparse · dismissible · explainable (F2.19 · F2.3.1 · F2.10) |
| Compatible with F2.10 on every surface they appear |
| Trust > mystery |
| Hide / not interested continuity preserved |
| No sponsored prominence as organic reco |
| No discovery manipulation |
| No “recommended because we want engagement” |

Home inserts and Discover suggestions share ethics — density may differ by room job, not by honesty.

---

# 7. Game Detail Experience

Game Detail is **relationship** (F2.4 / F2.4.1) — not a storefront.

| Game pages should | Must never |
|-------------------|------------|
| Celebrate the player’s relationship first | Lead as commercial SKU page |
| Feel like a room for one game | Feel like a store |
| Host Journey · activity · reviews as meaning | Host endless promo chrome |
| Offer Continue journey calmly | Invent grind progress theater |

Official information placement: context · transparency — never overshadowing Personal / relationship hierarchy (F2.4 · F2.24).

Community · Creator · Collection entry: doors from the graph — not hijacks of the relationship spine.

Related games: orientation aids — not compulsive “one more” engines.

---

# 8. Relationship-first Design

Relationship-first is UX law here (F2.4).

| Order of meaning (experience) |
|-------------------------------|
| Personal relationship |
| Friends / social kinship where present |
| Community / culture around the game |
| Official / metadata context |

| Never invert to |
|-----------------|
| Store score walls first |
| Trailer/autoplay first |
| Sponsored modules first |
| Vanity engagement first |

Game identity is lived continuity — Known For / memories kinship — not Metacritic theater as protagonist.

---

# 9. Reading Experience

Reviews and long-form on/near game surfaces remain first-class (F3.1 · F3.3 · F2.18 · F2.12).

| Reading flow should | Must never |
|---------------------|------------|
| Feel effortless in Game Detail and Home cards that open into prose | Sacrifice readability for density |
| Respect spoilers | Use spoilers as engagement bait |
| Preserve corridor when opening from Home/Discover | Interrupt with autoplay or sheet storms |

Activity timeline inside games: memory of relationship — not a notification farm.

---

# 10. Cross-Surface Continuity

| Continuity | Meaning |
|------------|---------|
| Home → Game → Home | Return-to-home is calm · expected (F3.2 Back) |
| Discover → Game → Library/Profile | Possibility can land in memory/identity |
| Game → Community/Creator/Collection | Graph doors · reversible |
| Continue journey | Resume relationship — not streak |
| Shared Game Stack | Same room from any tab (F2.1) |

Spatial continuity for game objects obeys F3.5 when motion exists.

Meaning continuity obeys F2.4 relationship spine always.

Home is today’s culture.

Library is lifetime memory (F3.7).

Discover is possibility.

Game Detail is relationship.

Do not blur these jobs.

---

# 11. Accessibility Relationship

Exploration must remain calm and operable for all (F2.18 · F3.1–F3.6).

| Implication |
|-------------|
| No autoplay as comprehension path |
| Recommendations perceivable & dismissible without motion-only cues |
| Reading corridors protected |
| Search/filter operable without gesture-only traps |
| Hierarchy: relationship before chrome on Game Detail |
| Reduce Motion: orientation preserved on Home/Discover/Game transitions |

---

# 12. Consistency Rules

| Rule |
|------|
| Home never behaves like Discover-as-slot or Library-as-inventory |
| Discover never behaves like Home heartbeat or storefront |
| Game Detail never behaves like commerce PDP first |
| Recommendation grammar consistent wherever sparse inserts appear |
| Search entry feels like the same honest tool across scopes |
| Official / community / creator entries clearly secondary to relationship |
| Magazine rhythm language stable on Home |

---

# 13. Anti-Manipulation

Explicit bans:

| Ban |
|-----|
| Endless engagement loops |
| Growth-first layouts |
| Autoplay |
| Infinite novelty pressure |
| Sponsored prominence |
| Artificial urgency |
| Discovery manipulation |
| “Recommended because we want engagement” |
| Unexplainable recommendations |
| Storefront-first Game Detail |
| Compulsive related-game mills |
| FOMO Home strips |
| Sold ranking disguised as Discover taste (F2.16) |

If a Home/Discover/Game pattern’s best argument is session length, it is illegitimate.

---

# 14. Future Ready

Reserve architecture only:

| Capability |
|------------|
| Richer explainability surfaces on reco (F2.19) |
| Optional mood/intent exploration aids |
| Clearer official-vs-player module labeling |
| Continuity between Seasonal/Events entry and Home (F2.15) without takeover |
| Desktop expansion that preserves mobile meaning order |

No algorithms · no ranking formulas · no UI.

---

# 15. Emotional Goal

Exploration should feel like:

> “I naturally found something meaningful.”

Never:

> “I was pushed toward content.”

Never:

> “I feel like I’m browsing a store.”

---

# 16. Audit Checklist

- [ ] Home = today’s culture · Discover = possibility · Game = relationship · Library contrast = memory  
- [ ] Home alive not overwhelming · rhythm magazine · no autoplay / novelty pressure  
- [ ] Discover curiosity not addiction · taste-first · search orients  
- [ ] Recommendations support taste · explainable · sparse · F2.10 compatible  
- [ ] Game Detail relationship-first · not storefront · reading first-class  
- [ ] Cross-surface continuity · return-to-home calm  
- [ ] Anti-manipulation bans explicit  
- [ ] Compatible with F2.3 / F2.4 / F2.7 / F2.10 / F2.19 / F3.1–F3.7  
- [ ] No UI · components · algorithms · ranking · RN · F3.8.1  
- [ ] MVP surfaces (§17) keep Home calm · Discover curious · Game relationship-first  

---

# 17. MVP Final Integration Amendment — Home / Discover & Semantic Similarity Recommendation

**Amendment:** MVP Final Integration Amendment (July 2026). Experience philosophy in §1–§16 is unchanged. This section extends Home / Discover experience for MVP surfaces.

## 17.1 Home

| Feature | Experience rule |
|---------|-----------------|
| Community activity | Feels like hearing your rooms, not entering a second app · never crowds the heartbeat (§3) |
| Event activity | Feels like an invitation, never a deadline · no urgency spikes (§13) |
| Achievement activity | Feels like a quiet acknowledgement of one's own history · never a score notification |
| Library import activity | Feels like the archive growing, summarized calmly · never a flood (§2) |

## 17.2 Discover

| Feature | Experience rule |
|---------|-----------------|
| Community discovery | Curiosity about people who share taste — never a growth funnel (§4 · §5) |
| Upcoming events | Possibility, not scarcity — time context without countdown pressure (§13) |

## 17.3 Semantic Similarity Recommendation

Semantic Recommendations must:

| Must | Must never |
|------|------------|
| Support discovery | Manipulate attention or belonging |
| Remain assistive | Replace player choice |
| Stay sparse and explainable (§6) | Become addictive endless optimization |
| Offer similarity as an option | Instruct the player what they “should” want |
| Degrade to absence when empty | Manufacture fake relevance |

| Law |
|-----|
| Assistive only — human agency always wins (F2.19 · §5 of that freeze) |
| No chat AI · no assistant voice · no generative framing |
| No recommendation addiction loops |
| Hide / Not interested remains available without penalty |

## 17.4 Game Detail

| Feature | Experience rule |
|---------|-----------------|
| Ownership indicator | Quiet context inside a relationship page — never a purchase nudge (§7 · §8) |
| Related games (semantic similarity) | Offered after meaning, not before it — reading stays first-class (§9) · never replaces choice |
| Event signals | Enrich the relationship; the game remains the protagonist (§7) |

## 17.5 Amendment laws

| Law |
|-----|
| No feature may change Home's calm, Discover's curiosity or Game's relationship-first order |
| Optional integrations must be invisible when absent — never a nagging empty promise |
| Cross-surface continuity applies to new objects identically (§10 · §12) |
| Anti-manipulation bans (§13) extend to event urgency, achievement pressure and recommendation loops |

---

## Final gate

### APPROVED

**Sprint F3.8 — Home, Discover & Game Experience LOCKED.**

Stop.

Do **NOT** continue to Sprint F3.8.1.

---

## Related documents

| Doc | Role |
|-----|------|
| [SPRINT_F2_3_HOME_FEED.md](../02_DESIGN/SPRINT_F2_3_HOME_FEED.md) · [SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md](../02_DESIGN/SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) | Home feed law |
| [SPRINT_F2_7_HOME_FEED.md](../02_DESIGN/SPRINT_F2_7_HOME_FEED.md) | Home as culture heartbeat |
| [SPRINT_F2_10_DISCOVER_SEARCH.md](../02_DESIGN/SPRINT_F2_10_DISCOVER_SEARCH.md) | Taste-first Discover |
| [SPRINT_F2_4_GAME_EXPERIENCE.md](../02_DESIGN/SPRINT_F2_4_GAME_EXPERIENCE.md) · [SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md](../02_DESIGN/SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md) | Relationship-first Game |
| [SPRINT_F2_19_INTELLIGENCE_AI_RECOMMENDATION.md](../02_DESIGN/SPRINT_F2_19_INTELLIGENCE_AI_RECOMMENDATION.md) | Explainable reco ethics |
| [F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md](./F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md) | Room jobs |
| [F3_7_PROFILE_IDENTITY_LIBRARY_EXPERIENCE.md](./F3_7_PROFILE_IDENTITY_LIBRARY_EXPERIENCE.md) | Library = memory contrast |
| [F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md](./F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md) | Attention · reading corridors |
| [F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md](./F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md) | Calm home · gaming-first feel |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Pillars · recognizability |
| [F3_9_COMMUNITY_CREATOR_SOCIAL_EXPERIENCE.md](./F3_9_COMMUNITY_CREATOR_SOCIAL_EXPERIENCE.md) | Community/creator doors from Game |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Home/Discover/Game experience: alive-not-overwhelming, curiosity-not-addiction, relationship-not-storefront; anti-engagement exploration bans |
| 1.1 | July 2026 | **MVP Final Integration Amendment** — §17 added: Semantic Similarity Recommendation must support discovery, remain assistive, never manipulate or replace player choice; no addictive endless optimization; Home/Discover/Game experience laws unchanged |
