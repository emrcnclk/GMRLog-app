import type { SearchHitType } from '@gmrlog/database';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { AppLogger } from '../logging/app-logger.service';

import { MeiliClientService } from './meili.client';
import { SEARCH_HIT_TYPE_TO_MEILI_INDEX } from './meili.types';
import { SearchIndexService } from './search-index.service';

/**
 * D3.25.1 — reconciles PostgreSQL and Meilisearch bidirectionally.
 *
 * Closes two related gaps found during D3.25 review:
 *  - games that were created without ever reaching the search index (Hollow
 *    Knight, Celeste) — no automated path existed to detect or fix this;
 *  - the general absence of any reindex/backfill job, flagged as risk R6/H10
 *    in `docs/00_PROJECT/SPRINT_0_PROJECT_AUDIT.md`.
 *
 * Two passes per `SearchHitType`, both batched (see `BATCH_SIZE`):
 *  1. **Forward** — every active (non-deleted) row in Postgres is upserted
 *     into its Meili index in one call per batch. Catches rows that were
 *     never indexed and rows whose document is stale.
 *  2. **Reverse** — every document id in the Meili index is checked against
 *     the active-row set; anything not in it (deleted, or never existed) is
 *     removed, batched the same way.
 *
 * The batched design is not an optimization — it is required for this
 * command to complete at all. The first version of this service upserted
 * one row per HTTP call; against this project's own seed data (500k+
 * reviews, 300k+ collections) that path did not finish in any reasonable
 * time. A `pnpm repair:index` that cannot complete against production-scale
 * data does not satisfy "reconcile PostgreSQL ↔ Meilisearch drift."
 *
 * Read-only on Postgres, idempotent, safe to run repeatedly.
 */

export interface SearchRepairTypeResult {
  type: SearchHitType;
  postgresActiveCount: number;
  upserted: number;
  upsertErrors: number;
  orphansRemoved: number;
  orphanErrors: number;
}

const ALL_SEARCH_HIT_TYPES: readonly SearchHitType[] = [
  'game',
  'user',
  'post',
  'review',
  'collection',
  'tier-list',
  'community',
  'event',
];

const PAGE_SIZE = 1000;
const BATCH_SIZE = 1000;

@Injectable()
export class SearchRepairService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meili: MeiliClientService,
    private readonly searchIndex: SearchIndexService,
    private readonly logger: AppLogger,
  ) {}

  async repairAll(): Promise<SearchRepairTypeResult[]> {
    const results: SearchRepairTypeResult[] = [];
    for (const type of ALL_SEARCH_HIT_TYPES) {
      results.push(await this.repairType(type));
    }
    return results;
  }

  async repairType(type: SearchHitType): Promise<SearchRepairTypeResult> {
    if (!this.meili.isAvailable()) {
      return {
        type,
        postgresActiveCount: 0,
        upserted: 0,
        upsertErrors: 0,
        orphansRemoved: 0,
        orphanErrors: 0,
      };
    }

    const activeIds = await this.loadActiveIds(type);

    let upserted = 0;
    let upsertErrors = 0;
    for (const batch of chunk(activeIds, BATCH_SIZE)) {
      try {
        upserted += await this.searchIndex.upsertMany(type, batch);
      } catch (error: unknown) {
        upsertErrors += batch.length;
        this.logger.event(
          'warn',
          {
            type,
            batchSize: batch.length,
            error: error instanceof Error ? error.message : String(error),
          },
          'search.repair.upsert-batch.failed',
        );
      }
    }

    const indexKey = SEARCH_HIT_TYPE_TO_MEILI_INDEX[type];
    const indexedIds = await this.meili.listDocumentIds(indexKey);
    const activeSet = new Set(activeIds);
    const orphanIds = indexedIds.filter((id) => !activeSet.has(id));

    let orphansRemoved = 0;
    let orphanErrors = 0;
    for (const batch of chunk(orphanIds, BATCH_SIZE)) {
      try {
        await this.meili.deleteDocuments(indexKey, batch);
        orphansRemoved += batch.length;
      } catch (error: unknown) {
        orphanErrors += batch.length;
        this.logger.event(
          'warn',
          {
            type,
            batchSize: batch.length,
            error: error instanceof Error ? error.message : String(error),
          },
          'search.repair.orphan-delete-batch.failed',
        );
      }
    }

    return {
      type,
      postgresActiveCount: activeIds.length,
      upserted,
      upsertErrors,
      orphansRemoved,
      orphanErrors,
    };
  }

  private async loadActiveIds(type: SearchHitType): Promise<string[]> {
    switch (type) {
      case 'game':
        // Games are never soft-deleted.
        return this.paginateIds((skip, take) =>
          this.prisma.game.findMany({
            select: { id: true },
            orderBy: { id: 'asc' },
            skip,
            take,
          }),
        );
      case 'user':
        return this.paginateIds((skip, take) =>
          this.prisma.user.findMany({
            where: { deletedAt: null },
            select: { id: true },
            orderBy: { id: 'asc' },
            skip,
            take,
          }),
        );
      case 'post':
        return this.paginateIds((skip, take) =>
          this.prisma.post.findMany({
            where: { deletedAt: null },
            select: { id: true },
            orderBy: { id: 'asc' },
            skip,
            take,
          }),
        );
      case 'review':
        return this.paginateIds((skip, take) =>
          this.prisma.review.findMany({
            where: { deletedAt: null },
            select: { id: true },
            orderBy: { id: 'asc' },
            skip,
            take,
          }),
        );
      case 'collection':
        return this.paginateIds((skip, take) =>
          this.prisma.collection.findMany({
            where: { deletedAt: null },
            select: { id: true },
            orderBy: { id: 'asc' },
            skip,
            take,
          }),
        );
      case 'tier-list':
        return this.paginateIds((skip, take) =>
          this.prisma.tierList.findMany({
            where: { deletedAt: null },
            select: { id: true },
            orderBy: { id: 'asc' },
            skip,
            take,
          }),
        );
      case 'community':
        return this.paginateIds((skip, take) =>
          this.prisma.community.findMany({
            where: { deletedAt: null },
            select: { id: true },
            orderBy: { id: 'asc' },
            skip,
            take,
          }),
        );
      case 'event':
        return this.paginateIds((skip, take) =>
          this.prisma.event.findMany({
            where: { deletedAt: null },
            select: { id: true },
            orderBy: { id: 'asc' },
            skip,
            take,
          }),
        );
    }
  }

  private async paginateIds(
    query: (skip: number, take: number) => Promise<{ id: string }[]>,
  ): Promise<string[]> {
    const ids: string[] = [];
    let skip = 0;
    for (;;) {
      const page = await query(skip, PAGE_SIZE);
      for (const row of page) {
        ids.push(row.id);
      }
      if (page.length < PAGE_SIZE) {
        break;
      }
      skip += PAGE_SIZE;
    }
    return ids;
  }
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
