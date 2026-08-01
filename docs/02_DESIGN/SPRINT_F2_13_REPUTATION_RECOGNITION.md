# GMRLOG — Sprint F2.13: Reputation & Recognition Ecosystem

**Document:** `docs/02_DESIGN/SPRINT_F2_13_REPUTATION_RECOGNITION.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F2.13 (Reputation & Recognition — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** Reputation & Recognition Architecture Freeze

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) |
| 4 | [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) |
| 5 | [`SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md`](./SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md) + [`SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md`](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) |
| 6 | [`SPRINT_F2_8_SOCIAL_COMMUNICATION.md`](./SPRINT_F2_8_SOCIAL_COMMUNICATION.md) |
| 7 | [`SPRINT_F2_11_COMMUNITIES_GUILDS.md`](./SPRINT_F2_11_COMMUNITIES_GUILDS.md) |
| 8 | [`SPRINT_F2_12_CREATOR_PLATFORM.md`](./SPRINT_F2_12_CREATOR_PLATFORM.md) |
| 9 | [`SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md`](./SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md) |
| 10 | **This document** — Reputation & Recognition |

Never contradict previous freezes. Expands **Known For** (F2.5.1), Community Reputation (F2.11), Creator Reputation (F2.12).

**Scope:** Entire reputation philosophy of GMRLOG.  
**Not:** Gamification · XP · karma · Reddit · StackOverflow · Discord roles · Steam levels.

**Out of scope:** UI, backend, algorithms, ranking formulas, implementation, React Native, Sprint F2.13.1+.

**Surfaces:** Profile Identity / Known For · Community identity · Creator Profile · Notifications Identity category — **no new tab**.

**Gate:** Stop after freeze. Do **NOT** continue to Sprint F2.13.1.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Reputation Mission |
| 2 | Recognition Philosophy |
| 3 | Reputation Sources |
| 4 | Known For System |
| 5 | Expertise |
| 6 | Community Trust |
| 7 | Creator Recognition |
| 8 | Developer Recognition |
| 9 | Recognition Objects |
| 10 | Milestones |
| 11 | Reputation Graph |
| 12 | Anti-Gamification Rules |
| 13 | Future Ready |
| 14 | Emotional Goal |
| 15 | Audit Checklist |

---

# 1. Reputation Mission

Reputation exists to answer one question:

> **Why does this person’s contribution matter?**

Not:

- How famous are they?  
- How many followers?  
- How many likes?

Identity before popularity remains absolute (F2.5 · F2.8).

---

# 2. Recognition Philosophy

| Celebrate | Never celebrate as primary |
|-----------|----------------------------|
| **Contribution** | Popularity |
| **Craft** | Reach alone |
| **Identity** | Influence theater |

**Identity precedes influence. Craft precedes reach.**

Recognition is descriptive and cultural — not competitive.

---

# 3. Reputation Sources

Reputation may emerge from:

| Sources |
|---------|
| Reviews · Guides · Articles · Collections · Tier Lists |
| Helpful comments |
| Community moderation |
| Events |
| Developer collaboration |
| Community leadership |

Never from:

| Anti-sources |
|--------------|
| Follower count |
| Likes alone |
| Hours online |
| Daily streaks |
| Spam volume |

Align F2.11 community reputation and F2.12 creator reputation sources.

---

# 4. Known For System

Expand existing **Known For** (F2.5.1 · F2.8 · F2.12) — qualitative facets only.

| Directional examples |
|----------------------|
| Known For RPG Reviews |
| Known For Horror Guides |
| Known For JRPG Collections |
| Known For Community Help |
| Known For Soulsborne Knowledge |
| Known For Strategy Articles |
| Known For Indie Discovery |
| Known For Retro Preservation |

| Rule |
|------|
| **Qualitative only** |
| **Never numerical** |
| No public score, grade, or Elo |
| May appear on Profile Identity — never as Hero vanity primary |
| Game “Known For” (F2.4.1) remains game personality; this is **person/community/creator** recognition |

---

# 5. Expertise

Separate **expertise** from popularity.

| Possible dimensions |
|---------------------|
| Genre · Mechanics · Franchises · Studios |
| Lore · Modding · Accessibility |
| Speedrunning · Photography · Achievement Hunting |

| Rule |
|------|
| **No levels** |
| **No ranks** |
| Descriptive affinity — kinship with Gamer DNA (how they play) + Known For (how they’re known) |

---

# 6. Community Trust

Communities recognize people through contribution (F2.11 roles: Trusted Member, Moderator, Curator — responsibility, not XP).

Trust grows through:

| Through |
|---------|
| Helpful answers |
| Quality moderation |
| Long-term contribution |
| Respect |
| Consistency |

Never through activity spam.

---

# 7. Creator Recognition

Creators become recognized because of:

| Craft |
|-------|
| Guides · Articles · Series |
| Editorial quality |
| Educational value |

**Not** subscriber count (F2.12).

---

# 8. Developer Recognition

Developers receive recognition through:

| Through |
|---------|
| Developer Diaries |
| Community engagement |
| Transparency |
| AMA participation |
| Patch communication |

**Never** through marketing volume alone.

---

# 9. Recognition Objects

Recognition can attach to:

| Objects |
|---------|
| Profiles · Reviews · Articles · Guides · Collections |
| Communities · Games · Series · Events |

Everything remains inside the **Content / Game Graph**. Nothing floats as orphan badges.

---

# 10. Milestones

Architecture only — identity moments (F2.5.1 Legacy · F2.9 Identity notifications).

| Examples |
|----------|
| First Helpful Guide |
| 100 Helpful Reviews |
| Community Favorite |
| Long-Term Contributor |
| Legacy Creator |

| Forbidden framing |
|-------------------|
| XP · Leveling · Battle pass |

Milestones **describe** a journey chapter — they do not unlock power or feed rank.

---

# 11. Reputation Graph

Reputation connects:

```
Player ↔ Creator ↔ Community ↔ Developer
         ↕
    Game · Article · Guide · Review · Collection
