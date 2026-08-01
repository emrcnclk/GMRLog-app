import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RequestIdentity } from '../auth/interfaces/identity';
import {
  createFakeCommunityMemberRepository,
  makeCommunity,
  makeCommunityMember,
} from '../communities/testing/fake-repositories';
import type { Event } from '@gmrlog/database';

import { DiscoverService } from './discover.service';
import { PaginatedPayload } from '../infrastructure/http/paginated-payload';
import {
  createFakeBecauseYouPlayedService,
  createFakeDiscoveryScoreService,
  createFakePrismaForDiscover,
  createFakeRecommendationService,
  createFakeSimilarityService,
  createFakeTrendingService,
} from './testing/fake-discovery-services';
import { createFakeDiscoverRepository } from './testing/fake-repositories';
import { GAME_CATALOG_DEFAULTS } from '../games/game-catalog.defaults';
import type { GameCardResponse } from '@gmrlog/types';

const guest: RequestIdentity = { class: 'guest' };
const player: RequestIdentity = { class: 'player', userId: 'user-1' };

const publicCommunity = makeCommunity({
  id: 'community-public',
  name: 'Public Room',
  slug: 'public-room',
  visibility: 'public',
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
});
const privateCommunity = makeCommunity({
  id: 'community-private',
  name: 'Hidden Room',
  slug: 'hidden-room',
  visibility: 'private',
  updatedAt: new Date('2026-01-03T00:00:00.000Z'),
});

const eventOlder: Event = {
  id: 'event-1',
  title: 'Seasonal',
  kind: 'seasonal',
  description: null,
  startsAt: new Date('2026-01-01T00:00:00.000Z'),
  endsAt: null,
  gameId: null,
  communityId: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};
