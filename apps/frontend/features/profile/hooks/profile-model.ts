import type {
  AchievementResponse,
  ActivityItemResponse,
  CollectionResponse,
  LibraryEntryResponse,
  LibraryHubResponse,
  LibraryStatusValue,
  PlayerArchetypeKey,
  PlayerArchetypeResponse,
  ReviewResponse,
  TierListResponse,
  UserSelfResponse,
  UserStatisticsResponse,
} from '@gmrlog/types';

export const PROFILE_TABS = [
  'overview',
  'library',
  'reviews',
  'collections',
  'tier-lists',
] as const;

export type ProfileTabId = (typeof PROFILE_TABS)[number];

export const PROFILE_TAB_LABELS: Record<ProfileTabId, string> = {
  overview: 'Overview',
  library: 'Library',
  reviews: 'Reviews',
  collections: 'Collections',
  'tier-lists': 'Tier Lists',
};

/** Shelf order for Library tab — user-facing sections first, then owned. */
export const LIBRARY_SECTION_ORDER: readonly LibraryStatusValue[] = [
  'playing',
  'completed',
  'wishlist',
  'backlog',
  'dropped',
  'hidden',
  'owned',
] as const;

export const LIBRARY_SECTION_LABELS: Record<LibraryStatusValue, string> = {
  playing: 'Currently Playing',
  completed: 'Completed',
  wishlist: 'Wishlist',
  backlog: 'Backlog',
  dropped: 'Dropped',
  hidden: 'Hidden',
  owned: 'Owned',
};

export const OVERVIEW_RECENT_LIMIT = 5;

export type ProfileLoadStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface ProfileViewModel {
  status: ProfileLoadStatus;
  user: UserSelfResponse | null;
  error: unknown;
  isRefreshing: boolean;
}

export function isProfileTabId(value: string): value is ProfileTabId {
  return (PROFILE_TABS as readonly string[]).includes(value);
}

export function resolveProfileView(input: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  user: UserSelfResponse | null | undefined;
  isRefreshing: boolean;
}): ProfileViewModel {
  if (input.isPending && !input.user) {
    return { status: 'loading', user: null, error: null, isRefreshing: false };
  }
  if (input.isError && !input.user) {
    return {
      status: 'error',
      user: null,
      error: input.error,
      isRefreshing: input.isRefreshing,
    };
  }
  if (!input.user) {
    return {
      status: 'empty',
      user: null,
      error: null,
      isRefreshing: input.isRefreshing,
    };
  }
  return {
    status: 'ready',
    user: input.user,
    error: input.error,
    isRefreshing: input.isRefreshing,
  };
}

export interface LibrarySectionModel {
  status: LibraryStatusValue;
  label: string;
  entries: LibraryEntryResponse[];
}

/** Group entries by status · preserve backend order within each shelf. */
export function groupLibraryEntries(
  entries: readonly LibraryEntryResponse[],
): LibrarySectionModel[] {
  const buckets = new Map<LibraryStatusValue, LibraryEntryResponse[]>();
  for (const status of LIBRARY_SECTION_ORDER) {
    buckets.set(status, []);
  }
  for (const entry of entries) {
    const bucket = buckets.get(entry.status);
    if (bucket) {
      bucket.push(entry);
    }
  }
  return LIBRARY_SECTION_ORDER.map((status) => ({
    status,
    label: LIBRARY_SECTION_LABELS[status],
    entries: buckets.get(status) ?? [],
  })).filter((section) => section.entries.length > 0);
}

/**
 * Profile identity stats — prefers `/me/statistics` when present,
 * otherwise derives from library hub + list lengths (no invented counters).
 */
export interface ProfileStatsModel {
  games: number;
  playing: number;
  completed: number;
  completionPercent: number;
  friends: number;
  reviews: number;
  lists: number;
  /** True when values came from UserStatisticsResponse. */
  fromStatistics: boolean;
}

