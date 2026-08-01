# GMRLOG — Product Backlog (Post-MVP)

**Document:** `docs/00_PROJECT/PRODUCT_BACKLOG.md`  
**Version:** 1.0  
**Status:** **ACTIVE — POST-MVP SSOT**  
**Date:** 2026-07-19  
**Role:** Principal Product Architect / CTO  
**Classification:** Permanent Product Evolution Backlog

> **This document does not change MVP scope, sprint order, Freezes, OpenAPI, Prisma, or [`docs/01_PRODUCT/ROADMAP.md`](../01_PRODUCT/ROADMAP.md).**  
> It stores approved **post-MVP** product ideas only.

---

## Purpose

This backlog is the **single source of truth (SSOT)** for all **future product evolution after MVP**.

- Current MVP / Module Freezes / active sprints remain authoritative for what ships **now**.
- Items here may be **promoted** into future roadmap revisions only after architecture review and North Star validation.
- Until MVP ships, this backlog stays **stable**: add/clarify entries; do **not** pull items into MVP.

**Canonical roadmap (unchanged):** [`docs/01_PRODUCT/ROADMAP.md`](../01_PRODUCT/ROADMAP.md)  
**Direction lock:** [`docs/00_PROJECT/NORTH_STAR.md`](./NORTH_STAR.md)

---

## Naming note (critical)

| Label in this document | Meaning |
|------------------------|---------|
| **Backlog Phase 2** | Post-MVP **feature horizon** categories in *this* backlog (Community Expansion, Steam, AI, etc.) |
| **Backlog Phase 3** | Later **platform / extensibility** horizon in *this* backlog |
| **Icebox** | Approved ideas with **no** assigned backlog phase |
| **ROADMAP Phase 2 / 3 / …** | Product delivery phases in `ROADMAP.md` (Closed Beta, Public Launch, …) — **not modified by this file** |

When a backlog item’s **Suggested phase** says “Phase 2”, it means **Backlog Phase 2** unless explicitly tied to a ROADMAP tranche in Dependencies.

---

## Sources folded in (reference only)

Deferred / Phase 2 notes from existing docs remain **documentation of deferral**; this backlog **captures** them for post-MVP planning without unlocking implementation:

| Source | Examples captured here |
|--------|------------------------|
| Communication Freeze / Sprint 9.4 amendment | Voice Rooms / Voice Platform |
| Module 10 Scope / Notification Freeze | Communication alerts, push/email send, digests, `FRIEND_ONLINE`, AI ranking, `GAME_DISCOUNT` |
| North Star | Steam-adjacent culture, indie/jams, OST, movies/TV, marketplace, AI-native, developers/studios |
| ROADMAP later phases | AI, guilds, events, public API — listed here as backlog depth, not a reorder |

---

## Feature card schema

Every feature uses:

| Field | Meaning |
|-------|---------|
| **Description** | What it is |
| **User value** | Why players / creators care |
| **Business value** | Why GMRLOG invests |
| **Complexity** | Low / Medium / High |
| **Suggested phase** | Backlog Phase 2, Phase 3, or Icebox |
| **Dependencies** | Freezes, platforms, or prior features |

**North Star gate (all items):** Must improve the digital home of **gaming culture** — not generic social spam.

---

# Phase 2 — Community Expansion

Realtime and co-presence experiences that deepen belonging **after** Communication MVP (text + attachments). Voice remains **out of MVP** per Communication Freeze / Sprint 9.4 amendment.

### Voice Rooms

| Field | Content |
|-------|---------|
| **Description** | Ephemeral or persistent voice rooms tied to friends, games, or communities. |
| **User value** | Talk while playing or hanging out without leaving GMRLOG. |
| **Business value** | Session length + retention; reduces Discord-only leakage for gaming talk. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Communication Phase 2 / Voice Platform Freeze; Realtime foundation; media SFU |

### Voice Channels

| Field | Content |
|-------|---------|
| **Description** | Persistent voice channels inside Groups / Community spaces. |
| **User value** | Always-on hangouts for guilds and friend circles. |
| **Business value** | Sticky community spaces; guild retention. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Voice Rooms; Groups/Guilds maturity; Permission matrix |

### Video Rooms

