# D3.11 Completion Report — Collections & Tier Lists Experience Foundation

**Status:** COMPLETE  
**Completed:** 2026-07-28  
**Scope:** Frontend only — collections CRUD · entries whole-board replace · tier lists CRUD · slots builder · game picker · optimistic updates.  
**Backend:** FEATURE FREEZE — not modified.  
**Not invented:** collaborative editing · voting · comments · reactions · templates · import/export · realtime · websocket · AI suggestions · incremental entry/slot endpoints.  
**D3.12 was not started.**

---

## Files created

### Shared boards (`features/boards/shared`)

| Path | Role |
| ---- | ---- |
| `board-model.ts` | List view · dirty · `mapBoardError` (409) · updatedAt |
| `game-picker.tsx` | `GET /search` → game hits · duplicate block |
| `delete-dialog.tsx` | Danger confirm wrapper |
| `visibility-selector.tsx` | Re-export content `VisibilitySelector` |
| `index.ts` | Barrel |

### Collections (`features/collections`)

| Path | Role |
| ---- | ---- |
| `hooks/collection-model.ts` | Editable entries · reorder · put payload · owner |
| `hooks/use-collections.ts` | List · detail · create · update · delete · replace entries |
| `components/collection-card.tsx` | Cover · title · description · count · visibility · updated |
| `components/collection-header.tsx` | Detail chrome |
| `components/collection-entry-card.tsx` | Entry row · edit controls |
| `components/collection-composer.tsx` | Create/edit forms |
| `components/empty-collections.tsx` | Empty + Create CTA |
| `components/collection-skeleton.tsx` | List/detail skeletons |
| `components/collection-error-state.tsx` | Offline-aware retry |
| `screens/*` | List · detail · entries editor · create · edit |
| `index.ts` | Barrel |

### Tier lists (`features/tier-lists`)

| Path | Role |
| ---- | ---- |
| `hooks/tier-list-model.ts` | S–F seed · drag/move · put payload · owner |
| `hooks/use-tier-lists.ts` | List · detail · create · update · delete · replace slots |
| `components/tier-list-card.tsx` | Title · visibility · counts · updated |
| `components/tier-list-header.tsx` | Detail chrome |
| `components/tier-row.tsx` | Tier row · drop target · `TierGameChip` |
| `components/tier-builder.tsx` | Board editor · picker · save |
| `components/tier-composer.tsx` | Create/edit forms |
| `components/empty-tier-lists.tsx` | Empty + Create CTA |
| `components/tier-skeleton.tsx` | List/detail skeletons |
| `components/tier-error-state.tsx` | Offline-aware retry |
| `screens/*` | List · detail · builder · create · edit |
| `index.ts` | Barrel |

### Routes

| Path | Role |
| ---- | ---- |
| `app/(app)/collections/index.tsx` | Collections list |
| `app/(app)/collections/create.tsx` | Create **modal** |
| `app/(app)/collection/[id]/index.tsx` | Detail |
| `app/(app)/collection/[id]/edit.tsx` | Edit **modal** |
| `app/(app)/collection/[id]/entries.tsx` | Entries editor **modal** |
| `app/(app)/tier-lists/index.tsx` | Tier lists list |
| `app/(app)/tier-lists/create.tsx` | Create **modal** |
| `app/(app)/tier-list/[id]/index.tsx` | Detail |
| `app/(app)/tier-list/[id]/edit.tsx` | Edit **modal** |
| `app/(app)/tier-list/[id]/builder.tsx` | Builder **modal** |

### Tests

| Path | Coverage |
| ---- | -------- |
| `collections/hooks/collection-model.spec.ts` | List · owner · reorder · duplicate · put |
| `collections/hooks/collection-query.spec.ts` | Keys · optimistic edit/entries · invalidate |
| `collections/collection-screen.spec.ts` | Loading · empty · ready |
| `collections/collection-navigation.spec.ts` | List ↔ detail ↔ edit ↔ entries |
| `tier-lists/hooks/tier-list-model.spec.ts` | S–F seed · drag · duplicate · put |
| `tier-lists/hooks/tier-list-query.spec.ts` | Keys · optimistic slots · invalidate |
| `tier-lists/tier-list-screen.spec.ts` | Loading · empty · ready |
| `tier-lists/tier-list-navigation.spec.ts` | List ↔ detail ↔ builder ↔ edit |