```

Nothing exists in isolation. Discover may surface Known For / expertise as taste signals — never as leaderboard (F2.10).

---

# 12. Anti-Gamification Rules

**Explicitly forbid:**

| Forbidden |
|-----------|
| XP |
| Levels |
| Leaderboards |
| Daily streaks |
| Login rewards |
| Engagement farming |
| Karma systems |
| Public scores |

**Reputation is descriptive. Never competitive.**

Helpful remains a craft signal (F2.8) — not a public karma total to farm.

---

# 13. Future Ready

Reserve architecture only:

| Reserved |
|----------|
| Expert Panels |
| Verified Experts |
| Editorial Boards |
| Community Councils |
| Mentor Program |
| Knowledge Contributors |
| Curator Networks |

No ranks disguised as “verified tiers.” Verification = trust stewardship, not prestige score.

---

# 14. Emotional Goal

Recognition should feel like:

> **“People value what I contribute.”**

Never:

> **“I’m farming internet points.”**

---

# 15. Audit Checklist

- [ ] Answers “why does this contribution matter?” — not fame/followers/likes  
- [ ] Identity before popularity · craft before reach  
- [ ] Sources = contribution; anti-sources forbidden  
- [ ] Known For expanded — qualitative, never numerical  
- [ ] Expertise distinct from fame — no levels/ranks  
- [ ] Community trust via quality & consistency  
- [ ] Creator recognition via craft — not subscribers  
- [ ] Developer recognition via transparency & engagement — not marketing  
- [ ] Recognition objects graph-connected  
- [ ] Milestones without XP/leveling/battle pass  
- [ ] Reputation graph intact  
- [ ] Anti-gamification rules explicit (no XP, levels, streaks, karma, leaderboards, public scores)  
- [ ] Future expert/council systems reserved  
- [ ] Compatible with F2.5–F2.12  
- [ ] No UI · backend · algorithms · ranking formulas · RN · F2.13.1  

---

## Final gate

### APPROVED

**Sprint F2.13 Reputation & Recognition Ecosystem LOCKED**

Stop. Do **NOT** continue to Sprint F2.13.1.

---

## Related documents

| Doc | Role |
|-----|------|
| [SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) | Known For · identity before popularity |
| [SPRINT_F2_12_CREATOR_PLATFORM.md](./SPRINT_F2_12_CREATOR_PLATFORM.md) | Creator reputation |
| [SPRINT_F2_11_COMMUNITIES_GUILDS.md](./SPRINT_F2_11_COMMUNITIES_GUILDS.md) | Community reputation · roles |
| [SPRINT_F2_8_SOCIAL_COMMUNICATION.md](./SPRINT_F2_8_SOCIAL_COMMUNICATION.md) | Helpful · no toxicity metrics |
| [SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md](./SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md) | Identity notifications — never gamify |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Identity · Creator Economy ethics |
| [SPRINT_F2_14_ACHIEVEMENT_LEGACY.md](./SPRINT_F2_14_ACHIEVEMENT_LEGACY.md) | Achievements as memory · personal journey |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Reputation mission, Known For expansion, expertise, trust, anti-gamification, graph, future panels |