| Field | Content |
|-------|---------|
| **Description** | Small-group video rooms for face-to-face gaming culture moments. |
| **User value** | Richer co-presence for watch parties, jams, and hangouts. |
| **Business value** | Differentiates “home” vs chat-only apps; creator/event upside. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Voice Rooms; stronger device/permission UX; moderation |

### Screen Sharing

| Field | Content |
|-------|---------|
| **Description** | Share gameplay or desktop into a Voice/Video room. |
| **User value** | Show builds, bugs, or clutch plays live to friends. |
| **Business value** | Increases room utility; supports indie feedback loops. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Video Rooms; bandwidth/QoS; abuse controls |

### Watch Parties

| Field | Content |
|-------|---------|
| **Description** | Synchronized watching of trailers, streams, or gaming movies/TV with chat/voice. |
| **User value** | Shared culture moments around games and adaptations. |
| **Business value** | Event engagement; partnership surface for studios/creators. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Video/Voice; content rights; sync protocol |

### Live Events

| Field | Content |
|-------|---------|
| **Description** | Scheduled live sessions (AMAs, patch digests, drops) with RSVP and reminders. |
| **User value** | Know when something meaningful is happening in-community. |
| **Business value** | DAU spikes; studio/creator marketing channel. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Notifications delivery; calendar; Events entity Freeze |

### Community Events

| Field | Content |
|-------|---------|
| **Description** | Community-organized meetups, raids, challenges, and local/online gatherings. |
| **User value** | Belonging through shared plans, not only feed posts. |
| **Business value** | Retention loops; guild/hub stickiness. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Groups/Guilds; Live Events; moderation |

---

# Phase 2 — Steam Ecosystem

GMRLOG does **not** compete with Steam as a store; it deepens **identity, showcase, and culture** using Steam-linked data where users opt in (North Star).

### Steam Achievement Import

| Field | Content |
|-------|---------|
| **Description** | Import unlocked Steam achievements into the user’s GMRLOG achievement/identity graph. |
| **User value** | One home for progress across platforms. |
| **Business value** | Profile richness; daily return for sync/check-ins. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Steam OAuth/API; Achievements BC; privacy consent |

### Achievement Showcase

| Field | Content |
|-------|---------|
| **Description** | Curated profile surface highlighting rare/favorite achievements. |
| **User value** | Pride and identity expression. |
| **Business value** | Profile shareability; social graph engagement. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Achievement Import or native unlocks; Profile customization |

### Achievement Collections

| Field | Content |
|-------|---------|
| **Description** | User-built sets of achievements (themes, games, rarity challenges). |
| **User value** | Collect and display meaningful progress stories. |
| **Business value** | UGC depth; time-on-profile. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Achievement Showcase; Collections patterns |

### Rare Achievement Badges

| Field | Content |
|-------|---------|
| **Description** | Prestige badges for low-unlock-rate or hard achievements. |
| **User value** | Status that feels earned, not purchased. |
| **Business value** | Aspiration loops; shareable moments. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Rarity data; Badge system; anti-cheat/trust |

### Completion Showcase

| Field | Content |
|-------|---------|
| **Description** | Visual celebration of 100% / platinum / library completion milestones. |
| **User value** | Recognition for dedication. |
| **Business value** | Logging retention; completionist segment. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Game Log / Progress; Steam Sync |

### Steam Profile Sync

| Field | Content |
|-------|---------|
| **Description** | Sync display name, avatar, and public Steam profile signals (opt-in). |
| **User value** | Less duplicate profile work. |
| **Business value** | Faster onboarding; higher profile completeness. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Steam OAuth; profile privacy rules |

### Steam Statistics

| Field | Content |
|-------|---------|
| **Description** | Playtime, library size, and genre stats imported or correlated with GMRLOG logs. |
| **User value** | Richer self-understanding of play habits. |
| **Business value** | Analytics stickiness; recommendation inputs. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Steam API quotas; Statistics BC; consent |

### Steam Friends Sync

| Field | Content |
|-------|---------|
| **Description** | Suggest or link Steam friends already on GMRLOG (privacy-first). |
| **User value** | Faster social graph bootstrap. |
| **Business value** | Network effects; invite conversion. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Steam Friends API; Social graph; block/privacy |

---

# Phase 2 — Profile Customization

Profiles as **living gaming identities** (North Star) — premium feel without selling the user’s dignity.

### Showcase Widgets

