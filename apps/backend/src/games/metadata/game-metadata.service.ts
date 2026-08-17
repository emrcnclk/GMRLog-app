import type { GameMetadataRepository, MetadataProvider } from '@gmrlog/database';
import { Inject, Injectable } from '@nestjs/common';

import { SearchIndexPublisher } from '../../infrastructure/jobs/search-index.publisher';
import { AppLogger } from '../../infrastructure/logging/app-logger.service';
import { GAME_METADATA_REPOSITORY } from '../games.tokens';

import { GameMetadataPublisher } from './game-metadata.publisher';
import {
  countPopulatedFields,
  resolveMetadataStatus,
  toApplyGameMetadataInput,
  toMediaJobs,
} from './metadata-merge';
import { parseReleaseYear } from './metadata-normalize';
import { METADATA_CONFIG, type MetadataConfig } from './metadata.config';
import type { MetadataEnrichReason } from './metadata.job-data';
import { MetadataProviderRegistry } from './providers/metadata-provider.registry';

export interface EnrichmentResult {
  status: 'applied' | 'partial' | 'no_match' | 'skipped' | 'not_found' | 'already_running';
  provider: MetadataProvider | null;
  fieldsWritten: number;
  mediaQueued: number;
}

/**
 * Applies provider metadata to the catalog (D3.25).
 *
 * Runs only inside a BullMQ worker. Nothing on an HTTP request path may call
 * this — see docs/18_CATALOG/GAME_METADATA_ARCHITECTURE.md §5 invariant 1.
 */
@Injectable()
export class GameMetadataService {
  constructor(
    @Inject(GAME_METADATA_REPOSITORY) private readonly repository: GameMetadataRepository,
    private readonly registry: MetadataProviderRegistry,
    private readonly publisher: GameMetadataPublisher,
    private readonly searchIndex: SearchIndexPublisher,
    private readonly logger: AppLogger,
    @Inject(METADATA_CONFIG) private readonly config: MetadataConfig,
  ) {}

  async enrich(
    gameId: string,
    reason: MetadataEnrichReason,
    hints: { igdbId?: number | null; steamAppId?: number | null } = {},
  ): Promise<EnrichmentResult> {
    const startedAt = Date.now();

    const game = await this.repository.findForEnrichment(gameId);
    if (game === null) {
      // Deleted between enqueue and execution — not an error.
      return { status: 'not_found', provider: null, fieldsWritten: 0, mediaQueued: 0 };
    }

    if (this.registry.enabledProviders().length === 0) {
      await this.repository.recordRun({
        gameId,
        provider: null,
        outcome: 'skipped',
        reason,
        confidence: null,
        fieldsWritten: 0,
        mediaQueued: 0,
        durationMs: Date.now() - startedAt,
        error: null,
      });
      // Status intentionally untouched: the game stays `pending` so it is
      // picked up automatically once a provider is configured.
      return { status: 'skipped', provider: null, fieldsWritten: 0, mediaQueued: 0 };
    }

    const claimed = await this.repository.claimForEnrichment(gameId);
    if (!claimed) {
      return { status: 'already_running', provider: null, fieldsWritten: 0, mediaQueued: 0 };
    }

    try {
      return await this.runEnrichment(game, reason, hints, startedAt);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      await this.repository.markFailure(gameId, message, 'failed');
      await this.repository.recordRun({
        gameId,
        provider: null,
        outcome: 'error',
        reason,
        confidence: null,
        fieldsWritten: 0,
        mediaQueued: 0,
        durationMs: Date.now() - startedAt,
        error: message,
      });
      // Rethrow so BullMQ retries with backoff.
      throw error;
    }
  }

  private async runEnrichment(
    game: {
      id: string;
      title: string;
      slug: string;
      igdbId: number | null;
      steamAppId: number | null;
      rawgId: number | null;
      releaseDate: Date | null;
    },
    reason: MetadataEnrichReason,
    hints: { igdbId?: number | null; steamAppId?: number | null },
    startedAt: number,
  ): Promise<EnrichmentResult> {
    const resolution = await this.registry.resolve(
      {
        title: game.title,
        slug: game.slug,
        igdbId: game.igdbId ?? hints.igdbId ?? null,
        steamAppId: game.steamAppId ?? hints.steamAppId ?? null,
        rawgId: game.rawgId,
        releaseYear: parseReleaseYear(game.releaseDate),
      },
      this.config.minConfidence,
    );

    const metadata = resolution.metadata;
    if (metadata === null) {
      const error =
        resolution.errors.length > 0
          ? `provider errors: ${resolution.errors.map((e) => `${e.provider}=${e.message}`).join('; ')}`
          : 'no provider match';
      await this.repository.markFailure(game.id, error, 'failed');
      await this.repository.recordRun({
        gameId: game.id,
        provider: null,
        outcome: 'no_match',
        reason,
        confidence: null,
        fieldsWritten: 0,
        mediaQueued: 0,
        durationMs: Date.now() - startedAt,
        error,
      });
      return { status: 'no_match', provider: null, fieldsWritten: 0, mediaQueued: 0 };
    }

    const status = resolveMetadataStatus(metadata, this.config.completeConfidence);
    const refreshedAt = new Date();

    await this.repository.applyMetadata(
      toApplyGameMetadataInput(game.id, metadata, status, refreshedAt),
    );

    // D3.25.1 — reindex AFTER the metadata transaction commits, never inside
    // it. Without this, a game's Meilisearch document never reflects its
    // enrichment: the same three-field skeleton (title/slug/id) stays
    // searchable forever, even after summary/description/genres land in
    // Postgres. A failure here must not fail enrichment — search staleness
    // is recoverable via `pnpm repair:index`; losing a successful apply is not.
    await this.reindexForSearch(game.id);

    // Media is enqueued AFTER the metadata transaction commits — never inside it.
    const mediaJobs = toMediaJobs(game.id, metadata, this.config);
    const mediaQueued = await this.publisher.enqueueMediaBatch(mediaJobs);

    // Late-bind provider "similar games" whose targets have since been created.
    await this.repository.resolveRelatedGameLinks(metadata.provider);

    const fieldsWritten = countPopulatedFields(metadata);
    await this.repository.recordRun({
      gameId: game.id,
      provider: metadata.provider,
      outcome: status === 'complete' ? 'success' : 'partial',
      reason,
      confidence: metadata.confidence,
      fieldsWritten,
      mediaQueued,
      durationMs: Date.now() - startedAt,
      error: null,
    });

    this.logger.event(
      'info',
      {
        gameId: game.id,
        provider: metadata.provider,
        status,
        confidence: metadata.confidence,
        fieldsWritten,
        mediaQueued,
      },
      'game.metadata.enriched',
    );

    return {
      status: status === 'complete' ? 'applied' : 'partial',
      provider: metadata.provider,
      fieldsWritten,
      mediaQueued,
    };
  }

  private async reindexForSearch(gameId: string): Promise<void> {
    try {
      await this.searchIndex.publishUpsert('game', gameId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.event('warn', { gameId, error: message }, 'game.metadata.search-reindex.failed');
    }
  }
}
