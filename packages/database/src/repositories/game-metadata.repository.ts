import { Prisma } from '@prisma/client';
import type {
  Company,
  CompanyRole,
  Game,
  GameMedia,
  GameMediaKind,
  GameMetadataStatus,
  GameRelatedGame,
  GameRelatedKind,
  GameSeries,
  MetadataProvider,
  MetadataRunOutcome,
  Tag,
  TagKind,
} from '@prisma/client';

import { withTransaction, type DatabaseClient } from './types';

/**
 * Catalog metadata persistence (D3.25 — docs/18_CATALOG/GAME_METADATA_ARCHITECTURE.md).
 *
 * The applier writes every field, join row and status transition for one game
 * inside a single `$transaction`. Media enqueue happens after commit in the
 * calling service — never inside an open transaction.
 */

export interface NamedRefInput {
  name: string;
  slug: string;
}

export interface TagRefInput extends NamedRefInput {
  kind: TagKind;
}

export interface CompanyRefInput extends NamedRefInput {
  role: CompanyRole;
}

export interface RelatedGameInput {
  provider: MetadataProvider;
  relatedExternalId: string;
  relatedTitle: string | null;
  kind: GameRelatedKind;
  sortOrder: number;
}

/** Scalar catalog fields. `undefined` means "provider had nothing", not "clear it". */
export interface GameMetadataScalars {
  title?: string;
  summary?: string | null;
  description?: string | null;
  releaseDate?: Date | null;
  trailerUrl?: string | null;
  externalRating?: number | null;
  externalRatingCount?: number | null;
  igdbId?: number | null;
  steamAppId?: number | null;
  rawgId?: number | null;
}

export interface ApplyGameMetadataInput {
  gameId: string;
  scalars: GameMetadataScalars;
  genres: NamedRefInput[];
  tags: TagRefInput[];
  platforms: NamedRefInput[];
  companies: CompanyRefInput[];
  franchise: NamedRefInput | null;
  series: NamedRefInput | null;
  relatedGames: RelatedGameInput[];
  status: GameMetadataStatus;
  provider: MetadataProvider;
  confidence: number;
  refreshedAt: Date;
}

export interface RecordMetadataRunInput {
  gameId: string;
  provider: MetadataProvider | null;
  outcome: MetadataRunOutcome;
  reason: string;
  confidence: number | null;
  fieldsWritten: number;
  mediaQueued: number;
  durationMs: number;
  error: string | null;
}

export interface ImageVariantKeys {
  thumb: string;
  standard: string;
  hero: string;
}

export interface UpsertGameMediaInput {
  gameId: string;
  kind: GameMediaKind;
  storageKey: string;
  provider: MetadataProvider;
  sourceUrl: string;
  sortOrder: number;
  width: number | null;
  height: number | null;
  /** D3.26 — set when the media pipeline processed this asset. */
  blurhash?: string | null;
  variants?: ImageVariantKeys | null;
}

export interface BackfillCandidate {
  id: string;
  title: string;
  slug: string;
  igdbId: number | null;
  steamAppId: number | null;
  rawgId: number | null;
  releaseDate: Date | null;
  metadataStatus: GameMetadataStatus;
}

export interface CatalogCoverage {
  total: number;
  byStatus: Record<string, number>;
  withCover: number;
  withSummary: number;
  mediaTotal: number;
}

export interface GameCatalogMetadataRecord {
  game: Game;
  genres: { id: string; name: string; slug: string }[];
  tags: Tag[];
  platforms: { id: string; name: string; slug: string }[];
  companies: (Company & { role: CompanyRole })[];
  series: GameSeries | null;
  media: GameMedia[];
}