| Field | Content |
|-------|---------|
| **Description** | Modular profile widgets (stats, currently playing, top reviews, etc.). |
| **User value** | Compose a personal homepage. |
| **Business value** | Differentiation; share/SEO surfaces. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Profile layout engine; performance budgets |

### Custom Layouts

| Field | Content |
|-------|---------|
| **Description** | Drag-and-drop or template-based profile layouts. |
| **User value** | True ownership of “my place.” |
| **Business value** | Premium upsell path (later); retention. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Showcase Widgets; design system |

### Animated Profile Cards

| Field | Content |
|-------|---------|
| **Description** | Subtle motion on profile cards / hover / share cards. |
| **User value** | Premium, memorable identity. |
| **Business value** | Brand perception; share CTR. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Performance/accessibility; asset pipeline |

### Themes

| Field | Content |
|-------|---------|
| **Description** | Profile color/theme packs (game-inspired, seasonal). |
| **User value** | Aesthetic self-expression. |
| **Business value** | Cosmetics economy (post community trust). |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Design tokens; Themes Freeze |

### Decorations

| Field | Content |
|-------|---------|
| **Description** | Frames, flourishes, and ornamental profile accents. |
| **User value** | Collectible flair without pay-to-win. |
| **Business value** | Cosmetic monetization later; event rewards. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Themes; inventory/entitlements |

### Badges

| Field | Content |
|-------|---------|
| **Description** | Expanded earned/ cosmetic badge display beyond MVP achievements. |
| **User value** | Visible milestones and affiliations. |
| **Business value** | Aspiration + program incentives. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Badge system; moderation of vanity spam |

### Profile Backgrounds

| Field | Content |
|-------|---------|
| **Description** | Custom/selectable profile backgrounds (art, game stills, licensed packs). |
| **User value** | Atmosphere and identity. |
| **Business value** | Premium packs; studio partnerships. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Media storage; rights; Themes |

### Featured Reviews

| Field | Content |
|-------|---------|
| **Description** | Pin best reviews on profile. |
| **User value** | Showcase writing craft. |
| **Business value** | Quality content discovery. |
| **Complexity** | Low |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Reviews BC; profile widgets |

### Featured Collections

| Field | Content |
|-------|---------|
| **Description** | Pin signature collections on profile. |
| **User value** | Taste-making identity. |
| **Business value** | Collection follow growth. |
| **Complexity** | Low |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Collections; profile widgets |

### Featured Achievements

| Field | Content |
|-------|---------|
| **Description** | Pin proudest unlocks on profile. |
| **User value** | Prestige storytelling. |
| **Business value** | Achievement engagement loop. |
| **Complexity** | Low |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Achievements; Showcase |

---

# Phase 2 — Community

Broader gaming-culture community surfaces (North Star: indie, jams, developers, esports-adjacent).

### Indie Hub

| Field | Content |
|-------|---------|
| **Description** | Dedicated discovery + community space for indie games and makers. |
| **User value** | Find gems and support creators. |
| **Business value** | Studio partnerships; differentiation. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Catalog tags; Developer/Studio pages |

### Browser Games

| Field | Content |
|-------|---------|
| **Description** | Playable / embeddable browser games hub with social layer. |
| **User value** | Instant play + share. |
| **Business value** | Session starts; jam pipeline. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Sandbox security; Content policy; Catalog |

### Game Jams

| Field | Content |
|-------|---------|
| **Description** | Host or co-host jams: themes, submissions, voting, showcases. |
| **User value** | Create and discover experimental games together. |
| **Business value** | Creator acquisition; seasonal spikes. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Developer Pages; Events; Moderation |

### Guilds / Clans

| Field | Content |
|-------|---------|
| **Description** | Persistent membership communities with roles, identity, and shared activity. |
| **User value** | Long-term belonging beyond DMs. |
| **Business value** | Retention; network effects. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Groups/Channels; Permissions; Voice (optional) |

### Tournament Platform

| Field | Content |
|-------|---------|
| **Description** | Brackets, check-ins, and community tournaments (not necessarily esports broadcast grade). |
| **User value** | Compete with friends/communities. |
| **Business value** | Events + sponsorship surface. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Guilds; Events; anti-cheat light; Integrity |

### Community Challenges

