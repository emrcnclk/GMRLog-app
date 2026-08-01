# GMRLOG — Sprint F2.21: External Integrations & Ecosystem

**Document:** `docs/02_DESIGN/SPRINT_F2_21_EXTERNAL_INTEGRATIONS_ECOSYSTEM.md`  
**Version:** 1.1  
**Status:** **LOCKED** · **Amended by MVP Final Integration Amendment** (§20)  
**Sprint:** F2.21 (External Integrations & Ecosystem — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** External Ecosystem Constitution

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) |
| 4 | [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) |
| 5 | [`SPRINT_F2_2_AUTHENTICATION_EXPERIENCE.md`](./SPRINT_F2_2_AUTHENTICATION_EXPERIENCE.md) + [`SPRINT_F2_2_1_AUTH_POLISH.md`](./SPRINT_F2_2_1_AUTH_POLISH.md) |
| 6 | [`SPRINT_F2_4_GAME_EXPERIENCE.md`](./SPRINT_F2_4_GAME_EXPERIENCE.md) + [`SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md`](./SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md) |
| 7 | [`SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md`](./SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md) + [`SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md`](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) |
| 8 | [`SPRINT_F2_6_LIBRARY_COLLECTIONS.md`](./SPRINT_F2_6_LIBRARY_COLLECTIONS.md) |
| 9 | [`SPRINT_F2_7_HOME_FEED.md`](./SPRINT_F2_7_HOME_FEED.md) + [`SPRINT_F2_8_SOCIAL_COMMUNICATION.md`](./SPRINT_F2_8_SOCIAL_COMMUNICATION.md) |
| 10 | [`SPRINT_F2_10_DISCOVER_SEARCH.md`](./SPRINT_F2_10_DISCOVER_SEARCH.md) |
| 11 | [`SPRINT_F2_11_COMMUNITIES_GUILDS.md`](./SPRINT_F2_11_COMMUNITIES_GUILDS.md) + [`SPRINT_F2_12_CREATOR_PLATFORM.md`](./SPRINT_F2_12_CREATOR_PLATFORM.md) |
| 12 | [`SPRINT_F2_13_REPUTATION_RECOGNITION.md`](./SPRINT_F2_13_REPUTATION_RECOGNITION.md) + [`SPRINT_F2_14_ACHIEVEMENT_LEGACY.md`](./SPRINT_F2_14_ACHIEVEMENT_LEGACY.md) + [`SPRINT_F2_15_EVENTS_SEASONAL.md`](./SPRINT_F2_15_EVENTS_SEASONAL.md) |
| 13 | [`SPRINT_F2_16_PREMIUM_MEMBERSHIP.md`](./SPRINT_F2_16_PREMIUM_MEMBERSHIP.md) |
| 14 | [`SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md`](./SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md) |
| 15 | [`SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md`](./SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) |
| 16 | [`SPRINT_F2_19_INTELLIGENCE_AI_RECOMMENDATION.md`](./SPRINT_F2_19_INTELLIGENCE_AI_RECOMMENDATION.md) |
| 17 | [`SPRINT_F2_20_SETTINGS_PERSONALIZATION.md`](./SPRINT_F2_20_SETTINGS_PERSONALIZATION.md) |
| 18 | **This document** — External Integrations & Ecosystem |

Never contradict previous freezes.

This document **extends** without changing their philosophy:

| Domain | Freeze |
|--------|--------|
| Identity / Digital Home | F2.5 / F2.5.1 |
| Auth / account linking posture | F2.2 / F2.2.1 |
| Game Experience | F2.4 / F2.4.1 |
| Library | F2.6 |
| Home / Social | F2.7 / F2.8 |
| Discover | F2.10 |
| Communities / Creator | F2.11 / F2.12 |
| Reputation / Legacy / Events | F2.13 / F2.14 / F2.15 |
| Premium · Trust · Accessibility · Intelligence · Agency | F2.16–F2.20 |

**This freeze is constitutional:** misdesigned external dependence can dissolve Digital Home into another platform’s mirror. Its primary job is to lock:

> **How can GMRLOG become the digital home of gaming without becoming dependent on other platforms?**

---

## Scope

**In scope:** How GMRLOG interacts with the outside world — philosophy of guests vs foundations, import vs ownership, identity portability, sync posture, creator/developer/community/discovery boundaries, data ownership, privacy & consent, anti-lock-in.

**Out of scope:**

| Forbidden in this freeze |
|--------------------------|
| UI |
| Backend |
| Database |
| OAuth |
| API design |
| SDK |
| React Native |
| Engineering |
| Implementation |
| Sprint F2.21.1+ |

