import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import type { RequestIdentity } from '../auth/interfaces/identity';

import { GamesService } from './games.service';
import {
  FakeGameMetadataRepository,
  makeCatalogRecord,
} from './metadata/testing/fake-metadata-repository';
import {
  createFakeGameRepository,
  createFakeLibraryEntryRepository,
  makeGame,
  makePlatform,
} from './testing/fake-repositories';

const player: RequestIdentity = { class: 'player', userId: 'user-1' };
const guest: RequestIdentity = { class: 'guest' };

const game = makeGame({ id: 'game-1', title: 'Hollow Knight', slug: 'hollow-knight' });

let gamesRepo: ReturnType<typeof createFakeGameRepository>;
let libraryRepo: ReturnType<typeof createFakeLibraryEntryRepository>;
let metadataRepo: FakeGameMetadataRepository;
let service: GamesService;

beforeEach(() => {
  gamesRepo = createFakeGameRepository([
    {
      game,
      detail: {
        game,
        platforms: [makePlatform({ id: 'platform-1', name: 'PC', slug: 'pc' })],
        ratingAverage: 4.5,
        ratingCount: 10,
        libraryCount: 3,
      },
    },
  ]);
  libraryRepo = createFakeLibraryEntryRepository([
    {
      id: 'entry-1',
      userId: 'user-1',
      gameId: 'game-1',
      status: 'playing',
      source: 'manual',
      platformId: null,
      note: null,
      version: 0,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  ]);
  metadataRepo = new FakeGameMetadataRepository([], [], [], makeCatalogRecord(game));
  // Franchise lookup only runs when `franchiseId` is set, which the fixture leaves null.
  const prisma = { franchise: { findUnique: async () => null } };
  service = new GamesService(gamesRepo, libraryRepo, metadataRepo, prisma as never);
});

describe('GamesService.getGame', () => {
  it('returns detail with library projection for authenticated viewer', async () => {
    const detail = await service.getGame('game-1', player);
    expect(detail).toMatchObject({
      id: 'game-1',
      title: 'Hollow Knight',
      library: { status: 'playing', source: 'manual', ownershipIndicator: 'manual' },
    });
  });

  it('omits library projection for guests', async () => {
    const detail = await service.getGame('game-1', guest);
    expect(detail.library).toBeNull();
  });

  it('throws when game is missing', async () => {
    await expect(service.getGame('missing', guest)).rejects.toBeInstanceOf(NotFoundException);
  });
});

// D3.25 — docs/18_CATALOG/GAME_METADATA_ARCHITECTURE.md §6
describe('GamesService catalog metadata projection', () => {
  it('projects catalog metadata onto the game response', async () => {
    const detail = await service.getGame('game-1', guest);

    expect(detail.genres).toEqual([{ id: 'genre-1', name: 'Metroidvania', slug: 'metroidvania' }]);
    expect(detail.metadata).toMatchObject({ status: 'pending', provider: null });
  });

  it('always includes the metadata block, even for an un-enriched game', async () => {
    const detail = await service.getGame('game-1', guest);

    expect(detail.metadata).toBeDefined();
    expect(detail.summary).toBeNull();
    expect(detail.tags).toEqual([]);
    expect(detail.developers).toEqual([]);
    expect(detail.publishers).toEqual([]);
    expect(detail.screenshots).toEqual([]);
  });

  it('resolves the cover key to a public URL', async () => {
    const detail = await service.getGame('game-1', guest);
    expect(detail.coverUrl).toContain('covers%2Fhollow-knight.jpg');
  });
});

describe('GamesService.listMedia', () => {
  it('returns an empty list for a game with no mirrored media', async () => {
    await expect(service.listMedia('game-1')).resolves.toEqual([]);
  });

  it('throws for a missing game', async () => {
    await expect(service.listMedia('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('GamesService.listSimilar', () => {
  it('returns an empty list when the provider declared no relationships', async () => {
    await expect(service.listSimilar('game-1')).resolves.toEqual([]);
  });

  it('throws for a missing game', async () => {
    await expect(service.listSimilar('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('GamesService.getMetadataStatus', () => {
  it('reports the enrichment lifecycle without triggering a provider call', async () => {
    const status = await service.getMetadataStatus('game-1');

    expect(status).toMatchObject({
      gameId: 'game-1',
      metadata: { status: 'pending', provider: null, refreshedAt: null, attribution: null },
    });
  });

  it('throws for a missing game', async () => {
    await expect(service.getMetadataStatus('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('GamesService.listSimilar with resolved targets', () => {
  it('resolves a related game once its target exists in the catalog', async () => {
    const relatedGamesRepo = new FakeGameMetadataRepository(
      [],
      [],
      [
        {
          id: 'related-1',
          gameId: 'game-1',
          relatedGameId: 'game-2',
          provider: 'igdb',
          relatedExternalId: '7346',
          relatedTitle: 'Dead Cells',
          kind: 'similar',
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      makeCatalogRecord(game),
    );
    const otherGame = makeGame({
      id: 'game-2',
      title: 'Dead Cells',
      slug: 'dead-cells',
      coverKey: null,
    });
    const gamesRepoWithTwo = createFakeGameRepository([
      {
        game,
        detail: {
          game,
          platforms: [],
          ratingAverage: null,
          ratingCount: 0,
          libraryCount: 0,
        },
      },
      {
        game: otherGame,
        detail: {
          game: otherGame,
          platforms: [],
          ratingAverage: null,
          ratingCount: 0,
          libraryCount: 0,
        },
      },
    ]);
    const prisma = { franchise: { findUnique: async () => null } };
    const svc = new GamesService(gamesRepoWithTwo, libraryRepo, relatedGamesRepo, prisma as never);

    const similar = await svc.listSimilar('game-1');

    expect(similar).toEqual([
      {
        gameId: 'game-2',
        title: 'Dead Cells',
        slug: 'dead-cells',
        coverImageUrl: null, // otherGame's coverKey is explicitly null
        kind: 'similar',
      },
    ]);
  });
});

describe('GamesService — franchise projection', () => {
  it('loads the franchise when the game has one', async () => {
    const gameWithFranchise = makeGame({
      id: 'game-1',
      title: 'Hollow Knight',
      slug: 'hollow-knight',
      franchiseId: 'franchise-1',
    });
    const gamesRepoWithFranchise = createFakeGameRepository([
      {
        game: gameWithFranchise,
        detail: {
          game: gameWithFranchise,
          platforms: [],
          ratingAverage: null,
          ratingCount: 0,
          libraryCount: 0,
        },
      },
    ]);
    const prisma = {
      franchise: {
        findUnique: async () => ({
          id: 'franchise-1',
          name: 'Hollow Knight',
          slug: 'hollow-knight',
        }),
      },
    };
    const svc = new GamesService(
      gamesRepoWithFranchise,
      libraryRepo,
      new FakeGameMetadataRepository([], [], [], makeCatalogRecord(gameWithFranchise)),
      prisma as never,
    );

    const detail = await svc.getGame('game-1', guest);

    expect(detail.franchise).toEqual({
      id: 'franchise-1',
      name: 'Hollow Knight',
      slug: 'hollow-knight',
    });
  });
});