| Field | Content |
|-------|---------|
| **Description** | Time-boxed play/review/log challenges with leaderboards or badges. |
| **User value** | Motivation and shared goals. |
| **Business value** | Habit formation; campaign tool. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Game Logs; Achievements; Notifications |

### Developer Pages

| Field | Content |
|-------|---------|
| **Description** | First-class developer identity pages (gamesography, updates, community). |
| **User value** | Follow makers, not only titles. |
| **Business value** | B2B relationship; trust. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Verification; Catalog ownership; *Note: ROADMAP Closed Beta may ship a thinner slice — backlog keeps full vision post-MVP* |

### Studio Pages

| Field | Content |
|-------|---------|
| **Description** | Studio hubs for portfolios, hiring signals, and community. |
| **User value** | Follow studios and culture. |
| **Business value** | Studio dashboards/ads later; ecosystem completeness. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Developer Pages; org accounts |

---

# Phase 2 — Creator Economy

Community-before-monetization: creators earn **after** trust and tools exist.

### Creator Profiles

| Field | Content |
|-------|---------|
| **Description** | Elevated profiles for curators, reviewers, streamers, and makers. |
| **User value** | Discover voices worth following. |
| **Business value** | Influence graph; program funnel. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Profile customization; verification |

### Donations

| Field | Content |
|-------|---------|
| **Description** | Tip/support creators and indie makers (platform-mediated). |
| **User value** | Support people who enrich culture. |
| **Business value** | Take-rate revenue; creator loyalty. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Payments compliance; KYC; Trust & Safety |

### Premium Communities

| Field | Content |
|-------|---------|
| **Description** | Paid access to exclusive community spaces. |
| **User value** | Deeper access to creators/guilds. |
| **Business value** | Recurring revenue; creator split. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Guilds; Payments; Entitlements |

### Paid Clubs

| Field | Content |
|-------|---------|
| **Description** | Membership clubs around games, genres, or creators. |
| **User value** | Belonging with perks (badges, rooms, early access). |
| **Business value** | ARPU; retention. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Premium Communities; Events |

### Creator Analytics

| Field | Content |
|-------|---------|
| **Description** | Audience, engagement, and content performance for creators. |
| **User value** | Improve craft with feedback loops. |
| **Business value** | Creator retention on platform. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Analytics pipeline; privacy |

### Creator Programs

| Field | Content |
|-------|---------|
| **Description** | Structured programs (curator, indie amplify, partner). |
| **User value** | Recognition and resources. |
| **Business value** | Supply of quality content; partnerships. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Creator Profiles; Ops tooling |

---

# Phase 2 — Marketplace

Commerce that serves **gaming culture** (mods, assets, commissions) — players must never feel like the product (North Star).

### Marketplace

| Field | Content |
|-------|---------|
| **Description** | Core marketplace shell: listings, search, checkout, seller profiles. |
| **User value** | Buy/sell gaming-culture goods in one home. |
| **Business value** | Fees; ecosystem lock-in. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Payments; Trust & Safety; Catalog |

### Asset Marketplace

| Field | Content |
|-------|---------|
| **Description** | Digital assets for creators/devs (sprites, audio, UI kits). |
| **User value** | Faster creation for indies/jams. |
| **Business value** | Dev ecosystem; fees. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Marketplace; licensing |

### Plugin Marketplace

| Field | Content |
|-------|---------|
| **Description** | Extensions for GMRLOG (and later SDK consumers). |
| **User value** | Customize the home. |
| **Business value** | Platform gravity; Phase 3 alignment. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Plugin System (Phase 3); review process |

### Mod Marketplace

| Field | Content |
|-------|---------|
| **Description** | Discover/trade mods with community ratings and compatibility notes. |
| **User value** | Safer mod discovery tied to games. |
| **Business value** | Catalog engagement; partnerships. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Marketplace; Game pages; IP policy |

### Commission System

| Field | Content |
|-------|---------|
| **Description** | Hire artists/devs for custom work (fan art, assets, trailers). |
| **User value** | Match talent with demand. |
| **Business value** | Escrow fees; creator economy. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Payments; dispute resolution; profiles |

---

# Phase 2 — Business

B2B value that helps developers build better games — without making players the product.

### Ads Platform

| Field | Content |
|-------|---------|
| **Description** | Studio/creator advertising with strict relevance and preference controls. |
| **User value** | Discover games they might actually want (opt-aware). |
| **Business value** | Core revenue line. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Privacy; Campaign Manager; brand safety |

