# Integrations API (D3.23)

**Status:** Additive amendment to S1 §13 (import-jobs · account-links · integration callbacks)

## Additive player routes

| Method | Path |
|--------|------|
| POST | `/integrations` |
| GET | `/integrations` |
| DELETE | `/integrations/:id` |
| POST | `/integrations/:id/sync` |
| GET | `/integrations/history` |
| POST | `/integrations/import/csv` |
| GET | `/integrations/providers` |
| POST | `/integrations/steam/connect` |
| POST | `/integrations/steam/disconnect` |
| GET | `/integrations/steam/status` |
| GET | `/integrations/steam/profile` |

## S1 continuity

| S1 | D3.23 relationship |
|----|-------------------|
| `POST /import-jobs` | Still valid; Steam first import may create ImportJob |
| `GET /import-jobs/{id}` | Status alias for sync job when linked |
| `POST /import-jobs/{id}/resolve` | Resolves sync_conflicts / import items |
| `POST /account-links` | OAuth start (steam/discord) |
| `POST /integrations/steam/callbacks` | Provider callback (signature) |

## ActivityKind additives (timeline)

| Kind |
|------|
| `library_synced` |
| `achievement_synced` |
| `playtime_updated` |
| `integration_connected` |
| `integration_disconnected` |

(`library_import` already exists in S2 ActivityKind.)

## Notification kind strings (product-governed String)

`library_imported` · `sync_completed` · `sync_failed` · `achievement_synced` · `new_games_found` · `library_updated`