export function buildProfileStats(input: {
  hub: LibraryHubResponse | null;
  collectionsCount: number;
  tierListsCount: number;
  statistics?: UserStatisticsResponse | null;
}): ProfileStatsModel {
  const lists = input.collectionsCount + input.tierListsCount;
  const stats = input.statistics;
  if (stats) {
    const statsLists = stats.collectionCount + stats.tierListCount;
    return {
      games: stats.gamesLogged,
      playing: stats.gamesPlayed,
      completed: stats.gamesCompleted,
      completionPercent: Math.round(stats.completionPercent),
      friends: stats.friendCount,
      reviews: stats.reviewCount,
      lists: statsLists > 0 ? statsLists : lists,
      fromStatistics: true,
    };
  }

  const hubTotal = input.hub?.total ?? 0;
  const completed = input.hub?.counts.completed ?? 0;
  const playing = input.hub?.counts.playing ?? 0;
  const completionPercent = hubTotal > 0 ? Math.round((completed / hubTotal) * 100) : 0;

  return {
    games: hubTotal,
    playing,
    completed,
    completionPercent,
    friends: 0,
    reviews: 0,
    lists,
    fromStatistics: false,
  };
}

export const ARCHETYPE_LABELS: Record<PlayerArchetypeKey, string> = {
  collector: 'Collector',
  completionist: 'Completionist',
  tryhard: 'Tryhard',
  explorer: 'Explorer',
  reviewer: 'Reviewer',
  speedrunner: 'Speedrunner',
  backlog_hoarder: 'Backlog Hoarder',
  competitive: 'Competitive',
  story_lover: 'Story Lover',
  indie_hunter: 'Indie Hunter',
  achievement_hunter: 'Achievement Hunter',
  social_gamer: 'Social Gamer',
};

export function archetypeLabel(key: PlayerArchetypeKey): string {
  return ARCHETYPE_LABELS[key];
}

/** Awarded achievements only — locked/in_progress stay off overview. */
export function filterAwardedAchievements(
  items: readonly AchievementResponse[],
): AchievementResponse[] {
  return items.filter((item) => item.progress.state === 'awarded');
}

/** Highest-score archetypes first for a restrained strip. */
export function sortArchetypes(
  items: readonly PlayerArchetypeResponse[],
): PlayerArchetypeResponse[] {
  return [...items].sort((a, b) => b.score - a.score);
}

export function takeRecent<T>(items: readonly T[], limit = OVERVIEW_RECENT_LIMIT): T[] {
  return items.slice(0, limit);
}

export function countTierListGames(list: TierListResponse): number {
  return list.slots.reduce((sum, slot) => sum + slot.games.length, 0);
}

export function visibilityLabel(visibility: string): string {
  switch (visibility) {
    case 'public':
      return 'Public';
    case 'followers':
      return 'Followers';
    case 'private':
      return 'Private';
    default:
      return visibility;
  }
}

export function initialsFromDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return (parts[0] ?? '?').slice(0, 2).toUpperCase();
  }
  return `${(parts[0] ?? '').slice(0, 1)}${(parts[1] ?? '').slice(0, 1)}`.toUpperCase();
}

export type ListViewStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface ListViewModel<T> {
  status: ListViewStatus;
  items: T[];
  error: unknown;
  isRefreshing: boolean;
}

export function resolveListView<T>(input: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  items: T[];
  isRefreshing: boolean;
}): ListViewModel<T> {
  if (input.isPending && input.items.length === 0) {
    return { status: 'loading', items: [], error: null, isRefreshing: false };
  }
  if (input.isError && input.items.length === 0) {
    return {
      status: 'error',
      items: [],
      error: input.error,
      isRefreshing: input.isRefreshing,
    };
  }
  if (input.items.length === 0) {
    return {
      status: 'empty',
      items: [],
      error: null,
      isRefreshing: input.isRefreshing,
    };
  }
  return {
    status: 'ready',
    items: input.items,
    error: input.error,
    isRefreshing: input.isRefreshing,
  };
}

/** Reviews tab — own list endpoint does not exist; always empty/unavailable. */
export interface ReviewsViewModel {
  status: 'empty';
  items: ReviewResponse[];
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  /** Backend has no GET /reviews index — UI stays honest. */
  listUnavailable: true;
}

export function resolveReviewsView(): ReviewsViewModel {
  return {
    status: 'empty',
    items: [],
    isRefreshing: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    listUnavailable: true,
  };
}

export interface OverviewActivitySlice {
  recentActivity: ActivityItemResponse[];
  recentCollections: CollectionResponse[];
  recentTierLists: TierListResponse[];
}
