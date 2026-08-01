# D3.9 Completion Report — Community Experience Foundation

**Status:** COMPLETE  
**Completed:** 2026-07-27  
**Scope:** Frontend only — communities list · detail · members · create · edit · join/leave · optimistic updates.  
**Backend:** FEATURE FREEZE — not modified.  
**Not invented:** community feed · moderation · invitations · roles UI · chat · events-inside-community · realtime · alphabetical member sections.  
**D3.10 was not started.**

---

## Files created

### Feature (`features/communities`)

| Path | Role |
| ---- | ---- |
| `hooks/community-model.ts` | List view · owner/member · join/leave optimistic · create/edit schemas |
| `hooks/use-communities.ts` | List · detail · members · create · update · delete · join · leave |
| `components/community-card.tsx` | Banner/avatar placeholders · name · description · members · Joined |
| `components/community-header.tsx` | Banner · avatar · name · JoinButton |
| `components/community-member-card.tsx` | Avatar · display name · handle · role · joined date |
| `components/community-composer.tsx` | Create (`communityCreateSchema`) · edit + unsaved discard |
| `components/visibility-badge.tsx` | Visibility label (create/edit; not projected on GET) |
| `components/join-button.tsx` | Join / Leave · owner badges |
| `components/community-skeleton.tsx` | List · detail · members skeletons |
| `components/empty-communities.tsx` | Empty + Create · Discover CTAs |
| `components/empty-members.tsx` | Empty members |
| `components/community-error-state.tsx` | Offline-aware retry |
| `screens/communities-screen.tsx` | `GET /communities` FlatList |
| `screens/community-detail-screen.tsx` | Detail · members · edit · delete |
| `screens/community-members-screen.tsx` | `GET .../members` (backend order) |
| `screens/create-community-screen.tsx` | Create modal |
| `screens/edit-community-screen.tsx` | Edit modal |
| `index.ts` | Barrel |

### Routes

| Path | Role |
| ---- | ---- |
| `app/(app)/communities/index.tsx` | Communities list |
| `app/(app)/communities/create.tsx` | Create **modal** |
| `app/(app)/community/[id]/index.tsx` | Detail (replaces placeholder) |
| `app/(app)/community/[id]/members.tsx` | Members |
| `app/(app)/community/[id]/edit.tsx` | Edit **modal** |

### Tests

| Path | Coverage |
| ---- | -------- |
| `hooks/community-model.spec.ts` | Owner/member · optimistic · schemas · order |
| `hooks/community-query.spec.ts` | Keys · join/leave/edit/delete optimistic · invalidate |
| `community-screen.spec.ts` | Loading · empty · ready · actions contract |
| `community-navigation.spec.ts` | List ↔ detail ↔ members · create · edit · delete |

### Docs

| Path | Role |
| ---- | ---- |
| `docs/05_FRONTEND/D3_9_COMPLETION_REPORT.md` | This report |

## Files updated

| Path | Change |
| ---- | ------ |
| `src/api/axios-client.ts` | Community CRUD · members · join/leave helpers |
| `src/query/query-client.ts` | `queryKeys.communities.*` |
| `app/(app)/_layout.tsx` | Modals for create + edit |
| `features/discover/components/community-card.tsx` | Press → detail |
| `features/discover/components/discover-lists.tsx` | Navigate to `/(app)/community/{id}` |

---

## Reusable components

| Component | Responsibility |
| --------- | -------------- |
| `CommunityCard` | Memoized list row · banner/avatar placeholders · Joined badge |
| `CommunityHeader` | Detail chrome · Join/Leave |
| `CommunityMemberCard` | Memoized member row · role · joined date |
| `CommunityComposer` | Create/edit forms · discard on dirty edit |
| `VisibilityBadge` | Create/edit visibility chip (`ContentVisibilityValue`) |
| `JoinButton` | POST/DELETE membership · owner-safe |
| `CommunitySkeleton` / `Detail` / `Members` | Shimmer loading only |
| `EmptyCommunities` / `EmptyMembers` | Calm empties + Discover CTA |
| `CommunityErrorState` | Retry · offline copy · permission via `mapAuthError` |

---

## Community architecture

- **Management list:** `GET /communities` (array · no cursor) — FlatList + pull-to-refresh.
- **Discover list:** still `GET /discover/communities` (cursor); cards navigate into Community Experience detail.
- **Detail:** `GET /communities/{id}` — description · member count · Join/Leave · Members · Edit/Delete (owner).
- **Visibility honesty:** stored on create/patch; **not** projected on `CommunityResponse` (S1 §15.6 / D2.12) — UI does not invent a list/detail visibility value.
- **Members:** backend order preserved (joinedAt asc) — no alphabetical sections.
- **Joined:** `viewerMembership !== null`; **Owner:** `viewerMembership.role === 'owner'`.

### Endpoints used (only)

| Method | Path |
| ------ | ---- |
| GET | `/communities` |
| POST | `/communities` |
| GET | `/communities/{id}` |
| PATCH | `/communities/{id}` |
| DELETE | `/communities/{id}` |
| GET | `/communities/{id}/members` |
| POST | `/communities/{id}/membership` |
| DELETE | `/communities/{id}/membership` |

### Query keys

| Hook | Key |
| ---- | --- |
| `useCommunities` | `communities.list` |
| `useCommunity` | `communities.detail(id)` |
| `useCommunityMembers` | `communities.members(id)` |
| Create / Update / Delete / Join / Leave | invalidate affected list · detail · members · `discover.communities` |

### Navigation

```
Communities → Community → Members
Community → Edit (modal)
Community → Delete → Communities
Communities → Create (modal) → Community
Discover Communities → Community
```

---

## Optimistic updates

1. **Join:** snapshot detail · set `viewerMembership` + increment members · patch list · rollback on error · invalidate detail/members/list/discover.
2. **Leave:** snapshot · clear membership · decrement members · rollback · invalidate same.
3. **Edit:** optimistic name/description on detail + list · rollback · set server truth on success.
4. **Delete:** remove from list · drop detail query · restore list on error · navigate to Communities on success.

---

## Loading states

- Skeletons for list, detail, and members (no spinner-only screens).
- Pull-to-refresh on list, detail, and members.
- Empty: no communities (Create + Discover) · no members.
- Errors: offline · retry · permission (`mapAuthError` / 403).

---

## Verification

| Check | Result |
| ----- | ------ |
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS (frontend **168** tests) |
| `pnpm format:check` | PASS |

---

D3.9 Community Experience Foundation is COMPLETE.

D3.10 was not started.
