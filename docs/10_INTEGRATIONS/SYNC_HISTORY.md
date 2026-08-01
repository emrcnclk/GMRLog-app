# Sync History (D3.23)

**Status:** LOCKED  
**Table:** `sync_history`

## Player-visible fields

| Field | Meaning |
|-------|---------|
| `startedAt` / `finishedAt` | Wall clock |
| `durationMs` | Computed |
| `importedCount` | New library rows |
| `updatedCount` | Playtime/status updates |
| `skippedCount` | Unmapped / skipped |
| `failedCount` | Hard failures |
| `warningCount` | Soft warnings |
| `status` | mirrors job terminal state |
| `syncType` | `IntegrationSyncType` |

API: `GET /integrations/history`