### Studio Dashboard

| Field | Content |
|-------|---------|
| **Description** | Ops dashboard for studios: community, content, campaigns. |
| **User value** | Studios engage communities better. |
| **Business value** | B2B retention; upsell analytics. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Studio Pages; AuthZ org model |

### Game Analytics

| Field | Content |
|-------|---------|
| **Description** | Aggregated, privacy-safe signals (sentiment, logs, discovery). |
| **User value** | Indirect: better games and updates. |
| **Business value** | Analytics products; studio trust. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Data platform; consent; Reviews/Logs |

### Campaign Manager

| Field | Content |
|-------|---------|
| **Description** | Launch/promote patches, wishlists, events, and challenges. |
| **User value** | Clearer studio communication. |
| **Business value** | Ads + events monetization. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Ads Platform; Notifications; Events |

### Sponsored Events

| Field | Content |
|-------|---------|
| **Description** | Branded community events with transparent labeling. |
| **User value** | Fun events + perks when relevant. |
| **Business value** | Sponsorship revenue. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Live/Community Events; Ads policy |

---

# Phase 2 — AI

AI Native (North Star): improve discovery, search, feed, moderation, personalization — **without replacing human interaction**.

### AI Recommendations

| Field | Content |
|-------|---------|
| **Description** | Personalized game/content recommendations grounded in logs, taste, and graph. |
| **User value** | Better discovery of games they will love. |
| **Business value** | Retention; catalog engagement. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Recommendation data plane; privacy; *ROADMAP Growth lists a slice — backlog is full capability* |

### AI Search

| Field | Content |
|-------|---------|
| **Description** | Natural-language and semantic search across games, reviews, people, hubs. |
| **User value** | Find culture faster (“cozy narrative indies like X”). |
| **Business value** | Search-to-play conversion. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Search index; embeddings; Catalog quality |

### AI Review Summary

| Field | Content |
|-------|---------|
| **Description** | Summaries of community consensus with spoilers gated. |
| **User value** | Faster decisions without drowning in text. |
| **Business value** | Review page engagement; trust if transparent. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Reviews; spoiler system; model eval |

### AI Feed Personalization

| Field | Content |
|-------|---------|
| **Description** | Rank feed for meaningful gaming signals over spam. |
| **User value** | Feed feels like home, not noise. |
| **Business value** | Session quality; DAU. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Feed; prefs; anti-gaming-the-algorithm |

### AI Moderation

| Field | Content |
|-------|---------|
| **Description** | Assistive moderation for toxicity, spam, spoilers, scams. |
| **User value** | Safer communities. |
| **Business value** | Trust; ops leverage. |
| **Complexity** | High |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Moderation BC; human-in-the-loop |

### AI Profile Assistant

| Field | Content |
|-------|---------|
| **Description** | Help users craft showcases, bios, and featured picks. |
| **User value** | Better identity with less friction. |
| **Business value** | Profile completeness; premium feel. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 2 |
| **Dependencies** | Profile customization; consent |

---

# Phase 3 — Platform

Extensibility so GMRLOG becomes an **ecosystem**, not only an app.

### Public API

| Field | Content |
|-------|---------|
| **Description** | Versioned public REST/Graph API for partners and power users. |
| **User value** | Build tools and bots around their gaming life. |
| **Business value** | Platform lock-in; partner ecosystem. |
| **Complexity** | High |
| **Suggested phase** | Phase 3 |
| **Dependencies** | Auth/scopes; rate limits; Freeze of public contracts |

### SDK

| Field | Content |
|-------|---------|
| **Description** | Client SDKs (web/mobile/game) for identity, social, and events. |
| **User value** | Devs embed GMRLOG culture in games/tools. |
| **Business value** | Distribution; data network effects. |
| **Complexity** | High |
| **Suggested phase** | Phase 3 |
| **Dependencies** | Public API; developer portal |

### Plugin System

| Field | Content |
|-------|---------|
| **Description** | First-party extension points for UI and workflows. |
| **User value** | Customize the home safely. |
| **Business value** | Marketplace; innovation without core bloat. |
| **Complexity** | High |
| **Suggested phase** | Phase 3 |
| **Dependencies** | Sandbox; review; Public API |

### Webhooks

