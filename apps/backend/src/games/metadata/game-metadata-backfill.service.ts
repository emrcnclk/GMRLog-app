import type { GameMetadataRepository } from '@gmrlog/database';
import { Inject, Injectable } from '@nestjs/common';

import { AppLogger } from '../../infrastructure/logging/app-logger.service';
import { GAME_METADATA_REPOSITORY } from '../games.tokens';

import { GameMetadataPublisher } from './game-metadata.publisher';
import { METADATA_CONFIG, type MetadataConfig } from './metadata.config';

export interface ScanResult {
  selected: number;
  enqueued: number;
}

/**
 * Backfill and refresh scans (D3.25 — docs/18_CATALOG/METADATA_QUEUES.md §4–5).
 *
 * Neither scan calls a provider. They only select and enqueue, so both complete
 * in milliseconds regardless of catalog size.
 */
@Injectable()
export class GameMetadataBackfillService {
  constructor(
    @Inject(GAME_METADATA_REPOSITORY) private readonly repository: GameMetadataRepository,
    private readonly publisher: GameMetadataPublisher,
    private readonly logger: AppLogger,
    @Inject(METADATA_CONFIG) private readonly config: MetadataConfig,
  ) {}

  /** Enqueue pending / stale / retryable-failed games, bounded per pass. */
  async runBackfillScan(): Promise<ScanResult> {
    const candidates = await this.repository.selectBackfillCandidates(
      this.config.backfillBatchSize,
      this.config.maxAttempts,
    );

    let enqueued = 0;
    for (const candidate of candidates) {
      const jobId = await this.publisher.enqueueEnrich({
        gameId: candidate.id,
        reason: 'backfill',
        igdbId: candidate.igdbId,
        steamAppId: candidate.steamAppId,
      });
      if (jobId !== null) {
        enqueued += 1;
      }
    }

    this.logger.event(
      'info',
      { selected: candidates.length, enqueued },
      'game.metadata.backfill.scan',
    );
    return { selected: candidates.length, enqueued };
  }

  /**
   * Mark records past the staleness window and enqueue them. Marking to `stale`
   * is what makes the pass idempotent — a game already marked is not re-selected.
   */
  async runRefreshScan(now: Date = new Date()): Promise<ScanResult> {
    const cutoff = new Date(now.getTime() - this.config.refreshIntervalDays * 86_400_000);
    const ids = await this.repository.markStale(cutoff, this.config.refreshBatchSize);

    let enqueued = 0;
    for (const gameId of ids) {
      const jobId = await this.publisher.enqueueEnrich({ gameId, reason: 'refresh' });
      if (jobId !== null) {
        enqueued += 1;
      }
    }

    this.logger.event(
      'info',
      { selected: ids.length, enqueued, cutoff: cutoff.toISOString() },
      'game.metadata.refresh.scan',
    );
    return { selected: ids.length, enqueued };
  }
}
