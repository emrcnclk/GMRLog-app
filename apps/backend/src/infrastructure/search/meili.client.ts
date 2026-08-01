import type { SearchHitType } from '@gmrlog/database';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { Meilisearch, type Meilisearch as MeilisearchClient } from 'meilisearch';

import { ENV } from '../config/config.module';
import type { BackendEnv } from '../config/env.schema';
import { AppLogger } from '../logging/app-logger.service';

import {
  MEILI_INDEX_KEYS,
  MEILI_INDEX_SETTINGS,
  SEARCH_HIT_TYPE_TO_MEILI_INDEX,
  type MeiliIndexKey,
  type MeiliSearchDocument,
} from './meili.types';

export const MEILI_CLIENT = Symbol('MEILI_CLIENT');

export type MeiliClientHandle = MeilisearchClient | null;

/**
 * Meilisearch client wrapper. Returns null when MEILI_HOST is unset (SQL fallback in tests).
 */
@Injectable()
export class MeiliClientService implements OnModuleInit {
  readonly client: MeiliClientHandle;

  constructor(
    @Inject(ENV) private readonly env: BackendEnv,
    private readonly logger: AppLogger,
  ) {
    const host = env.MEILI_HOST.trim();
    this.client =
      host.length > 0
        ? new Meilisearch({
            host,
            ...(env.MEILI_API_KEY.length > 0 ? { apiKey: env.MEILI_API_KEY } : {}),
          })
        : null;
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async onModuleInit(): Promise<void> {
    if (this.client === null) {
      return;
    }
    try {
      await this.ensureIndexes();
      this.logger.log('Meilisearch indexes ensured', 'MeiliClientService');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.event('warn', { error: message }, 'meili.index.ensure.failed');
    }
  }

  indexName(key: MeiliIndexKey): string {
    return `${this.env.MEILI_INDEX_PREFIX}_${key}`;
  }

  indexNameForType(type: SearchHitType): string {
    return this.indexName(SEARCH_HIT_TYPE_TO_MEILI_INDEX[type]);
  }

  async health(): Promise<boolean> {
    if (this.client === null) {
      return false;
    }
    try {
      await this.client.health();
      return true;
    } catch {
      return false;
    }
  }

  async upsertDocuments(key: MeiliIndexKey, documents: MeiliSearchDocument[]): Promise<void> {
    if (this.client === null || documents.length === 0) {
      return;
    }
    const index = this.client.index(this.indexName(key));
    await index.addDocuments(documents, { primaryKey: 'id' });
  }

  /**
   * D3.25.1 — every document id currently stored in an index, paginated.
   * Used by `SearchRepairService` to find documents with no corresponding
   * (or no longer active) Postgres row.
   */
  async listDocumentIds(key: MeiliIndexKey): Promise<string[]> {
    if (this.client === null) {
      return [];
    }
    const index = this.client.index(this.indexName(key));
    const pageSize = 1000;
    const ids: string[] = [];
    let offset = 0;
    for (;;) {
      const page = await index.getDocuments<{ id: string }>({
        fields: ['id'],
        limit: pageSize,
        offset,
      });
      for (const doc of page.results) {
        ids.push(doc.id);
      }
      if (page.results.length < pageSize) {
        break;
      }
      offset += pageSize;
    }
    return ids;
  }

  async deleteDocument(key: MeiliIndexKey, id: string): Promise<void> {
    if (this.client === null) {
      return;
    }
    const index = this.client.index(this.indexName(key));
    await index.deleteDocument(id);
  }

  /** D3.25.1 — one HTTP call per batch instead of one per id (`SearchRepairService`). */
  async deleteDocuments(key: MeiliIndexKey, ids: readonly string[]): Promise<void> {
    if (this.client === null || ids.length === 0) {
      return;
    }
    const index = this.client.index(this.indexName(key));
    await index.deleteDocuments([...ids]);
  }

  async multiSearch(
    query: string,
    limit: number,
  ): Promise<{ document: MeiliSearchDocument; indexKey: MeiliIndexKey }[]> {
    if (this.client === null) {
      return [];
    }
    const perIndexLimit = limit + 1;
    const response = await this.client.multiSearch({
      queries: MEILI_INDEX_KEYS.map((key) => ({
        indexUid: this.indexName(key),
        q: query,
        limit: perIndexLimit,
      })),
    });
    const hits: { document: MeiliSearchDocument; indexKey: MeiliIndexKey }[] = [];
    for (let i = 0; i < response.results.length; i += 1) {
      const key = MEILI_INDEX_KEYS[i];
      if (key === undefined) {
        continue;
      }
      const result = response.results[i];
      if (result === undefined) {
        continue;
      }
      for (const hit of result.hits) {
        hits.push({ document: hit as MeiliSearchDocument, indexKey: key });
      }
    }
    return hits;
  }

  private async ensureIndexes(): Promise<void> {
    if (this.client === null) {
      return;
    }
    for (const key of MEILI_INDEX_KEYS) {
      const index = this.client.index(this.indexName(key));
      const settings = MEILI_INDEX_SETTINGS[key];
      await index.updateSettings({
        searchableAttributes: settings.searchableAttributes,
        typoTolerance: { enabled: true },
        rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
      });
    }
  }
}
