import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestDatabase, type TestDatabase } from '../test-support/db-harness';
import { createGame } from '../test-support/factories';

import {
  PrismaGameMetadataRepository,
  type ApplyGameMetadataInput,
} from './game-metadata.repository';

/**
 * D3.25 catalog persistence against a real schema built from the migration
 * scripts (docs/07_DATABASE/MIGRATION_VERIFICATION_POLICY.md). Constructing the
 * harness also proves the D3.25 migration applies to an empty database.
 */

let db: TestDatabase;
let repository: PrismaGameMetadataRepository;

beforeAll(async () => {
  db = await createTestDatabase();
  repository = new PrismaGameMetadataRepository(db.prisma);
});

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await db.prisma.gameMetadataRun.deleteMany();
  await db.prisma.gameRelatedGame.deleteMany();
  await db.prisma.gameMedia.deleteMany();
  await db.prisma.gameTag.deleteMany();
  await db.prisma.gameCompany.deleteMany();
  await db.prisma.gameGenre.deleteMany();
  await db.prisma.gamePlatform.deleteMany();
  // Games too — otherwise an external id from an earlier test leaks into the
  // next one's late-binding assertions.
  await db.prisma.game.deleteMany();
});

let externalIdSeed = 100_000;
function nextExternalId(): number {
  externalIdSeed += 1;
  return externalIdSeed;
}

function applyInput(gameId: string, overrides: Partial<ApplyGameMetadataInput> = {}) {
  return {
    gameId,
    scalars: {
      summary: 'A rogue-like dungeon crawler.',
      description: 'Defy the god of the dead.',
      releaseDate: new Date('2020-09-17T00:00:00.000Z'),
      trailerUrl: 'https://www.youtube.com/watch?v=abc',
      externalRating: 91.5,
      externalRatingCount: 1200,
      igdbId: nextExternalId(),
    },
    genres: [{ name: 'Indie', slug: 'indie' }],
    tags: [{ name: 'Action', slug: 'action', kind: 'theme' as const }],
    platforms: [{ name: 'PC', slug: 'pc-windows' }],
    companies: [
      { name: 'Supergiant Games', slug: 'supergiant-games', role: 'developer' as const },
      { name: 'Supergiant Games', slug: 'supergiant-games', role: 'publisher' as const },
    ],
    franchise: { name: 'Hades', slug: 'hades-franchise' },
    series: { name: 'Supergiant Collection', slug: 'supergiant-collection' },
    relatedGames: [
      {
        provider: 'igdb' as const,
        relatedExternalId: '7346',
        relatedTitle: 'Dead Cells',
        kind: 'similar' as const,
        sortOrder: 0,
      },
    ],
    status: 'complete' as const,
    provider: 'igdb' as const,
    confidence: 0.95,
    refreshedAt: new Date('2026-07-31T00:00:00.000Z'),
    ...overrides,
  } satisfies ApplyGameMetadataInput;
}

describe('schema defaults', () => {
  it('creates every game as a pending skeleton', async () => {
    const game = await createGame(db.prisma);

    expect(game.metadataStatus).toBe('pending');
    expect(game.metadataVersion).toBe(0);
    expect(game.metadataAttempts).toBe(0);
    expect(game.summary).toBeNull();
    expect(game.igdbId).toBeNull();
  });
});

describe('claimForEnrichment', () => {
  it('claims a pending game', async () => {
    const game = await createGame(db.prisma);
    await expect(repository.claimForEnrichment(game.id)).resolves.toBe(true);
  });

  it('refuses a second concurrent claim', async () => {
    const game = await createGame(db.prisma);

    await repository.claimForEnrichment(game.id);

    await expect(repository.claimForEnrichment(game.id)).resolves.toBe(false);
  });
});

