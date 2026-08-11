# Backend changes

Smaller than it looks. The similarity engine already computes everything the DNA panel needs — it just throws the parts away and returns one number.

> **0.1 reality check — this is the most accurate document in the bundle.** §1 is exact: the five sub-scores are computed at `similarity.engine.ts:271-275` and discarded, and `USER_SIMILARITY_WEIGHTS` matches the table below value for value (0.28 / 0.22 / 0.18 / 0.18 / 0.14). §2 is exact: `UserSimilarity` (`schema.prisma:2090`) caches `score` only, and the write path is `computeAndCacheUserPairs` (`similarity.service.ts:163`). §4's hedge about the account-type field resolves to **there is none** — no `accountKind`, `accountType` or equivalent exists on `User`, so that field must be added as the doc allows for. Only §3's line reference and §5's role union needed correcting; both are marked inline below.

---

## 1. Return the breakdown, not just the total

**File:** `apps/backend/src/discover/scoring/similarity.engine.ts`

`computeUserSimilarityScore` already calculates five sub-scores internally:

```ts
const library = jaccardSimilarity(left.libraryGameIds, right.libraryGameIds);
const genre = jaccardSimilarity(left.genreIds, right.genreIds);
const wishlist = jaccardSimilarity(left.wishlistGameIds, right.wishlistGameIds);
const completion = jaccardSimilarity(left.completedGameIds, right.completedGameIds);
const review = reviewRatingSimilarity(left.reviewRatings, right.reviewRatings);
```

…then collapses them with `USER_SIMILARITY_WEIGHTS` and discards them. **The five sub-scores are exactly the five bars in the design.** Do not invent new dimensions — the prototype was updated to match these, with these labels:

| Signal         | Weight | UI label         |
| -------------- | ------ | ---------------- |
| `library`      | 0.28   | Shared library   |
| `genre`        | 0.22   | Genre overlap    |
| `reviewRating` | 0.18   | Rating agreement |
| `wishlist`     | 0.18   | Wishlist overlap |
| `completion`   | 0.14   | Completion style |

Add a sibling function that returns the parts, and make the existing one call it so the total can never drift from the breakdown:

```ts
export interface UserSimilarityBreakdown {
  library: number;
  genre: number;
  reviewRating: number;
  wishlist: number;
  completion: number;
  total: number; // all values in [0,1]
}

export function computeUserSimilarityBreakdown(
  left: UserSimilaritySignals,
  right: UserSimilaritySignals,
): UserSimilarityBreakdown;
```

Keep `computeUserSimilarityScore` as a thin wrapper returning `.total` — existing callers and `similarity.engine.spec.ts` keep passing. Add a test asserting the weighted sum of the parts equals `total`.

## 2. Persist the breakdown

**Files:** `packages/database` (Prisma schema + migration), `apps/backend/src/discover/similarity.service.ts`

The `UserSimilarity` model caches `score`. Add the five component columns (`Float`, default 0) alongside it, and write them in `computeAndCacheUserPairs`. Recomputing the breakdown on read would double the query cost for a value you already had at write time.

Existing cached rows will have zeroes. Either backfill with a one-off script or let the cache expire naturally — but **the panel must not render a breakdown of all-zeros with a non-zero total**. Treat `total > 0 && all components === 0` as "breakdown unavailable" and fall back to the score-only presentation.

## 3. Extend the DTO

