# D3.12 Completion Report — Events & Upload Experience Foundation

**Status:** COMPLETE  
**Completed:** 2026-07-28  
**Scope:** Frontend only — events list/detail · Going/Leave participation · upload grant→PUT→confirm foundation · profile/community upload wiring.  
**Backend:** FEATURE FREEZE — not modified.  
**Not invented:** S3 client · storage implementation · image editing · compression · cropping · community `bannerUploadId` field · new endpoints.  
**D3.13 was not started.**

---

## Files created

### Events (`features/events`)

| Path | Role |
| ---- | ---- |
| `hooks/event-model.ts` | List view · going · format · optimistic join/leave · discover page patch |
| `hooks/use-events.ts` | `useEvents` · `useEvent` · `useJoinEvent` · `useLeaveEvent` |
| `components/event-card.tsx` | Title · kind · starts · Going badge · navigate |
| `components/event-header.tsx` | Detail chrome · ParticipationButton |
| `components/participation-button.tsx` | Going / Leave · optimistic |
| `components/event-skeleton.tsx` | List + detail skeletons · `EventSkeleton` alias |
| `components/empty-events.tsx` | Empty list |
| `components/event-error-state.tsx` | Offline-aware retry |
| `screens/events-screen.tsx` | `GET /discover/events` list · pull-to-refresh |
| `screens/event-detail-screen.tsx` | `GET /events/{id}` · participation |
| `index.ts` | Barrel |

### Uploads (`features/uploads`)

| Path | Role |
| ---- | ---- |
| `upload-manager.ts` | Grant → PUT `uploadUrl` → confirm · injectable put/read |
| `upload-types.ts` | Phases · MIME map · progress → phase |
| `hooks/use-upload.ts` | Pick image · progress · success · failure · retry |
| `components/upload-avatar-button.tsx` | Avatar + shared purpose button + banner button |
| `components/upload-progress-overlay.tsx` | Progress · retry · dismiss |
| `index.ts` | Barrel |

### Tests

| Path | Coverage |
| ---- | -------- |
| `events/hooks/event-model.spec.ts` | View · format · optimistic · page patch |
| `events/event-query.spec.ts` | Keys · optimistic join/leave · invalidate |
| `events/event-screen.spec.ts` | Loading · empty · ready · offline retry |
| `uploads/upload-manager.spec.ts` | Grant · put · confirm · put fail · retry |
| `profile/profile-upload-integration.spec.ts` | mePatch upload ids · invalidate `me` |
| `communities/community-upload-integration.spec.ts` | No invented banner field · invalidate community |

### Docs

| Path | Role |
| ---- | ---- |
| `docs/05_FRONTEND/D3_12_COMPLETION_REPORT.md` | This report |

## Files updated

| Path | Change |
| ---- | ------ |
| `src/api/axios-client.ts` | `getEvent` · `joinEvent` · `leaveEvent` · `createUploadGrant` · `confirmUpload` |
| `src/query/query-client.ts` | `events.detail(id)` |
| `app/(app)/event/[id].tsx` | Real `EventDetailScreen` (placeholder removed) |
| `features/discover/components/event-card.tsx` | Re-export events `EventCard` |
| `features/discover/components/discover-lists.tsx` | Event list → `/(app)/event/{id}` |
| `features/discover/discover-list-screens.tsx` | `DiscoverEventsScreen` → `EventsScreen` |
| `features/profile/components/edit-profile-modal.tsx` | `UploadAvatarButton` · `UploadBannerButton` · PATCH confirmed ids |
| `features/communities/components/community-composer.tsx` | `community_banner` upload (local confirmed id) |
| `apps/frontend/package.json` | `expo-image-picker` (already present for pick flow) |

---

## Endpoints used (only)

| Method | Path | Use |
| ------ | ---- | --- |
| `GET` | `/discover/events` | Events list |
| `GET` | `/events/{id}` | Event detail |
| `POST` | `/events/{id}/participation` | Going (`{}` body) |
| `DELETE` | `/events/{id}/participation` | Leave |
| `POST` | `/uploads/grants` | Short-lived grant |
| `POST` | `/uploads/confirmations` | Confirm → `UploadResponse` |

---

## Events UX

- List: loading skeletons · empty · error + offline retry · pull-to-refresh · infinite cursor
- Detail: header · schedule/kind · Going / Leave
- `viewerParticipation` drives badge + button state
- Optimistic join/leave patches detail + discover infinite pages; rollback on error
- Invalidate only `events.detail` + `discover.events`

---

## Upload foundation

Flow: **select image → grant → PUT `uploadUrl` (grant headers) → confirm → `UploadResponse`**.

Supported purposes via `UploadPurpose` / validators enum:

- `avatar`
- `banner`
- `community_banner`
- `post_media`

(`message_media` allowed by types/API client; UI buttons cover profile/community surfaces.)

No S3 SDK · no storage · no crop/compress/edit.

State: progress phases · success · failure · retry (same asset).

---

## Profile / community wiring

| Surface | Behavior |
| ------- | -------- |
| Edit Profile · Avatar | Confirm upload → `PATCH /me` `{ avatarUploadId }` · invalidate `me` |
| Edit Profile · Banner | Confirm upload → `PATCH /me` `{ bannerUploadId }` · invalidate `me` |
| Community create/edit · Banner | Confirm `community_banner` · hold id locally · invalidate community list/detail |

### Honesty (frozen backend)

1. **`PATCH /me` with avatar/banner upload ids** — backend users service still rejects referenced uploads (`Referenced upload is not a confirmed upload` stub). Frontend completes grant→PUT→confirm and attempts patch; errors surface via `ErrorBanner`. Backend not modified.
2. **Community create/patch** — no `bannerUploadId` in schemas. UI uploads and holds confirmed id only; caption states attachment is unavailable on current community APIs.
3. **Upload PUT URL** — stub host `upload.gmrlog.local`; client still PUTs; confirm does not verify bytes. Tests mock PUT.

---

## Query invalidation

| After | Invalidate |
| ----- | ---------- |
| Participation | `events.detail(id)` · `discover.events` |
| Profile media apply | `me` only |
| Community banner confirm | `communities.detail` (edit) · `communities.list` |

---

## Verification

| Command | Result |
| ------- | ------ |
| `pnpm --filter @gmrlog/frontend build` | PASS |
| `pnpm --filter @gmrlog/frontend typecheck` | PASS |
| `pnpm --filter @gmrlog/frontend lint` | PASS |
| `pnpm --filter @gmrlog/frontend test` | PASS (230 tests) |
| `pnpm format:check` | PASS |

---

## Acceptance checklist

- [x] Events list + detail
- [x] Going / Leave + viewerParticipation UI
- [x] Optimistic participation
- [x] Pull-to-refresh · skeletons · empty · offline retry
- [x] Required event components + hooks
- [x] UploadManager · useUpload · avatar/banner buttons · progress overlay
- [x] Purposes: avatar · banner · community_banner · post_media
- [x] Profile + community integration (confirmed ids only)
- [x] Tests for upload + events + integrations
- [x] Backend / S1 / S2 untouched

---

D3.12 Events & Upload Experience Foundation is COMPLETE.

D3.13 was not started.