describe('applyMetadata', () => {
  it('writes scalars and advances the lifecycle', async () => {
    const game = await createGame(db.prisma);

    await repository.applyMetadata(applyInput(game.id));

    const updated = await db.prisma.game.findUniqueOrThrow({ where: { id: game.id } });
    expect(updated.summary).toBe('A rogue-like dungeon crawler.');
    expect(updated.igdbId).not.toBeNull();
    expect(updated.externalRating).toBe(91.5);
    expect(updated.metadataStatus).toBe('complete');
    expect(updated.metadataProvider).toBe('igdb');
    expect(updated.metadataVersion).toBe(1);
    expect(updated.metadataError).toBeNull();
  });

  it('upserts reference entities and links them', async () => {
    const game = await createGame(db.prisma);

    await repository.applyMetadata(applyInput(game.id));

    const [genres, tags, platforms, companies] = await Promise.all([
      db.prisma.gameGenre.findMany({ where: { gameId: game.id } }),
      db.prisma.gameTag.findMany({ where: { gameId: game.id }, include: { tag: true } }),
      db.prisma.gamePlatform.findMany({ where: { gameId: game.id } }),
      db.prisma.gameCompany.findMany({ where: { gameId: game.id } }),
    ]);

    expect(genres).toHaveLength(1);
    expect(tags[0]?.tag.kind).toBe('theme');
    expect(platforms).toHaveLength(1);
    // One company, two roles.
    expect(companies).toHaveLength(2);
    expect(companies.map((row) => row.role).sort()).toEqual(['developer', 'publisher']);
  });

  it('links franchise and series', async () => {
    const game = await createGame(db.prisma);

    await repository.applyMetadata(applyInput(game.id));

    const updated = await db.prisma.game.findUniqueOrThrow({
      where: { id: game.id },
      include: { franchise: true, series: true },
    });
    expect(updated.franchise?.slug).toBe('hades-franchise');
    expect(updated.series?.slug).toBe('supergiant-collection');
  });

  it('is idempotent — a second apply creates no duplicate links', async () => {
    const game = await createGame(db.prisma);

    await repository.applyMetadata(applyInput(game.id));
    await repository.applyMetadata(applyInput(game.id));

    const [genres, companies, related] = await Promise.all([
      db.prisma.gameGenre.count({ where: { gameId: game.id } }),
      db.prisma.gameCompany.count({ where: { gameId: game.id } }),
      db.prisma.gameRelatedGame.count({ where: { gameId: game.id } }),
    ]);

    expect(genres).toBe(1);
    expect(companies).toBe(2);
    expect(related).toBe(1);
  });

  it('increments the version on every successful apply', async () => {
    const game = await createGame(db.prisma);

    await repository.applyMetadata(applyInput(game.id));
    await repository.applyMetadata(applyInput(game.id));

    const updated = await db.prisma.game.findUniqueOrThrow({ where: { id: game.id } });
    expect(updated.metadataVersion).toBe(2);
  });

  it('shares reference rows across games rather than duplicating them', async () => {
    const first = await createGame(db.prisma);
    const second = await createGame(db.prisma);

    await repository.applyMetadata(applyInput(first.id, { scalars: {} }));
    await repository.applyMetadata(applyInput(second.id, { scalars: {} }));

    expect(await db.prisma.genre.count({ where: { slug: 'indie' } })).toBe(1);
    expect(await db.prisma.company.count({ where: { slug: 'supergiant-games' } })).toBe(1);
  });

  it('resets the attempt counter and clears the last error', async () => {
    const game = await createGame(db.prisma);
    await repository.markFailure(game.id, 'no provider match', 'failed');

    await repository.applyMetadata(applyInput(game.id));

    const updated = await db.prisma.game.findUniqueOrThrow({ where: { id: game.id } });
    expect(updated.metadataAttempts).toBe(0);
    expect(updated.metadataError).toBeNull();
  });

  it('drops an external id another game already owns instead of failing the job', async () => {
    const owner = await createGame(db.prisma);
    const contender = await createGame(db.prisma);
    const sharedIgdbId = nextExternalId();

    await repository.applyMetadata(
      applyInput(owner.id, { scalars: { igdbId: sharedIgdbId, summary: 'owner' } }),
    );

    // A second catalog row resolving to the same IGDB game must still enrich.
    await expect(
      repository.applyMetadata(
        applyInput(contender.id, { scalars: { igdbId: sharedIgdbId, summary: 'contender' } }),
      ),
    ).resolves.toBeUndefined();

    const updatedOwner = await db.prisma.game.findUniqueOrThrow({ where: { id: owner.id } });
    const updatedContender = await db.prisma.game.findUniqueOrThrow({
      where: { id: contender.id },
    });

    expect(updatedOwner.igdbId).toBe(sharedIgdbId);
    expect(updatedContender.igdbId).toBeNull();
    // Everything except the contested id still lands.
    expect(updatedContender.summary).toBe('contender');
    expect(updatedContender.metadataStatus).toBe('complete');
  });

  it('still writes an external id the same game already owns', async () => {
    const game = await createGame(db.prisma);
    const igdbId = nextExternalId();

    await repository.applyMetadata(applyInput(game.id, { scalars: { igdbId } }));
    await repository.applyMetadata(applyInput(game.id, { scalars: { igdbId } }));

    const updated = await db.prisma.game.findUniqueOrThrow({ where: { id: game.id } });
    expect(updated.igdbId).toBe(igdbId);
  });

  it('leaves omitted scalars untouched rather than clearing them', async () => {
    const game = await createGame(db.prisma);
    await repository.applyMetadata(applyInput(game.id));

    await repository.applyMetadata(applyInput(game.id, { scalars: {} }));

    const updated = await db.prisma.game.findUniqueOrThrow({ where: { id: game.id } });
    expect(updated.summary).toBe('A rogue-like dungeon crawler.');
  });
});

