# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/05_FRONTEND/STATE_MANAGEMENT.md`

**Status:** Approved

**Owner:** Frontend Team

**Classification:** Internal Engineering Documentation

---

# State Management

## Purpose

This document defines how GMRLOG manages application state across **mobile** (Expo) and **web** (Next.js) using **Zustand** for client state and **TanStack Query** for server state.

The goal is a single mental model, shared patterns in `packages/`, and zero duplication of server cache logic between platforms.

---

## State Classification

```text
┌─────────────────────────────────────────────────────────────┐
│                      UI State (React)                        │
│  Modal open, animation phase, form focus, bottom sheet       │
├─────────────────────────────────────────────────────────────┤
│                   Client State (Zustand)                     │
│  Auth session, theme, locale, realtime connection, prefs    │
├─────────────────────────────────────────────────────────────┤
│                  Server State (TanStack Query)               │
│  Games, feed, reviews, messages, notifications, search       │
├─────────────────────────────────────────────────────────────┤
│                   URL State (nuqs / router)                    │
│  Filters, tabs, deep-linked entity IDs (web + mobile)        │
└─────────────────────────────────────────────────────────────┘
```

**Rule:** If data comes from the API, it lives in TanStack Query—not Zustand.

---

## Package Layout

```text
packages/
├── api/                    # Generated OpenAPI client (@gmrlog/api)
├── types/                  # Shared interfaces
└── state/
    ├── query-keys.ts       # Canonical query key factory
    ├── query-client.ts     # Default options, error handler
    ├── stores/
    │   ├── auth-store.ts
    │   ├── theme-store.ts
    │   ├── settings-store.ts
    │   └── realtime-store.ts
    └── hooks/
        ├── use-feed.ts
        ├── use-game.ts
        └── ...
```

Apps import from `@gmrlog/state`—never duplicate store definitions in `apps/mobile` or `apps/web`.

---

## TanStack Query

