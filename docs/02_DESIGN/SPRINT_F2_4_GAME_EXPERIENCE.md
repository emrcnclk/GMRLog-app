# GMRLOG — Sprint F2.4: Game Detail Experience Architecture

**Document:** `docs/02_DESIGN/SPRINT_F2_4_GAME_EXPERIENCE.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F2.4 (Game Detail architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director / UX Architecture  
**Classification:** Frozen Game Detail experience

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) |
| 4 | [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) |
| 5 | [`SPRINT_F2_3_HOME_FEED.md`](./SPRINT_F2_3_HOME_FEED.md) + [`SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md`](./SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) |
| 6 | **This document** — Game Detail experience freeze |
| 6a | [`SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md`](./SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md) — **LOCKED amendment** (Journey, Game Pulse, memory, Known For, return hooks) |

**Game Detail SSOT** = this document + F2.4.1 identity refinement.

**Scope:** How every player experiences a game inside GMRLOG — architecture & composition only.  
**Out of scope:** React Native, backend, recommendation engine, pixel Figma, UI implementation, Sprint F2.5+.

**Placement (F2.1):** Shared **Game Stack** root = Game Detail · deep link `gmrlog://game/{id}`.

**Amendment note:** Section order is **relationship-first** (Personal before Friends/Community). This refines Master / F2.1 Game Page IA listings; **this document wins** for Game Detail hierarchy.

**Gate:** Stop after freeze. Do **not** continue to the next sprint in this deliverable.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Game Philosophy |
| 2 | Section Hierarchy |
| 3 | Personal Relationship |
| 4 | Friends Layer |
| 5 | Community Layer |
| 6 | Game Logs |
| 7 | Reviews · Posts · Collections |
| 8 | Statistics |
| 9 | Primary Actions |
| 10 | Empty States |
| 11 | Future Expansion |
| 12 | Audit Checklist |

---

# 1. Game Philosophy

## 1.1 Core question

The Game Detail page must answer:

> **What does this game mean to me?**

Not:

> What information exists about this game?

## 1.2 Competitive contrast

| Platform focus | GMRLOG focus |
|----------------|--------------|
| Steam — buying | **Your relationship** with the game |
| Metacritic — scores | Scores as context, not the destination |
| IGN — editorial reviews | Community + **your** review/history |
| Letterboxd — films | Games as lived journeys (logs, sessions, shelves) |

## 1.3 Emotional center

Game Detail is the **emotional center** of every title in GMRLOG.

Players should feel:

> “This is **MY history** with this game.”

Not:

> “This is a database page.”

## 1.4 Pillars on this surface

| Pillar | How it appears |
|--------|----------------|
| Library | Ownership, wishlist, backlog, collections, related |
| Logging | Status, progress, sessions, GameLog Timeline, reviews |
| Social | Friends activity, posts, share |
| Discovery | Related, recommendations, community pulse |
| Identity | Personal rating, favorites, achievements, stats about *you* |
| Communities | Discussions (phased), guides (future) |

## 1.5 Graph continuity (F2.3.1)

This page is a **hub node** of the gaming graph. Every outbound card (review, post, collection, tier, achievement) remains game-connected. Inbound from Home / Search / Library / Profile lands here with stack back intact.

---

# 2. Section Hierarchy

## 2.1 Locked order

```
1.  Hero
2.  Personal Status / Relationship
3.  Friends Activity
4.  Community
5.  Reviews
6.  Posts
7.  Collections
8.  Tier Lists
9.  Achievements
10. Statistics
11. Related Games
12. Future — Articles
13. Future — Guides
14. Future — Mods
```

## 2.2 Why this order

| Section | Why here |
|---------|----------|
| **Hero** | Orient: what game; instant status affordances |
| **Personal** | Core philosophy — *my* meaning first (Steam/Metacritic inversion) |
| **Friends** | Social proof from *your* world before global noise |
| **Community** | Broader “what’s happening” for this title |
| **Reviews** | Deep taste artifacts (largest cards when listed) |
| **Posts** | Lighter voice / discussion adjacent |
| **Collections · Tiers** | How culture shelves and ranks this game |
| **Achievements** | Progress identity (personal + community later in stats) |
| **Statistics** | Calm facts after stories — never the hero |
| **Related** | Discovery exit without becoming a store |
| **Articles · Guides · Mods** | Creator/community depth without redesign later |

**Why Personal before Friends:** Relationship-first. Friends enrich *your* history; they don’t replace it.  
**Why Stats late:** Prevents Metacritic energy at the top.  
**Why Related last among Core:** Leave after belonging, not bounce to browse mid-identity.

## 2.3 Guest / soft gate

Guests see Hero + Community + Reviews/Posts (public) + Related. Personal/Friends muted with soft auth gate on primary actions (F2.2.1).

---

# 3. Hero (hierarchy only)

Hero orients and exposes **relationship affordances** — not a storefront billboard.

