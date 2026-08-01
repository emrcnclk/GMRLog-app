# GMRLOG — Sprint F2.11: Communities & Guild Ecosystem

**Document:** `docs/02_DESIGN/SPRINT_F2_11_COMMUNITIES_GUILDS.md`  
**Version:** 1.1  
**Status:** **LOCKED** · **Amended by MVP Final Integration Amendment** (§16)  
**Sprint:** F2.11 (Communities & Guild Ecosystem — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** Community Ecosystem Freeze

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
| 7 | [`SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md`](./SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md) |
| 8 | [`SPRINT_F2_6_LIBRARY_COLLECTIONS.md`](./SPRINT_F2_6_LIBRARY_COLLECTIONS.md) |
| 9 | [`SPRINT_F2_8_SOCIAL_COMMUNICATION.md`](./SPRINT_F2_8_SOCIAL_COMMUNICATION.md) |
| 10 | [`SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md`](./SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md) |
| 11 | [`SPRINT_F2_10_DISCOVER_SEARCH.md`](./SPRINT_F2_10_DISCOVER_SEARCH.md) |
| 12 | **This document** — Communities & Guilds |

Extends prior freezes. **Never contradict** them.

**Scope:** Complete Community layer philosophy + Guild reservation.  
**Out of scope:** React Native, backend, algorithms, Figma, UI, implementation, Sprint F2.11.1+.

**Placement (F2.1):** Communities hub via **Discover** / deep link — **not** a new bottom tab without IA amendment.  
**Compose:** F1 DiscussionCard · CommunityCard · Post/Review/Shelf/Tier · F2.8 discussion/moderation · F2.10 community discovery.

**Gate:** Stop after freeze. Do **not** continue to Sprint F2.11.1.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Community Mission |
| 2 | Community Philosophy |
| 3 | Community Types |
| 4 | Community Identity |
| 5 | Community Feed |
| 6 | Community Discussions |
| 7 | Community Discovery |
| 8 | Relationship Graph |
| 9 | Community Roles |
| 10 | Guild System (Future) |
| 11 | Community Reputation |
| 12 | Creator Integration |
| 13 | Future Ready |
| 14 | Emotional Goal |
| 15 | Audit Checklist |

---

# 1. Community Mission

## 1.1 Why Communities exist

Communities exist because people **love the same games** — not because they want another chat room.

**Gaming always remains the protagonist.**

## 1.2 Why join a community instead of only following users?

| Following users | Joining a community |
|-----------------|---------------------|
| Follows a **person’s** taste & journey | Gathers around a **shared object of passion** (game, genre, craft) |
| Asymmetric attention | Shared culture, rules, and curated knowledge |
| Profile Digital Home of one gamer | Collective museum of many gamers’ best work |

Someone joins a community to find **shared expertise, discovery, and culture** around a theme — not to open a generic inbox of people.

---

# 2. Community Philosophy

| Feel like | Never feel like |
|-----------|-----------------|
| Shared passion | Endless chat |
| Shared expertise | Memes-as-product |
| Shared discovery | Spam |
| Shared culture | Politics-as-default |
| | Generic social groups |

Not a Discord / Reddit / Facebook Groups / Steam Discussions clone. Inherit **behaviors** (belonging, topical discussion, guides) — never UI.

Align F2.8: conversation supports gaming; healthy discussion; spoilers respected.

---

# 3. Community Types

Architecture categories (extensible):

| Type | Gravity |
|------|---------|
| Game Communities | Single title hub |
| Series Communities | Franchise |
| Genre Communities | Taste clusters |
| Developer Communities | Studio / author affinity |
| Platform Communities | Where people play |
| Hardware Communities | Culture OS breadth |
| Challenge Communities | Shared journeys / challenges |
| Lore Communities | World & story depth |
| Speedrun Communities | Craft & mastery |
| Modding Communities | Creation culture |
| Esports Communities | Competitive culture |
| Retro Communities | Legacy & memory |
| Future types | Reserved extension |

No type permanently dominates Discover or Home when surfaced.

---

# 4. Community Identity

Every community has its own identity — a collective cousin of Gamer Identity.

| Element | Role |
|---------|------|
| **Purpose** | Why this gathering exists |
| **Description** | Human summary |
| **Rules** | Culture of care (spoilers, respect) |
| **Featured creators** | Craft spotlights |
| **Featured collections** | Museum highlights |
| **Featured reviews** | Taste highlights |
| **Featured guides** | Expertise (future) |
| **Community moderators** | Trust stewards |
| **Community reputation** | Quality signal (§11) |
| **Community tags** | Discoverability |

Identity before member-count vanity.

---

# 5. Community Feed

What lives inside — **not** infinite generic chat.

| Content | Role |
|---------|------|
| Posts | Voice |
| Reviews | Opinion (game-linked) |
| Collections | Curated museums |
| Tier Lists | Taste visualization |
| Articles / Guides | Future craft |
| Developer Diaries | Official voice |
| Events | Time-bound culture |
| Pinned Discussions | Organized topics |
| Featured Games | Graph anchors |

Magazine rhythm kinship when dense (F2.3 / F2.7) — vary types; gaming graph required.

Compose F1 signatures only.

---

# 6. Community Discussions

## 6.1 Philosophy

Discussions are **organized around games and topics** — contextual replies, spoiler-aware.

| GMRLOG discussions | Discord anti-pattern |
|--------------------|----------------------|
| Topic + game context | Undifferentiated channels as home |
| Threaded, findable | Scroll-away forever chat |
| Spoiler gates | Spoiler chaos |
| Quality over volume | Always-on noise |

Differentiate from DMs (F2.8): communities are **public culture hubs**; DMs are calm private.

---

# 7. Community Discovery

How users find communities (architecture — no algo):

| Signal | Example spirit |
|--------|----------------|
| Journey | Because you played… |
| DNA | Because your DNA matches… |
| Shelves | Because your collections overlap… |
| Social | Friends joined… |
| Graph | Developer you follow… |
| Taste | Genre affinity… |
| Pulse | Trending community… / Hidden community… |

Taste-first (F2.10). Explainability when recommended. Discover hub is primary entry (F2.1 / F2.10).

---

# 8. Relationship Graph

Communities sit **inside** the Game Graph — nothing isolated.

```
Community
  ↔ Games · Profiles · Reviews · Collections · Tier Lists
  ↔ Articles · Events · Developers · Creators
```

| Edge | Meaning |
|------|---------|
| Community → Game(s) | Why the hub exists |
| Community → Profile | Membership / roles |
| Community → Reviews / Collections / Tiers | Featured culture |
| Community → Creator / Developer | Craft & official voice |
| Game Detail → Communities | Destination “discussions / communities” (F2.4) |
| Home / Discover → Community | Cards & hubs |

---

# 9. Community Roles

Reserve architecture — **no gamified hierarchy, no XP, no Discord role chaos**.

| Role | Intent |
|------|--------|
| Member | Participant |
| Trusted Member | Earned trust (qualitative) |
| Moderator | Safety & care |
| Community Curator | Taste & featured culture |
| Creator | Craft inside the hub |
| Developer | Official / studio presence |
| Admin | Platform / elevated stewardship |

Roles describe **responsibility**, not rank flex.

---

# 10. Guild System (Future)

**Communities ≠ Guilds.**

| Communities | Guilds (reserved) |
|-------------|-------------------|
| Public (or broadly cultural) hubs | Smaller **private** groups |
| Culture around games / themes | Tight belonging / crew |
| Discoverable | Invite-first |

Separate architecture reservation — do not collapse Guilds into Communities or vice versa. No UI in this sprint.

---

# 11. Community Reputation

Communities gain reputation through **quality**:

| Through | Never through |
|---------|----------------|
| Great reviews | Member count alone |
| Great guides | Messages sent |
| Great collections | Hours online |
| Helpful discussions | Spam volume |
| Quality moderation | Vanity metrics |

Kinship with Known For / identity-before-popularity (F2.5.1 · F2.8). **No scoring system** mandated — qualitative facets.

---

# 12. Creator Integration

Creators naturally belong inside communities — integrate, don’t takeover (F2.7 / F2.8).

Reserve:

AMA · Developer Q&A · Guides · Editorial Picks · Series · Articles · Community Spotlights  

Premium enhances creator presence — never paywalls community culture reading.

---

# 13. Future Ready

Reserve without implementation:

| Reserved |
|----------|
| Voice Rooms · Live Events · Community Challenges |
| Guild Wars · Seasonal Festivals |
| Developer Streams · Streaming integrations |
| Knowledge Bases |

No new bottom tabs without F2.1 amendment. Notifications category “Future Communities / Guilds / Events” (F2.9) applies.

---

# 14. Emotional Goal

Community should feel like:

> **“I found my people.”**

Never:

> **“I joined another Discord server.”**

---

# 15. Audit Checklist

- [ ] Communities are culture hubs — shared passion/expertise/discovery/culture  
- [ ] Why join vs only follow users is clear  
- [ ] Gaming remains protagonist  
- [ ] Not Discord · not Reddit · not Facebook Groups · not Steam Discussions clone  
- [ ] Community types defined & extensible  
- [ ] Community identity (purpose, rules, featured craft, mods, tags)  
- [ ] Feed = posts/reviews/shelves/tiers/events — no infinite generic chat  
- [ ] Discussions organized, contextual, spoiler-aware  
- [ ] Discovery taste-first & explainable  
- [ ] Full Game Graph consistency  
- [ ] Roles without XP / Discord role chaos  
- [ ] Guilds reserved separately from Communities  
- [ ] Reputation via quality — not member count / messages / hours  
- [ ] Creator integration reserved  
- [ ] Future voice/events/streams/knowledge reserved  
- [ ] Emotional goal: found my people  
- [ ] Entry via Discover / deep link — no nav redesign  
- [ ] Compatible with F2.1–F2.10 freezes  
- [ ] No UI · backend · algorithms · implementation · F2.11.1  
- [ ] MVP community scope declared (§16) — Detail · Feed · Members · Activity as one Shared Destination  

---

# 16. MVP Final Integration Amendment — Communities MVP

**Amendment:** MVP Final Integration Amendment (July 2026). Communities are **MVP scope**, not Version 2. Philosophy in §1–§15 is unchanged; this section fixes what exists in MVP and how it relates to the rest of the product.

## 16.1 MVP community surfaces

Community is a **first-class social destination** (a Shared Destination / room), reached from Discover and from culture that mentions them. Navigation remains unchanged: hub entry under Discover — no new tab (F2.1).

Communities may contain:

| Surface | Role | Anchor |
|---------|------|--------|
| Community Detail | The room's identity and orientation | §4 Community Identity |
| Community Feed | Community-scoped culture stream | §5 Community Feed |
| Community Members | The people of the room | §9 Community Roles |
| Community Activity | What happened inside this room | §5 · F2.9 |

## 16.2 Product relationships in MVP

| Relationship | Rule |
|--------------|------|
| Home | May display community activity from rooms the player belongs to (F2.7) — Home never becomes a communities feed |
| Discover | Exposes community discovery via the Communities Hub (§7 · F2.10) |
| Game · Post · Review · User | Remain their own destinations; communities reference them, never own them (§8) |
| Notifications | Community attention stays in the attention desk (F2.9) |
| Events | Community events are events (F2.15) presented in the community's context |

## 16.3 MVP laws

| Law |
|-----|
| Community is a first-class social destination — not a Discord clone and not a secondary chat layer |
| Navigation is unchanged: communities live under Discover as a hub entry and open as a Shared Destination — no new tab (F2.1) |
| Joining and leaving are deliberate, confirmable and reversible acts |
| Community sub-surfaces (Feed · Members · Activity) are children of the room — never new product areas |
| Member counts and activity volume are never presented as status pressure (§11) |
| Communities remain GMRLOG-native — never Discord-supplied (F2.21 §20.2) |

## 16.4 Still not MVP

| Deferred |
|----------|
| Guild System (§10) |
| Voice · live streams · knowledge bases (§13) |
| Creator monetization inside communities (F2.12 · F2.26) |

## 16.5 Architecture references

| Reference | Contains |
|-----------|----------|
| F5.1 §17.7 · §34 | Community as Shared Destination with MVP sub-surfaces |
| F5.2 §6.4 | Community activity in Home taxonomy |
| F5.3 | Community Detail · Feed · Members · Activity screens |
| F5.4 §38.1.1 | Community card / row behavior |

---

## Final gate

### APPROVED

**Sprint F2.11 Communities & Guild Ecosystem LOCKED**

Stop. Do **NOT** continue to Sprint F2.11.1.

---

## Related documents

| Doc | Role |
|-----|------|
| [SPRINT_F2_10_DISCOVER_SEARCH.md](./SPRINT_F2_10_DISCOVER_SEARCH.md) | Community discovery entry |
| [SPRINT_F2_8_SOCIAL_COMMUNICATION.md](./SPRINT_F2_8_SOCIAL_COMMUNICATION.md) | Discussion · moderation · not Discord |
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | Communities hub placement |
| [SPRINT_F2_4_GAME_EXPERIENCE.md](./SPRINT_F2_4_GAME_EXPERIENCE.md) | Game ↔ discussions / communities |
| [SPRINT_F1_FOUNDATION.md](./SPRINT_F1_FOUNDATION.md) | CommunityCard · DiscussionCard |
| [F3_9_COMMUNITY_CREATOR_SOCIAL_EXPERIENCE.md](../03_UX/F3_9_COMMUNITY_CREATOR_SOCIAL_EXPERIENCE.md) | Community participation experience |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Communities pillar |
| [SPRINT_F2_12_CREATOR_PLATFORM.md](./SPRINT_F2_12_CREATOR_PLATFORM.md) | Creator publishing in communities |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Community mission, types, identity, feed, discussions, discovery, graph, roles, guilds vs communities, reputation, creator, future |
| 1.1 | July 2026 | **MVP Final Integration Amendment** — §16 added: Communities MVP as a first-class social destination (Detail · Feed · Members · Activity); Guilds · voice · streams remain deferred; navigation and philosophy unchanged |