**Placement:** Optional linking / import / sync controls live under Settings · Profile · Library (F2.1 · F2.20). **No new bottom tab.** External services never become navigation roots.

**Gate:** Stop after freeze. Do **not** continue to Sprint F2.21.1.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | External Ecosystem Philosophy |
| 3 | Platform Independence |
| 4 | Import vs Ownership |
| 5 | Supported External Ecosystems |
| 6 | Identity Portability |
| 7 | Library Synchronization Philosophy |
| 8 | Creator Integration Philosophy |
| 9 | Developer Integration Philosophy |
| 10 | Community Integration Philosophy |
| 11 | External Discovery Philosophy |
| 12 | Data Ownership Philosophy |
| 13 | Privacy & Consent |
| 14 | Platform Dependency Rules |
| 15 | Anti-Lock-In Principles |
| 16 | Relationship Graph |
| 17 | Future Ready |
| 18 | Emotional Goal |
| 19 | Audit Checklist |

---

# 1. Mission

This sprint defines how GMRLOG interacts with the **outside world**.

External connections exist to reduce friction and enrich signals.

They do not exist to redefine GMRLOG as a mirror of Steam, Discord, Reddit, or any other host.

| Law |
|-----|
| External services are **guests** |
| GMRLOG remains the **foundation** |
| Identity always belongs to GMRLOG |
| A Steam account can disappear — a GMRLOG identity should remain |

Align North Star: digital home for gaming culture — not a better storefront profile.

---

# 2. External Ecosystem Philosophy

| Always | Never |
|--------|-------|
| Optional bridges | Mandatory platforms |
| Signals into GMRLOG | Foundations under GMRLOG |
| Player-authored meaning first | Synced history as identity |
| Multi-ecosystem hospitality | Single-vendor dependence |
| Calm linking (F2.20) | Forced account linking |

## Absolute product bans

| Never become |
|--------------|
| “A better Steam profile” |
| “A Discord replacement” |
| “A Reddit clone” |

Inherit **behaviors** from gaming culture where prior freezes allow.

Never inherit **UI**, brand systems, or product identity of guests.

---

# 3. Platform Independence

GMRLOG must never depend on any **single** external platform.

| Independence rule |
|-------------------|
| Core identity works with zero links |
| Core Library / logging / social culture works without sync |
| Discover / Communities / Creator remain meaningful offline from guests |
| Premium never sells “platform exclusivity” as belonging (F2.16) |
| Intelligence never requires a specific vendor graph (F2.19) |

If an external service vanishes, Digital Home remains.

If GMRLOG cannot survive that vanishing, the integration philosophy failed.

---

# 4. Import vs Ownership

## Import philosophy

| Import should | Import must never |
|---------------|-------------------|
| Reduce friction | Define identity |
| Seed shelves / play history as **signals** | Override player-authored story |
| Be optional and reversible (F2.20) | Be mandatory onboarding |
| Be clearly labeled as imported | Pretend to be lived memory |

**Player-created history always has higher meaning than synchronized history.**

## Ownership philosophy

Players own:

| Owned |
|-------|
| Memories |
| Reviews |
| Collections |
| Legacy |
| Identity |

External platforms only contribute **signals**.

They never own the player’s story.

---

# 5. Supported External Ecosystems

Architecture reservation only — not a ship checklist, not API contracts.

Presence in this list means “may be a guest someday.”

Absence of a link never blocks belonging.

## Digital platforms

| Guest |
|-------|
| Steam |
| Epic |
| PlayStation |
| Xbox |
| Nintendo |
| GOG |
| Battle.net |
| EA |
| Ubisoft |

## Gaming databases

| Guest |
|-------|
| IGDB |
| RAWG |
| HowLongToBeat |
| OpenCritic |
| Metacritic |
| BoardGameGeek |

## Content platforms

| Guest |
|-------|
| YouTube |
| Twitch |
| Spotify |
| Discord |
| Reddit |

## Developer platforms

| Guest |
|-------|
| Steamworks |
| Kickstarter |
| Patreon |
| GitHub |
| Developer Websites |

## Guest rule

| Rule |
|------|
| Guests enrich nodes on the game graph |
| Guests never become the graph’s root |
| Auth providers (F2.2.1) reinforce gaming identity entry — not product dependence |

---

# 6. Identity Portability

Identity is **native** to GMRLOG (F2.5.1).

| Portability means | Portability does not mean |
|-------------------|---------------------------|
| Optional links for convenience | Identity tethered to Steam/Discord/etc. |
| Export of player-authored memory (F2.20) | Borrowed prestige from external badges |
| Continuity if a guest account dies | Restarting Digital Home from a store |