const eventNewer: Event = {
  id: 'event-2',
  title: 'Tournament',
  kind: 'tournament',
  description: null,
  startsAt: new Date('2026-01-02T00:00:00.000Z'),
  endsAt: null,
  gameId: null,
  communityId: null,
  createdAt: new Date('2026-01-02T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  deletedAt: null,
};

let discover: ReturnType<typeof createFakeDiscoverRepository>;
let members: ReturnType<typeof createFakeCommunityMemberRepository>;
let discoveryScores: ReturnType<typeof createFakeDiscoveryScoreService>;
let similarity: ReturnType<typeof createFakeSimilarityService>;
let recommendations: ReturnType<typeof createFakeRecommendationService>;
let trending: ReturnType<typeof createFakeTrendingService>;
let becauseYouPlayed: ReturnType<typeof createFakeBecauseYouPlayedService>;
let prisma: ReturnType<typeof createFakePrismaForDiscover>;
let service: DiscoverService;

beforeEach(() => {
  discover = createFakeDiscoverRepository({
    communities: [publicCommunity, privateCommunity],
    events: [eventOlder, eventNewer],
    games: [],
  });
  members = createFakeCommunityMemberRepository([
    makeCommunityMember({
      id: 'member-1',
      communityId: 'community-public',
      userId: 'user-1',
      role: 'member',
    }),
  ]);
  discoveryScores = createFakeDiscoveryScoreService();
  similarity = createFakeSimilarityService();
  recommendations = createFakeRecommendationService();
  trending = createFakeTrendingService();
  becauseYouPlayed = createFakeBecauseYouPlayedService();
  prisma = createFakePrismaForDiscover();
  service = new DiscoverService(
    discover,
    members,
    prisma as never,
    discoveryScores,
    similarity,
    recommendations,
    trending,
    becauseYouPlayed,
  );
});

describe('DiscoverService.getHub', () => {
  it('returns static games, communities and events modules', () => {
    const hub = service.getHub();
    expect(hub.modules).toEqual([
      { id: 'games', href: '/discover/games' },
      { id: 'trending', href: '/discover/trending' },
      { id: 'popular', href: '/discover/popular' },
      { id: 'hidden-gems', href: '/discover/hidden-gems' },
      { id: 'recommended', href: '/discover/recommended' },
      { id: 'collections', href: '/discover/collections' },
      { id: 'communities', href: '/discover/communities' },
      { id: 'events', href: '/discover/events' },
      { id: 'because-you-played', href: '/discover/because-you-played' },
    ]);
  });
});

describe('DiscoverService.listGames', () => {
  it('lists game cards with default ordering', async () => {
    discover.games = [
      {
        game: {
          id: 'game-1',
          title: 'Hollow Knight',
          slug: 'hollow-knight',
          coverKey: null,
          releaseDate: new Date('2026-01-02T00:00:00.000Z'),
          featured: true,
          popularity: 10,
          franchiseId: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          ...GAME_CATALOG_DEFAULTS,
        },
        genres: [
          {
            id: 'genre-1',
            name: 'Metroidvania',
            slug: 'metroidvania',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        platforms: [
          {
            id: 'platform-1',
            name: 'PC',
            slug: 'pc',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        ratingAverage: 9,
        ratingCount: 2,
        libraryCount: 3,
      },
    ];
    const page = await service.listGames({ limit: 10 });
    expect(page.items[0]).toMatchObject({
      id: 'game-1',
      title: 'Hollow Knight',
      slug: 'hollow-knight',
      libraryCount: 3,
      ratingSummary: { average: 9, count: 2 },
    });
  });
});

describe('DiscoverService.listCommunities', () => {
  it('lists only public communities for guests', async () => {
    const page = await service.listCommunities(guest, { limit: 10 });
    expect(page.items.map((row) => row.id)).toEqual(['community-public']);
    expect(page.cursor.next).toBeNull();
  });

  it('includes viewerMembership for authenticated members', async () => {
    const page = await service.listCommunities(player, { limit: 10 });
    expect(page.items[0]?.viewerMembership?.role).toBe('member');
  });

  it('paginates with opaque cursors', async () => {
    discover.communities.push(
      makeCommunity({
        id: 'community-b',
        name: 'B',
        slug: 'room-b',
        visibility: 'public',
        updatedAt: new Date('2026-01-04T00:00:00.000Z'),
      }),
    );
    const page1 = await service.listCommunities(guest, { limit: 1 });
    expect(page1.items.length).toBe(1);
    expect(page1.hasMore).toBe(true);
    expect(page1.cursor.next).toEqual(expect.any(String));

    const page2 = await service.listCommunities(guest, {
      limit: 1,
      cursor: page1.cursor.next ?? undefined,
    });
    expect(page2.items.length).toBe(1);
    expect(page2.items[0]?.id).not.toBe(page1.items[0]?.id);
  });

  it('rejects invalid cursors', async () => {
    await expect(service.listCommunities(guest, { cursor: 'bad' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    const emptyId = Buffer.from('2026-01-01T00:00:00.000Z|', 'utf8').toString('base64url');
    await expect(service.listCommunities(guest, { cursor: emptyId })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('DiscoverService.listEvents', () => {
  it('lists events newest-first for guests', async () => {
    const page = await service.listEvents({ limit: 10 });
    expect(page.items.map((row) => row.id)).toEqual(['event-2', 'event-1']);
    expect(page.items[0]?.viewerParticipation).toBeNull();
  });

  it('paginates events', async () => {
    const page1 = await service.listEvents({ limit: 1 });
    expect(page1.items[0]?.id).toBe('event-2');
    expect(page1.hasMore).toBe(true);
    const page2 = await service.listEvents({ limit: 1, cursor: page1.cursor.next ?? undefined });
    expect(page2.items[0]?.id).toBe('event-1');
  });

  it('rejects invalid event cursors', async () => {
    await expect(service.listEvents({ cursor: 'bad' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects malformed event cursors with invalid payload shape', async () => {
    const noSeparator = Buffer.from('2026-01-01T00:00:00.000Z', 'utf8').toString('base64url');
    const emptyId = Buffer.from('2026-01-01T00:00:00.000Z|', 'utf8').toString('base64url');
    const badDate = Buffer.from('not-a-date|event-1', 'utf8').toString('base64url');

    await expect(service.listEvents({ cursor: noSeparator })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.listEvents({ cursor: emptyId })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.listEvents({ cursor: badDate })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('DiscoverService.listGames', () => {
  it('supports sort-specific cursors and rejects invalid ones', async () => {
    discover.games = [
      {
        game: {
          id: 'game-1',
          title: 'A',
          slug: 'a',
          coverKey: null,
          releaseDate: new Date('2026-01-01T00:00:00.000Z'),
          featured: true,
          popularity: 10,
          franchiseId: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          ...GAME_CATALOG_DEFAULTS,
        },
        genres: [],
        platforms: [],
        ratingAverage: 9,
        ratingCount: 1,
        libraryCount: 1,
      },
      {
        game: {
          id: 'game-2',
          title: 'B',
          slug: 'b',
          coverKey: null,
          releaseDate: new Date('2026-01-02T00:00:00.000Z'),
          featured: false,
          popularity: 5,
          franchiseId: null,
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
          ...GAME_CATALOG_DEFAULTS,
        },
        genres: [],
        platforms: [],
        ratingAverage: 8,
        ratingCount: 1,
        libraryCount: 1,
      },
    ];

    const popular = await service.listGames({ sort: 'popular', limit: 1 });
    expect(popular.hasMore).toBe(true);
    const popularPage2 = await service.listGames({
      sort: 'popular',
      limit: 1,
      cursor: popular.cursor.next ?? undefined,
    });
    expect(popularPage2.items[0]?.id).toBe('game-2');

    const recent = await service.listGames({ sort: 'recent', limit: 1 });
    expect(recent.cursor.next).toEqual(expect.any(String));

    const featured = await service.listGames({ sort: 'featured', limit: 1 });
    expect(featured.cursor.next).toEqual(expect.any(String));

    await expect(service.listGames({ sort: 'popular', cursor: 'bad' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('paginates default sort and applies genre/platform filters', async () => {
    discover.games = [
      {
        game: {
          id: 'game-1',
          title: 'Featured A',
          slug: 'featured-a',
          coverKey: null,
          releaseDate: new Date('2026-01-02T00:00:00.000Z'),
          featured: true,
          popularity: 20,
          franchiseId: 'fr-1',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          ...GAME_CATALOG_DEFAULTS,
        },
        genres: [
          {
            id: 'genre-1',
            name: 'Action',
            slug: 'action',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        platforms: [
          {
            id: 'platform-1',
            name: 'PC',
            slug: 'pc',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        ratingAverage: 9,
        ratingCount: 1,
        libraryCount: 1,
      },
      {
        game: {
          id: 'game-2',
          title: 'Featured B',
          slug: 'featured-b',
          coverKey: null,
          releaseDate: new Date('2026-01-01T00:00:00.000Z'),
          featured: false,
          popularity: 10,
          franchiseId: 'fr-1',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          ...GAME_CATALOG_DEFAULTS,
        },
        genres: [
          {
            id: 'genre-1',
            name: 'Action',
            slug: 'action',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        platforms: [
          {
            id: 'platform-1',
            name: 'PC',
            slug: 'pc',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        ratingAverage: 8,
        ratingCount: 1,
        libraryCount: 1,
      },
    ];

    const page1 = await service.listGames({
      limit: 1,
      genreId: 'genre-1',
      platformId: 'platform-1',
    });
    expect(page1.items[0]?.id).toBe('game-1');
    expect(page1.hasMore).toBe(true);

    const page2 = await service.listGames({
      limit: 1,
      genreId: 'genre-1',
      platformId: 'platform-1',
      cursor: page1.cursor.next ?? undefined,
    });
    expect(page2.items[0]?.id).toBe('game-2');
  });

  it('supports recent and featured sorts with cursor validation', async () => {
    discover.games = [
      {
        game: {
          id: 'game-a',
          title: 'A',
          slug: 'a',
          coverKey: null,
          releaseDate: new Date('2026-01-02T00:00:00.000Z'),
          featured: true,
          popularity: 1,
          franchiseId: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          ...GAME_CATALOG_DEFAULTS,
        },
        genres: [],
        platforms: [],
        ratingAverage: 9,
        ratingCount: 1,
        libraryCount: 1,
      },
      {
        game: {
          id: 'game-b',
          title: 'B',
          slug: 'b',
          coverKey: null,
          releaseDate: new Date('2026-01-01T00:00:00.000Z'),
          featured: false,
          popularity: 2,
          franchiseId: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          ...GAME_CATALOG_DEFAULTS,
        },
        genres: [],
        platforms: [],
        ratingAverage: 8,
        ratingCount: 1,
        libraryCount: 1,
      },
    ];

    const recent = await service.listGames({ sort: 'recent', limit: 1 });
    expect(recent.items[0]?.id).toBe('game-a');
    const featured = await service.listGames({ sort: 'featured', limit: 1 });
    expect(featured.items[0]?.id).toBe('game-a');

    await expect(service.listGames({ sort: 'recent', cursor: 'bad' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.listGames({ sort: 'featured', cursor: 'bad' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('paginates popular sort and rejects mismatched cursors', async () => {
    discover.games = [
      {
        game: {
          id: 'game-pop-1',
          title: 'Popular A',
          slug: 'popular-a',
          coverKey: null,
          releaseDate: new Date('2026-01-01T00:00:00.000Z'),
          featured: false,
          popularity: 20,
          franchiseId: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          ...GAME_CATALOG_DEFAULTS,
        },
        genres: [],
        platforms: [],
        ratingAverage: 9,
        ratingCount: 1,
        libraryCount: 1,
      },
      {
        game: {
          id: 'game-pop-2',
          title: 'Popular B',
          slug: 'popular-b',
          coverKey: null,
          releaseDate: new Date('2026-01-02T00:00:00.000Z'),
          featured: false,
          popularity: 10,
          franchiseId: null,
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
          ...GAME_CATALOG_DEFAULTS,
        },
        genres: [],
        platforms: [],
        ratingAverage: 8,
        ratingCount: 1,
        libraryCount: 1,
      },
    ];

    const page1 = await service.listGames({ sort: 'popular', limit: 1 });
    expect(page1.items[0]?.id).toBe('game-pop-1');
    expect(page1.hasMore).toBe(true);

    const page2 = await service.listGames({
      sort: 'popular',
      limit: 1,
      cursor: page1.cursor.next ?? undefined,
    });
    expect(page2.items[0]?.id).toBe('game-pop-2');

    await expect(
      service.listGames({ cursor: page1.cursor.next ?? undefined }),
    ).rejects.toBeInstanceOf(BadRequestException);

    const badPopular = Buffer.from('p|1.5|game-1', 'utf8').toString('base64url');
    const badRecentDate = Buffer.from('r|bad-date|game-1', 'utf8').toString('base64url');
    const badDefaultPopularity = Buffer.from(
      'd|1|bad|2026-01-01T00:00:00.000Z|game-1',
      'utf8',
    ).toString('base64url');
    await expect(service.listGames({ sort: 'popular', cursor: badPopular })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.listGames({ sort: 'recent', cursor: badRecentDate }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.listGames({ cursor: badDefaultPopularity })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('passes genre, platform, and franchise filters to the repository', async () => {
    const spy = vi.spyOn(discover, 'listDiscoverGames');
    await service.listGames({
      genreId: 'genre-1',
      platformId: 'platform-1',
      franchiseId: 'franchise-1',
    });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        genreId: 'genre-1',
        platformId: 'platform-1',
        franchiseId: 'franchise-1',
      }),
    );
  });

  it('paginates featured sort and accepts recent games without release dates', async () => {
    discover.games = [
      {
        game: {
          id: 'game-featured',
          title: 'Featured',
          slug: 'featured',
          coverKey: null,
          releaseDate: null,
          featured: true,
          popularity: 1,
          franchiseId: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          ...GAME_CATALOG_DEFAULTS,
        },
        genres: [],
        platforms: [],
        ratingAverage: 9,
        ratingCount: 1,
        libraryCount: 1,
      },
      {
        game: {
          id: 'game-plain',
          title: 'Plain',
          slug: 'plain',
          coverKey: null,
          releaseDate: new Date('2026-01-01T00:00:00.000Z'),
          featured: false,
          popularity: 2,
          franchiseId: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          ...GAME_CATALOG_DEFAULTS,
        },
        genres: [],
        platforms: [],
        ratingAverage: 8,
        ratingCount: 1,
        libraryCount: 1,
      },
    ];

    const featuredPage1 = await service.listGames({ sort: 'featured', limit: 1 });
    expect(featuredPage1.items[0]?.id).toBe('game-featured');
    const featuredPage2 = await service.listGames({
      sort: 'featured',
      limit: 1,
      cursor: featuredPage1.cursor.next ?? undefined,
    });
    expect(featuredPage2.items[0]?.id).toBe('game-plain');

    const recentPage = await service.listGames({ sort: 'recent', limit: 5 });
    expect(recentPage.items.some((row) => row.id === 'game-featured')).toBe(true);
  });
});

const sampleGameCard: GameCardResponse = {
  id: 'g1',
  title: 'T',
  slug: 't',
  coverImageUrl: null,
  coverImage: null,
  // D3.25 catalog fields
  heroImageUrl: null,
  heroImage: null,
  summary: null,
  releaseDate: null,
  genres: [],
  platforms: [],
  ratingSummary: { average: null, count: 0 },
  libraryCount: 0,
};

describe('DiscoverService D3.22 discovery methods', () => {
  it('delegates listTrending games and non-game entities', async () => {
    const gamesPage = new PaginatedPayload([sampleGameCard], { next: null }, false, 5);
    const entityPage = new PaginatedPayload([{ id: 'r1', score: 3 }], { next: null }, false, 5);
    trending.listTrending = vi
      .fn()
      .mockResolvedValueOnce(gamesPage)
      .mockResolvedValueOnce(entityPage)
      .mockResolvedValueOnce(gamesPage);

    const games = await service.listTrending({ window: '7d', entity: 'games', limit: 5 });
    expect(trending.listTrending).toHaveBeenCalledWith({
      limit: 5,
      window: '7d',
      entity: 'games',
    });
    expect(games).toBe(gamesPage);

    const reviews = await service.listTrending({ window: '7d', entity: 'reviews', limit: 5 });
    expect(trending.listTrending).toHaveBeenCalledWith({
      limit: 5,
      window: '7d',
      entity: 'reviews',
    });
    expect(reviews).toBe(entityPage);

    await service.listTrending({});
    expect(trending.listTrending).toHaveBeenCalledWith({ limit: 20 });
  });

  it('listPopular forces popular sort on listGames', async () => {
    const spy = vi.spyOn(service, 'listGames');
    await service.listPopular({ limit: 3 });
    expect(spy).toHaveBeenCalledWith({ limit: 3, sort: 'popular' });
  });

  it('delegates listHiddenGems to DiscoveryScoreService', async () => {
    const page = new PaginatedPayload([sampleGameCard], { next: null }, false, 10);
    discoveryScores.listHiddenGems = vi.fn(async () => page);
    const result = await service.listHiddenGems({ limit: 10 });
    expect(discoveryScores.listHiddenGems).toHaveBeenCalledWith(10);
    expect(result.items[0]?.id).toBe('g1');
  });

  it('delegates listRecommended with viewer id for guests and players', async () => {
    const sample = [{ game: sampleGameCard, score: 0.7, reasonKey: 'popular_fresh' }];
    recommendations.recommendForUser = vi.fn(async () => sample);
    await expect(service.listRecommended(guest, { limit: 4 })).resolves.toEqual(sample);
    expect(recommendations.recommendForUser).toHaveBeenCalledWith(null, 4);
    await service.listRecommended(player, { limit: 4 });
    expect(recommendations.recommendForUser).toHaveBeenCalledWith('user-1', 4);
  });

  it('delegates similar games and users with sample payloads', async () => {
    const similarGames = [{ game: sampleGameCard, score: 0.8 }];
    const similarUsers = [
      {
        user: { id: 'user-2', handle: 'bob', displayName: 'Bob', avatarUrl: null },
        score: 0.4,
      },
    ];
    similarity.getSimilarGames = vi.fn(async () => similarGames);
    similarity.getSimilarUsers = vi.fn(async () => similarUsers);
    await expect(service.listSimilarGames('game-1', { limit: 2 })).resolves.toEqual(similarGames);
    await expect(service.listSimilarUsers('user-2', { limit: 3 })).resolves.toEqual(similarUsers);
    expect(similarity.getSimilarGames).toHaveBeenCalledWith('game-1', 2);
    expect(similarity.getSimilarUsers).toHaveBeenCalledWith('user-2', 3);
  });

  it('lists public collections ordered by follower count and resolves entry games', async () => {
    const owner = {
      id: 'owner-1',
      handle: 'owner',
      displayName: 'Owner',
      avatarKey: null,
      bannerKey: null,
      avatarBlurhash: null,
      avatarVariants: null,
      bannerBlurhash: null,
      bannerVariants: null,
      bio: null,
      privacyId: null,
      creatorFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    const gameRow = {
      id: 'game-1',
      title: 'Hollow Knight',
      slug: 'hollow-knight',
      coverKey: null,
      releaseDate: null,
      featured: false,
      popularity: 1,
      franchiseId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...GAME_CATALOG_DEFAULTS,
    };
    prisma.collection.findMany = async () => [
      {
        id: 'col-low',
        ownerId: 'owner-1',
        title: 'Low',
        description: null,
        visibility: 'public',
        type: 'manual',
        ruleKey: null,
        bannerKey: null,
        coverKey: null,
        color: null,
        tags: [],
        version: 0,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        deletedAt: null,
        owner,
        entries: [
          {
            id: 'entry-1',
            collectionId: 'col-low',
            gameId: 'game-1',
            position: 0,
            note: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        _count: { followers: 1 },
      },
      {
        id: 'col-mid',
        ownerId: 'owner-1',
        title: 'Mid',
        description: null,
        visibility: 'public',
        type: 'manual',
        ruleKey: null,
        bannerKey: null,
        coverKey: null,
        color: null,
        tags: [],
        version: 0,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-03T00:00:00.000Z'),
        deletedAt: null,
        owner,
        entries: [],
        _count: { followers: 5 },
      },
      {
        id: 'col-high',
        ownerId: 'owner-1',
        title: 'High',
        description: null,
        visibility: 'public',
        type: 'manual',
        ruleKey: null,
        bannerKey: null,
        coverKey: null,
        color: null,
        tags: [],
        version: 0,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        deletedAt: null,
        owner,
        entries: [],
        _count: { followers: 5 },
      },
    ];
    prisma.game.findMany = async () => [gameRow];
    const page = await service.listPublicCollections({ limit: 10 });
    expect(page.items.map((row) => row.id)).toEqual(['col-mid', 'col-high', 'col-low']);
    expect(page.items[0]?.followerCount).toBe(5);
    expect(page.items[2]?.entries[0]?.gameId).toBe('game-1');
  });
});
