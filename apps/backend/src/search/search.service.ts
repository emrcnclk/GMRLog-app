import type {
  FollowRepository,
  SearchHitRecord,
  SearchListCursor,
  SearchRepository,
} from '@gmrlog/database';
import type { SearchHit, SearchHitType } from '@gmrlog/types';
import type { SearchQueryInput } from '@gmrlog/validators';
import { SEARCH_LIST_DEFAULT_LIMIT } from '@gmrlog/validators';
import { BadRequestException, Inject, Injectable, Optional } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { isAuthenticatedIdentity, type RequestIdentity } from '../auth/interfaces/identity';
import { FOLLOW_REPOSITORY } from '../follows/follows.tokens';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { PaginatedPayload } from '../infrastructure/http/paginated-payload';
import { MeiliClientService } from '../infrastructure/search/meili.client';
import type { MeiliSearchDocument } from '../infrastructure/search/meili.types';
import { SearchIndexService } from '../infrastructure/search/search-index.service';

import { type ExtendedSearchHitRecord, toSearchHit } from './mappers/search.mapper';
import { SEARCH_REPOSITORY } from './search.tokens';

const SEARCH_HIT_TYPES: readonly SearchHitType[] = [
  'game',
  'user',
  'review',
  'post',
  'collection',
  'tier-list',
  'community',
  'event',
  'achievement',
  'tag',
];

const SEARCH_HIT_TYPE_RANK: Record<SearchHitType, number> = {
  game: 0,
  user: 1,
  review: 2,
  post: 3,
  collection: 4,
  'tier-list': 5,
  community: 6,
  event: 7,
  achievement: 8,
  tag: 9,
};

const PRISMA_FALLBACK_TYPES = new Set<SearchHitType>(['achievement', 'tag']);

/**
 * Search domain service (F6.3 / D2.15 / D3.19 / D3.22 Search++).
 * Meilisearch when configured; otherwise database substring search.
 * Achievements + tags always merge from Prisma (not Meili-indexed yet).
 */
