# Changelog

All notable changes to GMRLOG are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-rc.1] — 2026-07-28

### Added

- Frontend Release Candidate lock (D3.17) with full release documentation under `docs/06_RELEASE/`.
- Production hardening audits from D3.16 (navigation · deep links · rollback · dead-code cleanup).
- Offline persistence & release engineering from D3.15.
- Feature surface from D3.1–D3.14: auth · home · discover · search · notifications · profile · library · content · communities · collections · tier lists · events · messaging · uploads · settings · motion/UI polish.

### Changed

- App / package version set to `1.0.0-rc.1`.
- Design system and UX frozen for RC (no new product surfaces).
- Repository Prettier formatting normalized for `format:check` gate (no behavior change).

### Known limitations

- Backend FEATURE FREEZE (S1/S2 only).
- Store icon/splash brand assets pending.
- FlashList dependency unused; FlatList remains primary.
- Monitoring / analytics providers not enabled.
- Placeholder routes: `user/[id]`, modal shell, some detail placeholders.

### Security

- Session tokens in SecureStore.
- No API secrets in public Expo env.

## [Unreleased]

### Added

- **D3.27 — Game Hub & Premium Profile Experience.** Frontend-only sprint that
  turns the two identity surfaces from CRUD screens into the product
  (`docs/05_FRONTEND/D3_27_COMPLETION_REPORT.md`):
  - **Root cause fixed:** D3.25's enriched `GET /games/:id`, `/media` and
    `/similar` reads — and `GET /me/statistics/history` — existed on the backend
    but were absent from `apps/frontend/src/api/axios-client.ts`. The Game Hub
    had no access to artwork, ratings, genres or studios, which is why it
    rendered as a stack of buttons.
  - **Game Hub:** hero artwork with scrim and cover, full catalog identity block,
    and in-place tabs (Overview · Reviews · Activity · Screenshots · Videos ·
    Collections · Recommendations) over a single virtualized list. The
    `game/[id]/*` sub-routes are retained, so D3.16 deep links still resolve.
  - **Profile:** hero with derived level and rank, six headline statistics,
    Gaming Insights, GitHub-style activity heatmap, archetype cards with
    strengths/weaknesses, grouped achievement showcase, and Steam-style library
    shelves in grid and list modes.
  - **Design system:** ten new primitives built once in `@gmrlog/ui`
    (`AspectBox`, `GradientScrim`, `SegmentedTabs`, `StatTile`, `ProgressBar`,
    `RarityBadge`, `ActivityHeatmap`, `Rail`, `DistributionBars`, `FadeInView`).
    The duplicated profile/game-hub tab strips now share one implementation.
  - **Tokens:** new `color.accent.*` / `color.rarity.*` / `color.scrim.*`
    families. An accent remaps `color.accent.*` and nothing else — asserted by
    `packages/ui/src/theme/accent.spec.ts` across all accents and both schemes —
    so accent choice can never degrade contrast elsewhere.
  - **Customization** (accent · card style · banner · favourite platform ·
    console generation · widget order · pinned/hidden widgets) persists
    device-locally; `docs/07_SOCIAL/PROFILE_CUSTOMIZATION.md` documents the
    server contract needed to sync it.
  - 91 new tests across six spec files; no backend or schema change.

- **D3.25 — Game Metadata & Catalog Foundation.** Every catalog `Game` is now
  a complete object instead of `title` + `slug`
  (`docs/18_CATALOG/D3_25_COMPLETION_REPORT.md`):
  - IGDB (primary) and Steam Store (fallback) metadata providers, plus RAWG
    implemented but disabled by default pending a licensing decision
    (`docs/18_CATALOG/METADATA_LICENSING.md`).
  - `game.metadata` / `game.media` BullMQ queues, hourly backfill scan, daily
    refresh scan — no HTTP request path ever blocks on a provider call.
  - Media ingestion mirrors provider artwork into object storage; nothing is
    hotlinked.
  - New reads: `GET /games/:id/media`, `GET /games/:id/similar`,
    `GET /games/:id/metadata`.
  - The similarity and recommendation engines now consume real tags,
    companies, and series data where the catalog has been enriched, falling
    back to their original proxies elsewhere.
  - The hardcoded `null` cover in `discover/mappers/game-card.mapper.ts`
    (audit finding C3) is deleted; discovery cards resolve real artwork.
  - Additive Prisma migration `20260731090000_d3_25_game_metadata_catalog`.

### Fixed

- A DI wiring bug found via live D3.25 smoke testing: `GameMetadataPublisher`
  declared its `JobsService` dependency as `@Optional() jobs: JobsService | null`,
  which TypeScript's decorator metadata erases to `Object`, causing Nest to
  silently inject `null` even though `JobsService` was always available.
  Fixed with an explicit `@Inject(JobsService)` token. Regression test:
  `apps/backend/src/games/metadata/metadata.module.spec.ts`.

### Planned

- Final store assets and EAS project identity.
- Device lab performance numbers.
- Backend unfreeze for documented upload/privacy gaps.
- D3.26+: game-native posts, feed game-signal wiring, community↔game link,
  user profile and review detail screens (audit Sprint 3).
- Backend gaps surfaced by D3.27, each currently omitted from the UI rather than
  faked (`docs/05_FRONTEND/D3_27_COMPLETION_REPORT.md` → Honest gaps):
  `User.country`; a per-rating `ratingDistribution` (or `GET /users/{id}/reviews`)
  for the profile review histogram; `quote` / `repost` members on the closed
  `ActivityKind` vocabulary; `blurhash` on `GameMediaResponse`;
  `GET`/`PATCH /me/profile-theme` to sync profile customization across devices.
