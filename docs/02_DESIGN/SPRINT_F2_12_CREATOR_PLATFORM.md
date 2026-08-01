# GMRLOG — Sprint F2.12: Creator Platform & Publishing Ecosystem

**Document:** `docs/02_DESIGN/SPRINT_F2_12_CREATOR_PLATFORM.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F2.12 (Creator Platform & Publishing Ecosystem — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** Creator Platform Architecture Freeze

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) |
| 4 | [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) |
| 5 | [`SPRINT_F2_3_HOME_FEED.md`](./SPRINT_F2_3_HOME_FEED.md) + [`SPRINT_F2_7_HOME_FEED.md`](./SPRINT_F2_7_HOME_FEED.md) |
| 6 | [`SPRINT_F2_4_GAME_EXPERIENCE.md`](./SPRINT_F2_4_GAME_EXPERIENCE.md) |
| 7 | [`SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md`](./SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md) + [`SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md`](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) |
| 8 | [`SPRINT_F2_6_LIBRARY_COLLECTIONS.md`](./SPRINT_F2_6_LIBRARY_COLLECTIONS.md) |
| 9 | [`SPRINT_F2_8_SOCIAL_COMMUNICATION.md`](./SPRINT_F2_8_SOCIAL_COMMUNICATION.md) |
| 10 | [`SPRINT_F2_10_DISCOVER_SEARCH.md`](./SPRINT_F2_10_DISCOVER_SEARCH.md) |
| 11 | [`SPRINT_F2_11_COMMUNITIES_GUILDS.md`](./SPRINT_F2_11_COMMUNITIES_GUILDS.md) |
| 12 | [`SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md`](./SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md) |
| 13 | **This document** — Creator Platform |

Never contradict previous freezes. Align Master §1.6 Creator Economy and Content Architecture (`post` | `review` | `article` | `editorial` | `guide` | `developer_blog`).

**Scope:** Complete Creator Platform & publishing architecture.  
**Out of scope:** UI, React Native, backend, APIs, recommendation algorithms, monetization implementation, Sprint F2.12.1+.

**Placement:** Profile **Creator** section (vertical growth) · Discover creator surfaces · Communities · Game Detail future slots — **not** a separate app or new bottom tab.

**Not:** Medium · Substack · Steam Guides · YouTube · Patreon · generic publishing sites.

**Gate:** Stop after freeze. Do **NOT** continue to Sprint F2.12.1.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Creator Mission |
| 2 | Creator Philosophy |
| 3 | Publishing Object Model |
| 4 | Articles |
| 5 | Guides |
| 6 | Series |
| 7 | Developer Publishing |
| 8 | Editorial Layer |
| 9 | Creator Profile |
| 10 | Publishing Workflow |
| 11 | Drafts |
| 12 | Community Integration |
| 13 | Discover Integration |
| 14 | Reputation |
| 15 | Creator Economy |
| 16 | Relationship Graph |
| 17 | Future Ready |
| 18 | Emotional Goal |
| 19 | Audit Checklist |

---

# 1. Creator Mission

## 1.1 Why creators exist

Creation exists because players eventually want to **contribute back** to gaming culture.

**Everyone can become a creator.**  
Creation is an **evolution of participation** — not a separate product, account type, or “Creator Mode” switch.

## 1.2 Evolution (descriptive — no XP)

```
Player → Reviewer → Curator → Creator → Community Leader
```

| Stage | Contribution |
|-------|----------------|
| **Player** | Logs, plays, belongs |
| **Reviewer** | Opinion & taste artifacts |
| **Curator** | Collections, tiers, shelves |
| **Creator** | Long-form, guides, series, sustained craft |
| **Community Leader** | Stewardship, AMA, community craft elevation |

No XP ladder. No forced path. Multiple facets can coexist (F2.5.1 Identity Evolution).

---

# 2. Creator Philosophy

| Rule | Meaning |
|------|---------|
| Creators **enrich** culture | Never dominate Home, Discover, or Game Detail |
| **Gaming remains protagonist** | Creators support games |
| Games are not an excuse for creators | No influencer-first product |
| Integrate, don’t takeover | F2.7 · F2.8 · F2.11 |

Story Ember: calm craft pride — not hype or clout.

---

# 3. Publishing Object Model

Everything belongs to the **same Content Object family** (Master §10).

| Object | Role |
|--------|------|
| Review | Opinion (Ledger) |
| Post | Short voice |
| Collection | Curated museum |
| Tier List | Taste visualization |
| **Article** | Deep evergreen (`article`) |
| **Guide** | Help (`guide`) |
| **Series** | Multi-part container linking works |
| **Editorial** | Staff/official amplify (`editorial`) |
| **Developer Diary** | Official process (`developer_blog`) |
| Walkthrough · Lore Essay · Retrospective | Guide/article flavors |
| Future media | Video essays, etc. — same family |

Formats evolve without app redesign. Graph-linked to games.

---

# 4. Articles

| Articles are | Articles are not |
|--------------|------------------|
| Deep | Blogs / diary dumps as default |
| Evergreen | Disposable hot takes only |
| High-quality | Engagement bait |
| Discoverable | Hidden paywall silos |
| Game-linked | Isolated Medium posts |

Typography: `editorial.*` tokens reserved (F1). UI not designed here.

---

# 5. Guides

| | **Review** | **Guide** |
|--|------------|-----------|
| Job | Opinion | Helping |
| Question | What do I think? | How do I / we succeed or understand? |
| Graph | Required game | Required game (often stronger structure) |

Both live on the Game Graph and may surface on Game Detail / Communities / Discover.

---

# 6. Series

Multi-part publishing architecture — no implementation.

Examples: Souls Retrospective · Resident Evil Timeline · JRPG History  

Series = ordered container of Articles/Guides/Posts — vertical Profile Creator growth, not a new nav product.

---

# 7. Developer Publishing

Reserve — developer identity integrates naturally (not a bolt-on CMS):

| Reserved |
|----------|
| Developer Diaries · Patch Notes · Behind the Scenes |
| AMA · Official Articles |
| Developer Collections · Developer Guides |

Surfaces: Game Detail · Communities · Discover Developer Spotlight · Profile when verified Dev/Studio.

---

# 8. Editorial Layer

Official/editorial publications **amplify quality** — **never replace community**.

Editorial picks may appear in Discover / Community spotlights. Community craft remains first-class.

---

# 9. Creator Profile

**Extension of Gamer Profile** — not another account type (F2.5 Creator section).

| Includes |
|----------|
| Published Works · Series · Guides · Articles |
| Featured Reviews · Featured Collections |
| Known For · Community Contributions |
| Drafts (private) |

Grows **vertically**, never sideways (F2.5.1). Identity Shelf may pin favorite article/guide later.

---

# 10. Publishing Workflow

Architecture only:

```
Draft → Revision → Preview → Publish → Update → Archive
```

Support **future collaborative publishing** (co-authors, community editors) without splitting the object model.

---

# 11. Drafts

Reserve (no UI):

| Capability |
|------------|
| Draft Library · Private Notes · Version History |
| Scheduled Publishing · Autosave |

Private to creator until publish; Digital Home holds published permanence.

---

# 12. Community Integration

Creators naturally belong inside Communities (F2.11).

| Communities elevate creators | Creators enrich communities |
|------------------------------|-----------------------------|
| Spotlights, AMAs, featured guides | Quality posts, guides, collections |

**Never split** creator product from community culture.

---

# 13. Discover Integration

Discover surfaces creators because of:

**quality · taste · guides · articles · series · collections**

Never simply because of **followers** (F2.10 taste-first · F2.5.1 Known For).

Explainability applies when recommended.

---

# 14. Reputation

Creator reputation comes from:

| From | Not from |
|------|----------|
| Great Guides · Articles · Reviews · Collections | Views alone |
| Helpful community work | Followers alone |
| | Likes alone |

Qualitative Known For facets — **no scoring system** mandated.

---

# 15. Creator Economy

Align Master §1.6 and monetization philosophy:

| Principle |
|-----------|
| **Premium enhances** |
| **Never paywalls culture** |
| Core reading/participating remains free |

Reserve (optional — not implemented here):

Subscriptions · Tips · Support · Creator Memberships · Premium Articles · Early Access  

Upsells contextual; no dark patterns. Entitlements live in monetization docs — this freeze owns **experience ethics**.

---

# 16. Relationship Graph

Creator connects to:

Games · Articles · Guides · Series · Reviews · Collections · Tier Lists · Communities · Developers · Profiles  

**Nothing exists outside the graph.** Game Detail / Home / Discover / Profile remain hubs.

---

# 17. Future Ready

Reserve — no implementation:

Video Essays · Podcasts · Streaming · Courses · Interactive Guides · Community Wikis · Collaborative Writing · Knowledge Bases  

Same Content family + graph; vertical Profile/Community/Discover absorption.

---

# 18. Emotional Goal

Creator experience should feel like:

> **“I contributed something valuable to gaming.”**

Never:

> **“I became an influencer.”**

---

# 19. Audit Checklist

- [ ] Everyone can become a creator — evolution of participation  
- [ ] No XP · no Creator Mode · no separate account type  
- [ ] Creators enrich, never dominate — gaming protagonist  
- [ ] Same Content Object family / graph  
- [ ] Articles ≠ blogs · Guides ≠ reviews  
- [ ] Series / Developer / Editorial reserved correctly  
- [ ] Creator Profile extends Gamer Profile vertically  
- [ ] Workflow Draft→Archive · Drafts capabilities reserved  
- [ ] Community integration — never split  
- [ ] Discover surfaces quality/taste — not follower count  
- [ ] Reputation from craft quality  
- [ ] Creator Economy enhances · core culture free  
- [ ] Full relationship graph  
- [ ] Future media/knowledge reserved  
- [ ] Emotional goal: valuable contribution  
- [ ] Compatible with Master Creator Economy + F2.5–F2.11  
- [ ] No UI · backend · RN · algorithms · monetization implementation · F2.12.1  

---

## Final gate

### APPROVED

**Sprint F2.12 Creator Platform & Publishing Ecosystem LOCKED**

Stop. Do **NOT** continue to Sprint F2.12.1.

---

## Related documents

| Doc | Role |
|-----|------|
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Creator Economy · Content formats |
| [SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) | Vertical creator growth · Known For |
| [SPRINT_F2_11_COMMUNITIES_GUILDS.md](./SPRINT_F2_11_COMMUNITIES_GUILDS.md) | Creator in communities |
| [SPRINT_F2_10_DISCOVER_SEARCH.md](./SPRINT_F2_10_DISCOVER_SEARCH.md) | Creator discovery |
| [SPRINT_F2_7_HOME_FEED.md](./SPRINT_F2_7_HOME_FEED.md) | Creator presence on Home |
| [docs/14_MONETIZATION/MONETIZATION.md](../14_MONETIZATION/MONETIZATION.md) | Entitlements (subordinate to ethics here) |
| [SPRINT_F2_16_PREMIUM_MEMBERSHIP.md](./SPRINT_F2_16_PREMIUM_MEMBERSHIP.md) | Constitutional Premium ethics |
| [SPRINT_F2_13_REPUTATION_RECOGNITION.md](./SPRINT_F2_13_REPUTATION_RECOGNITION.md) | Reputation · Known For · anti-gamification |
| [SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md](./SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) | Long-form reading accessibility |
| [SPRINT_F2_24_ENTERPRISE_STUDIO_ORGANIZATION.md](./SPRINT_F2_24_ENTERPRISE_STUDIO_ORGANIZATION.md) | Orgs collaborate · never replace creators |
| [F3_9_COMMUNITY_CREATOR_SOCIAL_EXPERIENCE.md](../03_UX/F3_9_COMMUNITY_CREATOR_SOCIAL_EXPERIENCE.md) | Creator relationship experience |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Creator evolution, publishing objects, articles/guides/series, workflow, economy ethics, graph, future |