export interface GameMetadataRepository {
  findForEnrichment(gameId: string): Promise<BackfillCandidate | null>;
  claimForEnrichment(gameId: string): Promise<boolean>;
  applyMetadata(input: ApplyGameMetadataInput): Promise<void>;
  markFailure(gameId: string, error: string, status: GameMetadataStatus): Promise<void>;
  recordRun(input: RecordMetadataRunInput): Promise<void>;
  selectBackfillCandidates(limit: number, maxAttempts: number): Promise<BackfillCandidate[]>;
  markStale(olderThan: Date, limit: number): Promise<string[]>;
  upsertMedia(input: UpsertGameMediaInput): Promise<void>;
  hasMedia(gameId: string, kind: GameMediaKind, sourceUrl: string): Promise<boolean>;
  promoteMediaKey(
    gameId: string,
    kind: GameMediaKind,
    storageKey: string,
    blurhash?: string | null,
    variants?: ImageVariantKeys | null,
  ): Promise<void>;
  listMedia(gameId: string): Promise<GameMedia[]>;
  listRelatedGames(gameId: string, kind: GameRelatedKind): Promise<GameRelatedGame[]>;
  resolveRelatedGameLinks(provider: MetadataProvider): Promise<number>;
  loadCatalogMetadata(gameId: string): Promise<GameCatalogMetadataRecord | null>;
  loadTagsByGameIds(gameIds: readonly string[]): Promise<Map<string, Tag[]>>;
  loadCompaniesByGameIds(
    gameIds: readonly string[],
  ): Promise<Map<string, (Company & { role: CompanyRole })[]>>;
  coverage(): Promise<CatalogCoverage>;
}

const CANDIDATE_SELECT = {
  id: true,
  title: true,
  slug: true,
  igdbId: true,
  steamAppId: true,
  rawgId: true,
  releaseDate: true,
  metadataStatus: true,
} as const;

export class PrismaGameMetadataRepository implements GameMetadataRepository {
  constructor(private readonly db: DatabaseClient) {}

  findForEnrichment(gameId: string): Promise<BackfillCandidate | null> {
    return this.db.game.findUnique({ where: { id: gameId }, select: CANDIDATE_SELECT });
  }

  /**
   * Transition to `enriching` only from a non-`enriching` state. The conditional
   * updateMany is the concurrency guard: a second worker claiming the same game
   * updates zero rows and stops.
   */
  async claimForEnrichment(gameId: string): Promise<boolean> {
    const result = await this.db.game.updateMany({
      where: { id: gameId, metadataStatus: { not: 'enriching' } },
      data: { metadataStatus: 'enriching' },
    });
    return result.count > 0;
  }

  async applyMetadata(input: ApplyGameMetadataInput): Promise<void> {
    await withTransaction(this.db, async (tx) => {
      const franchiseId =
        input.franchise === null ? undefined : await upsertFranchise(tx, input.franchise);
      const seriesId = input.series === null ? undefined : await upsertSeries(tx, input.series);
      const scalars = await dropConflictingExternalIds(tx, input.gameId, input.scalars);

      await tx.game.update({
        where: { id: input.gameId },
        data: {
          ...toGameScalarUpdate(scalars),
          ...(franchiseId === undefined ? {} : { franchiseId }),
          ...(seriesId === undefined ? {} : { seriesId }),
          metadataStatus: input.status,
          metadataProvider: input.provider,
          metadataConfidence: input.confidence,
          metadataRefreshedAt: input.refreshedAt,
          metadataAttempts: 0,
          metadataError: null,
          metadataVersion: { increment: 1 },
        },
      });

      await linkGenres(tx, input.gameId, input.genres);
      await linkTags(tx, input.gameId, input.tags);
      await linkPlatforms(tx, input.gameId, input.platforms);
      await linkCompanies(tx, input.gameId, input.companies);
      await linkRelatedGames(tx, input.gameId, input.relatedGames);
    });
  }

  async markFailure(
    gameId: string,
    error: string,
    status: GameMetadataStatus = 'failed',
  ): Promise<void> {
    await this.db.game.update({
      where: { id: gameId },
      data: {
        metadataStatus: status,
        metadataError: error.slice(0, 500),
        metadataAttempts: { increment: 1 },
      },
    });
  }