describe('markFailure', () => {
  it('records the reason and increments attempts', async () => {
    const game = await createGame(db.prisma);

    await repository.markFailure(game.id, 'no provider match', 'failed');
    await repository.markFailure(game.id, 'no provider match', 'failed');

    const updated = await db.prisma.game.findUniqueOrThrow({ where: { id: game.id } });
    expect(updated.metadataStatus).toBe('failed');
    expect(updated.metadataAttempts).toBe(2);
    expect(updated.metadataError).toBe('no provider match');
  });

  it('truncates an oversized error to fit the column budget', async () => {
    const game = await createGame(db.prisma);

    await repository.markFailure(game.id, 'x'.repeat(2000), 'failed');

    const updated = await db.prisma.game.findUniqueOrThrow({ where: { id: game.id } });
    expect(updated.metadataError?.length).toBe(500);
  });
});

describe('selectBackfillCandidates', () => {
  it('selects pending, stale and retryable-failed games', async () => {
    const pending = await createGame(db.prisma);
    const stale = await createGame(db.prisma);
    const failed = await createGame(db.prisma);
    const done = await createGame(db.prisma);

    await db.prisma.game.update({ where: { id: stale.id }, data: { metadataStatus: 'stale' } });
    await db.prisma.game.update({
      where: { id: failed.id },
      data: { metadataStatus: 'failed', metadataAttempts: 1 },
    });
    await db.prisma.game.update({ where: { id: done.id }, data: { metadataStatus: 'complete' } });

    const candidates = await repository.selectBackfillCandidates(50, 5);
    const ids = candidates.map((row) => row.id);

    expect(ids).toEqual(expect.arrayContaining([pending.id, stale.id, failed.id]));
    expect(ids).not.toContain(done.id);
  });

  it('excludes games that exhausted their attempt budget', async () => {
    const exhausted = await createGame(db.prisma);
    await db.prisma.game.update({
      where: { id: exhausted.id },
      data: { metadataStatus: 'failed', metadataAttempts: 5 },
    });

    const candidates = await repository.selectBackfillCandidates(50, 5);

    expect(candidates.map((row) => row.id)).not.toContain(exhausted.id);
  });

  it('honours the limit', async () => {
    await createGame(db.prisma);
    await createGame(db.prisma);
    await createGame(db.prisma);

    const candidates = await repository.selectBackfillCandidates(2, 5);

    expect(candidates).toHaveLength(2);
  });

  it('orders fewest-attempts first so fresh work outranks repeated failures', async () => {
    const fresh = await createGame(db.prisma);
    const retried = await createGame(db.prisma);
    await db.prisma.game.update({
      where: { id: retried.id },
      data: { metadataStatus: 'failed', metadataAttempts: 3 },
    });

    const candidates = await repository.selectBackfillCandidates(50, 5);
    const freshIndex = candidates.findIndex((row) => row.id === fresh.id);
    const retriedIndex = candidates.findIndex((row) => row.id === retried.id);

    expect(freshIndex).toBeLessThan(retriedIndex);
  });
});

