# Sync Engine (D3.23)

**Status:** LOCKED — deterministic, no AI

## Sync types — `IntegrationSyncType`

| Member |
|--------|
| `manual` |
| `daily` |
| `weekly` |
| `monthly` |
| `automatic` |

## Per sync effects

1. New games → library (`source=steam_import`) via external mapping
2. Updated playtime → library metadata / GameLog sessions proxy
3. Removed games → soft hide or conflict (never silent delete of manual)
4. Achievements → external_achievements → internal progress
5. Statistics · DiscoveryScore · Recommendations recompute hooks
6. Timeline activity kinds (see TIMELINE section in API.md)

## BullMQ queues

| Queue | Jobs |
|-------|------|
| `integration.sync` | Periodic / manual sync |
| `integration.import` | First import · CSV import |
| `integration.reconcile` | Conflict batch resolve |
| `integration.cleanup` | Stale job / token cleanup |
| `integration.retry` | Dead-letter retry |

Retry: exponential backoff · max attempts · dead letter after exhaustion.