  async recordRun(input: RecordMetadataRunInput): Promise<void> {
    await this.db.gameMetadataRun.create({
      data: {
        gameId: input.gameId,
        provider: input.provider,
        outcome: input.outcome,
        reason: input.reason,
        confidence: input.confidence,
        fieldsWritten: input.fieldsWritten,
        mediaQueued: input.mediaQueued,
        durationMs: input.durationMs,
        error: input.error === null ? null : input.error.slice(0, 500),
      },
    });
  }

  /**
   * Bounded scan: fresh work first (`pending`), then `stale`, then retryable
   * `failed` ordered by fewest attempts. Never touches games that exhausted
   * their attempt budget.
   */
  async selectBackfillCandidates(limit: number, maxAttempts: number): Promise<BackfillCandidate[]> {
    return this.db.game.findMany({
      where: {
        OR: [
          { metadataStatus: 'pending' },
          { metadataStatus: 'stale' },
          { metadataStatus: 'failed', metadataAttempts: { lt: maxAttempts } },
        ],
      },
      select: CANDIDATE_SELECT,
      orderBy: [{ metadataAttempts: 'asc' }, { popularity: 'desc' }, { id: 'asc' }],
      take: limit,
    });
  }

  async markStale(olderThan: Date, limit: number): Promise<string[]> {
    const targets = await this.db.game.findMany({
      where: {
        metadataStatus: { in: ['complete', 'partial'] },
        metadataRefreshedAt: { lt: olderThan },
      },
      select: { id: true },
      orderBy: [{ metadataRefreshedAt: 'asc' }, { id: 'asc' }],
      take: limit,
    });
    if (targets.length === 0) {
      return [];
    }
    const ids = targets.map((row) => row.id);
    await this.db.game.updateMany({
      where: { id: { in: ids } },
      data: { metadataStatus: 'stale' },
    });
    return ids;
  }

  async upsertMedia(input: UpsertGameMediaInput): Promise<void> {
    const blurhash = input.blurhash ?? null;
    const variants = (input.variants ?? null) as unknown as Prisma.InputJsonValue | undefined;
    await this.db.gameMedia.upsert({
      where: {
        gameId_kind_sourceUrl: {
          gameId: input.gameId,
          kind: input.kind,
          sourceUrl: input.sourceUrl,
        },
      },
      create: {
        gameId: input.gameId,
        kind: input.kind,
        storageKey: input.storageKey,
        provider: input.provider,
        sourceUrl: input.sourceUrl,
        sortOrder: input.sortOrder,
        width: input.width,
        height: input.height,
        blurhash,
        variants: variants ?? Prisma.JsonNull,
      },
      update: {
        storageKey: input.storageKey,
        provider: input.provider,
        sortOrder: input.sortOrder,
        width: input.width,
        height: input.height,
        blurhash,
        variants: variants ?? Prisma.JsonNull,
      },
    });
  }

  async hasMedia(gameId: string, kind: GameMediaKind, sourceUrl: string): Promise<boolean> {
    const existing = await this.db.gameMedia.findUnique({
      where: { gameId_kind_sourceUrl: { gameId, kind, sourceUrl } },
      select: { id: true },
    });
    return existing !== null;
  }

  /** Promote a stored asset to the denormalized pointer, only when unset. */
  async promoteMediaKey(
    gameId: string,
    kind: GameMediaKind,
    storageKey: string,
    blurhash: string | null = null,
    variants: ImageVariantKeys | null = null,
  ): Promise<void> {
    const variantsJson = variants as unknown as Prisma.InputJsonValue | null;
    if (kind === 'cover') {
      await this.db.game.updateMany({
        where: { id: gameId, coverKey: null },
        data: {
          coverKey: storageKey,
          coverBlurhash: blurhash,
          coverVariants: variantsJson ?? Prisma.JsonNull,
        },
      });
      return;
    }
    if (kind === 'hero') {
      await this.db.game.updateMany({
        where: { id: gameId, heroKey: null },
        data: {
          heroKey: storageKey,
          heroBlurhash: blurhash,
          heroVariants: variantsJson ?? Prisma.JsonNull,
        },
      });
    }
  }

