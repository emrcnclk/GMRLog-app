import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RequestIdentity } from '../auth/interfaces/identity';

import { SearchService } from './search.service';
import { createFakeSearchRepository } from './testing/fake-repositories';
import { GAME_CATALOG_DEFAULTS } from '../games/game-catalog.defaults';

const guest: RequestIdentity = { class: 'guest' };
const player: RequestIdentity = { class: 'player', userId: 'user-1' };

const fakeFollows = {
  async exists() {
    return false;
  },
};

const gameHit = {
  type: 'game' as const,
  id: 'game-1',
  orderedAt: new Date('2026-01-03T00:00:00.000Z'),
  game: {
    id: 'game-1',
    title: 'Hollow Knight',
    slug: 'hollow-knight',
    coverKey: null,
    releaseDate: null,
    featured: false,
    popularity: 0,
    franchiseId: null,
    createdAt: new Date('2026-01-03T00:00:00.000Z'),
    updatedAt: new Date('2026-01-03T00:00:00.000Z'),
    ...GAME_CATALOG_DEFAULTS,
  },
};
const userHit = {
  type: 'user' as const,
  id: 'user-2',
  orderedAt: new Date('2026-01-02T00:00:00.000Z'),
  user: {
    id: 'user-2',
    handle: 'hollow',
    displayName: 'Hollow Fan',
    bio: null,
    avatarKey: null,
    bannerKey: null,
    avatarBlurhash: null,
    avatarVariants: null,
    bannerBlurhash: null,
    bannerVariants: null,
    privacyId: null,
    firstName: null,
    lastName: null,
    birthDate: null,
    countryCode: null,
    creatorFeatured: false,
    accountKind: 'individual' as const,
    cardNumber: 1,
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
  },
};
const postHit = {
  type: 'post' as const,
  id: 'post-1',
  orderedAt: new Date('2026-01-01T00:00:00.000Z'),
  post: {
    id: 'post-1',
    authorId: 'user-1',
    gameId: null,
    communityId: null,
    body: 'Hollow Knight is great',
    visibility: 'public' as const,
    postKind: 'text' as const,
    containsSpoilers: false,
    pinnedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  },
};

let searchRepo: ReturnType<typeof createFakeSearchRepository>;
let service: SearchService;

beforeEach(() => {
  searchRepo = createFakeSearchRepository([gameHit, userHit, postHit]);
  service = new SearchService(searchRepo, null, null, fakeFollows as never);
});

