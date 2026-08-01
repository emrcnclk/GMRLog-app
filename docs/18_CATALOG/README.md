# 18 — Game Catalog & Metadata

Authority for the **game catalog domain**: how a `Game` row becomes a complete
object rather than `title` + `slug`.

Introduced by **Sprint D3.25 — Game Metadata & Catalog Foundation**.

| Document | Scope |
|---|---|
| [D3_25_IMPLEMENTATION_PLAN.md](D3_25_IMPLEMENTATION_PLAN.md) | Sprint plan, work breakdown, exit criteria, production gate |
| [GAME_METADATA_ARCHITECTURE.md](GAME_METADATA_ARCHITECTURE.md) | Domain model, data flow, schema, invariants |
| [METADATA_PROVIDERS.md](METADATA_PROVIDERS.md) | Provider abstraction, IGDB / Steam Store / RAWG, merge precedence |
| [METADATA_LICENSING.md](METADATA_LICENSING.md) | Licensing + attribution posture per provider; RAWG activation gate |
| [METADATA_QUEUES.md](METADATA_QUEUES.md) | BullMQ topology, backfill, refresh scheduler, failure handling |
| [MEDIA_INGESTION.md](MEDIA_INGESTION.md) | Cover / hero / screenshot mirroring into object storage |
| [CATALOG_OPERATIONS.md](CATALOG_OPERATIONS.md) | Runbook: coverage checks, forced refresh, incident response |

## Doc discipline

Per `SPRINT_0_PROJECT_AUDIT.md` §1, these documents describe **what exists**.
Anything not yet built is confined to an explicitly labelled `PLANNED` section
and is never written in the present tense.

## Related

- `docs/09_DISCOVERY/SIMILARITY_ENGINE.md` — primary consumer of catalog metadata
- `docs/10_INTEGRATIONS/SYNC_ENGINE.md` — creates skeleton games that this domain enriches
- `docs/06_BACKEND/BACKGROUND_JOBS.md` — queue registry
- `docs/08_API/GAME_API.yaml` — HTTP contract
