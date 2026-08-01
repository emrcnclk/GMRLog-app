# OpenAPI Layout

GMRLOG OpenAPI specs live under `docs/08_API/`. This folder documents the target layout (Architecture Freeze v1).

```
docs/08_API/
├── common/
│   ├── schemas/           # Shared entity & pagination schemas
│   ├── parameters.yaml
│   ├── responses.yaml
│   ├── headers.yaml
│   └── security.yaml
├── AUTH_API.yaml
├── USER_API.yaml
├── SOCIAL_API.yaml
├── NOTIFICATION_API.yaml
├── REVIEW_API.yaml
├── GAME_API.yaml
├── GAME_LOG_API.yaml
├── COLLECTION_API.yaml
├── LIST_API.yaml
├── TIERLIST_API.yaml
├── SEARCH_API.yaml
├── COMMUNICATION_API.yaml
├── POSTS_API.yaml
├── AI_API.yaml            # Spec-only / Phase 2+ — no Nest AI controller in Backend MVP
├── ADMIN_API.yaml
├── openapi/
│   ├── bundle.yaml        # Frozen runtime /docs/spec source
│   └── README.md
└── API_ARCHITECTURE.md
```

Each feature file references `common/` components. See `API_ARCHITECTURE.md` for domain boundaries.

**SSOT:** Frozen YAML under `docs/08_API/*.yaml` → `openapi/bundle.yaml`. Nest `@Api*` decorators are metadata-only; runtime Swagger UI serves the frozen bundle (`paths: {}` from decorators).

**Explicitly deferred OpenAPI register (Post-MVP):** public `/health*`, selected Admin shell routes, appeals surfaces, and historical SOCIAL feed discover/trending stubs — see [`POST_MVP_PRODUCTION_BACKLOG.md`](../00_PROJECT/POST_MVP_PRODUCTION_BACKLOG.md).

## Validate

```bash
python docs/08_API/bundle_openapi.py
```

Output: `openapi/bundle.yaml`