| Field | Content |
|-------|---------|
| **Description** | Outbound webhooks for unlocks, reviews, events, commerce. |
| **User value** | Automate personal workflows. |
| **Business value** | Integration stickiness; B2B. |
| **Complexity** | Medium |
| **Suggested phase** | Phase 3 |
| **Dependencies** | Public API; signing; retries |

### Third-party Integrations

| Field | Content |
|-------|---------|
| **Description** | Broader links (consoles, Discord optional bridges, calendars, etc.) beyond Steam. |
| **User value** | Meet users where they already play. |
| **Business value** | Acquisition; completeness. |
| **Complexity** | High |
| **Suggested phase** | Phase 3 |
| **Dependencies** | Per-vendor OAuth; privacy matrices |

### Desktop App

| Field | Content |
|-------|---------|
| **Description** | Native desktop shell for performance, overlays, and presence. |
| **User value** | Better companion while PC gaming. |
| **Business value** | Engagement depth; overlay ads later (careful). |
| **Complexity** | High |
| **Suggested phase** | Phase 3 |
| **Dependencies** | Realtime; Voice optional; updater |

### Console Companion App

| Field | Content |
|-------|---------|
| **Description** | Companion experience for console players (logging, social, alerts). |
| **User value** | Bring console life into the same digital home. |
| **Business value** | Segment expansion; partner talks. |
| **Complexity** | High |
| **Suggested phase** | Phase 3 |
| **Dependencies** | Platform policies; notifications; limited APIs |

---

# Icebox

Approved ideas **without** a backlog phase assignment. Promote only after architecture review.

### Premium-feeling profile ideas

| Field | Content |
|-------|---------|
| **Description** | Exploratory UX for “luxury” identity without pay-to-win. |
| **User value** | Pride and belonging. |
| **Business value** | Brand; future cosmetics. |
| **Complexity** | Medium |
| **Suggested phase** | Icebox |
| **Dependencies** | Design research; Profile Customization |

### Achievement prestige systems

| Field | Content |
|-------|---------|
| **Description** | Tiers, seasons, or prestige resets for long-term achievement culture. |
| **User value** | Endgame identity. |
| **Business value** | Habit loops. |
| **Complexity** | High |
| **Suggested phase** | Icebox |
| **Dependencies** | Achievements; economy design |

### Gamer archetypes

| Field | Content |
|-------|---------|
| **Description** | Taste/playstyle archetypes as identity and discovery aids. |
| **User value** | Self-recognition + better matches. |
| **Business value** | Recommendations; onboarding. |
| **Complexity** | Medium |
| **Suggested phase** | Icebox |
| **Dependencies** | Stats; AI Recommendations; privacy |

### Seasonal profile themes

| Field | Content |
|-------|---------|
| **Description** | Time-limited themes tied to seasons, events, or game launches. |
| **User value** | Fresh identity moments. |
| **Business value** | Event marketing; cosmetics. |
| **Complexity** | Low |
| **Suggested phase** | Icebox |
| **Dependencies** | Themes |

### Dynamic profile showcases

| Field | Content |
|-------|---------|
| **Description** | Auto-updating showcases based on recent play, reviews, or friends. |
| **User value** | Living profile with less curation work. |
| **Business value** | Profile freshness; share. |
| **Complexity** | Medium |
| **Suggested phase** | Icebox |
| **Dependencies** | Widgets; Feed/Logs events |

### Music integration for game soundtracks

| Field | Content |
|-------|---------|
| **Description** | OST discovery, lists, and listening context in gaming culture (North Star). |
| **User value** | Celebrate game music as culture. |
| **Business value** | Differentiation; partnerships. |
| **Complexity** | High |
| **Suggested phase** | Icebox |
| **Dependencies** | Licensing; Catalog; media |

### Gaming movie & TV discussions

| Field | Content |
|-------|---------|
| **Description** | Spaces for game adaptations and gaming media talk. |
| **User value** | Culture beyond gameplay logs. |
| **Business value** | Broader DAU; watch parties synergy. |
| **Complexity** | Medium |
| **Suggested phase** | Icebox |
| **Dependencies** | Community hubs; Watch Parties |

### Studio insight dashboards

