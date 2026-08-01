# Metadata Licensing & Attribution Posture

**Document:** `docs/18_CATALOG/METADATA_LICENSING.md`
**Introduced:** D3.25
**Status:** ACTIVE — engineering posture. Not legal advice.

This document records **why each provider is enabled or disabled by default**,
and what the code does to keep GMRLOG on the right side of each provider's
terms. It exists because "RAWG fallback only if licensing requires" is a
licensing-conditional instruction, and that condition needs a written, auditable
answer rather than an implicit one.

---

## 1. Summary table

| Provider | Default state | Env gate | Attribution surfaced | Artwork mirrored |
|---|---|---|---|---|
| IGDB (Twitch) | **Enabled when credentialed** | `IGDB_CLIENT_ID` + `IGDB_CLIENT_SECRET` | `metadata_provider = 'igdb'` per game; attribution string in `GET /games/:id/metadata` | Yes |
| Steam Store | **Enabled when credentialed** | `STEAM_STORE_METADATA_ENABLED` | `metadata_provider = 'steam'` per game | Yes |
| RAWG | **DISABLED** | `RAWG_ENABLED` + `RAWG_API_KEY` | wired, unused while disabled | Yes, when enabled |

Provenance is persisted per game (`Game.metadataProvider`) and per media row
(`GameMedia.provider`), so an attribution or takedown obligation can always be
resolved to the exact affected rows.

## 2. IGDB — primary

IGDB is accessed through Twitch's API gateway using client-credentials OAuth.
Terms require an authenticated application identity and attribution of IGDB as
the data source in surfaces that display the data.

**What the code does**
- Never ships credentials; the provider self-disables when either variable is absent.
- Honours the documented 4 requests/second ceiling via an in-process token bucket
  (`IGDB_RATE_LIMIT_RPS`, default `4`).
- Persists `metadataProvider = 'igdb'` on every game it writes, and exposes an
  `attribution` string on `GET /games/:id/metadata` so the future UI sprint has a
  contractual place to render it.

**Open item for the UI sprint (D3.27):** the attribution string is served by the
API but is not yet rendered anywhere, because D3.25 does not touch UI. This is
tracked in the completion report as a carry-forward, not as done.

## 3. Steam Store — fallback

`store.steampowered.com/api/appdetails` is an undocumented public endpoint. It
has no published rate limit and no formal terms of use covering third-party
consumption.

**Posture:** treat it as best-effort, self-limited, and clearly secondary.

**What the code does**
- Off unless `STEAM_STORE_METADATA_ENABLED=true` — an operator opt-in, not a default.
- Conservative self-imposed rate limit (`STEAM_STORE_RATE_LIMIT_RPS`, default `1`).
- Used only to (a) fill fields IGDB did not return, or (b) resolve games that
  IGDB could not match at all — most commonly Steam-exclusive and early-access titles.
- Steam header/capsule artwork is mirrored, not hotlinked, so GMRLOG never drives
  traffic to Valve's CDN from user devices.

## 4. RAWG — conditional, disabled

The sprint instruction is *"RAWG fallback only if licensing requires."*

**Finding:** licensing does **not** currently require RAWG. IGDB plus Steam Store
covers the catalog shapes GMRLOG needs (PC, console, mobile, retro), and neither
provider's terms force a third source. RAWG's free tier additionally carries an
attribution requirement and a commercial-use boundary that GMRLOG has not
evaluated against its own monetisation plans (`docs/14_MONETIZATION/`).

**Decision:** RAWG is **implemented but disabled**, so that enabling it later is a
configuration change rather than an engineering project. It requires **both**
`RAWG_ENABLED=true` and a non-empty `RAWG_API_KEY`; setting only one is a no-op.
Its registry priority is last.

**What would flip this decision** — any one of:
1. Measured IGDB + Steam coverage below **90%** of the live catalog after backfill.
2. A change in IGDB terms that restricts GMRLOG's use case.
3. A product requirement for data RAWG uniquely provides.

Coverage is measurable at any time via `GET /games/:id/metadata` aggregates and
the `gmrlog_catalog_metadata_coverage` metric, so condition (1) is observable
rather than guessed.

> **Requires a product/legal decision before RAWG is enabled in production:**
> whether GMRLOG's monetisation model falls inside RAWG's free-tier commercial
> boundary. Engineering has deliberately not made this call. Nothing in D3.25 is
> blocked by it — the sprint ships with RAWG off.

## 5. Artwork and the no-hotlink rule

All raster artwork from every provider is downloaded once and stored in GMRLOG's
own object storage (`MEDIA_INGESTION.md`). Consequences that matter here:

- No provider CDN sees GMRLOG end-user traffic.
- Removing a provider's data is a bounded delete over `GameMedia.provider`.
- Availability of a game page does not depend on a third-party CDN.

**Exception:** `Game.trailerUrl` stores a third-party video URL (YouTube/Vimeo).
Video is not mirrored — re-hosting video carries a materially different licensing
profile than caching a cover image, and embedding via the original host is the
posture those platforms' terms are written for.

## 6. Takedown / purge runbook

See `CATALOG_OPERATIONS.md` §4. In short: `GameMedia` rows carry `provider` and
`sourceUrl`, and `Game.metadataProvider` carries per-row provenance, so a
provider-scoped purge is a single indexed query in both tables.
