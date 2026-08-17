/** BullMQ queue names — docs/06_BACKEND/BACKGROUND_JOBS.md · docs/10_INTEGRATIONS/SYNC_ENGINE.md */
export const QUEUE_MAINTENANCE = 'maintenance';
export const QUEUE_MEDIA = 'media';
export const QUEUE_SEARCH_INDEX = 'search-index';
export const QUEUE_NOTIFICATIONS = 'notifications';
export const QUEUE_INTEGRATION_SYNC = 'integration.sync';
export const QUEUE_INTEGRATION_IMPORT = 'integration.import';
export const QUEUE_INTEGRATION_RECONCILE = 'integration.reconcile';
export const QUEUE_INTEGRATION_CLEANUP = 'integration.cleanup';
export const QUEUE_INTEGRATION_RETRY = 'integration.retry';
/** D3.25 — docs/18_CATALOG/METADATA_QUEUES.md */
export const QUEUE_GAME_METADATA = 'game.metadata';
export const QUEUE_GAME_MEDIA = 'game.media';
/**
 * D11.1 — deliberately separate from `QUEUE_GAME_METADATA`. A bulk IGDB
 * catalog mirror run is IGDB-rate-limited exactly like per-game enrich, so it
 * must never share that queue's concurrency budget: doing so would starve
 * live enrich traffic (10.6's isolation rule) behind a bulk backfill.
 */
export const QUEUE_GAME_CATALOG_SYNC = 'game.catalog-sync';
