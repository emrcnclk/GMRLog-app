# Metadata Provider Abstraction

**Document:** `docs/18_CATALOG/METADATA_PROVIDERS.md`
**Introduced:** D3.25
**Code:** `apps/backend/src/games/metadata/providers/`

---

## 1. The port

```ts
export interface GameMetadataProvider {
  readonly name: MetadataProviderName;      // 'igdb' | 'steam' | 'rawg'
  readonly priority: number;                // lower wins ties
  isEnabled(): boolean;
  lookup(query: ProviderLookupQuery): Promise<ProviderGameMetadata | null>;
}
```

`ProviderLookupQuery` carries every identity hint the caller has —
`{ title, slug, igdbId?, steamAppId?, rawgId?, releaseYear? }` — so a provider
can take the cheapest path available (direct id lookup beats title search).

`lookup` returns `null` for "no match" and **throws** for "transport failed".
The distinction matters: no-match falls through to the next provider, a throw is
recorded and retried by BullMQ.

## 2. The normalized DTO

Every provider returns the same shape. Nothing provider-specific escapes the
provider file.

```ts
export interface ProviderGameMetadata {
  provider: MetadataProviderName;
  confidence: number;            // 0..1 — match quality, not data quality
  externalIds: { igdbId?: number; steamAppId?: number; rawgId?: number };
  title: string | null;
  summary: string | null;
  description: string | null;
  releaseDate: Date | null;
  externalRating: number | null;       // normalized 0..100
  externalRatingCount: number | null;
  genres: ProviderNamedRef[];
  tags: ProviderTagRef[];              // { name, kind: theme|mode|perspective|keyword }
  platforms: ProviderNamedRef[];
  developers: ProviderNamedRef[];
  publishers: ProviderNamedRef[];
  franchise: ProviderNamedRef | null;
  series: ProviderNamedRef | null;
  similarGames: ProviderSimilarRef[];  // { externalId, title, kind }
  media: ProviderMediaRef[];           // { kind, url, width, height, sortOrder }
  trailerUrl: string | null;
  attribution: string;
}
```

`ProviderNamedRef` is `{ name, slug }` — the applier upserts on `slug`, so
"Action" from IGDB and "Action" from Steam converge on one `Genre` row.

## 3. Confidence

Direct external-id lookups score `1.0`. Title searches are scored by a pure
function in `metadata-match.ts`:

| Signal | Effect |
|---|---|
| Normalized exact title match | `0.9` base |
| Normalized prefix / subset match | `0.7` base |
| Token Jaccard otherwise | `0.4 × jaccard` base |
| Release year matches the hint | `+0.08` |
| Release year contradicts the hint | `−0.25` |

Normalization strips punctuation, roman-numeral-izes, folds diacritics, and
removes edition suffixes (`Game of the Year Edition`, `Definitive Edition`, …).

`METADATA_MIN_CONFIDENCE` (default `0.55`) is the floor for accepting a match at
all. `METADATA_COMPLETE_CONFIDENCE` (default `0.8`) is the floor for
`metadata_status = 'complete'`; between the two the game lands as `partial`.

## 4. The registry chain

`MetadataProviderRegistry.resolve(query)` walks enabled providers in priority
order and merges:

1. First provider returning a result **at or above** `METADATA_MIN_CONFIDENCE`
   becomes the **primary**. Its `provider` name is persisted on the game.
2. Remaining enabled providers are consulted only to **fill fields the primary
   left null or empty**. They never overwrite a primary value.
3. Scalar fields fill-forward on null. Collection fields (genres, tags,
   platforms, companies, media, similar) fill-forward only when the primary's
   collection is *empty* — collections are never interleaved across providers,
   because mixing taxonomies produces incoherent tag sets.
4. `externalIds` always union — learning a `steamAppId` from Steam while IGDB is
   primary is strictly useful.

Merge behaviour lives in `metadata-merge.ts` as pure functions with no I/O, and
is the single most heavily unit-tested piece of this sprint.

## 5. IGDB provider

- **Auth:** Twitch client-credentials. Token cached in-process until 60s before
  expiry, refreshed lazily, never persisted.
- **Transport:** `POST https://api.igdb.com/v4/games` with an APIcalypse query body.
- **Rate limit:** in-process token bucket, `IGDB_RATE_LIMIT_RPS` (default `4`),
  awaited before every call. Worker concurrency is bounded to match.
- **Fields requested:** name, summary, storyline, first_release_date, total_rating,
  total_rating_count, genres, themes, game_modes, player_perspectives, keywords,
  platforms, involved_companies (+developer/publisher flags), franchise,
  collection, similar_games, cover, artworks, screenshots, videos, websites.
- **Image URLs:** IGDB returns `//images.igdb.com/.../t_thumb/<hash>.jpg`; the
  provider rewrites the size token to `t_cover_big` / `t_1080p` / `t_screenshot_huge`
  by media kind and forces `https:`.
- **Rating:** `total_rating` is already 0–100; passed through.
- **Disabled when** either `IGDB_CLIENT_ID` or `IGDB_CLIENT_SECRET` is absent.

## 6. Steam Store provider

- **Transport:** `GET https://store.steampowered.com/api/appdetails?appids=<id>&l=english`.
- **Identity:** requires a `steamAppId`. It cannot search by title, so when no
  appid is known the provider returns `null` immediately — a deliberate choice
  over screen-scraping the store search page.
- **Rate limit:** `STEAM_STORE_RATE_LIMIT_RPS`, default `1`.
- **Mapping:** `short_description` → summary; `detailed_description` →
  description (HTML stripped); `genres` → genres; `categories` → tags
  (`kind: 'mode'`); `developers`/`publishers` → companies; `platforms` object →
  platform refs; `header_image` + `background_raw` → cover/hero;
  `screenshots[]` → screenshots; `movies[0]` → trailer;
  `metacritic.score` → external rating.
- **Confidence:** `1.0` — an appid lookup is exact by construction.
- **Disabled unless** `STEAM_STORE_METADATA_ENABLED=true`.

## 7. RAWG provider

Implemented, priority last, **disabled by default**. Requires both
`RAWG_ENABLED=true` and `RAWG_API_KEY`. See `METADATA_LICENSING.md` §4 for the
decision record and the conditions that would flip it.

## 8. Testing posture

No test performs network I/O. Every provider takes an injectable `fetch` and is
tested against recorded response fixtures in
`apps/backend/src/games/metadata/providers/__fixtures__/`. The registry, merge,
match, and normalization modules are pure and tested directly.

`NullMetadataProvider` (always disabled) and `FakeMetadataProvider`
(fixture-driven, configurable confidence) exist in `metadata/testing/` for
service- and processor-level tests.