| Law |
|-----|
| Identity always belongs to GMRLOG — never borrowed |
| Imported data never replaces player-authored identity |
| Known For / reputation remain contribution-based (F2.13) — not store levels |

---

# 7. Library Synchronization Philosophy

Library remains archive — not launcher (F2.6).

| Sync may | Sync must never |
|----------|-----------------|
| Suggest owned titles as candidates | Convert Library into a storefront mirror |
| Reduce manual shelf building | Force continuous mandatory sync |
| Respect Hidden Archive / privacy | Expose private shelves via guest APIs without consent |
| Be paused, limited, or disconnected | Make GMRLOG unusable without sync |

Synced ownership is a **signal**.

Logged relationship, reviews, collections, and journey remain the **meaning**.

Wishlist stays aspiration — not storefront checkout (F2.6).

---

# 8. Creator Integration Philosophy

Creator Platform remains human craft on GMRLOG (F2.12).

| Integration may | Integration must never |
|-----------------|------------------------|
| Optionally link external channels (YouTube · Twitch · etc.) as references | Relocate authorship off-platform as the primary home |
| Help creators bring audiences **into** GMRLOG culture | Turn GMRLOG into a Patreon/YouTube clone |
| Respect human byline · craft before automation (F2.19) | Import fake engagement or bought reputation |

Creator growth remains **vertical** on Profile.

External popularity never replaces Known For (F2.13).

---

# 9. Developer Integration Philosophy

Verified developers receive identity & communication integrity (F2.17).

| Integration may | Integration must never |
|-----------------|------------------------|
| Link official sites · Steamworks · GitHub · campaigns as references | Replace transparency with marketing theater |
| Support official game-node presence | Impersonation-prone unverified mirrors |
| Align Events / seasonal culture (F2.15) | Make developer tools a paywalled caste over players |

Marketing does not replace transparency.

Developer guests remain guests on the game graph.

---

# 10. Community Integration Philosophy

Communities & Guilds remain GMRLOG culture hubs (F2.11).

| Integration may | Integration must never |
|-----------------|------------------------|
| Optionally bridge presence signals where players consent | Become a Discord replacement |
| Reference external hangouts without making them mandatory | Become a Reddit clone |
| Keep platform constitution supreme (F2.17) | Outsource moderation identity to guests |

Belonging lives on GMRLOG.

External chat/forums are optional satellites — never the community foundation.

---

# 11. External Discovery Philosophy

Discover remains taste-first exploration (F2.10).

| External data may | External data must never |
|-------------------|--------------------------|
| Enrich metadata · playtime context · critic signals as **context** | Become popularity-first ranking law |
| Support explainable suggestions (F2.19) | Sell ranking via Premium (F2.16) |
| Inform Hidden gem / related culture | Force monoculture from one vendor’s chart |

Metacritic / OpenCritic / HLTB / IGDB are **guests to the game node**.

They do not invert F2.4 relationship-first Game Experience.

Personal meaning before store or score walls.

---

# 12. Data Ownership Philosophy

| Owner | Of |
|-------|----|
| Player | Memories · reviews · collections · legacy · identity · private archives |
| GMRLOG | Product graph · culture surfaces · constitution |
| External platforms | Their own accounts · their own catalogs · their own signals |

| Law |
|-----|
| Signals can be revoked; story remains |
| Import does not transfer ownership of meaning |
| Export & leave remain dignified (F2.20 · F2.14) |
| No retention hostage via guest lock-in |

---

# 13. Privacy & Consent

All linking, import, and sync inherit F2.17 · F2.20.

| Principle |
|-----------|
| Optional by default |
| Explicit consent for expansion |
| Reversible unlink / stop sync |
| No forced account linking |
| No mandatory imports |
| No quiet harvest across guests |
| Explanations must not leak private data across users |
| Accessibility remains available without linking (F2.18) |

Settings is the durable control plane for guest connections (F2.20).

---

# 14. Platform Dependency Rules

Immutable dependency bans:

| Ban |
|-----|
| Dependence on any single platform |
| Steam dependency as product foundation |
| Discord dependency as social foundation |
| Forced account linking |
| Mandatory synchronization |
| Mandatory imports |
| Platform-exclusive features that gate core culture |
| Identity tied to external services |

## Core culture must remain free of guests

| Must work unlinked |
|--------------------|
| Profile / Digital Home |
| Logging · reviews · collections |
| Home · Discover · Library |
| Communities · Creator participation |
| Reputation meaning · Legacy memory |

Premium may enhance organization tools around imports — never require a vendor to belong (F2.16).

---

