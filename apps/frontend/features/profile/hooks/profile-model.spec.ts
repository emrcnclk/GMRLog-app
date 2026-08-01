import type {
  AchievementResponse,
  CollectionResponse,
  LibraryEntryResponse,
  LibraryHubResponse,
  ReviewResponse,
  TierListResponse,
  UserSelfResponse,
  UserStatisticsResponse,
} from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  archetypeLabel,
  buildProfileStats,
  countTierListGames,
  filterAwardedAchievements,
  groupLibraryEntries,
  isProfileTabId,
  LIBRARY_SECTION_LABELS,
  LIBRARY_SECTION_ORDER,
  resolveListView,
  resolveProfileView,
  resolveReviewsView,
  sortArchetypes,
  takeRecent,
  visibilityLabel,
} from './profile-model';

const user: UserSelfResponse = {
  id: 'u1',
  handle: 'player',
  displayName: 'Player One',
  bio: 'Hello',
  avatarUrl: null,
  bannerUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  connectedProviders: [],
};

describe('profile model', () => {
  it('resolves profile loading → ready order', () => {
    expect(
      resolveProfileView({
        isPending: true,
        isError: false,
        error: null,
        user: null,
        isRefreshing: false,
      }).status,
    ).toBe('loading');

    expect(
      resolveProfileView({
        isPending: false,
        isError: false,
        error: null,
        user,
        isRefreshing: false,
      }).status,
    ).toBe('ready');
  });

  it('groups library entries including dropped shelf', () => {
    const entries: LibraryEntryResponse[] = [
      {
        gameId: 'g1',
        game: { id: 'g1', title: 'A', slug: 'a', coverUrl: null },
        status: 'playing',
        source: 'manual',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
      {
        gameId: 'g2',
        game: { id: 'g2', title: 'B', slug: 'b', coverUrl: null },
        status: 'playing',
        source: 'manual',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        gameId: 'g3',
        game: { id: 'g3', title: 'C', slug: 'c', coverUrl: null },
        status: 'wishlist',
        source: 'manual',
        updatedAt: '2026-01-03T00:00:00.000Z',
      },
      {
        gameId: 'g4',
        game: { id: 'g4', title: 'D', slug: 'd', coverUrl: null },
        status: 'dropped',
        source: 'manual',
        updatedAt: '2026-01-04T00:00:00.000Z',
      },
    ];

    const sections = groupLibraryEntries(entries);
    expect(sections.map((s) => s.status)).toEqual(['playing', 'wishlist', 'dropped']);
    expect(sections[0]?.entries.map((e) => e.gameId)).toEqual(['g1', 'g2']);
    expect(LIBRARY_SECTION_ORDER).toContain('dropped');
    expect(LIBRARY_SECTION_LABELS.dropped).toBe('Dropped');
  });

  it('builds stats from hub fallback when statistics missing', () => {
    const hub: LibraryHubResponse = {
      total: 12,
      counts: {
        owned: 2,
        playing: 3,
        completed: 4,
        wishlist: 1,
        backlog: 1,
        dropped: 0,
        hidden: 1,
      },
    };
    expect(buildProfileStats({ hub, collectionsCount: 2, tierListsCount: 1 })).toEqual({
      games: 12,
      playing: 3,
      completed: 4,
      completionPercent: 33,
      friends: 0,
      reviews: 0,
      lists: 3,
      fromStatistics: false,
    });
  });

  it('prefers /me/statistics fields when present', () => {
    const statistics: UserStatisticsResponse = {
      gamesLogged: 40,
      gamesPlayed: 5,
      gamesCompleted: 20,
      gamesDropped: 2,
      backlogSize: 8,
      wishlistSize: 4,
      hoursPlayed: 100,
      averageRating: 4.2,
      completionPercent: 50.4,
      reviewCount: 7,
      postCount: 1,
      commentCount: 3,
      followerCount: 10,
      followingCount: 9,
      friendCount: 6,
      communityCount: 2,
      collectionCount: 3,
      tierListCount: 2,
      achievementCount: 4,
      favoriteGenres: [],
      favoritePlatform: null,
      favoriteDeveloper: null,
      favoritePublisher: null,
      profileCompletionPercent: 80,
      period: 'lifetime',
      joinedAt: '2026-01-01T00:00:00.000Z',
    };
    expect(
      buildProfileStats({
        hub: null,
        collectionsCount: 0,
        tierListsCount: 0,
        statistics,
      }),
    ).toEqual({
      games: 40,
      playing: 5,
      completed: 20,
      completionPercent: 50,
      friends: 6,
      reviews: 7,
      lists: 5,
      fromStatistics: true,
    });
  });

  it('filters awarded achievements and sorts archetypes', () => {
    const achievements: AchievementResponse[] = [
      {
        id: 'a1',
        key: 'first_log',
        title: 'First Log',
        description: 'Logged a game',
        category: 'logging',
        isHidden: false,
        isRare: false,
        progress: { current: 1, target: 1, state: 'awarded' },
        awardedAt: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'a2',
        key: 'ten_reviews',
        title: 'Critic',
        description: 'Write 10 reviews',
        category: 'reviewing',
        isHidden: false,
        isRare: false,
        progress: { current: 2, target: 10, state: 'in_progress' },
        awardedAt: null,
      },
    ];
    expect(filterAwardedAchievements(achievements).map((a) => a.id)).toEqual(['a1']);
    expect(
      sortArchetypes([
        { key: 'collector', score: 1, awardedAt: '2026-01-01T00:00:00.000Z' },
        { key: 'reviewer', score: 9, awardedAt: '2026-01-02T00:00:00.000Z' },
      ]).map((a) => a.key),
    ).toEqual(['reviewer', 'collector']);
    expect(archetypeLabel('backlog_hoarder')).toBe('Backlog Hoarder');
  });

  it('reviews view stays empty without inventing a list endpoint', () => {
    const view = resolveReviewsView();
    expect(view.status).toBe('empty');
    expect(view.items).toEqual([]);
    expect(view.hasNextPage).toBe(false);
    expect(view.listUnavailable).toBe(true);
  });

  it('list view empty and ready', () => {
    expect(
      resolveListView({
        isPending: false,
        isError: false,
        error: null,
        items: [] as CollectionResponse[],
        isRefreshing: false,
      }).status,
    ).toBe('empty');

    const collections: CollectionResponse[] = [
      {
        id: 'c1',
        title: 'Favorites',
        description: null,
        owner: {
          id: 'u1',
          handle: 'player',
          displayName: 'Player One',
          avatarUrl: null,
        },
        visibility: 'public',
        entries: [],
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    expect(
      resolveListView({
        isPending: false,
        isError: false,
        error: null,
        items: collections,
        isRefreshing: false,
      }).status,
    ).toBe('ready');
  });

  it('counts tier list games and labels visibility', () => {
    const list: TierListResponse = {
      id: 't1',
      title: 'Ranks',
      owner: {
        id: 'u1',
        handle: 'player',
        displayName: 'Player One',
        avatarUrl: null,
      },
      visibility: 'followers',
      slots: [
        { label: 'S', position: 0, games: [{ gameId: 'g1', position: 0 }] },
        {
          label: 'A',
          position: 1,
          games: [
            { gameId: 'g2', position: 0 },
            { gameId: 'g3', position: 1 },
          ],
        },
      ],
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    expect(countTierListGames(list)).toBe(3);
    expect(visibilityLabel('private')).toBe('Private');
  });

  it('validates tab ids and takes recent slice', () => {
    expect(isProfileTabId('library')).toBe(true);
    expect(isProfileTabId('unknown')).toBe(false);
    expect(isProfileTabId('friends')).toBe(false);
    expect(takeRecent([1, 2, 3, 4, 5, 6], 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('review card fixture shape is stable', () => {
    const review: ReviewResponse = {
      id: 'r1',
      author: {
        id: 'u1',
        handle: 'player',
        displayName: 'Player One',
        avatarUrl: null,
      },
      body: 'Great',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      visibility: 'public',
      rating: 5,
      containsSpoilers: false,
      gameId: 'g1',
      game: { id: 'g1', title: 'Game', slug: 'game', coverUrl: null },
    };
    expect(review.id).toBe('r1');
  });
});
