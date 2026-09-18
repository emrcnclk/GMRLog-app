import type { GameMediaKind, MetadataProvider } from '@gmrlog/database';

/** Job payload shapes for the catalog queues (D3.25). */

export type MetadataEnrichReason = 'created' | 'backfill' | 'refresh' | 'manual';

export interface GameMetadataEnrichJobData {
  gameId: string;
  reason: MetadataEnrichReason;
  /** Identity hints known at enqueue time — e.g. the appid a Steam sync observed. */
  steamAppId?: number | null;
  igdbId?: number | null;
}

export interface GameMediaIngestJobData {
  gameId: string;
  kind: GameMediaKind;
  sourceUrl: string;
  provider: MetadataProvider;
  sortOrder: number;
  width: number | null;
  height: number | null;
  /** Promote to `games.cover_key` / `games.hero_key` once stored. */
  promote: boolean;
  /**
   * Re-ingest even though a `game_media` row for this (game, kind, source)
   * already exists — the repair path, for when the row survived and the
   * object behind it did not (a storage migration, a lost bucket).
   *
   * Safe to re-run by construction: `buildMediaKeyPrefix` is a digest of the
   * source URL, so a forced re-ingest writes the exact keys the row already
   * points at, and `upsertMedia` rewrites the row with the same values. No
   * row is deleted to make the repair possible.
   */
  force?: boolean;
}

/** D11.1 — one page-bounded run of the IGDB catalog mirror. */
export interface GameCatalogSyncJobData {
  /** How many IGDB pages (up to 500 rows each) this run may fetch. */
  maxPages: number;
  pageSize?: number;
}