describe('markStale', () => {
  it('marks only enriched records past the cutoff', async () => {
    const old = await createGame(db.prisma);
    const recent = await createGame(db.prisma);
    const neverEnriched = await createGame(db.prisma);

    await db.prisma.game.update({
      where: { id: old.id },
      data: {
        metadataStatus: 'complete',
        metadataRefreshedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
    await db.prisma.game.update({
      where: { id: recent.id },
      data: {
        metadataStatus: 'complete',
        metadataRefreshedAt: new Date('2026-07-30T00:00:00.000Z'),
      },
    });

    const ids = await repository.markStale(new Date('2026-07-01T00:00:00.000Z'), 100);

    expect(ids).toEqual([old.id]);
    expect(ids).not.toContain(recent.id);
    expect(ids).not.toContain(neverEnriched.id);
  });

  it('is idempotent — a marked game is not re-selected', async () => {
    const game = await createGame(db.prisma);
    await db.prisma.game.update({
      where: { id: game.id },
      data: {
        metadataStatus: 'complete',
        metadataRefreshedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });

    const first = await repository.markStale(new Date('2026-07-01T00:00:00.000Z'), 100);
    const second = await repository.markStale(new Date('2026-07-01T00:00:00.000Z'), 100);

    expect(first).toEqual([game.id]);
    expect(second).toEqual([]);
  });
});

describe('media persistence', () => {
  it('upserts on (game, kind, sourceUrl) so re-ingestion is idempotent', async () => {
    const game = await createGame(db.prisma);
    const input = {
      gameId: game.id,
      kind: 'cover' as const,
      storageKey: 'games/g/cover/a.jpg',
      provider: 'igdb' as const,
      sourceUrl: 'https://images.igdb.com/a.jpg',
      sortOrder: 0,
      width: 264,
      height: 352,
    };

    await repository.upsertMedia(input);
    await repository.upsertMedia({ ...input, storageKey: 'games/g/cover/b.jpg' });

    const rows = await db.prisma.gameMedia.findMany({ where: { gameId: game.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.storageKey).toBe('games/g/cover/b.jpg');
  });

  it('reports whether an asset was already ingested', async () => {
    const game = await createGame(db.prisma);
    await repository.upsertMedia({
      gameId: game.id,
      kind: 'cover',
      storageKey: 'k',
      provider: 'igdb',
      sourceUrl: 'https://images.igdb.com/a.jpg',
      sortOrder: 0,
      width: null,
      height: null,
    });

    await expect(
      repository.hasMedia(game.id, 'cover', 'https://images.igdb.com/a.jpg'),
    ).resolves.toBe(true);
    await expect(
      repository.hasMedia(game.id, 'cover', 'https://images.igdb.com/other.jpg'),
    ).resolves.toBe(false);
  });

  it('promotes cover and hero keys only while unset', async () => {
    const game = await createGame(db.prisma);

    await repository.promoteMediaKey(game.id, 'cover', 'first.jpg');
    await repository.promoteMediaKey(game.id, 'cover', 'second.jpg');
    await repository.promoteMediaKey(game.id, 'hero', 'hero.jpg');

    const updated = await db.prisma.game.findUniqueOrThrow({ where: { id: game.id } });
    expect(updated.coverKey).toBe('first.jpg');
    expect(updated.heroKey).toBe('hero.jpg');
  });

  it('ignores promotion for kinds without a denormalized pointer', async () => {
    const game = await createGame(db.prisma);

    await repository.promoteMediaKey(game.id, 'screenshot', 'shot.jpg');

    const updated = await db.prisma.game.findUniqueOrThrow({ where: { id: game.id } });
    expect(updated.coverKey).toBeNull();
    expect(updated.heroKey).toBeNull();
  });
});

describe('related games', () => {
  it('lists provider relationships in sort order', async () => {
    const game = await createGame(db.prisma);
    await repository.applyMetadata(
      applyInput(game.id, {
        relatedGames: [
          {
            provider: 'igdb',
            relatedExternalId: '2',
            relatedTitle: 'Second',
            kind: 'similar',
            sortOrder: 1,
          },
          {
            provider: 'igdb',
            relatedExternalId: '1',
            relatedTitle: 'First',
            kind: 'similar',
            sortOrder: 0,
          },
        ],
      }),
    );

    const related = await repository.listRelatedGames(game.id, 'similar');

    expect(related.map((row) => row.relatedTitle)).toEqual(['First', 'Second']);
    expect(related[0]?.relatedGameId).toBeNull();
  });

  it('late-binds a relationship once the target enters the catalog', async () => {
    const source = await createGame(db.prisma);
    await repository.applyMetadata(applyInput(source.id));
    // The fixture declares a `similar` relationship to IGDB id 7346.

    const target = await createGame(db.prisma);
    await db.prisma.game.update({ where: { id: target.id }, data: { igdbId: 7346 } });

    const resolved = await repository.resolveRelatedGameLinks('igdb');

    expect(resolved).toBe(1);
    const related = await repository.listRelatedGames(source.id, 'similar');
    expect(related[0]?.relatedGameId).toBe(target.id);
  });

  it('resolves nothing when no target matches', async () => {
    const game = await createGame(db.prisma);
    await repository.applyMetadata(applyInput(game.id));

    await expect(repository.resolveRelatedGameLinks('igdb')).resolves.toBe(0);
  });
});

describe('recordRun and coverage', () => {
  it('records one audit row per attempt', async () => {
    const game = await createGame(db.prisma);

    await repository.recordRun({
      gameId: game.id,
      provider: 'igdb',
      outcome: 'success',
      reason: 'backfill',
      confidence: 0.95,
      fieldsWritten: 12,
      mediaQueued: 3,
      durationMs: 420,
      error: null,
    });

    const runs = await db.prisma.gameMetadataRun.findMany({ where: { gameId: game.id } });
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({ outcome: 'success', fieldsWritten: 12, mediaQueued: 3 });
  });

  it('records a skipped run with no provider', async () => {
    const game = await createGame(db.prisma);

    await repository.recordRun({
      gameId: game.id,
      provider: null,
      outcome: 'skipped',
      reason: 'created',
      confidence: null,
      fieldsWritten: 0,
      mediaQueued: 0,
      durationMs: 1,
      error: null,
    });

    const runs = await db.prisma.gameMetadataRun.findMany({ where: { gameId: game.id } });
    expect(runs[0]?.provider).toBeNull();
    expect(runs[0]?.outcome).toBe('skipped');
  });

  it('reports catalog coverage by status', async () => {
    const enriched = await createGame(db.prisma);
    await repository.applyMetadata(applyInput(enriched.id));
    await repository.promoteMediaKey(enriched.id, 'cover', 'c.jpg');

    const coverage = await repository.coverage();

    expect(coverage.total).toBeGreaterThan(0);
    expect(coverage.byStatus.complete).toBeGreaterThanOrEqual(1);
    expect(coverage.withCover).toBeGreaterThanOrEqual(1);
    expect(coverage.withSummary).toBeGreaterThanOrEqual(1);
  });
});

describe('loadCatalogMetadata', () => {
  it('returns the full projection for an enriched game', async () => {
    const game = await createGame(db.prisma);
    await repository.applyMetadata(applyInput(game.id));

    const record = await repository.loadCatalogMetadata(game.id);

    expect(record?.genres.map((row) => row.slug)).toEqual(['indie']);
    expect(record?.tags.map((row) => row.slug)).toEqual(['action']);
    expect(record?.companies).toHaveLength(2);
    expect(record?.series?.slug).toBe('supergiant-collection');
  });

  it('returns empty collections for an un-enriched game', async () => {
    const game = await createGame(db.prisma);

    const record = await repository.loadCatalogMetadata(game.id);

    expect(record?.genres).toEqual([]);
    expect(record?.tags).toEqual([]);
    expect(record?.media).toEqual([]);
  });

  it('returns null for a missing game', async () => {
    await expect(repository.loadCatalogMetadata('missing')).resolves.toBeNull();
  });
});
