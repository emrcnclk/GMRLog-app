# GMRLOG Documentation Index

**Version:** 1.0.0  
**Status:** Documentation Freeze v1  
**Last Updated:** 2026-07-10

Single navigation index for all `/docs` content. Documentation is the **single source of truth** — implementation must not contradict these specs.

---

## Coverage Summary

| Discipline | Folder | Docs | Status |
|------------|--------|------|--------|
| Project | `00_PROJECT/` | 15 | ✅ Complete |
| Product | `01_PRODUCT/` | 10 | ✅ Complete |
| Design | `02_DESIGN/` | 8 | ✅ Complete |
| UX | `03_UX/` | 5 | ✅ Complete |
| Components | `04_COMPONENTS/` | 1 | ✅ Index → `02_DESIGN/` |
| Frontend | `05_FRONTEND/` | 4 | ✅ Complete |
| Backend | `06_BACKEND/` | 14 | ✅ Complete |
| Database | `07_DATABASE/` | 5 | ✅ Complete |
| API | `08_API/` | 5 MD + 13 YAML + bundle | ✅ Complete |
| AI | `09_AI/` | 4 | ✅ Complete |
| DevOps | `10_DEVOPS/` | 13 | ✅ Complete |
| Security | `11_SECURITY/` | 3 | ✅ Complete |
| Testing | `12_TESTING/` | 2 | ✅ Complete |
| Analytics | `13_ANALYTICS/` | 4 | ✅ Complete |
| Monetization | `14_MONETIZATION/` | 1 | ✅ Complete |
| Admin | `15_ADMIN/` | 1 | ✅ Complete |
| Cursor | `16_CURSOR/` | 1 | ✅ Complete |
| Catalog | `18_CATALOG/` | 8 | ✅ Complete (D3.25) |

**Total markdown documents:** 90 as of Documentation Freeze v1.0. This table
has not been re-counted per sprint since; treat the per-folder counts above as
stale for any folder that has shipped a sprint since 2026-07-10 (visible from
its own `D3_*` docs), and `18_CATALOG/` as the first folder added after the
freeze.
**OpenAPI modules:** 15/15 validate as of D3.25 (module count unchanged by
D3.25 — only `GAME_API.yaml`'s content changed, additively). See
`docs/08_API/OPENAPI_CHANGE_CONTROL_D3_25.md`.

---

## Validate OpenAPI

```bash
python docs/08_API/bundle_openapi.py
```

Generates `openapi/bundle.yaml` and [DOCUMENTATION_FREEZE_REPORT.md](08_API/DOCUMENTATION_FREEZE_REPORT.md).

---

## Related Documents

- [README.md](../README.md)
- [API_ARCHITECTURE.md](08_API/API_ARCHITECTURE.md)
- [SYSTEM_DESIGN.md](06_BACKEND/SYSTEM_DESIGN.md)
- [18_CATALOG/README.md](18_CATALOG/README.md) — D3.25 game metadata & catalog domain

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-07-10 | Documentation Freeze v1 — full index |
| 1.0.0 (addendum) | 2026-07-31 | D3.25 — added `18_CATALOG/` (8 docs); see `docs/18_CATALOG/D3_25_COMPLETION_REPORT.md` |
