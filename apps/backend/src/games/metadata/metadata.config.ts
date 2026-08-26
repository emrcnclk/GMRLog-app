/**
 * Catalog metadata configuration (D3.25).
 * Read from the boot-validated env so `backendEnvSchema` stays the SSOT, with
 * literal fallbacks so unit tests need no environment at all.
 */

export interface MetadataConfig {
  minConfidence: number;
  completeConfidence: number;
  maxAttempts: number;
  backfillBatchSize: number;
  refreshBatchSize: number;
  refreshIntervalDays: number;
  metadataConcurrency: number;
  mediaConcurrency: number;
  mediaTimeoutMs: number;
  mediaMaxBytes: number;
  maxScreenshots: number;
  maxArtworks: number;
  /**
   * D11.3 — the earliest release year the catalog mirror walks, as a year.
   *
   * IGDB carries releases back to the 1950s, and the long tail before 1990 is
   * arcade and home-computer entries almost nobody logs, each of which still
   * costs a row, a search document and a cover download. 1990 is a product
   * decision, not a technical limit: it is where the catalogue starts being
   * the one players actually have a history with.
   *
   * Set `CATALOG_RELEASE_FLOOR_YEAR=0` to walk everything IGDB has.
   */
  catalogReleaseFloorYear: number;
}

export const DEFAULT_METADATA_CONFIG: MetadataConfig = {
  minConfidence: 0.55,
  completeConfidence: 0.8,
  maxAttempts: 5,
  backfillBatchSize: 200,
  refreshBatchSize: 500,
  refreshIntervalDays: 30,
  metadataConcurrency: 2,
  mediaConcurrency: 4,
  mediaTimeoutMs: 15_000,
  mediaMaxBytes: 8 * 1024 * 1024,
  maxScreenshots: 12,
  maxArtworks: 4,
  catalogReleaseFloorYear: 1990,
};

function year(raw: string | undefined, fallback: number): number {
  if (raw === undefined) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function num(raw: string | undefined, fallback: number): number {
  if (raw === undefined) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadMetadataConfig(
  source: Record<string, string | undefined> = process.env,
): MetadataConfig {
  const d = DEFAULT_METADATA_CONFIG;
  return {
    minConfidence: num(source.METADATA_MIN_CONFIDENCE, d.minConfidence),
    completeConfidence: num(source.METADATA_COMPLETE_CONFIDENCE, d.completeConfidence),
    maxAttempts: num(source.METADATA_MAX_ATTEMPTS, d.maxAttempts),
    backfillBatchSize: num(source.METADATA_BACKFILL_BATCH_SIZE, d.backfillBatchSize),
    refreshBatchSize: num(source.METADATA_REFRESH_BATCH_SIZE, d.refreshBatchSize),
    refreshIntervalDays: num(source.METADATA_REFRESH_INTERVAL_DAYS, d.refreshIntervalDays),
    metadataConcurrency: num(source.GAME_METADATA_WORKER_CONCURRENCY, d.metadataConcurrency),
    mediaConcurrency: num(source.GAME_MEDIA_WORKER_CONCURRENCY, d.mediaConcurrency),
    mediaTimeoutMs: num(source.MEDIA_INGEST_TIMEOUT_MS, d.mediaTimeoutMs),
    mediaMaxBytes: num(source.MEDIA_INGEST_MAX_BYTES, d.mediaMaxBytes),
    maxScreenshots: num(source.MEDIA_INGEST_MAX_SCREENSHOTS, d.maxScreenshots),
    maxArtworks: num(source.MEDIA_INGEST_MAX_ARTWORKS, d.maxArtworks),
    // `num` refuses zero, and zero is this value's documented "walk
    // everything" setting, so it gets its own parse rather than sharing one.
    catalogReleaseFloorYear: year(source.CATALOG_RELEASE_FLOOR_YEAR, d.catalogReleaseFloorYear),
  };
}

export const METADATA_CONFIG = Symbol('METADATA_CONFIG');