# 15. Anti-Lock-In Principles

| Principle |
|-----------|
| Multi-guest hospitality · zero-guest viability |
| Native identity continuity |
| Player-authored history ranks above synced history |
| Unlink without destroying Digital Home |
| No platform-exclusive identity facets |
| No “complete your Steam link to unlock culture” |
| Anti-patterns named and forbidden |

## Explicitly forbid

| Anti-pattern |
|--------------|
| Platform lock-in |
| Steam dependency |
| Discord dependency |
| Forced account linking |
| Mandatory synchronization |
| Mandatory imports |
| Platform-exclusive features |
| Identity tied to external services |

---

# 16. Relationship Graph

External ecosystems attach as **optional edges**.

They do not rewrite nodes.

```
GMRLOG Identity (root)
  ↓
Digital Home / Library / Journey
  ↓
Game Graph (F2.4)
  ↓
Discover / Home / Communities / Creator
  ↓
Reputation / Legacy / Events
  ↓
Trust / Agency / Accessibility / Intelligence
  ↔
External guests (optional signals only)
```

| Guests may | Guests must not |
|------------|-----------------|
| Feed signals into Library / Game metadata / optional links | Become foundations |
| Reduce friction | Replace authorship |
| Leave without collapsing the home | Own the player’s story |

---

# 17. Future Ready

Reserve architecture for (philosophy only — no implementation):

| Capability |
|------------|
| Broader multi-store linking posture |
| Richer optional library sync controls |
| Clearer imported vs authored labeling |
| Creator channel references |
| Developer official-link integrity |
| Cross-guest conflict resolution philosophy (player chooses truth) |
| Portability / export packages that exclude guest lock-in |
| Events bridges for real-world / platform festivals (F2.15) without dependency |

Architecture only.

---

# 18. Emotional Goal

External integration should feel like:

> “I can bring my games with me — but this home is still mine.”

Never:

> “Without Steam / Discord, I am nobody here.”

And never:

> “GMRLOG is just a nicer skin over another platform.”

---

# 19. Audit Checklist

- [ ] External services are guests — never foundations  
- [ ] No dependence on any single platform  
- [ ] Never a better Steam profile · Discord replacement · Reddit clone  
- [ ] Identity belongs to GMRLOG — never borrowed  
- [ ] Imported data never replaces player-authored identity  
- [ ] Player-created history outranks synchronized history  
- [ ] Import optional · reversible · friction-reducing only  
- [ ] Players own memories · reviews · collections · legacy · identity  
- [ ] Library sync never becomes launcher/storefront identity  
- [ ] Creator / Developer / Community integrations stay satellites  
- [ ] External discovery enriches context — never popularity law  
- [ ] Privacy & consent: no forced linking · no mandatory sync/import  
- [ ] Anti-lock-in principles explicit and enforced  
- [ ] Compatible with Auth · Identity · Library · Home · Social · Discover · Communities · Creator · Reputation · Legacy · Events · Premium · Trust · Accessibility · Intelligence · Settings  
- [ ] No new tab · no UI · OAuth · API · SDK · backend · RN · F2.21.1  
- [ ] MVP integrations named and bounded (§20) · Steam is a library source · Discord is an identity provider only  

---

# 20. MVP Final Integration Amendment — Steam Library Import · Discord Linking

**Amendment:** MVP Final Integration Amendment (July 2026). This section names which guests are **MVP scope**. It does not change §1–§19 philosophy: guests remain guests, identity remains native, nothing becomes a foundation.

## 20.1 Steam Library Import (MVP)

Optional Steam Library Import is the first MVP library source under §7 Library Synchronization Philosophy.

| Product surface | Meaning |
|-----------------|---------|
| Optional onboarding step | Offered once during readiness · skippable · never a wall (F2.2) |
| Connected Account inside Profile / Settings | Visible, honest, reversible connection state (F2.20) |
| Library Import entry | Where a player chooses to bring owned games into the archive (F2.6) |
| Steam ownership indicator on Game pages | Context signal on the game node (F2.4.1) — not a purchase prompt |
| Import task layer | Import runs as a task with consent, progress and resolvable conflicts |
| Feed activity for imported games | Summarized library activity in Home (F2.7) — never per-game spam |

| Law |
|-----|
| Steam is optional — users can fully use GMRLOG without Steam |
| Steam never replaces GMRLOG — GMRLOG remains the Digital Home |
| Steam is only an initial library source — ownership is a signal; logged relationship, reviews and collections remain the meaning (§7) |
| Import never overwrites player-authored status, reviews, collections or hidden-archive privacy |
| Disconnect is always available and never punished |
| Steam achievements are **not** imported — they remain external metadata; GMRLOG achievements are native (F2.14) |