**File:** `packages/types/src/index.ts` — **`SimilarUserResponse` is at L1212**, not the ~L1181 written here before the 0.1 audit. (`README.md`'s table carries the same stale reference.)

```ts
export type DnaBand = 'near-identical' | 'strong' | 'partial' | 'different';

export interface DnaDimension {
  key: 'library' | 'genre' | 'reviewRating' | 'wishlist' | 'completion';
  score: number; // 0–100, rounded
}

export interface SimilarUserResponse {
  user: UserPublicResponse;
  score: number; // unchanged — 0–1, existing consumers keep working
  match?: {
    // NEW, optional so nothing breaks
    percent: number; // 0–100, rounded — what the UI shows
    band: DnaBand;
    dimensions: DnaDimension[];
  };
}
```

Adding `match` as optional means `similar-users-section.tsx`, the Discover rail and the friends list can all render the token from data they already fetch, with no new request.

**Band thresholds** (server-owned, so every surface agrees):
`>= 85` near-identical · `70–84` strong · `55–69` partial · `< 55` different.

> **6.2 confirmation, 2026-08-11 — `score` is the DNA match score, not a second Discover-only number.** Raised as the one question 6.2 had to settle before touching code: is `UserSimilarity.score` (served today as `SimilarUserResponse.score`) the same value the DNA match panel will show, or a separate similarity metric that happens to share a table? It is the **same** value — traced the whole path: `computeUserSimilarityScore` (§1's engine, one weighted total) → `UserSimilarity.score` (§2's cache) → `SimilarUserResponse.score` (§3, already served to `useSimilarUsers`) → and `match.percent` above is defined as nothing more than `Math.round(score * 100)` of that identical total, formalized with a server-owned `band` once 5.1–5.3 land. There is no second pipeline anywhere in `similarity.engine.ts` or `similarity.service.ts` — one weighted sum, three shapes it's served in.
>
> Practically: the "Plays like you" rail (6.2) renders `Math.round(score * 100)` as its headline percentage today — that is formatting an existing server-computed float, not deriving a second score, and it is the exact number `match.percent` will carry once 5.3 ships (optional field, additive, the rail's render call does not change). What the rail does **not** have yet, and does not need per its own spec, is `band`/`dimensions` — the card has no colour-by-threshold requirement (unlike the friends-list and community-member match _token_, which do read "accent when ≥70%"), so nothing here computes a band client-side. This does not change TASKS.md's Phase 6 dependency note — 6.1/6.3/6.4 still wait on Phase 5 for the token's band-styling and the panel's breakdown — it only confirms, in writing, the assumption that note was already making correctly.

## 4. The full match endpoint

**Files:** `discover.controller.ts` + `similarity.service.ts`, or a new `dna-match` module if you prefer it beside `archetypes/`.

```
GET /users/:id/dna-match  →  DnaMatchResponse
```

```ts
export interface DnaMatchResponse {
  user: UserPublicResponse;
  applicable: boolean; // false for organisation / studio accounts
  percent: number;
  band: DnaBand;
  dimensions: DnaDimension[];
  verdict: string; // one sentence
  traits: string[]; // 2–3 short labels
  sharedGames: GameCardResponse[]; // cap at 8
}
```

- **`applicable: false`** for any non-individual account. The client omits the whole panel — this is not a zero score, the concept does not apply. Check whatever the account-type field is on `User`; if there is none yet, add `accountKind: 'individual' | 'organisation'` and default existing rows to `individual`.
- **`sharedGames`** is the intersection of both libraries, ordered by the viewer's playtime. `libraryGameIds` is already loaded to compute the score — reuse the set rather than querying again.
- **Blocked either direction** → 404, consistent with `getSimilarUsers`, which already filters blocked ids.
- **Below the minimum shared-data threshold** (say fewer than 3 shared games and no shared reviews) → return `percent: 0` with `band: 'different'` and a verdict explaining the thinness. Never fabricate a number from a thin sample; the client shows the "not enough shared logs yet" state.

### The verdict sentence

One plain sentence naming the strongest and weakest signal — "Smaller shared shelf, but you agree on almost everything you have both played." Generate it from the breakdown with a small set of templates keyed on which dimension leads and which lags; do **not** ship a single generic string, and do not call an LLM on the read path. Keep the templates in one file so copy can be edited without touching the scoring.

### Traits

Reuse the archetype engine — `apps/backend/src/archetypes/archetype-engine.service.ts` already derives player archetypes. Traits are the viewed player's top 2–3 archetype labels, not a new taxonomy.

## 5. Community: roles and leaderboard

**Files:** `apps/backend/src/communities/*`

`community-permissions.ts` and `community-badges.ts` already exist, so role is likely modelled — confirm before adding anything.

> **0.1 — confirmed, and the union below is wrong as a result.** Role _is_ modelled: `enum CommunityRole { member, moderator, owner, admin }` (`schema.prisma:305`), carried on the membership row (`schema.prisma:1463`) and ranked by `communityRoleRank` in `community-permissions.ts` as `member 0 < moderator 1 < admin 2 < owner 3`.
>
> So **do not add a role enum — reuse `CommunityRole`.** And the members-response union written below drops `owner` and `admin`, two roles the database already stores; a response typed that way cannot represent a community's own owner. The union should be the four persisted roles **plus** the derived one:
>
> ```ts
> role: 'owner' | 'admin' | 'moderator' | 'member';
> isContributor?: boolean;   // derived from the leaderboard window, not a role
> ```
>
> Keeping `contributor` off the role axis is the cleaner fix: it is a _rank in a window_, not a permission, and collapsing it into the same field is what forced `owner` and `admin` out. The Moderators rail (task 7.2) then reads "accent border + glow for `moderator` and above, hairline for contributors" without losing the owner.

- **Members response** gains `role: 'moderator' | 'contributor' | 'member'`. `contributor` is derived, not assigned: top N by contribution points in the window.
- **New endpoint:**
  ```
  GET /communities/:id/leaderboard?window=90d  →  { entries: LeaderboardEntry[] }
  ```
  ```ts
  export interface LeaderboardEntry {
    rank: number;
    user: UserPublicResponse;
    points: number;
  }
  ```
- **Points** are a sum over the window: posts, replies, accepted guides, events hosted. Pick the weights with the product owner and put them in one exported constant next to `USER_SIMILARITY_WEIGHTS`, so they are visible and tunable rather than buried in a query.
- Cache per community per window; this is a read-heavy, slow-changing figure. Do not compute it per request.
- Deleted and blocked users are excluded, and ranks close up — no gaps in the numbering.

> **7.1 — implemented 2026-08-11.** `GET /communities/:id/leaderboard?window={7d|30d|90d}&limit=` (default `90d`/20, max 50), `CommunityLeaderboardResponse { window, entries: CommunityLeaderboardEntry[] }`. `CommunityMemberResponse.isContributor` is a real `true`/`false` on every `listMembers` row (top 10 by the default-window leaderboard), optional only where a member-shaped response doesn't recompute the whole board (a role-patch reply).
>
> Two things this section left for engineering, resolved and recorded rather than guessed past silently:
>
> - **No product owner was reachable from a coding session, so the weights are a documented default, not a placeholder:** `post: 1, guide: 3, reply: 1, eventHosted: 5` (`apps/backend/src/communities/scoring/leaderboard.engine.ts`). A guide is more effort than a text post; hosting an event is the highest-effort act available to a member; a post and a reply are both "showed up" and share a weight. Revisit with real usage data — this is a starting point the constant makes trivial to tune, exactly as asked.
> - **"Accepted guides" has no acceptance mechanism anywhere in the schema.** No field on `Post`, no separate model, nothing resembling a moderator sign-off. Every `guide`-kind post counts at the guide weight — there is nothing to gate on. Same class of doc-vs-code gap as 3.1's `holderPercent` and 3.4's `unreadCount`: named in a spec, absent from the data model, documented rather than invented.
> - **"Blocked users" collapses into the same check as "deleted."** The schema's only account-removal signal is `User.deletedAt`; there is no platform-level ban/suspend field. `Block` is a directed, viewer-relative edge (blocker → blocked), and using it here would make a supposedly community-wide, cacheable-per-window resource depend on who's asking — the opposite of what "cache per community per window" asks for. So "deleted and blocked" is one exclusion, not two.
> - **Replies and hosted-events are scoped to a community by joining through its own post/event ids**, not a direct FK — `Comment` is polymorphic (`hostType`/`hostId`), so `countByHostsGroupedByAuthorSince('post', communityPostIds, since)` takes the id set from `Post.listByCommunity` first. Acceptable at this app's scale (bounded by one community's own activity, not the whole platform); the same two-query shape as `listMembers`' own N+1 fixes, just not yet collapsed into a single joined query — worth revisiting if a community's post count ever gets large enough to matter.
> - **Cached in Redis, `PLATFORM_REDIS`, 1 hour TTL, graceful when Redis is down** (falls straight through to a fresh computation, the same degrade `FeedCacheService` already established) — full ranked list per `communityId:window`, uncapped by any caller's `limit` so `getLeaderboard` and `listMembers`'s contributor derivation read the identical cache entry instead of computing twice.

## 6. Community: circle `kind` and an activity signal

Raised as **3b.1e**: `SCREEN_REDESIGNS_2.md` §13 needs a circle `kind` for its filter pills and an activity signal (`postsToday`, a live "active now" indicator) for its card footer and its own "Active now" rail. Neither exists in this doc, in `README.md`, or in the schema — the only source is the prototype's `COMM_FILTERS` array (`Games`, `Board games`, `Cosplay`, `Live events`) and one design note ("Circles carry four kinds ... the kicker and icon do the sorting, so nothing needs a bespoke layout"). Decided here, in the design-authority doc, not invented inside a screen task.

### `kind`

- **One value, not several.** Every entry in the prototype's own mock data (`COMMUNITIES`) carries exactly one `kind`; nothing in the design docs shows a circle belonging to more than one filter pill at once. `enum CommunityKind { games, board_games, cosplay, live_events }` — the prototype's own four, no fifth "general" bucket. A catch-all would let every future circle land there by default instead of an owner choosing, which defeats the filter pills' purpose.
- **Required, not optional.** An optional field means the filter pills always have a circle they can't place. The migration backfills every existing community to `games` — the app's own default domain (`CLAUDE.md`: "GMRLog is a gaming identity product"), and the same value the create form defaults to, so a fresh circle and a backfilled one start identically.
- **Set at creation, editable after, by the owner/admin** — the same place `name`/`description`/`visibility` are already edited. **The create and edit screen changes are not part of this decision.** They are a screen task of their own, downstream of this section, the same way §13/§14's own screens were split into their own tasks.

### Activity signal

Two fields, both derived at read time, neither stored:

```ts
postsToday: number; // this community's post-kind activity items since the current UTC day's start
activeNow: boolean; // at least one post-kind activity item in the last 3 hours
```

- **Source is `CommunityActivity` → `ActivityItem` filtered to `kind: 'post'`, not a raw `Post.communityId` count.** `CommunityActivity`/`ActivityItem` is already the Feed tab's own source (`listFeed`/`paginateCommunityActivity`, 3b.2), keyed on `occurredAt` with an existing `kinds` filter (`feedTabToActivityKinds`). Counting the same rows the Feed tab itself would show keeps "posts today" honest with what a viewer scrolling that tab actually sees, instead of a second, slightly different definition read straight off `Post`.
- **`postsToday` resets at UTC midnight, not the viewer's.** Scores and counts are server-side precisely so two devices never disagree (`CLAUDE.md`); a per-viewer "today" would make the same circle show two different counts to two viewers in two time zones at the same instant. One boundary, UTC, for every viewer, every time.
- **`activeNow` is a rolling window, independent of the calendar day.** A community with one post at 00:05 and silence since would read `postsToday > 0` for the next 24 hours — not what a pulsing "active now" dot should promise. `activeNow` is **at least one post-kind activity item in the last 3 hours.** Three hours is picked to survive a normal quiet stretch inside an active circle without flickering off between two people posting an hour apart; revisit against real usage once this ships, the same way `USER_SIMILARITY_WEIGHTS` is tunable rather than load-bearing on its first guess.
- **Batched, not per-row — the same rule 3b.1a fixed the directory endpoint against.** Both fields come from one grouped count per page (`communityId`, `kind: 'post'`, `occurredAt >= <cutoff>`), the same shape `listOwnersByCommunityIds`/`countByCommunityIds` already use for the same endpoint, never a query per card.

Both fields are additive on `CommunityResponse` per `CLAUDE.md`'s DTO rule; existing consumers are unaffected until the directory screen reads them. Building the directory's filter pills against real `kind`, the card footer's `postsToday`/live dot, and the "Active now" rail is a screen task that reads this section — not part of it.

## 7. Order of work

1. Engine breakdown + test (no API surface change) — safe to ship alone
2. Prisma columns + service write path
3. `SimilarUserResponse.match` — unlocks every list token in the UI at once
4. `GET /users/:id/dna-match` — unlocks the panel
5. Community role + leaderboard — independent of everything above, can run in parallel
6. Community `kind` + activity signal (§6) — independent of everything above, can run in parallel

## 8. Subscription — no billing backend anywhere

**Confirmed gap, not yet scoped.** 3b.5's Subscription screen (§17) grepped `apps/backend`, `packages/database`, `packages/validators` and `packages/types` for `subscription`/`billing`/`stripe`/`iap` before writing `subscription-model.ts` — nothing matches. There is no schema model, no DTO, no route, no payment-provider integration of any kind.

The screen is real and honest as far as it goes: `SUBSCRIPTION_PLANS` and `SUBSCRIPTION_FEATURES` are pure content and arithmetic (§17's pricing and "2 months free" math), and the screen renders exactly one state — **not subscribed** — because that is the only state any data source can back. It does not fabricate a "subscribed" view, a purchase flow, or a fault state for a request it never makes. But it is **permanently half** until this section is built: a player can select a plan and see the price, and nothing happens when they would expect to pay.

Needed before the screen can do anything past display:

| Need                                                    | Shape                                                                                                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A subscription/entitlement model                        | who is Pro, which plan, renewal date — `UserSettings` is the wrong place; this wants its own table, mirroring how `ProfilePin`/`ConnectedAccount` each got their own rather than growing `UserSettings` further          |
| A payment provider integration                          | Stripe or platform IAP (App Store/Play Billing) — not decided; changes the shape of everything below it                                                                                                                  |
| `GET /me/subscription`                                  | current plan, status, renewal date                                                                                                                                                                                       |
| `POST /me/subscription` (or provider webhook + confirm) | start a subscription; exact shape depends on the provider chosen                                                                                                                                                         |
| `DELETE /me/subscription`                               | cancel                                                                                                                                                                                                                   |
| The "Pro-only" gate itself                              | §18's card styles/banners this session found have **no ownership concept at all** in `ProfileCardStyle`/`ProfileBannerStyle` — ungating a "Pro" feature needs a real entitlement check somewhere, not a client-side flag |

This is its own scoping pass, not a one-line follow-up — payment-provider choice alone has legal/compliance weight (see `CLAUDE.md`'s prohibition on financial actions without explicit user confirmation, which would apply to any future purchase flow this unlocks). Flagging here so the next session that greps for "subscription" finds this instead of re-deriving the same "no backend anywhere" finding from scratch.

Steps 1–3 are worth shipping before any UI work; the frontend can then build against real data instead of fixtures.
