import { describe, expect, it } from 'vitest';

import { DEFAULT_METADATA_CONFIG, loadMetadataConfig } from './metadata.config';

describe('loadMetadataConfig', () => {
  it('falls back to the documented defaults with an empty environment', () => {
    expect(loadMetadataConfig({})).toEqual(DEFAULT_METADATA_CONFIG);
  });

  it('reads every configured value from the environment', () => {
    const config = loadMetadataConfig({
      METADATA_MIN_CONFIDENCE: '0.4',
      METADATA_COMPLETE_CONFIDENCE: '0.9',
      METADATA_MAX_ATTEMPTS: '3',
      METADATA_BACKFILL_BATCH_SIZE: '50',
      METADATA_REFRESH_BATCH_SIZE: '100',
      METADATA_REFRESH_INTERVAL_DAYS: '14',
      GAME_METADATA_WORKER_CONCURRENCY: '1',
      GAME_MEDIA_WORKER_CONCURRENCY: '8',
      MEDIA_INGEST_TIMEOUT_MS: '5000',
      MEDIA_INGEST_MAX_BYTES: '1048576',
      MEDIA_INGEST_MAX_SCREENSHOTS: '4',
      MEDIA_INGEST_MAX_ARTWORKS: '2',
    });

    expect(config).toEqual({
      minConfidence: 0.4,
      completeConfidence: 0.9,
      maxAttempts: 3,
      backfillBatchSize: 50,
      refreshBatchSize: 100,
      refreshIntervalDays: 14,
      metadataConcurrency: 1,
      mediaConcurrency: 8,
      mediaTimeoutMs: 5000,
      mediaMaxBytes: 1_048_576,
      maxScreenshots: 4,
      maxArtworks: 2,
    });
  });

  it('falls back per-key on an unparseable value rather than throwing', () => {
    const config = loadMetadataConfig({ METADATA_MAX_ATTEMPTS: 'not-a-number' });
    expect(config.maxAttempts).toBe(DEFAULT_METADATA_CONFIG.maxAttempts);
  });

  it('falls back on a zero or negative value — every setting must stay positive', () => {
    const config = loadMetadataConfig({ GAME_METADATA_WORKER_CONCURRENCY: '0' });
    expect(config.metadataConcurrency).toBe(DEFAULT_METADATA_CONFIG.metadataConcurrency);
  });
});