## 20.2 Discord Account Linking (MVP)

Discord is an **identity / provider only**, under §6 Identity Portability and F2.2.1 optional providers. Discord is **never a social layer**.

| Is | Is not |
|----|--------|
| Optional login method | Chat · messaging · voice · social layer |
| Connected Account row with clear purpose | Discord communities inside GMRLOG |
| OAuth task flow returning to origin | Presence · rich presence · status broadcasting |
| Convenience for entry | A social graph import or a reputation source |

| Law |
|-----|
| Communities remain GMRLOG-native (F2.11) — Discord never supplies community structure |
| Messaging remains F2.8 · GMRLOG-owned · calm |
| Linking Discord grants identity convenience and nothing else |
| A refused connection is never re-prompted |

## 20.3 Version 2 (not MVP)

| Deferred |
|----------|
| Public API · Developer / Publisher dashboards (F2.28 · F2.24) |
| Twitch integration |
| Additional platform sync sources beyond Steam |
| Marketplace · Premium-gated integrations · Creator economy hooks |

## 20.4 Architecture references

Structure and behavior for these surfaces live in product architecture, not here:

| Reference | Contains |
|-----------|----------|
| F5.1 §34 | Placement of Steam / Discord surfaces in existing strata |
| F5.3 | Onboarding Connect Accounts · Library Import · Connected Accounts · Account Link and Steam Library Import tasks |
| F5.4 §42.1 | Linking and import behavior contracts |
| F5.2 §6.4 | Library import activity in Home taxonomy |

---

## Final gate

### APPROVED

**Sprint F2.21 — External Integrations & Ecosystem LOCKED.**

Stop.

Do **NOT** continue to Sprint F2.21.1.

---

## Related documents

| Doc | Role |
|-----|------|
| [SPRINT_F2_2_1_AUTH_POLISH.md](./SPRINT_F2_2_1_AUTH_POLISH.md) | Optional platform providers · Settings linking |
| [SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) | Native Digital Home · not Steam profile |
| [SPRINT_F2_6_LIBRARY_COLLECTIONS.md](./SPRINT_F2_6_LIBRARY_COLLECTIONS.md) | Archive · not launcher |
| [SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md](./SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md) | Relationship-first game node |
| [SPRINT_F2_10_DISCOVER_SEARCH.md](./SPRINT_F2_10_DISCOVER_SEARCH.md) | Taste-first · external context not law |
| [SPRINT_F2_11_COMMUNITIES_GUILDS.md](./SPRINT_F2_11_COMMUNITIES_GUILDS.md) | Not Discord / Reddit clone |
| [SPRINT_F2_12_CREATOR_PLATFORM.md](./SPRINT_F2_12_CREATOR_PLATFORM.md) | Human craft home |
| [SPRINT_F2_14_ACHIEVEMENT_LEGACY.md](./SPRINT_F2_14_ACHIEVEMENT_LEGACY.md) | Life as a gamer · not trophy chase |
| [SPRINT_F2_16_PREMIUM_MEMBERSHIP.md](./SPRINT_F2_16_PREMIUM_MEMBERSHIP.md) | No bought belonging via vendors |
| [SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md](./SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md) | Developer integrity · privacy |
| [SPRINT_F2_20_SETTINGS_PERSONALIZATION.md](./SPRINT_F2_20_SETTINGS_PERSONALIZATION.md) | Optional · reversible guest controls |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Culture-first · six pillars |
| [SPRINT_F2_22_PLATFORM_INTELLIGENCE_OPERATIONS.md](./SPRINT_F2_22_PLATFORM_INTELLIGENCE_OPERATIONS.md) | Stewardship health · anti-addiction ops |
| [SPRINT_F2_27_SECURITY_PRIVACY_DATA_GOVERNANCE.md](./SPRINT_F2_27_SECURITY_PRIVACY_DATA_GOVERNANCE.md) | External sharing · consent · zero-link privacy |
| [SPRINT_F2_28_DEVELOPER_PLATFORM_API_EXTENSIBILITY.md](./SPRINT_F2_28_DEVELOPER_PLATFORM_API_EXTENSIBILITY.md) | Extensibility · guests never foundations |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — External Ecosystem constitution: guests not foundations; import vs ownership; independence; anti-lock-in; graph unchanged |
| 1.1 | July 2026 | **MVP Final Integration Amendment** — §20 added: optional Steam Library Import (Steam never replaces GMRLOG; initial library source only) and Discord as identity/provider only (never a social layer); Twitch · Public API deferred to Version 2 |
