/**
 * Query persistence cache versioning (D3.15).
 * Bump `QUERY_CACHE_BUSTER` after schema / DTO shape changes that invalidate cached payloads.
 * Never invent new DTO fields — only invalidate when existing shapes change.
 */

/** PersistQueryClient `buster` — mismatch clears persisted cache safely. */
export const QUERY_CACHE_BUSTER = 'd3.15.0';

/** AsyncStorage key for the dehydrated query client. */
export const QUERY_CACHE_STORAGE_KEY = 'gmrlog.query-cache.v1';

/** AsyncStorage key for the durable offline mutation queue. */
export const OFFLINE_MUTATION_QUEUE_KEY = 'gmrlog.offline-mutation-queue.v1';

/** Max age for persisted query cache (7 days). */
export const QUERY_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
