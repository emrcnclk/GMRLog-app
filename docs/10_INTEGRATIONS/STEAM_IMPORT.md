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
| POST | `/integrations/steam/connect` | Body: `{ steamIdOrUrl }` — **self-reported, unverified.** See below. |
| POST | `/integrations/steam/disconnect` | Soft disconnect |
| GET | `/integrations/steam/status` | Connection + last sync |
| GET | `/integrations/steam/profile` | External profile projection |
| POST | `/auth/connect/steam/start`, `/callback` | OpenID 2.0, **verified**. Task 4.5, `steam-connect.controller.ts`. |

S1 `POST /integrations/steam/callbacks` remains provider-signature callback (not player SDK).  
S1 `POST /import-jobs` remains supported; D3.23 Steam import may create an `ImportJob` row for continuity.

## Verified vs. unverified (task 4.5a)

`POST /integrations/steam/connect` accepts any unclaimed SteamID64/vanity/profile URL with
**no proof of ownership** — it was the whole of D3.23, written before 4.5's OpenID flow existed.
`POST /auth/connect/steam/start` + `/callback` proves ownership via Steam's OpenID 2.0
`check_authentication`. Both write through the same `SteamConnectService.upsertConnection`, and
both remain live: the unverified endpoint has real consumers (frontend manual-entry fallback,
`scripts/release/smoke-d3-23-production-gate.mjs`) that don't go through a browser, so it wasn't
removed.

The distinction is durable in the data, not just in whether an `AccountLink(purpose: 'connect')`
row exists: `UserIntegration.metadata` carries `{ verified: boolean }`, surfaced as
`UserIntegrationResponse.verified`. Only `connectVerified` (OpenID-proven) ever writes `true`.

Because of this, an unverified self-report can never block the real owner from later connecting
via the verified flow: if the real owner authenticates via OpenID and finds their SteamID already
claimed by an unverified connection, that squatting connection is evicted (disconnected, same as
a normal disconnect — its imported data is not deleted) and the verified owner takes the slot. A
*verified* claim, by contrast, can never be displaced — only the real owner could ever produce a
passing `check_authentication` for that SteamID in the first place.

There is no path from unverified to verified other than passing `verifyAssertion` — `connect()`
never writes `verified: true`, so a squatted claim cannot be silently upgraded by anything short
of the real owner completing the OpenID round trip.
