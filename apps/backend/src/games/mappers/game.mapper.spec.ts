import type { GameCatalogMetadataRecord, GameDetailRecord, LibraryEntry } from '@gmrlog/database';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { GAME_CATALOG_DEFAULTS } from '../game-catalog.defaults';

import {
  toGameMediaResponse,
  toGameMetadataProjection,
  toGameRelatedGameResponse,
  toGameResponse,
  toGameTagSummary,
} from './game.mapper';

const BASE_URL = 'https://cdn.test.local/';
let previousBaseUrl: string | undefined;

beforeEach(() => {
  previousBaseUrl = process.env.MEDIA_PUBLIC_BASE_URL;
  process.env.MEDIA_PUBLIC_BASE_URL = BASE_URL;
});

afterEach(() => {
  if (previousBaseUrl === undefined) {
    delete process.env.MEDIA_PUBLIC_BASE_URL;
  } else {
    process.env.MEDIA_PUBLIC_BASE_URL = previousBaseUrl;
  }
});

function makeDetail(overrides: Partial<GameDetailRecord['game']> = {}): GameDetailRecord {
  return {
    game: {
      id: 'game-1',
      title: 'Hades',
      slug: 'hades',
      coverKey: null,
      releaseDate: new Date('2020-09-17T00:00:00.000Z'),
      featured: false,
      popularity: 10,
      franchiseId: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...GAME_CATALOG_DEFAULTS,
      ...overrides,
    },
    platforms: [],
    ratingAverage: null,
    ratingCount: 0,
    libraryCount: 0,
  } as GameDetailRecord;
}