describe('SearchService.search', () => {
  it('returns matching hits newest-first for guests', async () => {
    const page = await service.search(guest, { q: 'hollow' });
    expect(page.items.map((row) => row.id)).toEqual(['game-1', 'user-2', 'post-1']);
    expect(page.items[0]).toMatchObject({
      type: 'game',
      summary: { title: 'Hollow Knight', slug: 'hollow-knight' },
    });
    expect(page.cursor.next).toBeNull();
  });

  it('returns empty results when nothing matches', async () => {
    const page = await service.search(guest, { q: 'missing-term' });
    expect(page.items).toEqual([]);
    expect(page.hasMore).toBe(false);
  });

  it('paginates with opaque cursors', async () => {
    const page1 = await service.search(guest, { q: 'hollow', limit: 1 });
    expect(page1.items.length).toBe(1);
    expect(page1.items[0]?.id).toBe('game-1');
    expect(page1.hasMore).toBe(true);

    const page2 = await service.search(guest, {
      q: 'hollow',
      limit: 1,
      cursor: page1.cursor.next ?? undefined,
    });
    expect(page2.items[0]?.id).toBe('user-2');
  });

  it('rejects invalid cursors', async () => {
    await expect(service.search(guest, { q: 'hollow', cursor: 'bad' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    const unknownType = Buffer.from('2026-01-01T00:00:00.000Z|unknown|post-1', 'utf8').toString(
      'base64url',
    );
    await expect(
      service.search(guest, { q: 'hollow', cursor: unknownType }),
    ).rejects.toBeInstanceOf(BadRequestException);
    const missingSeparator = Buffer.from('2026-01-01T00:00:00.000Z', 'utf8').toString('base64url');
    await expect(
      service.search(guest, { q: 'hollow', cursor: missingSeparator }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('passes viewer id for authenticated searches', async () => {
    await service.search(player, { q: 'hollow' });
    expect(searchRepo.hits.length).toBe(3);
  });
  it('filters hits by types when provided', async () => {
    const page = await service.search(guest, { q: 'hollow', types: ['game'] });
    expect(page.items.map((row) => row.type)).toEqual(['game']);
    expect(page.items[0]?.id).toBe('game-1');
  });
  it('returns empty when types exclude all matches', async () => {
    const page = await service.search(guest, { q: 'hollow', types: ['achievement'] });
    expect(page.items).toEqual([]);
  });
});
describe('SearchService.search Prisma achievement / tag fallbacks', () => {
  const prisma = {
    achievement: {
      findMany: vi.fn(),
    },
    genre: {
      findMany: vi.fn(),
    },
  };
  beforeEach(() => {
    prisma.achievement.findMany.mockReset();
    prisma.genre.findMany.mockReset();
    prisma.achievement.findMany.mockResolvedValue([
      {
        id: 'ach-1',
        title: 'Hollow Milestone',
        category: 'milestones',
        createdAt: new Date('2026-01-04T00:00:00.000Z'),
      },
    ]);
    prisma.genre.findMany.mockResolvedValue([
      {
        id: 'genre-1',
        name: 'Hollow Genre',
        slug: 'hollow-genre',
        createdAt: new Date('2026-01-05T00:00:00.000Z'),
      },
    ]);
    searchRepo = createFakeSearchRepository([gameHit, userHit, postHit]);
    service = new SearchService(searchRepo, null, null, fakeFollows as never, prisma as never);
  });
  it('merges achievement and tag hits from Prisma', async () => {
    const page = await service.search(guest, { q: 'hollow' });
    expect(page.items.map((row) => row.id)).toEqual([
      'genre-1',
      'ach-1',
      'game-1',
      'user-2',
      'post-1',
    ]);
    expect(page.items[0]).toMatchObject({
      type: 'tag',
      summary: { name: 'Hollow Genre', slug: 'hollow-genre' },
    });
    expect(page.items[1]).toMatchObject({
      type: 'achievement',
      summary: { name: 'Hollow Milestone', category: 'milestones' },
    });
  });
  it('returns only achievement hits when types filters to achievement', async () => {
    const page = await service.search(guest, { q: 'hollow', types: ['achievement'] });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({ type: 'achievement', id: 'ach-1' });
    expect(prisma.genre.findMany).not.toHaveBeenCalled();
  });
  it('returns only tag hits when types filters to tag', async () => {
    const page = await service.search(guest, { q: 'hollow', types: ['tag'] });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({ type: 'tag', id: 'genre-1' });
    expect(prisma.achievement.findMany).not.toHaveBeenCalled();
  });
  it('skips Prisma fallbacks when types exclude achievement and tag', async () => {
    const page = await service.search(guest, { q: 'hollow', types: ['game', 'user'] });
    expect(page.items.map((row) => row.type)).toEqual(['game', 'user']);
    expect(prisma.achievement.findMany).not.toHaveBeenCalled();
    expect(prisma.genre.findMany).not.toHaveBeenCalled();
  });
});
describe('SearchService.search via Meilisearch', () => {
  const meili = {
    isAvailable: () => true,
    multiSearch: vi.fn(),
  };
  const searchIndex = {
    meiliDocumentToHitRecord: vi.fn(
      (document: { id: string; type: string; orderedAt: string; visibility?: string }) => ({
        type: document.type,
        id: document.id,
        orderedAt: new Date(document.orderedAt),
        game:
          document.type === 'game'
            ? {
                id: document.id,
                title: 'Hollow',
                slug: 'hollow',
                coverKey: null,
                releaseDate: null,
                featured: false,
                popularity: 0,
                franchiseId: null,
                createdAt: new Date(document.orderedAt),
                updatedAt: new Date(document.orderedAt),
                ...GAME_CATALOG_DEFAULTS,
              }
            : undefined,
        user:
          document.type === 'user'
            ? {
                id: document.id,
                handle: 'player',
                displayName: 'Player',
                bio: null,
                avatarKey: null,
                bannerKey: null,
                avatarBlurhash: null,
                avatarVariants: null,
                bannerBlurhash: null,
                bannerVariants: null,
                privacyId: null,
                firstName: null,
                lastName: null,
                birthDate: null,
                countryCode: null,
                createdAt: new Date(document.orderedAt),
                updatedAt: new Date(document.orderedAt),
                deletedAt: null,
              }
            : undefined,
        post:
          document.type === 'post'
            ? {
                id: document.id,
                authorId: 'user-1',
                gameId: null,
                communityId: null,
                body: 'hidden followers post',
                visibility: document.visibility ?? 'public',
                createdAt: new Date(document.orderedAt),
                updatedAt: new Date(document.orderedAt),
                deletedAt: null,
              }
            : undefined,
      }),
    ),
  };
  const follows = {
    exists: vi.fn(async (_viewerId: string, ownerId: string) => ownerId === 'owner-1'),
  };
  beforeEach(() => {
    meili.multiSearch.mockResolvedValue([
      {
        document: {
          id: 'game-1',
          type: 'game',
          orderedAt: '2026-01-03T00:00:00.000Z',
          title: 'Hollow',
        },
        indexKey: 'games',
      },
      {
        document: {
          id: 'post-1',
          type: 'post',
          orderedAt: '2026-01-02T00:00:00.000Z',
          visibility: 'followers',
          authorId: 'owner-1',
          body: 'followers only',
        },
        indexKey: 'posts',
      },
      {
        document: {
          id: 'post-2',
          type: 'post',
          orderedAt: '2026-01-01T00:00:00.000Z',
          visibility: 'private',
          authorId: 'owner-2',
          body: 'private',
        },
        indexKey: 'posts',
      },
    ]);
  });
  it('filters meili hits by visibility and paginates', async () => {
    const meiliService = new SearchService(
      searchRepo,
      meili as never,
      searchIndex as never,
      follows as never,
    );
    const page = await meiliService.search(player, { q: 'hollow', limit: 1 });
    expect(page.items.map((row) => row.id)).toEqual(['game-1']);
    expect(page.hasMore).toBe(true);
    const nextPage = await meiliService.search(player, {
      q: 'hollow',
      limit: 5,
      cursor: page.cursor.next ?? undefined,
    });
    expect(nextPage.items.some((row) => row.id === 'post-1')).toBe(true);
    expect(nextPage.items.some((row) => row.id === 'post-2')).toBe(false);
  });
  it('returns empty results for blank meili queries', async () => {
    const meiliService = new SearchService(
      searchRepo,
      meili as never,
      searchIndex as never,
      follows as never,
    );
    const page = await meiliService.search(guest, { q: '   ' });
    expect(page.items).toEqual([]);
  });
  it('allows owners to see private meili hits and uses follow cache', async () => {
    meili.multiSearch.mockResolvedValue([
      {
        document: {
          id: 'post-private',
          type: 'post',
          orderedAt: '2026-01-02T00:00:00.000Z',
          visibility: 'private',
          authorId: 'user-1',
          body: 'mine',
        },
        indexKey: 'posts',
      },
      {
        document: {
          id: 'post-followers',
          type: 'post',
          orderedAt: '2026-01-01T00:00:00.000Z',
          visibility: 'followers',
          authorId: 'owner-2',
          body: 'followers',
        },
        indexKey: 'posts',
      },
    ]);
    searchIndex.meiliDocumentToHitRecord.mockImplementation(((document: {
      id: string;
      type: string;
      orderedAt: string;
      visibility?: string;
      body?: string;
    }) => ({
      type: document.type,
      id: document.id,
      orderedAt: new Date(document.orderedAt),
      game: undefined,
      user: undefined,
      post: {
        id: document.id,
        authorId: document.type === 'post' ? 'user-1' : 'owner-2',
        gameId: null,
        communityId: null,
        body: document.body ?? '',
        visibility: 'private',
        createdAt: new Date(document.orderedAt),
        updatedAt: new Date(document.orderedAt),
        deletedAt: null,
      },
    })) as never);
    const meiliService = new SearchService(
      searchRepo,
      meili as never,
      searchIndex as never,
      follows as never,
    );
    const ownerView = await meiliService.search(
      { class: 'player', userId: 'user-1' },
      { q: 'mine', limit: 5 },
    );
    expect(ownerView.items.some((row) => row.id === 'post-private')).toBe(true);
    follows.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    const followerView = await meiliService.search(
      { class: 'player', userId: 'user-3' },
      { q: 'followers', limit: 5 },
    );
    expect(followerView.items.some((row) => row.id === 'post-followers')).toBe(true);
    expect(follows.exists).toHaveBeenCalled();
  });
  it('hides private hits from guests and paginates ties by type rank', async () => {
    meili.multiSearch.mockResolvedValue([
      {
        document: {
          id: 'post-private-guest',
          type: 'post',
          orderedAt: '2026-01-02T00:00:00.000Z',
          visibility: 'private',
          authorId: 'owner-1',
          body: 'secret',
        },
        indexKey: 'posts',
      },
      {
        document: {
          id: 'game-same-time',
          type: 'game',
          orderedAt: '2026-01-02T00:00:00.000Z',
          title: 'Same time game',
        },
        indexKey: 'games',
      },
      {
        document: {
          id: 'user-after',
          type: 'user',
          orderedAt: '2026-01-01T00:00:00.000Z',
          handle: 'later',
        },
        indexKey: 'users',
      },
    ]);
    searchIndex.meiliDocumentToHitRecord.mockImplementation(((document: {
      id: string;
      type: string;
      orderedAt: string;
    }) => ({
      type: document.type,
      id: document.id,
      orderedAt: new Date(document.orderedAt),
      game:
        document.type === 'game'
          ? {
              id: document.id,
              title: 'Game',
              slug: 'game',
              coverKey: null,
              releaseDate: null,
              featured: false,
              popularity: 0,
              franchiseId: null,
              createdAt: new Date(document.orderedAt),
              updatedAt: new Date(document.orderedAt),
              ...GAME_CATALOG_DEFAULTS,
            }
          : undefined,
      user:
        document.type === 'user'
          ? {
              id: document.id,
              handle: 'user',
              displayName: 'User',
              bio: null,
              avatarKey: null,
              bannerKey: null,
              avatarBlurhash: null,
              avatarVariants: null,
              bannerBlurhash: null,
              bannerVariants: null,
              privacyId: null,
              firstName: null,
              lastName: null,
              birthDate: null,
              countryCode: null,
              createdAt: new Date(document.orderedAt),
              updatedAt: new Date(document.orderedAt),
              deletedAt: null,
            }
          : undefined,
      post:
        document.type === 'post'
          ? {
              id: document.id,
              authorId: 'owner-1',
              gameId: null,
              communityId: null,
              body: 'secret',
              visibility: 'private',
              createdAt: new Date(document.orderedAt),
              updatedAt: new Date(document.orderedAt),
              deletedAt: null,
            }
          : undefined,
    })) as never);
    const meiliService = new SearchService(
      searchRepo,
      meili as never,
      searchIndex as never,
      follows as never,
    );
    const guestView = await meiliService.search(guest, { q: 'secret', limit: 5 });
    expect(guestView.items.some((row) => row.id === 'post-private-guest')).toBe(false);
    expect(guestView.items[0]?.id).toBe('game-same-time');
    const page1 = await meiliService.search(player, { q: 'secret', limit: 1 });
    expect(page1.items[0]?.id).toBe('game-same-time');
    expect(page1.hasMore).toBe(true);
    const page2 = await meiliService.search(player, {
      q: 'secret',
      limit: 5,
      cursor: page1.cursor.next ?? undefined,
    });
    expect(page2.items.some((row) => row.id === 'user-after')).toBe(true);
  });
  it('reuses follow lookups and hides follower posts without owners', async () => {
    meili.multiSearch.mockResolvedValue([
      {
        document: {
          id: 'post-a',
          type: 'post',
          orderedAt: '2026-01-01T00:00:00.000Z',
          visibility: 'followers',
          authorId: 'owner-1',
          body: 'a',
        },
        indexKey: 'posts',
      },
      {
        document: {
          id: 'post-b',
          type: 'post',
          orderedAt: '2026-01-01T00:00:00.000Z',
          visibility: 'followers',
          authorId: 'owner-1',
          body: 'b',
        },
        indexKey: 'posts',
      },
      {
        document: {
          id: 'post-no-owner',
          type: 'post',
          orderedAt: '2026-01-01T00:00:00.000Z',
          visibility: 'followers',
          body: 'hidden',
        },
        indexKey: 'posts',
      },
    ]);
    searchIndex.meiliDocumentToHitRecord.mockImplementation(((document: {
      id: string;
      type: string;
      orderedAt: string;
      authorId?: string;
      body?: string;
    }) => ({
      type: document.type,
      id: document.id,
      orderedAt: new Date(document.orderedAt),
      game: undefined,
      user: undefined,
      post: {
        id: document.id,
        authorId: document.authorId ?? 'owner-1',
        gameId: null,
        communityId: null,
        body: document.body ?? '',
        visibility: 'followers',
        createdAt: new Date(document.orderedAt),
        updatedAt: new Date(document.orderedAt),
        deletedAt: null,
      },
    })) as never);
    const meiliService = new SearchService(
      searchRepo,
      meili as never,
      searchIndex as never,
      follows as never,
    );
    const page = await meiliService.search(
      { class: 'player', userId: 'viewer-1' },
      { q: 'follow', limit: 5 },
    );
    expect(page.items.map((row) => row.id)).toEqual(['post-b', 'post-a']);
    expect(page.items.some((row) => row.id === 'post-no-owner')).toBe(false);
    expect(follows.exists).toHaveBeenCalled();
  });
});
