import { QueryClient } from '@tanstack/react-query';

import { FrontendApiError } from '../api/axios-client';

/**
 * Global QueryClient defaults (D3.1 + D3.15 offline).
 * networkMode offlineFirst: serve cache offline · pause when disconnected.
 */
export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        networkMode: 'offlineFirst',
        retry: (failureCount, error) => {
          if (error instanceof FrontendApiError && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
        networkMode: 'offlineFirst',
      },
    },
  });
}

/** Canonical query key factory — domain keys stay here, not in screens. */
export const queryKeys = {
  me: ['me'] as const,
  settings: ['settings'] as const,
  health: ['health'] as const,
  activity: {
    all: ['activity'] as const,
    list: () => ['activity', 'list'] as const,
  },
  feed: {
    all: ['feed'] as const,
    home: (filter?: string) => ['feed', 'home', filter ?? 'for_you'] as const,
    reviews: (slice?: string) => ['feed', 'reviews', slice ?? 'latest'] as const,
  },
  discover: {
    all: ['discover'] as const,
    hub: () => ['discover', 'hub'] as const,
    games: () => ['discover', 'games'] as const,
    communities: () => ['discover', 'communities'] as const,
    events: () => ['discover', 'events'] as const,
    trending: (window?: string) => ['discover', 'trending', window ?? '7d'] as const,
    popular: () => ['discover', 'popular'] as const,
    hiddenGems: () => ['discover', 'hidden-gems'] as const,
    recommended: () => ['discover', 'recommended'] as const,
    collections: () => ['discover', 'collections'] as const,
    similarGames: (id: string) => ['discover', 'similar-games', id] as const,
    similarUsers: (id: string) => ['discover', 'similar-users', id] as const,
  },
  search: {
    all: ['search'] as const,
    results: (q: string) => ['search', 'results', q] as const,
  },
  library: {
    all: ['library'] as const,
    hub: () => ['library', 'hub'] as const,
    entries: () => ['library', 'entries'] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    /** Own-reviews index is not available on backend (no GET /reviews list). */
    list: () => ['reviews', 'list'] as const,
    detail: (id: string) => ['reviews', 'detail', id] as const,
    byGame: (gameId: string) => ['reviews', 'game', gameId] as const,
  },
  posts: {
    all: ['posts'] as const,
    detail: (id: string) => ['posts', 'detail', id] as const,
    byGame: (gameId: string) => ['posts', 'game', gameId] as const,
  },
  games: {
    all: ['games'] as const,
    detail: (gameId: string) => ['games', 'detail', gameId] as const,
    media: (gameId: string) => ['games', 'media', gameId] as const,
    related: (gameId: string) => ['games', 'related', gameId] as const,
    hub: (gameId: string) => ['games', 'hub', gameId] as const,
    feed: (gameId: string) => ['games', 'feed', gameId] as const,
    guides: (gameId: string) => ['games', 'guides', gameId] as const,
    screenshots: (gameId: string) => ['games', 'screenshots', gameId] as const,
    collections: (gameId: string) => ['games', 'collections', gameId] as const,
    events: (gameId: string) => ['games', 'events', gameId] as const,
    communities: (gameId: string) => ['games', 'communities', gameId] as const,
    players: (gameId: string) => ['games', 'players', gameId] as const,
  },
  profile: {
    hero: (userId: string) => ['profile', 'hero', userId] as const,
  },
  bookmarks: {
    all: ['bookmarks'] as const,
    list: () => ['bookmarks', 'list'] as const,
  },
  collections: {
    all: ['collections'] as const,
    list: () => ['collections', 'list'] as const,
    detail: (id: string) => ['collections', 'detail', id] as const,
  },
  tierLists: {
    all: ['tierLists'] as const,
    list: () => ['tierLists', 'list'] as const,
    detail: (id: string) => ['tierLists', 'detail', id] as const,
  },
  messages: {
    all: ['messages'] as const,
    conversations: () => ['messages', 'conversations'] as const,
    conversation: (id: string) => ['messages', 'conversation', id] as const,
    thread: (id: string) => ['messages', 'thread', id] as const,
  },
  communities: {
    all: ['communities'] as const,
    list: () => ['communities', 'list'] as const,
    detail: (id: string) => ['communities', 'detail', id] as const,
    members: (id: string) => ['communities', 'members', id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: () => ['notifications', 'list'] as const,
  },
  events: {
    all: ['events'] as const,
    detail: (id: string) => ['events', 'detail', id] as const,
  },
  friends: {
    all: ['friends'] as const,
    list: () => ['friends', 'list'] as const,
    requests: () => ['friends', 'requests'] as const,
    online: () => ['friends', 'online'] as const,
    relationship: (userId: string) => ['friends', 'relationship', userId] as const,
  },
  statistics: {
    all: ['statistics'] as const,
    me: () => ['statistics', 'me'] as const,
    meHistory: (period: string) => ['statistics', 'me', 'history', period] as const,
    user: (userId: string) => ['statistics', 'user', userId] as const,
  },
  achievements: {
    all: ['achievements'] as const,
    me: () => ['achievements', 'me'] as const,
    user: (userId: string) => ['achievements', 'user', userId] as const,
    detail: (id: string) => ['achievements', 'detail', id] as const,
  },
  archetypes: {
    all: ['archetypes'] as const,
    me: () => ['archetypes', 'me'] as const,
    user: (userId: string) => ['archetypes', 'user', userId] as const,
  },
  integrations: {
    all: ['integrations'] as const,
    providers: () => ['integrations', 'providers'] as const,
    list: () => ['integrations', 'list'] as const,
    history: () => ['integrations', 'history'] as const,
    steamStatus: () => ['integrations', 'steam', 'status'] as const,
    steamProfile: () => ['integrations', 'steam', 'profile'] as const,
  },
};

/** Profile pull-to-refresh — invalidate all profile-related query roots. */
export async function invalidateProfileQueries(client: QueryClient): Promise<void> {
  await Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.me }),
    client.invalidateQueries({ queryKey: queryKeys.library.all }),
    client.invalidateQueries({ queryKey: queryKeys.reviews.all }),
    client.invalidateQueries({ queryKey: queryKeys.collections.all }),
    client.invalidateQueries({ queryKey: queryKeys.tierLists.all }),
    client.invalidateQueries({ queryKey: queryKeys.activity.all }),
    client.invalidateQueries({ queryKey: queryKeys.statistics.all }),
    client.invalidateQueries({ queryKey: queryKeys.achievements.all }),
    client.invalidateQueries({ queryKey: queryKeys.archetypes.all }),
    client.invalidateQueries({ queryKey: queryKeys.friends.all }),
    client.invalidateQueries({ queryKey: ['profile', 'hero'] }),
  ]);
}

export function mapQueryError(error: unknown): {
  message: string;
  status: number;
  requestId: string | null;
  retryable: boolean;
} {
  if (error instanceof FrontendApiError) {
    return {
      message: error.message,
      status: error.status,
      requestId: error.requestId,
      retryable: error.envelope?.error.retryable ?? error.status >= 500,
    };
  }
  if (error instanceof Error) {
    return { message: error.message, status: 0, requestId: null, retryable: true };
  }
  return { message: 'Unexpected error', status: 0, requestId: null, retryable: true };
}

/**
 * Cursor page helper for infinite queries (S1 cursor dialect).
 * `nextCursor` comes from envelope meta.cursor.next.
 */
export function getNextPageParam(meta: {
  cursor?: { next: string | null };
  hasMore?: boolean;
}): string | undefined {
  if (meta.hasMore === false) {
    return undefined;
  }
  return meta.cursor?.next ?? undefined;
}
