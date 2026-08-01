/**
 * Deterministic provider doubles for service / processor tests (D3.25).
 * No test performs network I/O — docs/18_CATALOG/METADATA_PROVIDERS.md §8.
 */

import {
  emptyProviderMetadata,
  type GameMetadataProvider,
  type MetadataProviderName,
  type ProviderGameMetadata,
  type ProviderLookupQuery,
} from '../providers/metadata-provider.port';

/** Always disabled. Models the zero-credential deployment. */
export class NullMetadataProvider implements GameMetadataProvider {
  constructor(
    readonly name: MetadataProviderName = 'igdb',
    readonly priority = 10,
  ) {}

  isEnabled(): boolean {
    return false;
  }

  lookup(): Promise<ProviderGameMetadata | null> {
    return Promise.resolve(null);
  }
}

export interface FakeMetadataProviderOptions {
  name?: MetadataProviderName;
  priority?: number;
  enabled?: boolean;
  result?: ProviderGameMetadata | null;
  error?: Error;
}

export class FakeMetadataProvider implements GameMetadataProvider {
  readonly name: MetadataProviderName;
  readonly priority: number;
  readonly calls: ProviderLookupQuery[] = [];

  private readonly enabled: boolean;
  private readonly result: ProviderGameMetadata | null;
  private readonly error: Error | undefined;

  constructor(options: FakeMetadataProviderOptions = {}) {
    this.name = options.name ?? 'igdb';
    this.priority = options.priority ?? 10;
    this.enabled = options.enabled ?? true;
    this.result = options.result ?? null;
    this.error = options.error;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  lookup(query: ProviderLookupQuery): Promise<ProviderGameMetadata | null> {
    this.calls.push(query);
    if (this.error !== undefined) {
      return Promise.reject(this.error);
    }
    return Promise.resolve(this.result);
  }
}

/** Fully-populated fixture — every field the applier can write. */
export function completeProviderMetadata(
  overrides: Partial<ProviderGameMetadata> = {},
): ProviderGameMetadata {
  const base = emptyProviderMetadata('igdb', 'Game data provided by IGDB (igdb.com)');
  return {
    ...base,
    confidence: 0.95,
    externalIds: { igdbId: 1905, steamAppId: 1145360 },
    title: 'Hades',
    summary: 'A rogue-like dungeon crawler.',
    description: 'Defy the god of the dead as you hack and slash out of the Underworld.',
    releaseDate: new Date('2020-09-17T00:00:00.000Z'),
    externalRating: 91.5,
    externalRatingCount: 1200,
    genres: [
      { name: 'Indie', slug: 'indie' },
      { name: 'Role-playing (RPG)', slug: 'role-playing-rpg' },
    ],
    tags: [
      { name: 'Action', slug: 'action', kind: 'theme' },
      { name: 'Single player', slug: 'single-player', kind: 'mode' },
    ],
    platforms: [
      { name: 'PC (Microsoft Windows)', slug: 'pc-microsoft-windows' },
      { name: 'Nintendo Switch', slug: 'nintendo-switch' },
    ],
    companies: [
      { name: 'Supergiant Games', slug: 'supergiant-games', role: 'developer' },
      { name: 'Supergiant Games', slug: 'supergiant-games', role: 'publisher' },
    ],
    franchise: { name: 'Hades', slug: 'hades' },
    series: { name: 'Supergiant Collection', slug: 'supergiant-collection' },
    similarGames: [
      { externalId: '7346', title: 'Dead Cells', kind: 'similar', sortOrder: 0 },
      { externalId: '11208', title: 'Bastion', kind: 'similar', sortOrder: 1 },
    ],
    media: [
      {
        kind: 'cover',
        url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.jpg',
        width: 264,
        height: 352,
        sortOrder: 0,
      },
      {
        kind: 'hero',
        url: 'https://images.igdb.com/igdb/image/upload/t_1080p/ar8h9.jpg',
        width: 1920,
        height: 1080,
        sortOrder: 0,
      },
      {
        kind: 'screenshot',
        url: 'https://images.igdb.com/igdb/image/upload/t_screenshot_huge/sc8v1x.jpg',
        width: 1920,
        height: 1080,
        sortOrder: 0,
      },
    ],
    trailerUrl: 'https://www.youtube.com/watch?v=91t0ha9x0AE',
    ...overrides,
  };
}
