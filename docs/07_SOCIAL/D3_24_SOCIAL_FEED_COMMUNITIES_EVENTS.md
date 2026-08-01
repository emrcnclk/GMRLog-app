# D3.24 — Social Feed, Communities & Events

**Document:** `docs/07_SOCIAL/D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md`  
**Version:** 1.3  
**Status:** **COMPLETE · Production Ready**
**Sprint:** D3.24  
**Last Updated:** July 2026  
**Authority chain:** North Star (LOCKED) → F1–F5 · Posts Platform Freeze v1.0 → this package → `docs/08_API/*`  
**Mode:** Deterministic only — **no AI**

---

## Gaming Social Platform Identity

> Elaborates LOCKED North Star for the D3.24 social layer — **does not amend** `NORTH_STAR.md`.

GMRLOG is **not** a Twitter clone. It is a **Gaming Social Platform** where every interaction revolves around games. Users build a living gaming identity through library, achievements, reviews, collections, communities, events, and game activities. Hybrid Timeline = social content + lived play = Digital Home.

---

## Revision log

| Ver | Summary |
|-----|---------|
| 1.0–1.2 | Hybrid · Ranking · Quote v2 · Communities · Events · Profile · identity |
| **1.3** | Follow≠Friend weights · FeedItem taxonomy · Game Hub · Creator · Review Feed · Collection Hub · Reputation · Composer++ · Community badges · Event LFG · Because You Played · Profile Hero |

---

## Deliverable map (v1.3)

| # | Area | Doc |
|---|------|-----|
| 1 | Relationships · Hybrid · Ranking · Filters · FeedItem types | [`FEED_ENGINE_V2.md`](./FEED_ENGINE_V2.md) · [`FEED_ITEM_TYPES.md`](./FEED_ITEM_TYPES.md) · [`SOCIAL_GRAPH.md`](./SOCIAL_GRAPH.md) |
| 2 | Posts · Composer++ | [`SOCIAL_POSTS_V2.md`](./SOCIAL_POSTS_V2.md) · [`COMPOSER.md`](./COMPOSER.md) |
| 3 | Quote v2 · actions | [`SOCIAL_ACTIONS.md`](./SOCIAL_ACTIONS.md) |
| 4 | Game Hub | [`GAME_HUB.md`](./GAME_HUB.md) |
| 5 | Communities 2.0 + reputation badges | [`COMMUNITIES_2.md`](./COMMUNITIES_2.md) |
| 6 | Events v2 + LFG states | [`EVENTS_V2.md`](./EVENTS_V2.md) |
| 7 | Review Feed | [`REVIEW_FEED.md`](./REVIEW_FEED.md) |
| 8 | Collection Hub | [`COLLECTION_HUB.md`](./COLLECTION_HUB.md) |
| 9 | Reputation · Creator | [`REPUTATION.md`](./REPUTATION.md) · [`CREATOR_PROFILE.md`](./CREATOR_PROFILE.md) |
| 10 | Profile Hero | [`PROFILE_V2.md`](./PROFILE_V2.md) |
| 11 | Discovery — Because You Played | [`../09_DISCOVERY/BECAUSE_YOU_PLAYED.md`](../09_DISCOVERY/BECAUSE_YOU_PLAYED.md) |
| 12 | Cache · Notifications | [`FEED_CACHE.md`](./FEED_CACHE.md) · [`NOTIFICATION_MATRIX.md`](./NOTIFICATION_MATRIX.md) |

---

## 1. Relationships (critical)

| Edge | Direction | Timeline weight |
|------|-----------|-----------------|
| **Friend** | Bidirectional | `friendWeight` (**highest**) |
| **Follow** | Unidirectional | `followWeight` (`friendWeight > followWeight`) |
| **Block** | Unidirectional | Hard exclude |
| **Mute** | Unidirectional | Soft exclude from viewer feed |

D3.21 already has Follow · Friendship · Block. Mute must be first-class if not fully wired. Friendship ≠ auto-Follow.

