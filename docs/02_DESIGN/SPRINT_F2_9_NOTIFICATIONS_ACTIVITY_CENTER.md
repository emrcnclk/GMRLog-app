# GMRLOG — Sprint F2.9: Notifications & Activity Center Architecture

**Document:** `docs/02_DESIGN/SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F2.9 (Notifications & Activity Center — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** Notifications & Activity Center Experience Freeze

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
| 7 | [`SPRINT_F2_8_SOCIAL_COMMUNICATION.md`](./SPRINT_F2_8_SOCIAL_COMMUNICATION.md) |
| 8 | **This document** — Notifications & Activity Center |

**SSOT precedence:** North Star → Master → Foundation → IA → Previous F2 → This document.

**Scope:** Complete Notifications & Activity Center philosophy.  
**Out of scope:** React Native, Figma, UI implementation, backend, APIs, algorithms, database, Sprint F2.9.1+.

**Compose only existing architecture:** Notifications tab · F1 NotificationCard · deep links (F2.1) · F2.8 social/notification philosophy.  
**Do not** redesign navigation or Home.

**Gate:** Stop after freeze. Do **not** continue to Sprint F2.9.1.

---

## Relationship to previous sprints

| Surface | Job |
|---------|-----|
| **Home** | What is happening **now** |
| **Notifications** | What happened **while you were away** — reconnect |
| **Activity Center** | Preserves **your interaction history** (memory) |
| **Profile** | Preserves **gaming identity** (Digital Home) |
| **Library** | Preserves **archive** |

Notifications reconnect you with **meaningful moments**. They do not replace Home’s heartbeat or Profile’s story.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Notification Philosophy |
| 3 | Notification Categories |
| 4 | Activity Center Philosophy |
| 5 | Priority Model |
| 6 | Notification Lifetime |
| 7 | Deep Linking Philosophy |
| 8 | Grouping Philosophy |
| 9 | Identity Notifications |
| 10 | Creator Notifications |
| 11 | Notification Controls |
| 12 | Future Ready |
| 13 | Emotional Goal |
| 14 | Audit Checklist |

---

# 1. Mission

Notifications exist to **reconnect players with meaningful gaming moments**.

| Never | Always |
|-------|--------|
| Maximize screen time | Respect attention |
| Create addiction | Quality over quantity |
| Create anxiety | Calm Story Ember tone |
| Pull without meaning | Gaming as protagonist |

Aligns F2.8: notifications bring people back to meaningful gaming moments — never infinite engagement.

---

# 2. Notification Philosophy

| Prefer | Reject |
|--------|--------|
| **Quality** over quantity | Notification firehose |
| **Meaning** over urgency | Fake urgency / red panic |
| **Identity** over engagement | Vanity ping spam |
| **Celebrate** | Guilt |
| | FOMO |
| | Streak mechanics |
| | “Come back now.” |

Tone kinship with Auth security calm and Game return hooks: informative, actionable, dismissible — never coercive.

---

# 3. Notification Categories

Architecture only — why each exists.

| Category | Why it exists |
|----------|----------------|
| **Gaming** | Title-scoped life (playing, progress-adjacent culture) — protagonist signals |
| **Friend Activity** | Your world’s presence — belonging without chat addiction |
| **Reviews** | Taste artifacts you care about (replies, helpful, friends reviewed) |
| **Posts** | Voice in your graph |
| **Replies / Comments** | Conversation continuity on your objects |
| **Mentions** | Direct address — identity respect |
| **Collections** | Museum edges (follow, collab future, appears-in) |
| **Tier Lists** | Opinion structures you follow or own |
| **Library** | Archive-relevant changes (status, shelf updates you opted into) |
| **Wishlist** | Aspiration cues — **not** commerce/pricing |
| **Creator** | Craft engagement — enhance, don’t takeover |
| **Developer** | Studio/dev updates on games you relate to |
| **Identity** | Digital Home milestones — never gamified XP |
| **Achievements** | Identity moments — not trophy spam |
| **Moderation** | Safety & trust (reports, appeals) — staff/player as relevant |
| **Security** | Account protection — calm, never fear-mongering |
| **System** | Sync, policy, verification — necessary clarity |
| **Future Communities** | Group discussion life |
| **Future Guilds** | Stronger belonging units |
| **Future Events** | Time-bound culture moments |

Maps under F2.8 umbrellas (Gaming · Social · Identity · Creator · System · Future) with finer experience vocabulary here.

---

# 4. Activity Center Philosophy

## 4.1 Notifications vs Activity History

| | **Notifications** | **Activity History** (Activity Center) |
|--|-------------------|----------------------------------------|
| Job | Require **attention** (reconnect) | Preserve **memory** |
| Time | While you were away / unread | Longer personal interaction trail |
| Feeling | “Catch up on what matters” | “What I touched / was part of” |
| Urgency | Priority model applies | Mostly calm archive |
| Badge | Tab unread | Typically no anxiety badge |

## 4.2 Why both are necessary

- Notifications alone become anxiety or get ignored.  
- Activity alone doesn’t pull you to fresh meaningful moments.  
- Together: **reconnect + remember** — parallel to Home (now) vs Profile Activity (story timeline).  

Activity Center may live as a mode/segment within Notifications stack or Profile-adjacent history — **architecture only**; no new tab. Must not redesign navigation.

---

# 5. Priority Model

Architecture only — **no ranking algorithms**.

| Level | Experience intent |
|-------|-------------------|
| **High** | Security, direct mentions, strong personal ownership (e.g. reply on your review) — clear, calm, not screaming |
| **Medium** | Friend activity on shared taste, helpful on your craft, collection follows |
| **Low** | Broad social likes, soft discovery nudges you opted into |
| **Silent** | Logged for Activity History / digest only — no interrupt |
| **Digest** | Bundled summary (daily/weekly) — meaning without drip addiction |

User controls can shift categories across these levels (see §11).

---

# 6. Notification Lifetime

Architecture only.

| State | Meaning |
|-------|---------|
| **Fresh** | New, unread, in attention set |
| **Recent** | Still visible in primary list; may be read |
| **Archived** | Left primary attention; retained for history |
| **Dismissed** | User cleared from attention — may remain in Activity History |
| **Resolved** | Action completed (opened destination, accepted, etc.) |
| **History** | Long-term Activity Center memory |

No dark pattern of undismissable guilt items.

---

# 7. Deep Linking Philosophy

Every notification must have a **meaningful destination**. **No dead ends.**

| Destination examples |
|----------------------|
| Game · Review · Post · Comment · Conversation |
| Collection · Tier List · Profile |
| Developer · Creator |
| Future Article · Future Guide |
| Settings (security/system only when appropriate) |

Resolution follows F2.1 deep link + tab/stack restore. Align F2.8: deep link to the **object**, not an empty inbox.

---

# 8. Grouping Philosophy

Batching principles — architecture only (no algo).

| Group by | Intent |
|----------|--------|
| Same Post / Review / Game / Creator / Collection | Reduce noise; one card, N actors |
| Friend Activity | Presence digest, not ping storm |
| Developer Updates | Title-scoped batches |
| Daily Summary | Digest priority |

Rules: preserve explainability; expand to individuals on tap; never hide a High security item inside a cute batch.

---

# 9. Identity Notifications

Connect with Gamer Identity (F2.5 / F2.5.1) — **never gamify**.

| Examples | Spirit |
|----------|--------|
| First Review · First Collection | Legacy beginnings |
| Journey Complete | Relationship with a game |
| Known For | Reputation facet — qualitative |
| Legacy · Anniversary | On This Day kinship |
| Creator Milestones · Identity Growth | Vertical craft growth |

No XP, no streaks, no “keep your streak alive” copy.

---

# 10. Creator Notifications

Reserve architecture for:

Articles · Guides · Series · Developer Diaries · Editorial Picks · Creator Followers · Creator Discussions · AMAs  

**Premium must enhance — not replace — the core experience.** Creator pings integrate with everyone else’s priority/controls model; no creator takeover of the Notifications tab.

---

# 11. Notification Controls

Architecture only.

| Control | Intent |
|---------|--------|
| **Per-category** | Align §3 categories |
| **Mute** | Quiet a source or category |
| **Pause** | Temporary global or category pause |
| **Digest** | Prefer summaries |
| **Priority** | User preference toward High/Medium/Low/Silent |
| **Spoilers** | Suppress or gate spoiler-bearing notifications |
| **Mentions** | Elevate or constrain direct address |
| **Creator Updates** | Opt density for creator/dev |
| **Privacy** | Presence- and social-derived notification visibility |

Settings surface per F2.1 — no new nav root.

---

# 12. Future Ready

Reserve only — do not design:

Push · Email · Desktop · Wearables · Widgets · Live Activities · Communities · Guilds · Streaming · Events  

Channels deliver the **same philosophy**; they do not invent a second notification product.

---

# 13. Emotional Goal

Notifications should feel like:

> **“My gaming world moved while I was away.”**

Never:

> **“My phone is trying to pull me back.”**

---

# 14. Audit Checklist

- [ ] Reconnect to meaningful gaming moments — not screen-time max  
- [ ] No addiction, anxiety, FOMO, guilt, streaks, “come back now”  
- [ ] Quality · meaning · identity · celebrate  
- [ ] Categories defined with clear *why*  
- [ ] Notifications (attention) ≠ Activity History (memory) — both necessary  
- [ ] Priority levels: High · Medium · Low · Silent · Digest — no algo in this doc  
- [ ] Lifetime: Fresh → Recent → Archived → Dismissed → Resolved → History  
- [ ] Every notification has a meaningful deep link — no dead ends  
- [ ] Grouping/batching principles without hiding security  
- [ ] Identity notifications never gamified  
- [ ] Creator notifications reserved; Premium enhances core  
- [ ] Per-category controls · mute · pause · digest · spoilers · privacy  
- [ ] Future channels reserved — not designed  
- [ ] Emotional goal: world moved / not phone pulling  
- [ ] Distinct from Home (now) · Profile (identity) · Library (archive)  
- [ ] F2.8 philosophy honored  
- [ ] F2.1 Notifications stack / badge / deep links honored  
- [ ] No nav/Home redesign · F1 NotificationCard composition  
- [ ] No RN · Figma · backend · APIs · algorithms · F2.9.1  

---

## Final gate

### APPROVED

**Sprint F2.9 Notifications & Activity Center Architecture LOCKED**

Stop. Do **not** continue to Sprint F2.9.1.

---

## Related documents

| Doc | Role |
|-----|------|
| [SPRINT_F2_8_SOCIAL_COMMUNICATION.md](./SPRINT_F2_8_SOCIAL_COMMUNICATION.md) | Notification mission umbrella · DM/social |
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | NotificationsStack · categories · deep links |
| [SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) | Identity · Legacy · Known For |
| [SPRINT_F1_FOUNDATION.md](./SPRINT_F1_FOUNDATION.md) | NotificationCard |
| [SPRINT_F2_7_HOME_FEED.md](./SPRINT_F2_7_HOME_FEED.md) | Home = now vs Notifications = away |
| [SPRINT_F2_20_SETTINGS_PERSONALIZATION.md](./SPRINT_F2_20_SETTINGS_PERSONALIZATION.md) | Notification controls · calm defaults |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Notifications vs Activity Center, categories, priority, lifetime, grouping, identity/creator, controls, future channels |
