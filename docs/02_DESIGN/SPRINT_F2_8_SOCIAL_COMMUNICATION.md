# GMRLOG — Sprint F2.8: Social & Communication Architecture

**Document:** `docs/02_DESIGN/SPRINT_F2_8_SOCIAL_COMMUNICATION.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F2.8 (Social Layer philosophy — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** Social & Communication Experience Freeze

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) |
| 4 | [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) |
| 5 | [`SPRINT_F2_3_HOME_FEED.md`](./SPRINT_F2_3_HOME_FEED.md) + [`SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md`](./SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) + [`SPRINT_F2_7_HOME_FEED.md`](./SPRINT_F2_7_HOME_FEED.md) |
| 6 | [`SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md`](./SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md) + [`SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md`](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) |
| 7 | [`SPRINT_F2_6_LIBRARY_COLLECTIONS.md`](./SPRINT_F2_6_LIBRARY_COLLECTIONS.md) |
| 8 | [`SPRINT_F2_4_GAME_EXPERIENCE.md`](./SPRINT_F2_4_GAME_EXPERIENCE.md) |
| 9 | **This document** — Social Layer philosophy |

**Scope:** Entire Social Layer philosophy — how people connect, converse, and notify around games.  
**Out of scope:** React Native, backend, algorithms, Figma, UI implementation, new navigation, Home redesign, Sprint F2.8.1+.

**Compose only existing architecture:** Messages via Profile overflow (not a tab) · Notifications tab · Home/Game/Profile social surfaces · F1 cards (Post, Comment, Message Bubble, Notification, Activity).

**Story Ember:** Calm, warm, identity-first — never chat addiction chrome.

**Gate:** Stop after freeze. Do **not** continue to Sprint F2.8.1.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Social Philosophy |
| 3 | Communication Types |
| 4 | Messaging Philosophy |
| 5 | Notification Philosophy |
| 6 | Presence |
| 7 | Community Interactions |
| 8 | Relationship Graph |
| 9 | Creator Communication |
| 10 | Moderation Philosophy |
| 11 | Future Ready |
| 12 | Audit Checklist |

---

# 1. Mission

## 1.1 Why communication exists

People come to GMRLOG to **discuss games** — not to endlessly chat.

| Conversation does | Conversation must not |
|-------------------|------------------------|
| Support gaming | Become the product |
| Deepen taste, journey, community | Replace Library / Logging / Identity |
| Carry stories about play | Farm infinite session time |

**Gaming remains the protagonist.** Social is the supporting cast.

## 1.2 Emotional goal

The social layer must feel like:

> People gathering because they love games.

Never:

> People addicted to chatting.

---

# 2. Social Philosophy

## 2.1 Building blocks

| Concept | Role |
|---------|------|
| **Followers / Following** | Asymmetric attention — discover people; never Hero vanity |
| **Friends** (future) | Stronger mutual bond — reserved |
| **Mutuals** | Soft bridge on other-profiles (F2.5) |
| **Reputation** | **Known For** — qualitative craft (F2.5.1); no score |
| **Identity** | Gaming Identity · DNA · Digital Home — center of gravity |
| **Conversation** | Posts, replies, comments, DMs — always graph-tied when about play |
| **Community** | Groups, discussions, events (phased) — Discover / future hubs |

## 2.2 How they relate

```
Identity (who I am as a gamer)
    ↑ supports
Reputation (Known For)
    ↑ earned via
Conversation + Curation (reviews, shelves, help)
    ↑ amplified by
Follow graph (reach, not worth)
    ↑ contextualized by