@Injectable()
export class SearchService {
  constructor(
    @Inject(SEARCH_REPOSITORY) private readonly searchRepository: SearchRepository,
    @Optional() @Inject(MeiliClientService) private readonly meili: MeiliClientService | null,
    @Optional() @Inject(SearchIndexService) private readonly searchIndex: SearchIndexService | null,
    @Inject(FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
    @Optional() private readonly prisma: PrismaService | null = null,
  ) {}

  async search(
    identity: RequestIdentity,
    query: SearchQueryInput,
  ): Promise<PaginatedPayload<SearchHit>> {
    const limit = query.limit ?? SEARCH_LIST_DEFAULT_LIMIT;
    const cursor = query.cursor !== undefined ? decodeCursor(query.cursor) : undefined;
    const viewerId = isAuthenticatedIdentity(identity) ? identity.userId : null;
    const typeFilter = normalizeTypeFilter(query.types);

    const wantsIndexed =
      typeFilter === null || [...typeFilter].some((type) => !PRISMA_FALLBACK_TYPES.has(type));
    const indexedCursor =
      cursor !== undefined && !PRISMA_FALLBACK_TYPES.has(cursor.type) ? cursor : undefined;
    // Over-fetch when merging Prisma fallbacks so post-merge cursor paging stays correct.
    const indexedLimit = limit + 1;

    let rows: ExtendedSearchHitRecord[] = wantsIndexed
      ? this.meili?.isAvailable() === true && this.searchIndex != null
        ? await this.searchViaMeili(query.q, indexedLimit, indexedCursor, viewerId)
        : await this.searchRepository.search({
            query: query.q,
            limit: indexedLimit,
            viewerId,
            ...(indexedCursor !== undefined ? { cursor: indexedCursor as SearchListCursor } : {}),
          })
      : [];

    if (typeFilter !== null) {
      rows = rows.filter((hit) => typeFilter.has(hit.type));
    }

    const wantsAchievement = typeFilter === null || typeFilter.has('achievement');
    const wantsTag = typeFilter === null || typeFilter.has('tag');
    if ((wantsAchievement || wantsTag) && this.prisma != null) {
      const extras = await this.searchPrismaFallbacks(
        query.q,
        indexedLimit,
        wantsAchievement,
        wantsTag,
      );
      rows = mergeHits(rows, extras);
    }

    if (cursor !== undefined) {
      rows = rows.filter((hit) => isAfterCursor(hit, cursor));
    }
    rows = rows.slice(0, limit + 1);

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const next =
      hasMore && last !== undefined
        ? encodeCursor({ orderedAt: last.orderedAt, type: last.type, id: last.id })
        : null;

    return new PaginatedPayload(page.map(toSearchHit), { next }, hasMore, limit);
  }

  private async searchViaMeili(
    q: string,
    limit: number,
    cursor: SearchListCursorExtended | undefined,
    viewerId: string | null,
  ): Promise<SearchHitRecord[]> {
    const trimmed = q.trim();
    if (trimmed.length === 0 || this.searchIndex == null || this.meili == null) {
      return [];
    }

    const rawHits = await this.meili.multiSearch(trimmed, limit + 1);
    const followCache = new Map<string, boolean>();
    const records: SearchHitRecord[] = [];

    for (const hit of rawHits) {
      const visible = await isMeiliDocumentVisible(
        hit.document,
        viewerId,
        this.follows,
        followCache,
      );
      if (!visible) {
        continue;
      }
      records.push(this.searchIndex.meiliDocumentToHitRecord(hit.document));
    }

    records.sort(compareHitsDesc);
    let filtered = records;
    if (cursor !== undefined) {
      filtered = records.filter((hit) => isAfterCursor(hit, cursor));
    }
    return filtered.slice(0, limit + 1);
  }

  private async searchPrismaFallbacks(
    q: string,
    take: number,
    wantsAchievement: boolean,
    wantsTag: boolean,
  ): Promise<ExtendedSearchHitRecord[]> {
    if (this.prisma == null) {
      return [];
    }
    const trimmed = q.trim();
    if (trimmed.length === 0) {
      return [];
    }

    const textFilter: Prisma.StringFilter = { contains: trimmed, mode: 'insensitive' };
    const tasks: Promise<ExtendedSearchHitRecord[]>[] = [];

    if (wantsAchievement) {
      tasks.push(
        this.prisma.achievement
          .findMany({
            where: {
              OR: [{ title: textFilter }, { category: textFilter }, { key: textFilter }],
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take,
          })
          .then((rows) =>
            rows.map((achievement) => ({
              type: 'achievement' as const,
              id: achievement.id,
              orderedAt: achievement.createdAt,
              achievement: {
                id: achievement.id,
                title: achievement.title,
                category: achievement.category,
              },
            })),
          ),
      );
    }

    if (wantsTag) {
      tasks.push(
        this.prisma.genre
          .findMany({
            where: {
              OR: [{ name: textFilter }, { slug: textFilter }],
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take,
          })
          .then((rows) =>
            rows.map((genre) => ({
              type: 'tag' as const,
              id: genre.id,
              orderedAt: genre.createdAt,
              tag: { id: genre.id, name: genre.name, slug: genre.slug },
            })),
          ),
      );
    }

    const batches = await Promise.all(tasks);
    return batches.flat();
  }
}

interface SearchListCursorExtended {
  orderedAt: Date;
  type: SearchHitType;
  id: string;
}

function normalizeTypeFilter(types: SearchHitType[] | undefined): Set<SearchHitType> | null {
  if (types === undefined || types.length === 0) {
    return null;
  }
  return new Set(types);
}

function mergeHits(
  base: ExtendedSearchHitRecord[],
  extras: ExtendedSearchHitRecord[],
): ExtendedSearchHitRecord[] {
  const seen = new Set(base.map((hit) => `${hit.type}:${hit.id}`));
  const merged = [...base];
  for (const hit of extras) {
    const key = `${hit.type}:${hit.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(hit);
    }
  }
  merged.sort(compareHitsDesc);
  return merged;
}

function encodeCursor(cursor: SearchListCursorExtended): string {
  const payload = `${cursor.orderedAt.toISOString()}|${cursor.type}|${cursor.id}`;
  return Buffer.from(payload, 'utf8').toString('base64url');
}

function decodeCursor(raw: string): SearchListCursorExtended {
  let decoded: string;
  try {
    decoded = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
  const firstSeparator = decoded.indexOf('|');
  if (firstSeparator <= 0) {
    throw new BadRequestException('Invalid cursor');
  }
  const secondSeparator = decoded.indexOf('|', firstSeparator + 1);
  if (secondSeparator <= firstSeparator) {
    throw new BadRequestException('Invalid cursor');
  }
  const orderedAtRaw = decoded.slice(0, firstSeparator);
  const typeRaw = decoded.slice(firstSeparator + 1, secondSeparator);
  const id = decoded.slice(secondSeparator + 1);
  const orderedAt = new Date(orderedAtRaw);
  if (Number.isNaN(orderedAt.getTime()) || id.length === 0 || !isSearchHitType(typeRaw)) {
    throw new BadRequestException('Invalid cursor');
  }
  return { orderedAt, type: typeRaw, id };
}

function isSearchHitType(value: string): value is SearchHitType {
  return (SEARCH_HIT_TYPES as readonly string[]).includes(value);
}

function compareHitsDesc(a: ExtendedSearchHitRecord, b: ExtendedSearchHitRecord): number {
  const at = a.orderedAt.getTime();
  const bt = b.orderedAt.getTime();
  if (at !== bt) {
    return bt - at;
  }
  const ar = SEARCH_HIT_TYPE_RANK[a.type];
  const br = SEARCH_HIT_TYPE_RANK[b.type];
  if (ar !== br) {
    return br - ar;
  }
  return b.id.localeCompare(a.id);
}

function isAfterCursor(hit: ExtendedSearchHitRecord, cursor: SearchListCursorExtended): boolean {
  const ht = hit.orderedAt.getTime();
  const ct = cursor.orderedAt.getTime();
  if (ht < ct) {
    return true;
  }
  if (ht > ct) {
    return false;
  }
  const hr = SEARCH_HIT_TYPE_RANK[hit.type];
  const cr = SEARCH_HIT_TYPE_RANK[cursor.type];
  if (hr < cr) {
    return true;
  }
  if (hr > cr) {
    return false;
  }
  return hit.id < cursor.id;
}

async function isMeiliDocumentVisible(
  document: MeiliSearchDocument,
  viewerId: string | null,
  follows: FollowRepository,
  followCache: Map<string, boolean>,
): Promise<boolean> {
  if (document.type === 'game' || document.type === 'user' || document.type === 'event') {
    return true;
  }

  const visibility = document.visibility ?? 'public';
  const ownerId = document.authorId ?? document.ownerId ?? null;

  if (visibility === 'public') {
    return true;
  }
  if (viewerId === null) {
    return false;
  }
  if (ownerId === viewerId) {
    return true;
  }
  if (visibility === 'private') {
    return false;
  }

  // Remaining ContentVisibility: followers
  if (ownerId == null) {
    return false;
  }
  const cached = followCache.get(ownerId);
  if (cached !== undefined) {
    return cached;
  }
  const exists = await follows.exists(viewerId, ownerId);
  followCache.set(ownerId, exists);
  return exists;
}
