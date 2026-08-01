import type {
  ApplyGameMetadataInput,
  BackfillCandidate,
  CatalogCoverage,
  Company,
  CompanyRole,
  Game,
  GameCatalogMetadataRecord,
  GameMedia,
  GameMediaKind,
  GameMetadataRepository,
  GameMetadataStatus,
  GameRelatedGame,
  GameRelatedKind,
  ImageVariantKeys,
  MetadataProvider,
  RecordMetadataRunInput,
  Tag,
  UpsertGameMediaInput,
} from '@gmrlog/database';

/**
 * In-memory `GameMetadataRepository` for service and processor tests (D3.25).
 * Records every write so specs can assert on applied metadata without a database.
 */
export class FakeGameMetadataRepository implements GameMetadataRepository {
  readonly applied: ApplyGameMetadataInput[] = [];
  readonly runs: RecordMetadataRunInput[] = [];
  readonly failures: { gameId: string; error: string; status: GameMetadataStatus }[] = [];
  readonly mediaWrites: UpsertGameMediaInput[] = [];
  readonly promotions: {
    gameId: string;
    kind: GameMediaKind;
    storageKey: string;
    blurhash: string | null;
    variants: ImageVariantKeys | null;
  }[] = [];

  /** Set to false to model a game already claimed by another worker. */
  claimSucceeds = true;

  constructor(
    private readonly candidates: BackfillCandidate[] = [],
    private readonly existingMedia: GameMedia[] = [],
    private readonly related: GameRelatedGame[] = [],
    private readonly catalog: GameCatalogMetadataRecord | null = null,
  ) {}

  findForEnrichment(gameId: string): Promise<BackfillCandidate | null> {
    return Promise.resolve(this.candidates.find((row) => row.id === gameId) ?? null);
  }

  claimForEnrichment(): Promise<boolean> {
    return Promise.resolve(this.claimSucceeds);
  }

  applyMetadata(input: ApplyGameMetadataInput): Promise<void> {
    this.applied.push(input);
    return Promise.resolve();
  }

  markFailure(gameId: string, error: string, status: GameMetadataStatus): Promise<void> {
    this.failures.push({ gameId, error, status });
    return Promise.resolve();
  }

  recordRun(input: RecordMetadataRunInput): Promise<void> {
    this.runs.push(input);
    return Promise.resolve();
  }

  selectBackfillCandidates(limit: number, maxAttempts: number): Promise<BackfillCandidate[]> {
    void maxAttempts;
    return Promise.resolve(this.candidates.slice(0, limit));
  }

  markStale(olderThan: Date, limit: number): Promise<string[]> {
    void olderThan;
    return Promise.resolve(this.candidates.slice(0, limit).map((row) => row.id));
  }

  upsertMedia(input: UpsertGameMediaInput): Promise<void> {
    this.mediaWrites.push(input);
    return Promise.resolve();
  }

  hasMedia(gameId: string, kind: GameMediaKind, sourceUrl: string): Promise<boolean> {
    return Promise.resolve(
      this.existingMedia.some(
        (row) => row.gameId === gameId && row.kind === kind && row.sourceUrl === sourceUrl,
      ),
    );
  }

  promoteMediaKey(
    gameId: string,
    kind: GameMediaKind,
    storageKey: string,
    blurhash: string | null = null,
    variants: ImageVariantKeys | null = null,
  ): Promise<void> {
    this.promotions.push({ gameId, kind, storageKey, blurhash, variants });
    return Promise.resolve();
  }

  listMedia(gameId: string): Promise<GameMedia[]> {
    return Promise.resolve(this.existingMedia.filter((row) => row.gameId === gameId));
  }

  listRelatedGames(gameId: string, kind: GameRelatedKind): Promise<GameRelatedGame[]> {
    return Promise.resolve(
      this.related.filter((row) => row.gameId === gameId && row.kind === kind),
    );
  }

  resolveRelatedGameLinks(provider: MetadataProvider): Promise<number> {
    void provider;
    return Promise.resolve(0);
  }

  loadCatalogMetadata(gameId: string): Promise<GameCatalogMetadataRecord | null> {
    if (this.catalog?.game.id !== gameId) {
      return Promise.resolve(null);
    }
    return Promise.resolve(this.catalog);
  }

  loadTagsByGameIds(): Promise<Map<string, Tag[]>> {
    return Promise.resolve(new Map<string, Tag[]>());
  }

  loadCompaniesByGameIds(): Promise<Map<string, (Company & { role: CompanyRole })[]>> {
    return Promise.resolve(new Map<string, (Company & { role: CompanyRole })[]>());
  }

  coverage(): Promise<CatalogCoverage> {
    return Promise.resolve({
      total: this.candidates.length,
      byStatus: {},
      withCover: 0,
      withSummary: 0,
      mediaTotal: this.existingMedia.length,
    });
  }
}

/** Backfill candidate matching a `makeGame()` fixture. */
export function makeBackfillCandidate(
  overrides: Partial<BackfillCandidate> = {},
): BackfillCandidate {
  return {
    id: 'game-1',
    title: 'Hollow Knight',
    slug: 'hollow-knight',
    igdbId: null,
    steamAppId: null,
    rawgId: null,
    releaseDate: new Date('2017-02-24T00:00:00.000Z'),
    metadataStatus: 'pending',
    ...overrides,
  };
}

export function makeGameMedia(overrides: Partial<GameMedia> = {}): GameMedia {
  return {
    id: 'media-1',
    gameId: 'game-1',
    kind: 'screenshot',
    storageKey: 'games/game-1/screenshot/abc.jpg',
    provider: 'igdb',
    sourceUrl: 'https://images.igdb.com/a.jpg',
    sortOrder: 0,
    width: 1920,
    height: 1080,
    blurhash: null,
    variants: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function makeGameRelatedGame(overrides: Partial<GameRelatedGame> = {}): GameRelatedGame {
  return {
    id: 'related-1',
    gameId: 'game-1',
    relatedGameId: null,
    provider: 'igdb',
    relatedExternalId: '7346',
    relatedTitle: 'Dead Cells',
    kind: 'similar',
    sortOrder: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function makeCatalogRecord(
  game: Game,
  overrides: Partial<GameCatalogMetadataRecord> = {},
): GameCatalogMetadataRecord {
  return {
    game,
    genres: [{ id: 'genre-1', name: 'Metroidvania', slug: 'metroidvania' }],
    tags: [],
    platforms: [{ id: 'platform-1', name: 'PC', slug: 'pc' }],
    companies: [],
    series: null,
    media: [],
    ...overrides,
  };
}