  listMedia(gameId: string): Promise<GameMedia[]> {
    return this.db.gameMedia.findMany({
      where: { gameId },
      orderBy: [{ kind: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  listRelatedGames(gameId: string, kind: GameRelatedKind): Promise<GameRelatedGame[]> {
    return this.db.gameRelatedGame.findMany({
      where: { gameId, kind },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  /**
   * Late-bind provider relationships whose target has since entered the catalog.
   * Runs after enrichment so "similar games" stops pointing at nothing.
   */
  async resolveRelatedGameLinks(provider: MetadataProvider): Promise<number> {
    const unresolved = await this.db.gameRelatedGame.findMany({
      where: { provider, relatedGameId: null },
      select: { id: true, relatedExternalId: true },
      take: 500,
    });
    if (unresolved.length === 0) {
      return 0;
    }

    const externalIds = unresolved
      .map((row) => Number.parseInt(row.relatedExternalId, 10))
      .filter((value) => Number.isFinite(value));
    if (externalIds.length === 0) {
      return 0;
    }

    const column = externalIdColumn(provider);
    const matches = await this.db.game.findMany({
      where: { [column]: { in: externalIds } },
      select: { id: true, igdbId: true, steamAppId: true, rawgId: true },
    });
    if (matches.length === 0) {
      return 0;
    }

    const byExternalId = new Map<string, string>();
    for (const match of matches) {
      const external = match[column];
      if (external != null) {
        byExternalId.set(String(external), match.id);
      }
    }

    let resolved = 0;
    for (const row of unresolved) {
      const gameId = byExternalId.get(row.relatedExternalId);
      if (gameId === undefined) {
        continue;
      }
      await this.db.gameRelatedGame.update({
        where: { id: row.id },
        data: { relatedGameId: gameId },
      });
      resolved += 1;
    }
    return resolved;
  }

  async loadCatalogMetadata(gameId: string): Promise<GameCatalogMetadataRecord | null> {
    const game = await this.db.game.findUnique({
      where: { id: gameId },
      include: { series: true },
    });
    if (game === null) {
      return null;
    }

    const [genreLinks, tagLinks, platformLinks, companyLinks, media] = await Promise.all([
      this.db.gameGenre.findMany({ where: { gameId }, include: { genre: true } }),
      this.db.gameTag.findMany({ where: { gameId }, include: { tag: true } }),
      this.db.gamePlatform.findMany({ where: { gameId }, include: { platform: true } }),
      this.db.gameCompany.findMany({ where: { gameId }, include: { company: true } }),
      this.listMedia(gameId),
    ]);

    const { series, ...rest } = game;
    return {
      game: rest,
      genres: genreLinks.map((link) => link.genre),
      tags: tagLinks.map((link) => link.tag),
      platforms: platformLinks.map((link) => link.platform),
      companies: companyLinks.map((link) => ({ ...link.company, role: link.role })),
      series,
      media,
    };
  }

  async loadTagsByGameIds(gameIds: readonly string[]): Promise<Map<string, Tag[]>> {
    const out = new Map<string, Tag[]>();
    if (gameIds.length === 0) {
      return out;
    }
    const links = await this.db.gameTag.findMany({
      where: { gameId: { in: [...gameIds] } },
      include: { tag: true },
    });
    for (const link of links) {
      const list = out.get(link.gameId) ?? [];
      list.push(link.tag);
      out.set(link.gameId, list);
    }
    return out;
  }

  async loadCompaniesByGameIds(
    gameIds: readonly string[],
  ): Promise<Map<string, (Company & { role: CompanyRole })[]>> {
    const out = new Map<string, (Company & { role: CompanyRole })[]>();
    if (gameIds.length === 0) {
      return out;
    }
    const links = await this.db.gameCompany.findMany({
      where: { gameId: { in: [...gameIds] } },
      include: { company: true },
    });
    for (const link of links) {
      const list = out.get(link.gameId) ?? [];
      list.push({ ...link.company, role: link.role });
      out.set(link.gameId, list);
    }
    return out;
  }

  async coverage(): Promise<CatalogCoverage> {
    const [total, statusGroups, withCover, withSummary, mediaTotal] = await Promise.all([
      this.db.game.count(),
      this.db.game.groupBy({ by: ['metadataStatus'], _count: { _all: true } }),
      this.db.game.count({ where: { coverKey: { not: null } } }),
      this.db.game.count({ where: { summary: { not: null } } }),
      this.db.gameMedia.count(),
    ]);

    const byStatus: Record<string, number> = {};
    for (const group of statusGroups) {
      byStatus[group.metadataStatus] = group._count._all;
    }
    return { total, byStatus, withCover, withSummary, mediaTotal };
  }
}

// ---------------------------------------------------------------------------
// Transaction helpers
// ---------------------------------------------------------------------------

type TransactionClient = Prisma.TransactionClient;

function externalIdColumn(provider: MetadataProvider): 'igdbId' | 'steamAppId' | 'rawgId' {
  switch (provider) {
    case 'steam':
      return 'steamAppId';
    case 'rawg':
      return 'rawgId';
    default:
      return 'igdbId';
  }
}

/**
 * Two catalog rows can legitimately resolve to the same external game — the
 * same title imported twice under slightly different names, for instance. The
 * external id columns are unique, so writing one blindly would raise P2002,
 * fail the job, and keep failing on every retry until it reaches the DLQ.
 *
 * Instead: drop only the ids another game already owns, keep the rest of the
 * metadata, and let the enrichment succeed. Deduplicating the two catalog rows
 * is a separate concern from enriching them.
 */
type ExternalIdColumn = 'igdbId' | 'steamAppId' | 'rawgId';

async function dropConflictingExternalIds(
  tx: TransactionClient,
  gameId: string,
  scalars: GameMetadataScalars,
): Promise<GameMetadataScalars> {
  const candidates: [ExternalIdColumn, number][] = [];
  if (scalars.igdbId != null) candidates.push(['igdbId', scalars.igdbId]);
  if (scalars.steamAppId != null) candidates.push(['steamAppId', scalars.steamAppId]);
  if (scalars.rawgId != null) candidates.push(['rawgId', scalars.rawgId]);

  if (candidates.length === 0) {
    return scalars;
  }

  const owners = await tx.game.findMany({
    where: {
      id: { not: gameId },
      OR: candidates.map(([column, value]) => ({ [column]: value })),
    },
    select: { igdbId: true, steamAppId: true, rawgId: true },
  });

  if (owners.length === 0) {
    return scalars;
  }

  const next = { ...scalars };
  for (const [column, value] of candidates) {
    const taken = owners.some((owner) => owner[column] === value);
    if (taken) {
      // `next[column]` is a scalar (never a method), so assigning `undefined`
      // is equivalent to `delete` for `toGameScalarUpdate`'s `!== undefined`
      // check — and avoids the dynamic-delete lint rule.
      next[column] = undefined;
    }
  }
  return next;
}

/**
 * Only defined keys reach the update — `undefined` never clears a column.
 * Unchecked input, because the applier writes `franchiseId` / `seriesId` as
 * scalar FKs; Prisma forbids mixing scalar FKs with relation-style updates.
 */
function toGameScalarUpdate(scalars: GameMetadataScalars): Prisma.GameUncheckedUpdateInput {
  const data: Prisma.GameUncheckedUpdateInput = {};
  if (scalars.summary !== undefined) data.summary = scalars.summary;
  if (scalars.description !== undefined) data.description = scalars.description;
  if (scalars.releaseDate !== undefined) data.releaseDate = scalars.releaseDate;
  if (scalars.trailerUrl !== undefined) data.trailerUrl = scalars.trailerUrl;
  if (scalars.externalRating !== undefined) data.externalRating = scalars.externalRating;
  if (scalars.externalRatingCount !== undefined) {
    data.externalRatingCount = scalars.externalRatingCount;
  }
  if (scalars.igdbId !== undefined) data.igdbId = scalars.igdbId;
  if (scalars.steamAppId !== undefined) data.steamAppId = scalars.steamAppId;
  if (scalars.rawgId !== undefined) data.rawgId = scalars.rawgId;
  return data;
}

async function upsertFranchise(tx: TransactionClient, ref: NamedRefInput): Promise<string> {
  const row = await tx.franchise.upsert({
    where: { slug: ref.slug },
    create: { name: ref.name, slug: ref.slug },
    update: {},
    select: { id: true },
  });
  return row.id;
}

async function upsertSeries(tx: TransactionClient, ref: NamedRefInput): Promise<string> {
  const row = await tx.gameSeries.upsert({
    where: { slug: ref.slug },
    create: { name: ref.name, slug: ref.slug },
    update: {},
    select: { id: true },
  });
  return row.id;
}

async function linkGenres(
  tx: TransactionClient,
  gameId: string,
  refs: readonly NamedRefInput[],
): Promise<void> {
  for (const ref of refs) {
    const genre = await tx.genre.upsert({
      where: { slug: ref.slug },
      create: { name: ref.name, slug: ref.slug },
      update: {},
      select: { id: true },
    });
    await tx.gameGenre.upsert({
      where: { gameId_genreId: { gameId, genreId: genre.id } },
      create: { gameId, genreId: genre.id },
      update: {},
    });
  }
}

async function linkTags(
  tx: TransactionClient,
  gameId: string,
  refs: readonly TagRefInput[],
): Promise<void> {
  for (const ref of refs) {
    const tag = await tx.tag.upsert({
      where: { slug: ref.slug },
      create: { name: ref.name, slug: ref.slug, kind: ref.kind },
      update: {},
      select: { id: true },
    });
    await tx.gameTag.upsert({
      where: { gameId_tagId: { gameId, tagId: tag.id } },
      create: { gameId, tagId: tag.id },
      update: {},
    });
  }
}

async function linkPlatforms(
  tx: TransactionClient,
  gameId: string,
  refs: readonly NamedRefInput[],
): Promise<void> {
  for (const ref of refs) {
    const platform = await tx.platform.upsert({
      where: { slug: ref.slug },
      create: { name: ref.name, slug: ref.slug },
      update: {},
      select: { id: true },
    });
    await tx.gamePlatform.upsert({
      where: { gameId_platformId: { gameId, platformId: platform.id } },
      create: { gameId, platformId: platform.id },
      update: {},
    });
  }
}

async function linkCompanies(
  tx: TransactionClient,
  gameId: string,
  refs: readonly CompanyRefInput[],
): Promise<void> {
  for (const ref of refs) {
    const company = await tx.company.upsert({
      where: { slug: ref.slug },
      create: { name: ref.name, slug: ref.slug },
      update: {},
      select: { id: true },
    });
    await tx.gameCompany.upsert({
      where: {
        gameId_companyId_role: { gameId, companyId: company.id, role: ref.role },
      },
      create: { gameId, companyId: company.id, role: ref.role },
      update: {},
    });
  }
}

async function linkRelatedGames(
  tx: TransactionClient,
  gameId: string,
  refs: readonly RelatedGameInput[],
): Promise<void> {
  for (const ref of refs) {
    await tx.gameRelatedGame.upsert({
      where: {
        gameId_provider_relatedExternalId_kind: {
          gameId,
          provider: ref.provider,
          relatedExternalId: ref.relatedExternalId,
          kind: ref.kind,
        },
      },
      create: {
        gameId,
        provider: ref.provider,
        relatedExternalId: ref.relatedExternalId,
        relatedTitle: ref.relatedTitle,
        kind: ref.kind,
        sortOrder: ref.sortOrder,
      },
      update: { relatedTitle: ref.relatedTitle, sortOrder: ref.sortOrder },
    });
  }
}
