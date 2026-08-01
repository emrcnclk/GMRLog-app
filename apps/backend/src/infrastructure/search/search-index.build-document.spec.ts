import { beforeEach, describe, expect, it, vi } from 'vitest';

const repoMocks = vi.hoisted(() => ({
  game: { findById: vi.fn() },
  user: { findById: vi.fn() },
  post: { findActiveById: vi.fn() },
  review: { findActiveById: vi.fn() },
  collection: { findActiveById: vi.fn() },
  tierList: { findActiveById: vi.fn() },
  community: { findActiveById: vi.fn() },
  event: { findActiveById: vi.fn() },
}));

vi.mock('@gmrlog/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@gmrlog/database')>();
  class GameRepoMock {
    findById = repoMocks.game.findById;
  }
  class UserRepoMock {
    findById = repoMocks.user.findById;
  }
  class PostRepoMock {
    findActiveById = repoMocks.post.findActiveById;
  }
  class ReviewRepoMock {
    findActiveById = repoMocks.review.findActiveById;
  }
  class CollectionRepoMock {
    findActiveById = repoMocks.collection.findActiveById;
  }
  class TierListRepoMock {
    findActiveById = repoMocks.tierList.findActiveById;
  }
  class CommunityRepoMock {
    findActiveById = repoMocks.community.findActiveById;
  }
  class EventRepoMock {
    findActiveById = repoMocks.event.findActiveById;
  }
  return {
    ...actual,
    PrismaGameRepository: GameRepoMock,
    PrismaUserRepository: UserRepoMock,
    PrismaPostRepository: PostRepoMock,
    PrismaReviewRepository: ReviewRepoMock,
    PrismaCollectionRepository: CollectionRepoMock,
    PrismaTierListRepository: TierListRepoMock,
    PrismaCommunityRepository: CommunityRepoMock,
    PrismaEventRepository: EventRepoMock,
  };
});

import { SearchIndexService } from './search-index.service';

describe('SearchIndexService.buildDocument', () => {
  const meili = {
    isAvailable: () => true,
    upsertDocuments: vi.fn(),
    deleteDocument: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds documents for every searchable entity', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    repoMocks.game.findById.mockResolvedValue({
      id: 'game-1',
      title: 'Hollow',
      slug: 'hollow',
      createdAt: now,
    });
    repoMocks.user.findById.mockResolvedValue({
      id: 'user-1',
      handle: 'player',
      displayName: 'Player',
      createdAt: now,
      deletedAt: null,
    });
    repoMocks.post.findActiveById.mockResolvedValue({
      id: 'post-1',
      authorId: 'user-1',
      body: 'Hello',
      visibility: 'public',
      postKind: 'text' as const,
      containsSpoilers: false,
      pinnedAt: null,
      createdAt: now,
    });
    repoMocks.review.findActiveById.mockResolvedValue({
      id: 'review-1',
      authorId: 'user-1',
      gameId: 'game-1',
      body: 'Great',
      visibility: 'public',
      postKind: 'text' as const,
      containsSpoilers: false,
      pinnedAt: null,
      createdAt: now,
    });
    repoMocks.collection.findActiveById.mockResolvedValue({
      id: 'collection-1',
      ownerId: 'user-1',
      title: 'Favorites',
      description: null,
      visibility: 'public',
      postKind: 'text' as const,
      containsSpoilers: false,
      pinnedAt: null,
      createdAt: now,
    });
    repoMocks.tierList.findActiveById.mockResolvedValue({
      id: 'tier-1',
      ownerId: 'user-1',
      title: '2026',
      visibility: 'public',
      postKind: 'text' as const,
      containsSpoilers: false,
      pinnedAt: null,
      createdAt: now,
    });
    repoMocks.community.findActiveById.mockResolvedValue({
      id: 'community-1',
      name: 'Culture',
      description: null,
      visibility: 'public',
      postKind: 'text' as const,
      containsSpoilers: false,
      pinnedAt: null,
      createdAt: now,
    });
    repoMocks.event.findActiveById.mockResolvedValue({
      id: 'event-1',
      title: 'Seasonal',
      kind: 'seasonal',
      createdAt: now,
    });

    // D3.25 — buildDocument's 'game' case joins gameGenre directly via Prisma.
    const prisma = { gameGenre: { findMany: vi.fn().mockResolvedValue([]) } };
    const service = new SearchIndexService(prisma as never, meili as never);
    await service.upsert('game', 'game-1');
    await service.upsert('user', 'user-1');
    await service.upsert('post', 'post-1');
    await service.upsert('review', 'review-1');
    await service.upsert('collection', 'collection-1');
    await service.upsert('tier-list', 'tier-1');
    await service.upsert('community', 'community-1');
    await service.upsert('event', 'event-1');

    expect(meili.upsertDocuments).toHaveBeenCalledTimes(8);
    repoMocks.user.findById.mockResolvedValue({ id: 'missing-user', deletedAt: now });
    await service.upsert('user', 'missing-user');
    expect(meili.deleteDocument).toHaveBeenCalled();
  });

  // D3.25 — docs/18_CATALOG/GAME_METADATA_ARCHITECTURE.md §6
  it('joins genres and carries the cover key onto the game document', async () => {
    repoMocks.game.findById.mockResolvedValue({
      id: 'game-1',
      title: 'Hades',
      slug: 'hades',
      coverKey: 'games/game-1/cover/a.jpg',
      summary: 'A rogue-like dungeon crawler.',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const prisma = {
      gameGenre: {
        findMany: vi
          .fn()
          .mockResolvedValue([
            { genre: { name: 'Indie' } },
            { genre: { name: 'Role-playing (RPG)' } },
          ]),
      },
    };
    const service = new SearchIndexService(prisma as never, meili as never);

    await service.upsert('game', 'game-1');

    expect(prisma.gameGenre.findMany).toHaveBeenCalledWith({
      where: { gameId: 'game-1' },
      include: { genre: true },
    });
    const [, documents] = meili.upsertDocuments.mock.calls[0] as [
      string,
      Record<string, unknown>[],
    ];
    expect(documents[0]).toMatchObject({
      coverKey: 'games/game-1/cover/a.jpg',
      genres: ['Indie', 'Role-playing (RPG)'],
      description: 'A rogue-like dungeon crawler.',
    });
  });
});