See [`SOCIAL_GRAPH.md`](./SOCIAL_GRAPH.md) · ranking in [`FEED_ENGINE_V2.md`](./FEED_ENGINE_V2.md).

---

## 2. FeedItem taxonomy

Technical separation (not only product labels):

`FeedItem` → `PostItem` · `ActivityItem` · `RecommendationItem` · `AdvertisementItem` (**future only**)

See [`FEED_ITEM_TYPES.md`](./FEED_ITEM_TYPES.md).

---

## 3. Hybrid Timeline + Ranking

User Generated + Game Activities (unchanged identity).

```
score =
  freshness
  + friendWeight
  + followWeight
  + communityWeight
  + gameWeight
  + interactionVelocity
  + discoveryBoost
  + userSimilarity
  + interestOverlap
```

`friendWeight > followWeight`. No AI.

---

## 4. Game Hub

Every game is a social hub (extends F2.4 Game destination — **not** a new bottom tab):

Timeline · Reviews · Screenshots · Guides · Collections · Tier Lists · Events · Communities · Players

Game-tagged feed items fan into the hub automatically.

See [`GAME_HUB.md`](./GAME_HUB.md).

---

## 5. Creator Profile · Reputation · Profile Hero

- Creator: badge · followers · collections · guides · featured posts — [`CREATOR_PROFILE.md`](./CREATOR_PROFILE.md)  
- Gaming Reputation (behavior-based, not blue-check): [`REPUTATION.md`](./REPUTATION.md)  
- Profile Hero: Steam Level · Completion % · Archetype · Favorites · Current · Top Genre · Member Since · Total Hours — [`PROFILE_V2.md`](./PROFILE_V2.md)

---

## 6. Review Feed · Collection Hub

Letterboxd-style review surfaces + discoverable collections:

[`REVIEW_FEED.md`](./REVIEW_FEED.md) · [`COLLECTION_HUB.md`](./COLLECTION_HUB.md)

---

## 7. Composer++

Single compose: Text + Game + Screenshot + Review + Collection + Guide + Poll + Achievement + Event.

[`COMPOSER.md`](./COMPOSER.md)

---

## 8. Communities · Events

Community badges: Top Contributor · Moderator · Founder · Verified Creator.  
Event states: Going · Interested · Looking for Team · Need Players · Hosting (+ Declined).

---

## 9. Discovery — Because You Played

Deterministic module from library seeds → related reviews · collections · builds · communities.

[`BECAUSE_YOU_PLAYED.md`](../09_DISCOVERY/BECAUSE_YOU_PLAYED.md)

---

## API additives (v1.3 highlights)

| Area | Paths |
|------|-------|
| Feed | `/feed` + `itemKind` · filters; `/feed/reviews/*` |
| Graph | Follow · Friend · Block · Mute (ensure Mute surface) |
| Game Hub | `/games/:id/hub` · `/games/:id/feed` |
| Quotes | `POST /quotes` multi-target |
| Events | RSVP states include LFG · `invite` |
| Collections | `/collections/discover` · hub |
| Reputation | read on profile |
| Discovery | `/discover/because-you-played` |

---

## Test Gate (v1.3 additives)

- [ ] friendWeight > followWeight fixtures  
- [ ] Mute/Block exclude  
- [ ] FeedItem kind discrimination  
- [ ] Game Hub fan-in from game-tagged items  
- [ ] Review feed filters  
- [ ] Collection hub discover  
- [ ] Reputation award rules (deterministic)  
- [ ] Event LFG states  
- [ ] Because You Played deterministic chain  
- [ ] Prior v1.2 gates still pass  

---

## Explicit non-goals

AI · Twitter clone · Discord chat · live ads in D3.24 (`AdvertisementItem` reserved only) · paid blue-check vanity · new bottom tab · FLUSHALL

---

## Related

All docs in deliverable map above · [`TIMELINE_EVENTS.md`](./TIMELINE_EVENTS.md)
