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
}