### Default client options

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 300_000,
      retry: (failureCount, error) => {
        if (isAuthError(error)) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      onError: globalMutationErrorHandler,
    },
  },
});
```

Platform overrides:

| Option | Mobile | Web |
|--------|--------|-----|
| `refetchOnWindowFocus` | `AppState` active | `document.visibilitychange` |
| Persistence | MMKV persister | None (SSR hydrates per request) |
| `networkMode` | `'offlineFirst'` on cached queries | `'online'` |

---

## Query Key Factory

All keys are created through `createQueryKeys` in `packages/state/query-keys.ts`.

```typescript
export const queryKeys = {
  feed: {
    all: ['feed'] as const,
    home: (cursor?: string) => [...queryKeys.feed.all, 'home', { cursor }] as const,
    following: (cursor?: string) => [...queryKeys.feed.all, 'following', { cursor }] as const,
  },
  games: {
    all: ['games'] as const,
    detail: (gameId: string) => [...queryKeys.games.all, gameId] as const,
    similar: (gameId: string) => [...queryKeys.games.all, gameId, 'similar'] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    detail: (reviewId: string) => [...queryKeys.reviews.all, reviewId] as const,
    byGame: (gameId: string, cursor?: string) =>
      [...queryKeys.reviews.all, 'game', gameId, { cursor }] as const,
  },
  users: {
    all: ['users'] as const,
    profile: (username: string) => [...queryKeys.users.all, username] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (cursor?: string) => [...queryKeys.notifications.all, { cursor }] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
  messages: {
    all: ['messages'] as const,
    threads: (cursor?: string) => [...queryKeys.messages.all, 'threads', { cursor }] as const,
    thread: (threadId: string, cursor?: string) =>
      [...queryKeys.messages.all, threadId, { cursor }] as const,
  },
  collections: {
    all: ['collections'] as const,
    detail: (collectionId: string) => [...queryKeys.collections.all, collectionId] as const,
  },
  search: {
    all: ['search'] as const,
    results: (query: string, filters: SearchFilters) =>
      [...queryKeys.search.all, query, filters] as const,
  },
} as const;
```

Invalidation always uses the factory—never raw string arrays in features.

---

## Feature Hook Pattern

Each feature exposes hooks; components never call the API client directly.

```typescript
// packages/state/hooks/use-game.ts
export function useGame(gameId: string) {
  return useQuery({
    queryKey: queryKeys.games.detail(gameId),
    queryFn: () => api.games.getGame({ gameId }),
    enabled: Boolean(gameId),
  });
}

export function useLikeReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.reviews.likeReview,
    onMutate: async ({ reviewId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.reviews.detail(reviewId) });
      const previous = queryClient.getQueryData(queryKeys.reviews.detail(reviewId));
      queryClient.setQueryData(queryKeys.reviews.detail(reviewId), (old) =>
        old ? { ...old, isLiked: true, likeCount: old.likeCount + 1 } : old,
      );
      return { previous };
    },
    onError: (_err, { reviewId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.reviews.detail(reviewId), context.previous);
      }
    },
    onSettled: (_data, _err, { reviewId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.detail(reviewId) });
    },
  });
}
```

---

## Infinite Queries

Used for: feed, notifications, messages, search, review lists.

```typescript
export function useFollowingFeed() {
  return useInfiniteQuery({
    queryKey: queryKeys.feed.following(),
    queryFn: ({ pageParam }) => api.social.getFollowingFeed({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
```

Flatten pages in a selector hook—not in components:

```typescript
export function useFlattenedFeed(query: UseInfiniteQueryResult<FeedPage>) {
  return useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
}
```

---

## Zustand Stores

### Auth store (`auth-store.ts`)

| Field | Type | Persisted |
|-------|------|-----------|
| `accessToken` | `string \| null` | Secure storage (mobile) / memory (web) |
| `refreshToken` | `string \| null` | Secure storage only |
| `user` | `UserSummary \| null` | MMKV (mobile), cookie session (web) |
| `status` | `'idle' \| 'authenticated' \| 'guest'` | Yes |

Actions: `setSession`, `clearSession`, `updateUser`.

Web stores refresh token in HTTP-only cookie via BFF route—not in Zustand.

### Theme store (`theme-store.ts`)

| Field | Values |
|-------|--------|
| `colorScheme` | `'dark' \| 'light' \| 'system'` |
| `oledMode` | `boolean` |

Persisted to MMKV / `localStorage`. Default: `dark`.

### Settings store (`settings-store.ts`)

Locale, reduced motion override, notification preferences cache, haptic feedback toggle.

### Realtime store (`realtime-store.ts`)

| Field | Purpose |
|-------|---------|
| `socketStatus` | `'connected' \| 'connecting' \| 'disconnected'` |
| `typingUsers` | `Map<threadId, userId[]>` |
| `onlineFriends` | `Set<userId>` |

Ephemeral—never persisted.

---

## Zustand Conventions

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ThemeState {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set) => ({
        colorScheme: 'dark',
        setColorScheme: (colorScheme) => set({ colorScheme }),
      }),
      { name: 'gmrlog-theme' },
    ),
    { name: 'ThemeStore' },
  ),
);
```

Rules:

- One store per domain—no monolithic global store.
- Selectors use shallow compare: `useThemeStore((s) => s.colorScheme)`.
- No async logic inside stores—use TanStack Query or dedicated services.
- Store files export the hook only; test stores via `getState()` / `setState()`.

---

## React Context (UI Only)

Permitted uses:

| Provider | Contents |
|----------|----------|
| `BottomSheetProvider` | Sheet host ref |
| `ToastProvider` | Toast queue |
| `PortalProvider` | Modal portals (web) |

Forbidden: API data, auth tokens, or feature flags in Context.

---

## Web (Next.js) Specifics

### Server Components

- Fetch in RSC with `fetch` + `cache: 'no-store'` for user-specific data.
- Pass serialized initial data to client components via props.
- Hydrate TanStack Query with `HydrationBoundary` + `dehydrate(queryClient)`.

```typescript
// apps/web/app/game/[slug]/page.tsx
export default async function GamePage({ params }: Props) {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.games.detail(params.slug),
    queryFn: () => serverApi.games.getGame({ gameId: params.slug }),
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GameDetailClient gameId={params.slug} />
    </HydrationBoundary>
  );
}
```

### Client-only stores

Zustand stores that touch `window` / `localStorage` use:

```typescript
const useStore = create(...) 
// with persist storage: () => localStorage
// and skipHydration until useEffect on client
```

---

## Mobile (Expo) Specifics

- Wrap app in `PersistQueryClientProvider` with MMKV persister.
- Auth tokens: `expo-secure-store` adapter for sensitive persist slice.
- `networkMode: 'offlineFirst'` on feed, game detail, notifications queries.
- Integrate `OfflineWriteQueue` in mutation `onMutate` when `!isOnline` (see `OFFLINE_MODE.md`).

---

## Prefetching Strategy

| Action | Prefetch |
|--------|----------|
| Feed card visible 500ms | `queryKeys.games.detail(gameId)` |
| Profile link press (hover web / pressIn mobile) | `queryKeys.users.profile(username)` |
| Tab switch to Notifications | `queryKeys.notifications.list()` |

Use `queryClient.prefetchQuery`—never manual cache seeding without API response shape.

---

## DevTools

| Platform | Tool |
|----------|------|
| Web | TanStack Query Devtools (dev only) |
| Mobile | Flipper + React Native DevTools |
| Both | Zustand devtools middleware |

Disabled in production builds.

---

## Testing

| Layer | Approach |
|-------|----------|
| Query hooks | `QueryClientProvider` with `retry: false`, MSW handlers |
| Zustand | Reset store in `beforeEach` via `useStore.setState(initial)` |
| Optimistic mutations | Assert cache before/after; verify rollback |
| RSC hydration | Integration test: prefetch + dehydrate + client render |

---

## Anti-Patterns

| Do not | Do instead |
|--------|------------|
| Store API responses in Zustand | TanStack Query |
| Call `axios` from components | Feature hooks |
| Duplicate query keys as strings | `queryKeys` factory |
| `useEffect` + `fetch` for data | `useQuery` |
| Global event bus for cache updates | `queryClient.invalidateQueries` |
| Prop-drill server data 3+ levels | Query hook at consumption point |

---

## Acceptance Criteria

- Mobile and web share `packages/state` for keys, hooks, and stores.
- No server data in Zustand outside the auth user summary cache.
- All features consume data through typed hooks.
- Optimistic updates follow the documented `onMutate` / rollback pattern.

---

## Related Documents

- [FRONTEND_ARCHITECTURE.md](FRONTEND_ARCHITECTURE.md)
- [OFFLINE_MODE.md](OFFLINE_MODE.md)
- [SYNC_STRATEGY.md](SYNC_STRATEGY.md)
- [CODING_STANDARDS.md](../00_PROJECT/CODING_STANDARDS.md)
- [MONOREPO_STRUCTURE.md](../00_PROJECT/MONOREPO_STRUCTURE.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 Alpha | 2026-07-10 | Initial release |