| Element | Role |
|---------|------|
| **Cover** | Primary artwork (cinematic; F1 Cover) |
| **Background** | Soft art extension / scrim — calm, not neon |
| **Title** | Display hierarchy |
| **Developer** | Link to developer/studio identity (when exists) |
| **Platforms** | Subtle platform badges |
| **Genres** | Taste chips |
| **Release** | Date / TBA meta |
| **Community Rating** | Aggregate context (secondary to personal when logged in) |
| **Personal Rating** | Your score if set — identity accent |
| **Completion** | Completion Arc / % when applicable |
| **Ownership** | Owned / not owned signal |
| **Wishlist** | State + action |
| **Backlog** | State + action |
| **Playing / Completed / Dropped / …** | Status from Library/Logging vocabulary |

Hero may surface a **compact status control** (status picker) — full Personal section expands the story.

No pixel layout here.

---

# 4. Personal Relationship

## 4.1 Most important section

This is **“My history.”** If only one section ships well, it is this one.

## 4.2 Philosophy

| Include | Feeling |
|---------|---------|
| **Your Progress** | Where you are in the journey |
| **Your Rating** | Your taste stamp |
| **Your Review** | Link/preview to your Review Card / empty CTA |
| **Your Playtime** | Lived time (mono/stat, calm) |
| **Your Sessions** | Recent sessions → GameLog |
| **Your Screenshots** | Future media shelf |
| **Your Notes** | Future private/public notes |

## 4.3 Presentation architecture

- Compose **GameLog Timeline** (F1 composition) + status + rating + review entry.  
- Empty personal state is hopeful: “Start your history” → Log Progress (not shame).  
- Personal block stays above Friends so the page never opens as “everyone else first.”

## 4.4 Primary emotional job

Answer *meaning to me* before *consensus about it*.

---

# 5. Friends Layer

Architecture only — no implementation.

| Block | Intent |
|-------|--------|
| **Friends currently playing** | Living presence (F2.3.1 momentum) |
| **Friends completed** | Shared victories / closure |
| **Friends reviewed** | Taste you trust |
| **Friends recommended** | Social discovery |
| **Friends collections** | Shelves that include this game |
| **Friends tier lists** | Where they ranked it |

### Rules

- Prefer **Living Activity** sentence style when listing deeds.  
- Tap → Profile / Review / Collection / Tier / Presence filter.  
- If no friends graph: collapse section; do not fake social proof.  
- Ordering: playing → recent completed/reviewed → shelves/tiers.

---

# 6. Community Layer

Broader culture for this title — still not a review river alone.

| Block | Intent |
|-------|--------|
| **Recent Reviews** | Fresh taste |
| **Recent Posts** | Voice now |
| **Popular Discussions** | Communities pillar (phased) |
| **Newest Logs** | Logging pulse |
| **Top Review** | One highlighted quality review (helpful/friends-weighted philosophy) |

### Ordering philosophy

| Signal | Use |
|--------|-----|
| Recency | Recent* blocks |
| Quality / helpful | Top Review |
| Friends overlap | Soft boost inside community previews |
| Diversity | Mix logs + posts + reviews in the Community *preview*; full lists live in dedicated sections below |

Community section is a **sampler**; Reviews/Posts sections are the deeper lists.

---

# 7. Game Logs

## 7.1 Role

Logs are the spine of **relationship** — sessions, progress, completion, mood.

## 7.2 Presentation architecture

| Form | Use |
|------|-----|
| **Timeline** | Primary personal history (GameLog Timeline composition) |
| **Cards** | Feed-like log moments when surfaced in Community/Friends |
| **Sessions** | Entries on the timeline |
| **Progress** | Status + % + Completion Arc |
| **Completion** | Milestone node on timeline |
| **Mood** | Optional tag on log/review (architecture reserved; not required Core) |

No redesign of F1 signatures — compose them.

---

# 8. Reviews · Posts · Collections · Tiers · Achievements

## 8.1 Reviews

| Dimension | Freeze |
|-----------|--------|
| **Appearance** | Review Card (Ledger + Ember Rail) |
| **Sorts** | **Best** (helpful/quality) · **Newest** · **Friends** · **Developer** (official/dev responses if any) |
| **Default** | Friends if friend reviews exist; else Best |
| **Spoilers** | Spoiler Badge + hidden body; filter “Hide spoilers” available |
| **Empty** | CTA Write Review + community sampler if any |

Sorting philosophy: **trust and taste over rage engagement**. Friends and Best beat pure controversial.

## 8.2 Posts

| Dimension | Freeze |
|-----------|--------|
| **Scope** | Posts with this game on the graph (optional game ref resolved here) |
| **Ordering** | Newest default; Friends boost soft |
| **Pinned** | Reserved for developer/community mods later — architecture slot at top of Posts |
| **Context** | Game chip always visible on this page’s posts |
| **Media** | F1 Post Card restrained media → Media Viewer |
| **Spoilers** | Same spoiler discipline as reviews when flagged |

## 8.3 Collections · Tier Lists · Recommendations relationship

