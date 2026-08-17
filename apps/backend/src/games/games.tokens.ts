export const GAME_REPOSITORY = Symbol('GAME_REPOSITORY');
export const GAME_LIBRARY_ENTRY_REPOSITORY = Symbol('GAME_LIBRARY_ENTRY_REPOSITORY');
/** D3.25 — docs/18_CATALOG/GAME_METADATA_ARCHITECTURE.md */
export const GAME_METADATA_REPOSITORY = Symbol('GAME_METADATA_REPOSITORY');
/**
 * D11.1 — the single `IgdbMetadataProvider` instance, shared between the
 * per-game enrich provider chain (`GAME_METADATA_PROVIDERS`) and
 * `GameCatalogSyncService`'s bulk mirror. One instance means one
 * `TokenBucketRateLimiter` and one cached Twitch token — two instances would
 * each independently enforce 4 req/sec against the same IGDB app credentials,
 * summing above the real limit whenever both run at once.
 */
export const IGDB_METADATA_PROVIDER = Symbol('IGDB_METADATA_PROVIDER');