const libraryEntry = {
  id: 'entry-1',
  userId: 'user-1',
  gameId: 'game-1',
  status: 'playing',
  source: 'manual',
  platformId: null,
  note: null,
  version: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as LibraryEntry;

describe('toGameMetadataProjection', () => {
  it('projects an un-enriched game with a null attribution', () => {
    const projection = toGameMetadataProjection({
      metadataStatus: 'pending',
      metadataProvider: null,
      metadataRefreshedAt: null,
    });

    expect(projection).toEqual({
      status: 'pending',
      provider: null,
      refreshedAt: null,
      attribution: null,
    });
  });

  it('projects an enriched game with its attribution string', () => {
    const projection = toGameMetadataProjection({
      metadataStatus: 'complete',
      metadataProvider: 'igdb',
      metadataRefreshedAt: new Date('2026-07-31T00:00:00.000Z'),
    });

    expect(projection.provider).toBe('igdb');
    expect(projection.refreshedAt).toBe('2026-07-31T00:00:00.000Z');
    expect(projection.attribution).toContain('IGDB');
  });
});

describe('toGameTagSummary', () => {
  it('projects id, name, slug and kind', () => {
    expect(
      toGameTagSummary({
        id: 'tag-1',
        name: 'Action',
        slug: 'action',
        kind: 'theme',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toEqual({ id: 'tag-1', name: 'Action', slug: 'action', kind: 'theme' });
  });
});

describe('toGameMediaResponse', () => {
  it('resolves the storage key to a public URL', () => {
    const media = toGameMediaResponse({
      id: 'media-1',
      gameId: 'game-1',
      kind: 'screenshot',
      storageKey: 'games/game-1/screenshot/a.jpg',
      provider: 'igdb',
      sourceUrl: 'https://images.igdb.com/a.jpg',
      sortOrder: 2,
      width: 1920,
      height: 1080,
      blurhash: null,
      variants: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(media.url).toBe(`${BASE_URL}games%2Fgame-1%2Fscreenshot%2Fa.jpg`);
    expect(media.sortOrder).toBe(2);
    expect(media.width).toBe(1920);
  });
});

describe('toGameResponse', () => {
  it('degrades cleanly with no catalog record — the pre-enrichment shape', () => {
    const response = toGameResponse(makeDetail(), null, null);

    expect(response.summary).toBeNull();
    expect(response.genres).toEqual([]);
    expect(response.tags).toEqual([]);
    expect(response.developers).toEqual([]);
    expect(response.publishers).toEqual([]);
    expect(response.franchise).toBeNull();
    expect(response.series).toBeNull();
    expect(response.screenshots).toEqual([]);
    expect(response.metadata.status).toBe('pending');
  });

  it('includes the library projection only for an authenticated viewer', () => {
    expect(toGameResponse(makeDetail(), libraryEntry, null).library).toEqual({
      status: 'playing',
      source: 'manual',
      ownershipIndicator: 'manual',
    });
    expect(toGameResponse(makeDetail(), null, null).library).toBeNull();
  });

  it('resolves cover and hero keys to public URLs', () => {
    const response = toGameResponse(
      makeDetail({ coverKey: 'games/game-1/cover/a.jpg', heroKey: 'games/game-1/hero/b.jpg' }),
      null,
      null,
    );

    expect(response.coverUrl).toBe(`${BASE_URL}games%2Fgame-1%2Fcover%2Fa.jpg`);
    expect(response.heroUrl).toBe(`${BASE_URL}games%2Fgame-1%2Fhero%2Fb.jpg`);
  });

  it('projects the full catalog record when one is supplied', () => {
    const catalog: NonNullable<Parameters<typeof toGameResponse>[2]> = {
      game: makeDetail().game,
      genres: [{ id: 'genre-1', name: 'Action', slug: 'action' }],
      tags: [
        {
          id: 'tag-1',
          name: 'Roguelike',
          slug: 'roguelike',
          kind: 'keyword',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      platforms: [{ id: 'platform-1', name: 'PC', slug: 'pc' }],
      companies: [
        {
          id: 'company-1',
          name: 'Supergiant Games',
          slug: 'supergiant-games',
          role: 'developer',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'company-1',
          name: 'Supergiant Games',
          slug: 'supergiant-games',
          role: 'publisher',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      series: {
        id: 'series-1',
        name: 'Supergiant Collection',
        slug: 'supergiant-collection',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      media: [
        {
          id: 'media-1',
          gameId: 'game-1',
          kind: 'screenshot',
          storageKey: 'games/game-1/screenshot/a.jpg',
          provider: 'igdb',
          sourceUrl: 'https://a/1.jpg',
          sortOrder: 0,
          width: null,
          height: null,
          blurhash: null,
          variants: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'media-2',
          gameId: 'game-1',
          kind: 'cover',
          storageKey: 'games/game-1/cover/a.jpg',
          provider: 'igdb',
          sourceUrl: 'https://a/2.jpg',
          sortOrder: 0,
          width: null,
          height: null,
          blurhash: null,
          variants: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      franchise: {
        id: 'franchise-1',
        name: 'Hades',
        slug: 'hades',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    };

    const response = toGameResponse(makeDetail(), null, catalog);

    expect(response.genres).toEqual([{ id: 'genre-1', name: 'Action', slug: 'action' }]);
    expect(response.developers).toEqual([
      { id: 'company-1', name: 'Supergiant Games', slug: 'supergiant-games' },
    ]);
    expect(response.publishers).toEqual([
      { id: 'company-1', name: 'Supergiant Games', slug: 'supergiant-games' },
    ]);
    expect(response.franchise).toEqual({ id: 'franchise-1', name: 'Hades', slug: 'hades' });
    expect(response.series).toEqual({
      id: 'series-1',
      name: 'Supergiant Collection',
      slug: 'supergiant-collection',
    });
    // Only screenshot-kind media enters the screenshots array.
    expect(response.screenshots).toHaveLength(1);
    expect(response.screenshots[0]?.kind).toBe('screenshot');
  });

  it('returns null franchise/series when the catalog record has none', () => {
    const catalog: GameCatalogMetadataRecord = {
      game: makeDetail().game,
      genres: [],
      tags: [],
      platforms: [],
      companies: [],
      series: null,
      media: [],
    };

    const response = toGameResponse(makeDetail(), null, catalog);

    expect(response.franchise).toBeNull();
    expect(response.series).toBeNull();
  });
});

describe('toGameRelatedGameResponse', () => {
  it('projects an unresolved relationship using the provider title', () => {
    const response = toGameRelatedGameResponse(
      { relatedGameId: null, relatedTitle: 'Dead Cells', kind: 'similar' },
      null,
    );

    expect(response).toEqual({
      gameId: null,
      title: 'Dead Cells',
      slug: null,
      coverImageUrl: null,
      kind: 'similar',
    });
  });

  it('prefers the resolved catalog row once the target exists', () => {
    const response = toGameRelatedGameResponse(
      { relatedGameId: 'game-2', relatedTitle: 'Dead Cells', kind: 'similar' },
      {
        id: 'game-2',
        title: 'Dead Cells',
        slug: 'dead-cells',
        coverKey: 'games/game-2/cover/a.jpg',
      },
    );

    expect(response.gameId).toBe('game-2');
    expect(response.slug).toBe('dead-cells');
    expect(response.coverImageUrl).toBe(`${BASE_URL}games%2Fgame-2%2Fcover%2Fa.jpg`);
  });
});
