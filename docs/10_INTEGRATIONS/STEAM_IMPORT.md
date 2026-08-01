# Integration Providers & Steam Connect (D3.23)

**Status:** LOCKED for D3.23  
**Owner:** Integrations

## Closed vocabulary — `IntegrationProvider`

| Member | Notes |
|--------|-------|
| `steam` | Primary D3.23 provider (live connect/import/sync) |
| `xbox` | Schema + dashboard stub (connect deferred) |
| `playstation` | Schema + dashboard stub |
| `epic` | Schema + dashboard stub |
| `nintendo` | Schema + dashboard stub |
| `csv` | File import provider (wizard) |

`ConnectedProvider` (S1 auth OAuth) remains `steam` · `discord`. Integration platform is a **separate** closed set owned by this folder.

## Steam identity inputs (connect)

Accepted and normalized to SteamID64:

- SteamID64
- Vanity URL / custom URL (`steamcommunity.com/id/...`)
- Profile URL (`steamcommunity.com/profiles/...`)

## Steam API surface (player)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/integrations/steam/connect` | Body: `{ steamIdOrUrl }` |
| POST | `/integrations/steam/disconnect` | Soft disconnect |
| GET | `/integrations/steam/status` | Connection + last sync |
| GET | `/integrations/steam/profile` | External profile projection |

S1 `POST /integrations/steam/callbacks` remains provider-signature callback (not player SDK).  
S1 `POST /import-jobs` remains supported; D3.23 Steam import may create an `ImportJob` row for continuity.
