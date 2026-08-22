import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BecauseYouPlayedService } from './because-you-played.service';

describe('BecauseYouPlayedService', () => {
  const communities = {
    findManyByIds: vi.fn().mockResolvedValue([]),
  };
  const eventParticipations = {
    countAttendeesByEvents: vi.fn().mockResolvedValue([]),
  };
  const prisma = {
    libraryEntry: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    game: { findUnique: vi.fn() },
    review: { findMany: vi.fn() },
    collectionEntry: { findMany: vi.fn() },
    collection: { findMany: vi.fn() },
    community: { findMany: vi.fn() },
    communityMember: { count: vi.fn(), findUnique: vi.fn() },
    event: { findMany: vi.fn() },
    post: { findMany: vi.fn() },
  };
  const recommendations = {
    recommendForUser: vi.fn(),
  };

  let service: BecauseYouPlayedService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.review.findMany.mockResolvedValue([]);
    prisma.collectionEntry.findMany.mockResolvedValue([]);
    prisma.collection.findMany.mockResolvedValue([]);
    prisma.community.findMany.mockResolvedValue([]);
    prisma.event.findMany.mockResolvedValue([]);
    prisma.post.findMany.mockResolvedValue([]);
    service = new BecauseYouPlayedService(
      prisma as never,
      recommendations as never,
      communities as never,
      eventParticipations as never,
    );
  });

  it('requires authentication', async () => {
    await expect(service.build({ class: 'guest' }, {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns empty module when library has no seed', async () => {
    prisma.libraryEntry.findFirst.mockResolvedValue(null);
    const result = await service.build({ class: 'player', userId: 'user-1' }, {});
    expect(result.reasonKey).toBe('because_you_played');
    expect(result.recommended).toEqual([]);
    expect(result.sourceGameId).toBe('');
  });

  it('builds sections from a library seed with deterministic reasonKey', async () => {
    prisma.libraryEntry.findFirst.mockResolvedValue({
      game: { id: 'seed-1', title: 'Dark Souls' },
    });
    recommendations.recommendForUser.mockResolvedValue([
      {
        game: {
          id: 'rec-1',
          slug: 'lies-of-p',
          title: 'Lies of P',
          coverImageUrl: null,
          releaseDate: null,
          genres: [],
          platforms: [],
          ratingSummary: { average: null, count: 0 },
          libraryCount: 0,
        },
        score: 0.9,
        reasonKey: 'because_you_played',
      },
    ]);

    const result = await service.build({ class: 'player', userId: 'user-1' }, {});

    expect(result.sourceGameId).toBe('seed-1');
    expect(result.sourceGameTitle).toBe('Dark Souls');
    expect(result.reasonKey).toBe('because_you_played');
    expect(result.recommended.map((g) => g.id)).toEqual(['rec-1']);
    expect(result.relatedReviews).toEqual([]);
    expect(result.collections).toEqual([]);
    expect(result.communities).toEqual([]);
    expect(result.events).toEqual([]);
    expect(result.guides).toEqual([]);
  });

  it('resolves explicit seedGameId from library then catalog', async () => {
    prisma.libraryEntry.findUnique.mockResolvedValueOnce(null);
    prisma.game.findUnique.mockResolvedValueOnce({ id: 'seed-x', title: 'Sekiro' });
    recommendations.recommendForUser.mockResolvedValue([]);

    const result = await service.build(
      { class: 'player', userId: 'user-1' },
      { seedGameId: 'seed-x' },
    );
    expect(result.sourceGameId).toBe('seed-x');
    expect(result.sourceGameTitle).toBe('Sekiro');
  });

  it('loads related sections and paginates with cursor', async () => {
    prisma.libraryEntry.findFirst.mockResolvedValue({
      game: { id: 'seed-1', title: 'Dark Souls' },
    });
    recommendations.recommendForUser.mockResolvedValue(
      Array.from({ length: 3 }, (_, i) => ({
        game: {
          id: `rec-${i + 1}`,
          slug: `g-${i + 1}`,
          title: `Game ${i + 1}`,
          coverImageUrl: null,
          releaseDate: null,
          genres: [],
          platforms: [],
          ratingSummary: { average: null, count: 0 },
          libraryCount: 0,
        },
        score: 1 - i * 0.1,
        reasonKey: 'because_you_played',
      })),
    );
    prisma.review.findMany.mockResolvedValue([
      {
        id: 'r1',
        authorId: 'a1',
        gameId: 'seed-1',
        body: 'good',
        rating: 5,
        visibility: 'public',
        containsSpoilers: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        author: makeAuthor(),
      },
    ]);
    prisma.collectionEntry.findMany.mockResolvedValue([{ collectionId: 'c1' }]);
    prisma.collection.findMany.mockResolvedValue([
      {
        id: 'c1',
        ownerId: 'a1',
        title: 'Favs',
        description: null,
        visibility: 'public',
        type: 'manual',
        ruleKey: null,
        bannerKey: null,
        coverKey: null,
        color: null,
        tags: [],
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        owner: makeAuthor(),
      },
    ]);
    prisma.community.findMany.mockResolvedValue([
      {
        id: 'com-1',
        name: 'Souls',
        slug: 'souls',
        description: null,
        visibility: 'public',
        avatarKey: null,
        bannerKey: null,
        avatarBlurhash: null,
        avatarVariants: null,
        bannerBlurhash: null,
        bannerVariants: null,
        joinType: 'public',
        tags: ['seed-1'],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ]);
    prisma.communityMember.count.mockResolvedValue(3);
    prisma.communityMember.findUnique.mockResolvedValue(null);
    prisma.event.findMany.mockResolvedValue([
      {
        id: 'e1',
        title: 'Cup',
        kind: 'tournament',
        description: null,
        startsAt: new Date(),
        endsAt: null,
        gameId: 'seed-1',
        communityId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ]);
    prisma.post.findMany.mockResolvedValue([
      {
        id: 'p1',
        authorId: 'a1',
        gameId: 'rec-1',
        communityId: null,
        body: 'guide',
        visibility: 'public',
        postKind: 'guide',
        containsSpoilers: false,
        pinnedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        author: makeAuthor(),
      },
    ]);

    const page = await service.build(
      { class: 'player', userId: 'user-1' },
      { limit: 1, cursor: Buffer.from('0', 'utf8').toString('base64url') },
    );
    expect(page.recommended).toHaveLength(1);
    expect(page.nextCursor).not.toBeNull();
    expect(page.relatedReviews).toHaveLength(1);
    expect(page.collections).toHaveLength(1);
    expect(page.communities).toHaveLength(1);
    expect(page.events).toHaveLength(1);
    expect(page.guides).toHaveLength(1);
  });

  it('rejects invalid cursors', async () => {
    prisma.libraryEntry.findFirst.mockResolvedValue({
      game: { id: 'seed-1', title: 'Dark Souls' },
    });
    recommendations.recommendForUser.mockResolvedValue([]);
    await expect(
      service.build(
        { class: 'player', userId: 'user-1' },
        { cursor: Buffer.from('nope', 'utf8').toString('base64url') },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function makeAuthor() {
  return {
    id: 'a1',
    handle: 'author',
    displayName: 'Author',
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
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}
