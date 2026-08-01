# D3.3 Completion Report — Home Shell & Feed Foundation

**Status:** COMPLETE  
**Completed:** 2026-07-27  
**Scope:** Frontend only — bottom tabs · Home activity feed · reusable feed components · React Query cursor pagination.  
**Backend:** FEATURE FREEZE — not modified.  
**D3.4 was not started.**

---

## Files created

### Navigation

| Path | Role |
| ---- | ---- |
| `apps/frontend/app/(app)/(tabs)/_layout.tsx` | Bottom tabs: Home · Discover · Search · Notifications · Profile |
| `apps/frontend/app/(app)/(tabs)/home/index.tsx` | Home tab → `HomeScreen` |
| `apps/frontend/app/(app)/(tabs)/discover/index.tsx` | Discover tab shell |
| `apps/frontend/app/(app)/(tabs)/search/index.tsx` | Search tab shell |
| `apps/frontend/app/(app)/(tabs)/notifications/index.tsx` | Notifications tab shell |
| `apps/frontend/app/(app)/(tabs)/profile/index.tsx` | Profile shell + sign out |

### Home feature

| Path | Role |
| ---- | ---- |
| `apps/frontend/features/home/home-screen.tsx` | Production Home (Loading → Empty → Feed) |
| `apps/frontend/features/home/index.ts` | Feature barrel |
| `apps/frontend/features/home/hooks/activity-feed-model.ts` | Pure feed view-model · kind copy · time · icons |
| `apps/frontend/features/home/hooks/use-activity-feed.ts` | Infinite query hook (`GET /activity`) |
| `apps/frontend/features/home/components/activity-card.tsx` | Memoized `ActivityCard` |
| `apps/frontend/features/home/components/activity-list.tsx` | FlatList + pull-to-refresh + cursor end |
| `apps/frontend/features/home/components/feed-skeleton.tsx` | `ActivitySkeleton` · `FeedSkeleton` · `HomeSkeleton` |
| `apps/frontend/features/home/components/home-header.tsx` | Logo · search · notifications shortcuts |
| `apps/frontend/features/home/components/empty-feed.tsx` | Empty state + Discover CTA |
| `apps/frontend/features/home/components/error-state.tsx` | Offline-aware retry (composes `@gmrlog/ui`) |
| `apps/frontend/features/home/components/refresh-container.tsx` | Pull-to-refresh for empty/error |

### Tests

| Path | Coverage |
| ---- | -------- |
| `features/home/hooks/use-activity-feed.spec.ts` | Loading/empty/error/feed · all kinds · time · cursor |
| `features/home/hooks/activity-query.spec.ts` | Query keys · page flatten · invalidate |
| `features/home/components/activity-card.spec.ts` | Card content contract |
| `features/home/home-screen.spec.ts` | State order |

### Docs

| Path | Role |
| ---- | ---- |
| `docs/05_FRONTEND/D3_3_COMPLETION_REPORT.md` | This report |

## Files updated

| Path | Change |
| ---- | ------ |
| `apps/frontend/app/(app)/index.tsx` | Redirect → `/(app)/(tabs)/home` |
| `apps/frontend/app/(auth)/_layout.tsx` | Post-login → Home tab |
| `apps/frontend/src/navigation/auth-gate*.ts(x)` | Authenticated replace → Home tab |
| `apps/frontend/src/api/axios-client.ts` | `listActivity()` → `GET /activity` |
| `apps/frontend/src/query/query-client.ts` | `queryKeys.activity` |
| `packages/ui/src/components/skeleton.tsx` | Optional shimmer (reduce-motion aware) |
| `packages/ui/src/index.ts` | Export `SkeletonBlock` |

---

## Navigation tree

```
(app)
  index → redirect /(tabs)/home
  (tabs)
    home
    discover
    search
    notifications
    profile
(modals)          — separated (unchanged)
(settings)        — separated (unchanged)
(auth)            — login (unchanged)
```

---

## Reusable components

| Component | Responsibility |
| --------- | -------------- |
| `ActivityCard` | Actor avatar · name · message · time · kind target icon |
| `ActivityList` | FlatList · stable keys · memo rows · end-reached |
| `FeedSkeleton` / `ActivitySkeleton` / `HomeSkeleton` | Shimmer loading (no spinners) |
| `HomeHeader` | Logo · Search · Notifications |
| `EmptyFeed` | Illustration placeholder · headline · Discover CTA |
| `ErrorState` | Retry · offline copy |
| `RefreshContainer` | Pull-to-refresh for non-list states |

---

## Query architecture

- **Endpoint:** `GET /activity` (S1 §13.11) — no mocks
- **Client:** `AxiosApiClient.listActivity`
- **Hook:** `useActivityFeed` → `useInfiniteQuery`
- **Keys:** `queryKeys.activity.list()` = `['activity', 'list']`
- **Pagination:** envelope `meta.cursor.next` + `hasMore` via `getNextPageParam`
- **Refresh:** `invalidateQueries({ queryKey: queryKeys.activity.list() })` — single invalidate path
- **DTO:** `ActivityItemResponse` from `@gmrlog/types` — every `ActivityKindValue` mapped

---

## Loading states

1. Initial: `HomeSkeleton` (header bones + feed shimmer)
2. Next page: footer `ActivitySkeleton`
3. No `ActivityIndicator` on Home feed path

## Empty states

- Quiet feed copy + compass illustration placeholder
- CTA **Discover games** → `/(app)/(tabs)/discover`

## Pagination

- Cursor-only (no offset)
- `onEndReached` → `fetchNextPage` when `hasNextPage`
- Guarded against duplicate in-flight next-page fetches

---

## Verification

| Check | Result |
| ----- | ------ |
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS (frontend 52 tests) |
| `pnpm format:check` | PASS |

---

## Deferred

- Discover / Search / Notifications product surfaces (tab shells only)
- Library tab naming vs F2.1 (this sprint ships **Search** per D3.3 brief)
- Activity item deep-links / object navigation
- Live avatar imagery beyond URL + initials placeholder
- FAB compose hub (F2.1)

---

D3.3 Home Shell & Feed Foundation is COMPLETE.

D3.4 was not started.