### Docs

| Path | Role |
| ---- | ---- |
| `docs/05_FRONTEND/D3_11_COMPLETION_REPORT.md` | This report |

## Files updated

| Path | Change |
| ---- | ------ |
| `src/api/axios-client.ts` | Collection + tier CRUD · `PUT` entries/slots |
| `src/query/query-client.ts` | `collections.detail` · `tierLists.detail` |
| `app/(app)/_layout.tsx` | Modals for create/edit/entries/builder |
| `features/profile/hooks/use-collections.ts` | Re-export feature hook (same keys) |
| `features/profile/hooks/use-tier-lists.ts` | Re-export feature hook |
| `features/profile/components/*-card.tsx` · empty | Re-export feature components |
| `features/profile/profile-screen.tsx` | Create CTAs for empty tabs |

---

## Reusable components

| Component | Responsibility |
| --------- | -------------- |
| `GamePicker` | Search catalog games · exclude duplicates |
| `VisibilitySelector` | Shared visibility control |
| `DeleteDialog` | Danger delete confirm |
| `CollectionCard` / `TierListCard` | Memoized list rows |
| `CollectionComposer` / `TierComposer` | Create/edit + unsaved discard |
| `TierBuilder` / `TierRow` / `TierGameChip` | Local board DnD before PUT |
| Skeletons / empties / error states | Loading · empty · offline/retry/409 |

---

## Collections architecture

- **List:** `GET /collections` (array) — FlatList · pull-to-refresh.
- **Detail:** `GET /collections/{id}` — entries embedded (no separate `GET .../entries` in S1/backend).
- **Create / Edit:** `POST` / `PATCH` with `@gmrlog/validators` schemas.
- **Entries:** local reorder/add/remove → single `PUT /collections/{id}/entries` whole-board replace.
- **Delete:** `DELETE /collections/{id}` · optimistic list removal · confirm dialog.
- **Owner-only** edit/delete/entries via `collection.owner.id`.

### Endpoints used (collections)

| Method | Path |
| ------ | ---- |
| GET | `/collections` |
| POST | `/collections` |
| GET | `/collections/{id}` |
| PATCH | `/collections/{id}` |
| DELETE | `/collections/{id}` |
| PUT | `/collections/{id}/entries` |

---

## Tier list architecture

- **List:** `GET /tier-lists` (array).
- **Detail:** `GET /tier-lists/{id}` — slots embedded.
- **Create / Edit:** `POST` / `PATCH`.
- **Builder:** local S–F board (seeded when slots empty; otherwise **backend order preserved**) → `PUT /tier-lists/{id}/slots`.
- **Empty rows allowed**; duplicate games blocked client-side and via 409 mapping.
- **Owner-only** builder/edit/delete.

### Endpoints used (tier lists)

| Method | Path |
| ------ | ---- |
| GET | `/tier-lists` |
| POST | `/tier-lists` |
| GET | `/tier-lists/{id}` |
| PATCH | `/tier-lists/{id}` |
| DELETE | `/tier-lists/{id}` |
| PUT | `/tier-lists/{id}/slots` |

---

## Optimistic update flow

1. **Collection edit / entries replace / delete:** cancel → snapshot → patch cache → rollback on error → invalidate list (+ set detail on success).
2. **Tier edit / slots replace / delete:** same pattern on `tierLists.detail` + `tierLists.list`.
3. Profile tabs share the same query keys — stay coherent without extra wiring.

---

## Drag & drop implementation

- **No new DnD package** — uses select/long-press chip + drop-on-row (a11y-friendly).
- Within-tier: Left / Right reorder.
- Cross-tier: selected chip → tap target row (`moveGameOnBoard`).
- Persist only via whole-board `PUT .../slots` (no incremental slot APIs).
- Board rows memoized; chip selection avoids full unnecessary remount patterns where possible.

---

## Loading states

- Skeletons for lists and details (no spinner-only screens).
- Empty: Create CTA (+ Discover on profile).
- Errors: offline · retry · permission · **409 duplicate**.

---

## Verification

| Check | Result |
| ----- | ------ |
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS (frontend **208** tests) |
| `pnpm format:check` | PASS |

---

D3.11 Collections & Tier Lists Experience Foundation is COMPLETE.

D3.12 was not started.