Relationship Graph (shared games & taste)
```

## 2.3 Locked principle

**Identity before popularity.**  
Follower count never defines the person. Align Profile Social non-dominance and Feed “celebrate, don’t chase followers.”

---

# 3. Communication Types

| Type | Role | Graph expectation |
|------|------|-------------------|
| **Posts** | Short public voice (F1 Post Card; F2.7 pillar) | Optional game — encouraged |
| **Replies / Comments** | Threaded response on posts, reviews, collections, etc. | Inherit parent object’s games |
| **Mentions** | Address a person in conversation | Notify calmly |
| **DMs** | Private 1:1 | May reference games/objects |
| **Group DMs** | Future multi-person private | Reserved |
| **Conversation threads** | Nested discussion structure | Spoiler-aware |
| **Reactions** | Lightweight affect (like, helpful, …) — not toxicity metrics |

### Reaction philosophy

- Prefer **meaningful** signals (Like, Helpful) over endless emoji farms.  
- Helpful elevates reviews/guides — craft over outrage.  
- No public “ratio” or dunk metrics.  
- Compose F1 action patterns; no new reaction language required for Core.

---

# 4. Messaging Philosophy

## 4.1 DM exists — GMRLOG is NOT Discord

| GMRLOG DM | Discord-like anti-pattern |
|-----------|---------------------------|
| Calm, intentional | Always-on chat culture |
| Often about a game, review, trade of taste | Random endless scrolling chat |
| Entry via Profile / deep link — **not** a bottom tab (F2.1) | Chat as primary nav |

## 4.2 Principles

- Long sessions happen **around games** (Game Detail, Reviews, Collections) — not random chatting as the home.  
- Message Bubble composition (F1) when UI ships.  
- Presence may inform availability — never pressure “reply now.”  
- Soft notifications — batchable, muteable.

---

# 5. Notification Philosophy

## 5.1 Purpose

Notifications exist to bring people back to **meaningful gaming moments**.

**Never** infinite engagement loops, streak guilt, or outrage pings.

## 5.2 Categories (LOCKED framing)

| Category | Examples |
|----------|----------|
| **Gaming** | Friend playing a shared title, wishlist cultural cues (non-commerce), completion adjacent |
| **Social** | Follow, like, comment, mention, message |
| **Identity** | Milestone, legacy/anniversary soft cue, Known For-adjacent recognition (future) |
| **Creator** | Article/guide engagement, AMA, editorial (future) |
| **System** | Security, policy, sync, verification |
| **Future** | Events, live rooms, guilds — reserved |

Aligns and extends F2.1 notification categories (Social, Games, Reviews, Collections, Achievements, System, Moderation, Admin, Creator) under this philosophy umbrella.

## 5.3 Rules

- Prefer quality over quantity; digest options later.  
- Deep link to the **object** (game, review, post) — not empty inboxes.  
- Tab badge numeric with cap (F2.1).  
- User control in Settings — never dark-pattern re-enable.

---

# 6. Presence

Architecture only — no UI chrome mandated.

| State | Intent |
|-------|--------|
| Online / Offline | Basic availability |
| Last Seen | Optional, privacy-respecting |
| Playing | Rich signal — title on the graph |
| Writing Review | Creative presence |
| Creating Collection | Curation presence |
| Future Rich Presence | Session, party, community room — reserved |

### Rules

- Presence supports **living community** (Feed / Game Pulse) — not surveillance.  
- Privacy defaults favor calm; granular controls in Settings (architecture).  
- “Playing” ties to Game graph — gaming stays protagonist.

---

# 7. Community Interactions

| Interaction | Philosophy |
|-------------|------------|
| **Likes** | Soft appreciation |
| **Helpful** | Craft signal — especially reviews/guides |
| **Bookmarks** | Save for later (Future home per IA) |
| **Shares** | Spread taste — system share sheet |
| **Mentions** | Invite into conversation |
| **Quotes** | Future — cite a post/review with context |
| **Thread replies** | Discuss in place; spoilers respected |

**No toxicity-first metrics** (controversial sort as default, dunk counts, public shame scores).

---

# 8. Relationship Graph

## 8.1 Philosophy

People connect through:

**Games · Reviews · Collections · Tier Lists · Shared taste**

Not through follower count.

## 8.2 Implications

| Surface | Relationship signal |
|---------|---------------------|
| Other Profile | Mutuals · Shared Games · Shared Reviews · Shared Collections (F2.5) |
| Game Detail | Friends playing / reviewed / shelved (F2.4) |
| Home | Friend Activity · “because your friends…” recs (F2.7) |
| Discover | Community overlap · taste similarity |

Follower edges are **distribution**, not **definition**. The relationship graph is a projection of the **gaming graph** between people.

---

# 9. Creator Communication

Reserved — integrates, never takeovers (F2.7).

| Surface | Intent |
|---------|--------|
| Followers | Same follow graph |
| Subscribers | Future — Premium/creator enhance; not paywalled culture |
| Creator posts | Same Post/Article family |
| Creator discussions | Threads on craft |
| AMAs | Structured conversation events (future) |
| Developer interactions | Dev identity chip · diaries · replies |

Vertical growth on Profile Creator section (F2.5.1) — no sideways Creator tab.

---

# 10. Moderation Philosophy

Architecture only — healthy discussion, identity protection.

| Tool | Role |
|------|------|
| **Spoilers** | Explicit gates — culture of care (F1 Spoiler Badge) |
| **Mute** | Quiet a source without drama |
| **Block** | Hard boundary |
| **Report** | Trust & safety intake (F2.1 flows) |
| **Conversation safety** | Rate limits, staff stacks — IA already reserved |
| **Identity protection** | No harassment of Digital Home; calm security tone (Auth polish) |

Healthy discussion > viral conflict. Moderator/Admin stacks remain role overlays (F2.1) — not player nav.

---

# 11. Future Ready

Reserve without UI / implementation / nav redesign:

| Reserved |
|----------|
| Voice |
| Communities (hub already phased) |
| Guilds |
| Events |
| Live rooms |
| Streaming |

Absorb into Discover / Community / Events surfaces later — **no new bottom tabs** without F2.1 amendment.

---

# 12. Audit Checklist

- [ ] Communication supports games — gaming is protagonist  
- [ ] Feels like gathering for love of games — not chat addiction  
- [ ] Identity before popularity  
- [ ] Followers / Friends / Mutuals / Reputation / Conversation / Community related clearly  
- [ ] Posts, replies, comments, mentions, DMs, reactions, threads defined  
- [ ] DM calm — not Discord clone; not a tab  
- [ ] Notifications → meaningful gaming moments; categories defined; no infinite engagement  
- [ ] Presence states reserved; privacy-respecting; Playing graph-tied  
- [ ] Likes / Helpful / Bookmarks / Shares / Mentions / threads — no toxicity-first metrics  
- [ ] Relationship graph via games & taste — not follower count  
- [ ] Creator communication reserved; no takeover  
- [ ] Moderation: spoiler, mute, block, report, safety, identity protection  
- [ ] Voice / Communities / Guilds / Events / Live / Streaming reserved  
- [ ] No nav redesign · No Home redesign  
- [ ] Compose existing IA + F1 only  
- [ ] Story Ember consistency  
- [ ] No RN · backend · algorithms · Figma · F2.8.1  

---

## Final gate

### APPROVED

**Sprint F2.8 Social & Communication Architecture LOCKED**

Stop. Do **not** continue to Sprint F2.8.1.

---

## Related documents

| Doc | Role |
|-----|------|
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | Notifications tab · Messages overflow · deep links |
| [SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md](./SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md) | Notifications & Activity Center detail |
| [SPRINT_F2_7_HOME_FEED.md](./SPRINT_F2_7_HOME_FEED.md) | Social philosophy on Home · creator presence |
| [SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) | Known For · identity before popularity |
| [SPRINT_F1_FOUNDATION.md](./SPRINT_F1_FOUNDATION.md) | Post · Comment · MessageBubble · NotificationCard |
| [F3_9_COMMUNITY_CREATOR_SOCIAL_EXPERIENCE.md](../03_UX/F3_9_COMMUNITY_CREATOR_SOCIAL_EXPERIENCE.md) | Social interaction experience |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Social + Communities pillars · Creator Economy |
| [SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md](./SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md) | Trust constitution · moderation · privacy |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Social layer mission, messaging ≠ Discord, notifications, presence, relationship graph, moderation, future reserves |
