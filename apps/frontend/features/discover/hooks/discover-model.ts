export type DiscoverListStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface DiscoverListViewModel<T> {
  status: DiscoverListStatus;
  items: T[];
  error: unknown;
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
}

/**
 * Shared list state order for Discover surfaces:
 * Loading → Empty → Ready (error when no cached pages).
 */
export function resolveDiscoverListView<T>(input: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  items: T[];
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
}): DiscoverListViewModel<T> {
  if (input.isPending && input.items.length === 0) {
    return {
      status: 'loading',
      items: [],
      error: null,
      isRefreshing: false,
      isFetchingNextPage: false,
      hasNextPage: false,
    };
  }

  if (input.isError && input.items.length === 0) {
    return {
      status: 'error',
      items: [],
      error: input.error,
      isRefreshing: input.isRefreshing,
      isFetchingNextPage: false,
      hasNextPage: false,
    };
  }

  if (input.items.length === 0) {
    return {
      status: 'empty',
      items: [],
      error: null,
      isRefreshing: input.isRefreshing,
      isFetchingNextPage: false,
      hasNextPage: false,
    };
  }

  return {
    status: 'ready',
    items: input.items,
    error: input.error,
    isRefreshing: input.isRefreshing,
    isFetchingNextPage: input.isFetchingNextPage,
    hasNextPage: input.hasNextPage,
  };
}

export type DiscoverHubStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface DiscoverHubViewModel<T> {
  status: DiscoverHubStatus;
  modules: T[];
  error: unknown;
  isRefreshing: boolean;
}

export function resolveDiscoverHubView<T>(input: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  modules: T[];
  isRefreshing: boolean;
}): DiscoverHubViewModel<T> {
  if (input.isPending && input.modules.length === 0) {
    return { status: 'loading', modules: [], error: null, isRefreshing: false };
  }
  if (input.isError && input.modules.length === 0) {
    return {
      status: 'error',
      modules: [],
      error: input.error,
      isRefreshing: input.isRefreshing,
    };
  }
  if (input.modules.length === 0) {
    return {
      status: 'empty',
      modules: [],
      error: null,
      isRefreshing: input.isRefreshing,
    };
  }
  return {
    status: 'ready',
    modules: input.modules,
    error: input.error,
    isRefreshing: input.isRefreshing,
  };
}

/** Expo Router discover child path (D3.22 module registry). */
export type DiscoverChildRoute =
  | '/games'
  | '/communities'
  | '/events'
  | '/trending'
  | '/popular'
  | '/hidden-gems'
  | '/recommended'
  | '/collections';

/** Map hub href → Expo Router discover child path. Unknown hrefs → null. */
export function hubHrefToRoute(href: string): DiscoverChildRoute | null {
  switch (href) {
    case '/discover/games':
      return '/games';
    case '/discover/communities':
      return '/communities';
    case '/discover/events':
      return '/events';
    case '/discover/trending':
      return '/trending';
    case '/discover/popular':
      return '/popular';
    case '/discover/hidden-gems':
      return '/hidden-gems';
    case '/discover/recommended':
      return '/recommended';
    case '/discover/collections':
      return '/collections';
    default:
      return null;
  }
}

export function discoverModuleTitle(id: string): string {
  switch (id) {
    case 'games':
      return 'Games';
    case 'communities':
      return 'Communities';
    case 'events':
      return 'Events';
    case 'trending':
      return 'Trending';
    case 'popular':
      return 'Popular';
    case 'hidden-gems':
      return 'Hidden Gems';
    case 'recommended':
      return 'Recommended';
    case 'collections':
      return 'Collections';
    default:
      return titleCaseId(id);
  }
}

export function discoverModuleDescription(id: string): string {
  switch (id) {
    case 'games':
      return 'Browse the games catalog';
    case 'communities':
      return 'Find communities to join';
    case 'events':
      return 'See upcoming shared events';
    case 'trending':
      return 'What the culture is talking about now';
    case 'popular':
      return 'Games with lasting presence';
    case 'hidden-gems':
      return 'High praise, quieter popularity';
    case 'recommended':
      return 'Taste-shaped picks for you';
    case 'collections':
      return 'Public shelves worth exploring';
    default:
      return 'Explore this discover module';
  }
}

function titleCaseId(id: string): string {
  return id
    .split(/[-_]/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatEventStartsAt(iso: string, nowMs = Date.now()): string {
  const starts = Date.parse(iso);
  if (Number.isNaN(starts)) {
    return '';
  }
  const delta = starts - nowMs;
  const dayMs = 24 * 60 * 60 * 1000;
  if (delta < 0 && Math.abs(delta) < dayMs) {
    return 'Started today';
  }
  if (delta >= 0 && delta < dayMs) {
    return 'Starts today';
  }
  return new Date(starts).toLocaleDateString();
}