| Field | Content |
|-------|---------|
| **Description** | Deeper insight products beyond Game Analytics MVP-for-studios. |
| **User value** | Better games via feedback. |
| **Business value** | High-ARPU B2B. |
| **Complexity** | High |
| **Suggested phase** | Icebox |
| **Dependencies** | Game Analytics; contracts |

### Advanced player analytics

| Field | Content |
|-------|---------|
| **Description** | Personal deep-dive stats, streaks, taste maps, year-in-review. |
| **User value** | Reflective gaming identity. |
| **Business value** | Virality (shares); retention. |
| **Complexity** | Medium |
| **Suggested phase** | Icebox |
| **Dependencies** | Statistics; privacy |

### Community experiments

| Field | Content |
|-------|---------|
| **Description** | Sandbox for experimental social formats (temporary hubs, rituals). |
| **User value** | Novelty and belonging. |
| **Business value** | Product learning without core risk. |
| **Complexity** | Medium |
| **Suggested phase** | Icebox |
| **Dependencies** | Feature flags; moderation |

### Future monetization concepts

| Field | Content |
|-------|---------|
| **Description** | Parking lot for ethical monetization (cosmetics, clubs, B2B) under Community Before Monetization. |
| **User value** | Sustainable platform funding without exploitation. |
| **Business value** | Long-term revenue design. |
| **Complexity** | High |
| **Suggested phase** | Icebox |
| **Dependencies** | Trust metrics; legal; North Star test |

---

## Deferred Module Notes (post-MVP capture)

These are **already deferred** in Module/Communication Freezes. Listed so they are not lost; they do **not** unlock MVP work.

| Item | Suggested backlog home | Complexity |
|------|------------------------|------------|
| Communication message / mention / invite notifications | Phase 2 — Community Expansion (alerts) + Notifications Freeze amendment | Medium |
| Reliable Push / Email send + digests | Phase 2 — Platform ops (Notifications delivery) | High |
| `FRIEND_ONLINE` / presence alerts | Icebox until Realtime + anti-spam design | High |
| `GAME_RELEASE` / `UPDATE` / `REMINDER` jobs | Phase 2 — Community / Wishlist discovery | Medium |
| `GAME_DISCOUNT` marketing blasts | Icebox (marketing default false) | Medium |
| AI notification ranking | Phase 2 — AI | High |
| Voice Database Freeze + Voice Room REST | Phase 2 — Community Expansion | High |
| Realtime WebSocket foundation | Phase 2 — Community Expansion (enabler) | High |

---

# Product Evolution Principles

1. **MVP remains frozen.** Freezes, OpenAPI, Prisma, and active sprint scopes are not altered by this backlog.
2. **Backlog items do not affect current implementation.** Engineers must not implement backlog features under MVP sprints without an explicit unlock (Freeze + roadmap amendment).
3. **Every new feature must pass the North Star test:** *Does this make GMRLOG a better digital home for gaming culture?*
4. **Community before monetization.** Creator economy, ads, and marketplace follow trust and belonging — never the reverse.
5. **Gaming first.** Reject generic social clones; prefer Steam/Discord/Letterboxd *best parts* combined for gaming culture.
6. **Features may be promoted into future roadmaps only after architecture review** (ADR / Freeze / security / events / cost).
7. **This backlog is a living document, but current MVP scope is not.** Edits refine post-MVP thinking; they do not reorder `ROADMAP.md` Phase 0–1 delivery.
8. **Naming clarity:** Backlog Phase 2/3 ≠ ROADMAP Phase 2 Closed Beta / Phase 3 Public Launch unless a promotion explicitly maps them.
9. **Prefer composition and Freezes.** New surfaces require Database/API Freezes before code; inventing undeclared endpoints or tables is forbidden.
10. **AI assists humans.** AI improves discovery and safety; it must not replace human community interaction.

---

## Change control

| Change type | Allowed? |
|-------------|----------|
| Add/clarify Icebox or Phase 2/3 backlog cards | Yes (product review) |
| Promote backlog item into `ROADMAP.md` | Yes — **separate** roadmap PR after architecture review |
| Pull backlog item into current MVP / Module Freezes | **No** until MVP ships + explicit unlock |
| Modify Prisma / OpenAPI / implement from this doc alone | **No** |

---

## Gate

**Product Backlog v1.0 generated.**

- No code  
- No Prisma changes  
- No OpenAPI changes  
- No roadmap modifications  
- No feature implementation  

Stop.
