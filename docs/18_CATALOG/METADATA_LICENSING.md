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

| Provider | Default state | Env gate | Attribution surfaced | Artwork |
|---|---|---|---|---|
| IGDB (Twitch) | **Enabled when credentialed** | `IGDB_CLIENT_ID` + `IGDB_CLIENT_SECRET` | `metadata_provider = 'igdb'` per game; attribution string in `GET /games/:id/metadata` | Referenced (§5) |
| Steam Store | **Enabled when credentialed** | `STEAM_STORE_METADATA_ENABLED` | `metadata_provider = 'steam'` per game | Referenced (§5) |
| RAWG | **DISABLED** | `RAWG_ENABLED` + `RAWG_API_KEY` | wired, unused while disabled | Referenced when enabled (§5) |

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
- Steam header/capsule artwork is referenced by its CDN URL since 2026-09, so player
  devices do request it from Valve's CDN — see §5 for what that implies.

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

## 5. Artwork: referenced, not mirrored (reversed 2026-09)

**Current rule.** Catalog images — covers, banners, artworks, screenshots — are stored
as the provider's own image URL and served from the provider's CDN. Nothing is
downloaded. `resolveMediaUrl` passes an allowlisted provider URL (`images.igdb.com`,
`*.steamstatic.com`, `steamcdn-a.akamaihd.net`, `media.rawg.io`) through untouched and
treats anything else as a storage key; IGDB's other sizes come from swapping the size
token, so there is no image processing either. Player uploads are unaffected and still
live in GMRLOG's own object storage.

**Why it changed.** This section used to require that all artwork be downloaded once
and served from GMRLOG's storage. Measured against the real catalog that meant ~35 GB
for ~229k games and hours of worker time per environment, most of it art for games
nobody will open. The product owner chose references, as most catalog sites do.

**What that gives up — each of these was a reason for the old rule:**

- **Provider CDNs now see end-user traffic.** A player's browser requests every image
  directly from IGDB (Twitch) or Valve, so those companies receive the player's IP
  address and user agent. Under KVKK and GDPR they are recipients of personal data, and
  the Privacy Policy and the KVKK disclosure notice must name them before launch.
  **Open, tracked in TASKS.md** — the legal texts are being finalised for production and
  this has to be part of that pass, not after it.
- **A game page depends on a third-party CDN being up.** If IGDB's image host is down,
  images do not load; the pages still render, falling back to their placeholder surface.
- **Removing a provider's data is still bounded** — a delete over `GameMedia.provider`
  and a reset of `Game.coverKey`/`heroKey` where they hold that provider's URLs — but
  there is no longer a stored copy to remove.

Media downloaded before the switch still works: its rows keep their storage keys, and
the link pass never overwrites an existing row.

**Exception, unchanged:** `Game.trailerUrl` stores a third-party video URL
(YouTube/Vimeo) and embeds it via the original host.

## 6. Takedown / purge runbook

See `CATALOG_OPERATIONS.md` §4. In short: `GameMedia` rows carry `provider` and
`sourceUrl`, and `Game.metadataProvider` carries per-row provenance, so a
provider-scoped purge is a single indexed query in both tables.
