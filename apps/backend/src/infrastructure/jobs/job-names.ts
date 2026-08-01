/** BullMQ job names — docs/06_BACKEND/BACKGROUND_JOBS.md · docs/10_INTEGRATIONS/SYNC_ENGINE.md */
export const JOB_MAINTENANCE_UPLOAD_CLEANUP = 'maintenance.upload.cleanup';
export const JOB_MAINTENANCE_NOTIFICATION_CLEANUP = 'maintenance.notification.cleanup';
export const JOB_MAINTENANCE_SESSION_CLEANUP = 'maintenance.session.cleanup';
export const JOB_FEED_FANOUT = 'feed.fanout';
export const JOB_MEDIA_IMAGE_PROCESS = 'media.image.process';
export const JOB_MEDIA_PURGE = 'media.purge';
export const JOB_SEARCH_INDEX_UPSERT = 'search.index.upsert';
export const JOB_SEARCH_INDEX_DELETE = 'search.index.delete';
export const JOB_INTEGRATION_SYNC_RUN = 'integration.sync.run';
export const JOB_INTEGRATION_IMPORT_RUN = 'integration.import.run';
export const JOB_INTEGRATION_RECONCILE_RUN = 'integration.reconcile.run';
export const JOB_INTEGRATION_CLEANUP_RUN = 'integration.cleanup.run';
export const JOB_INTEGRATION_RETRY_RUN = 'integration.retry.run';
export const JOB_EVENT_REMINDER = 'event.reminder';
/** D3.25 — docs/18_CATALOG/METADATA_QUEUES.md §2 */
export const JOB_GAME_METADATA_ENRICH = 'game.metadata.enrich';
export const JOB_GAME_METADATA_BACKFILL_SCAN = 'game.metadata.backfill.scan';
export const JOB_GAME_METADATA_REFRESH_SCAN = 'game.metadata.refresh.scan';
export const JOB_GAME_MEDIA_INGEST = 'game.media.ingest';
