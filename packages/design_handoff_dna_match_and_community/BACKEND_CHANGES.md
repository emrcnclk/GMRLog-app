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

## 6. Order of work

1. Engine breakdown + test (no API surface change) — safe to ship alone
2. Prisma columns + service write path
3. `SimilarUserResponse.match` — unlocks every list token in the UI at once
4. `GET /users/:id/dna-match` — unlocks the panel
5. Community role + leaderboard — independent of everything above, can run in parallel

Steps 1–3 are worth shipping before any UI work; the frontend can then build against real data instead of fixtures.