// D3.25.1 — the delete-on-missing branch was only exercised for 'user'.
// Cover the remaining types that follow the same findActiveById → null pattern.
describe('SearchIndexService.buildDocument — delete-on-missing for every soft-deletable type', () => {
  it('deletes the tier-list document when the row is gone', async () => {
    const meili = { isAvailable: () => true, upsertDocuments: vi.fn(), deleteDocument: vi.fn() };
    repoMocks.tierList.findActiveById.mockResolvedValue(null);
    const service = new SearchIndexService({} as never, meili as never);

    await service.upsert('tier-list', 'missing-tier-list');

    expect(meili.deleteDocument).toHaveBeenCalledWith('tier_lists', 'missing-tier-list');
    expect(meili.upsertDocuments).not.toHaveBeenCalled();
  });

  it('deletes the community document when the row is gone', async () => {
    const meili = { isAvailable: () => true, upsertDocuments: vi.fn(), deleteDocument: vi.fn() };
    repoMocks.community.findActiveById.mockResolvedValue(null);
    const service = new SearchIndexService({} as never, meili as never);

    await service.upsert('community', 'missing-community');

    expect(meili.deleteDocument).toHaveBeenCalledWith('communities', 'missing-community');
  });

  it('deletes the event document when the row is gone', async () => {
    const meili = { isAvailable: () => true, upsertDocuments: vi.fn(), deleteDocument: vi.fn() };
    repoMocks.event.findActiveById.mockResolvedValue(null);
    const service = new SearchIndexService({} as never, meili as never);

    await service.upsert('event', 'missing-event');

    expect(meili.deleteDocument).toHaveBeenCalledWith('events', 'missing-event');
  });

  it('deletes the collection document when the row is gone', async () => {
    const meili = { isAvailable: () => true, upsertDocuments: vi.fn(), deleteDocument: vi.fn() };
    repoMocks.collection.findActiveById.mockResolvedValue(null);
    const service = new SearchIndexService({} as never, meili as never);

    await service.upsert('collection', 'missing-collection');

    expect(meili.deleteDocument).toHaveBeenCalledWith('collections', 'missing-collection');
  });

  it('deletes the post document when the row is gone', async () => {
    const meili = { isAvailable: () => true, upsertDocuments: vi.fn(), deleteDocument: vi.fn() };
    repoMocks.post.findActiveById.mockResolvedValue(null);
    const service = new SearchIndexService({} as never, meili as never);

    await service.upsert('post', 'missing-post');

    expect(meili.deleteDocument).toHaveBeenCalledWith('posts', 'missing-post');
  });

  it('returns null for a game with no matching row (delete path)', async () => {
    const meili = { isAvailable: () => true, upsertDocuments: vi.fn(), deleteDocument: vi.fn() };
    repoMocks.game.findById.mockResolvedValue(null);
    const service = new SearchIndexService({} as never, meili as never);

    await service.upsert('game', 'missing-game');

    expect(meili.deleteDocument).toHaveBeenCalledWith('games', 'missing-game');
  });
});
