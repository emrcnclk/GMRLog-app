# Integrations Domain (`docs/10_INTEGRATIONS`)

**Status:** COMPLETE · **Production Ready** — D3.23 Platform Integrations & Library Sync  
**Authority chain:** S1/S2 → this folder → `docs/08_API/*`  
**Mode:** Deterministic only — **no AI**

## Purpose

Move GMRLOG from manual library entry to connected platforms:

Steam (and later Xbox / PSN / Epic / Nintendo / CSV) → library · playtime · achievements → timeline · discovery · statistics.

## Documents

| Doc | Role |
|-----|------|
| `D3_23_COMPLETION_REPORT.md` | Sprint delivery + verification |
| `SMOKE_RESULTS.md` | Production gate (6/6) transcript |
| `STEAM_IMPORT.md` | Connect · first import · profile |
| `SYNC_ENGINE.md` | Sync types · BullMQ · reconcile |
| `CONFLICT_RESOLUTION.md` | Keep local / Steam / newest / ask |
| `CSV_IMPORT.md` | SteamDB · Backloggd · generic wizard |
| `SYNC_HISTORY.md` | History projection for players |
| `API.md` | Additive `/integrations/*` + S1 `import-jobs` mapping |

## Explicit non-goals (D3.23)

Realtime Steam WebSocket · AI · Premium · Marketplace · Voice · Desktop · Discord Rich Presence · Twitch

## Next

D3.24 — Social Feed, Communities & Events (`docs/07_SOCIAL/D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md`)