| Relationship | Presentation |
|--------------|--------------|
| **Collections containing this game** | Collection Shelf previews; “Appears in” |
| **Tier Lists ranking this game** | Tier List Card / row with tier letter highlight |
| **Recommendations** | Related section + “Because…” explainability (F2.3.1) |

Show **edges of the graph**, not isolated lists.

## 8.4 Achievements

- Personal unlock progress first when logged in.  
- Community rarity later inside Statistics or subview.  
- Tap → achievement detail / tracking (phased).

---

# 9. Statistics

Calm facts **after** stories. **No charts in this sprint** — define *what* exists.

| Metric family | Examples |
|---------------|----------|
| Community completion | % completed / abandoned patterns (high level) |
| Average rating | Community aggregate |
| Volume | Reviews · Logs · Collections · Tier Lists counts |
| Friends | Friends who own / played / reviewed |
| Playtime distribution | Buckets architecture (e.g. ranges) — visualize later |

Stats must not outrank Personal or Friends visually when UI ships (F1 hierarchy: stats tertiary unless user seeks them).

---

# 10. Primary Actions

Freeze the action vocabulary (placement UI later; Hero + sticky/overflow patterns allowed).

| Action | Intent |
|--------|--------|
| **Log Progress** | Primary relationship verb — sheet/status (F2.1 modal) |
| **Write Review** | Taste artifact |
| **Create Post** | Voice about this game (game pre-attached) |
| **Add to Collection** | Library graph edge |
| **Recommend** | Social share of taste (to friends / post) |
| **Wishlist** | Library intent |
| **Share** | System share sheet |
| **Favorite** | Identity showcase signal |

Composer chooser may open with **game context prefilled** (F2.3 create entry pattern).

Secondary: rate, change status, view timeline, report, hide.

---

# 11. Empty States

Always hopeful; never a dead database.

| Situation | Philosophy |
|-----------|------------|
| **Never played** | Invite to start history — Log / Wishlist / backlog; show Friends/Community so the world feels alive |
| **No reviews** | “Be the first voice” + Write Review; still show posts/logs if any |
| **No friends** | Collapse Friends; lean Community + Related; suggest Discover people (not guilt) |
| **Offline** | Cached hero + personal if available; Offline state + Retry |
| **New release** | Pulse energy — early logs/posts; soft “first impressions” without spoiler pressure |

Guest: browse community; actions soft-gate to auth.

---

# 12. Future Expansion (Creator Ready)

Reserve without redesign:

| Future | Slot |
|--------|------|
| **Articles** | Section 12 — editorial cards; multi-game graph OK |
| **Guides** | Section 13 — structured; Communities/Creator |
| **Video Essays** | Media-forward card under Articles/Guides family |
| **Developer Notes** | Pinned in Posts/Community; Developer identity chip |
| **Walkthroughs** | Guides subtype |
| **Mods** | Section 14 — Library-adjacent culture |

Same Content object family (`article` / `guide` / `developer_blog`) — Master §10 · F2.3.1 creator-ready.

Premium enhances creators; does not lock reading culture on Game Detail.

---

# 13. Audit Checklist

- [ ] Answers “What does this game mean to me?”  
- [ ] Feels like MY history — not a DB/store/Metacritic page  
- [ ] Hierarchy: Hero → Personal → Friends → Community → … locked  
- [ ] Personal Relationship is the strongest section intent  
- [ ] Friends / Community layers defined without implementation  
- [ ] Logs via Timeline/sessions/progress architecture  
- [ ] Reviews sorts: Best · Newest · Friends · Developer + spoilers  
- [ ] Posts: ordering, pin slot, game context, media, spoilers  
- [ ] Collections/Tiers show graph relationships  
- [ ] Statistics defined, charts deferred, placement late  
- [ ] Primary actions frozen  
- [ ] Empty states hopeful (never played / no reviews / no friends / offline / new release)  
- [ ] Articles/Guides/Mods/Dev notes reserved  
- [ ] Game graph hub continuity with Home  
- [ ] F2.1 Game Stack + modals respected  
- [ ] F1 signatures only — no one-off Game page chrome language  
- [ ] No RN / backend / algo / pixel Figma in this sprint  

---

## Success criteria

| Criterion | Met |
|-----------|-----|
| Emotional center of each game | Yes — Personal-first |
| Relationship over catalog | Yes |
| Compose from F1 + F2.1 | Yes |
| Creator-ready without redesign | Yes |

---

## Final gate

### APPROVED

Sprint F2.4 Game Detail Experience Architecture is **LOCKED**.

Stop. Do **not** continue to the next sprint in this output.

---

## Related documents

| Doc | Role |
|-----|------|
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Game destination · content architecture |
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | Game Stack · deep links · modals |
| [SPRINT_F1_FOUNDATION.md](./SPRINT_F1_FOUNDATION.md) | Review / Shelf / Timeline / Game Card |
| [SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md](./SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) | Gaming graph · living activity · explainability |
| [SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md](./SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md) | Journey · Game Pulse · memory identity |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Relationship-first Game Detail hierarchy, personal/friends/community, actions, empty, creator-ready |
