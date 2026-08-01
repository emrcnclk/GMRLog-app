import { createHash } from 'node:crypto';

import type { GameMediaKind, GameMetadataRepository } from '@gmrlog/database';
import { Inject, Injectable } from '@nestjs/common';

import { AppLogger } from '../../infrastructure/logging/app-logger.service';
import { MediaProcessingService } from '../../infrastructure/media/media-processing.service';
import { GAME_METADATA_REPOSITORY } from '../games.tokens';

import { METADATA_CONFIG, type MetadataConfig } from './metadata.config';
import type { GameMediaIngestJobData } from './metadata.job-data';

/**
 * Mirrors provider artwork into object storage (D3.25 — docs/18_CATALOG/MEDIA_INGESTION.md).
 * Nothing is hotlinked. Video is never mirrored (METADATA_LICENSING.md §5).
 */

/** Only these leave storage; the URL's own extension is never trusted. */
const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export type IngestOutcome = 'stored' | 'skipped-existing' | 'rejected' | 'failed';

export interface IngestResult {
  outcome: IngestOutcome;
  storageKey: string | null;
  reason?: string;
}

/** `games/{gameId}/{kind}/{sha256(sourceUrl)[0..15]}` — no extension; variants append their own. */
export function buildMediaKeyPrefix(
  gameId: string,
  kind: GameMediaKind,
  sourceUrl: string,
): string {
  const digest = createHash('sha256').update(sourceUrl).digest('hex').slice(0, 16);
  return `games/${gameId}/${kind}/${digest}`;
}

export function extensionForContentType(contentType: string | null): string | null {
  if (contentType === null) {
    return null;
  }
  const normalized = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
  return CONTENT_TYPE_EXTENSIONS[normalized] ?? null;
}

@Injectable()
export class GameMediaIngestionService {
  constructor(
    @Inject(GAME_METADATA_REPOSITORY) private readonly repository: GameMetadataRepository,
    private readonly mediaProcessing: MediaProcessingService,
    private readonly logger: AppLogger,
    @Inject(METADATA_CONFIG) private readonly config: MetadataConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async ingest(job: GameMediaIngestJobData): Promise<IngestResult> {
    // Cheap guard first — a fully-ingested game performs zero network I/O.
    const existing = await this.repository.hasMedia(job.gameId, job.kind, job.sourceUrl);
    if (existing) {
      return { outcome: 'skipped-existing', storageKey: null };
    }

    const download = await this.download(job.sourceUrl);
    if (download.rejected !== undefined) {
      this.logger.event(
        'warn',
        { gameId: job.gameId, kind: job.kind, reason: download.rejected },
        'game.media.rejected',
      );
      // A rejected asset is not a job failure — one bad URL must not poison the gallery.
      return { outcome: 'rejected', storageKey: null, reason: download.rejected };
    }

    const keyPrefix = buildMediaKeyPrefix(job.gameId, job.kind, job.sourceUrl);
    const processed = await this.mediaProcessing.processImage({
      sourceBuffer: download.body,
      keyPrefix,
    });
    // The canonical pointer is the `standard` variant — no original bytes are ever kept.
    const storageKey = processed.variants.standard;

    await this.repository.upsertMedia({
      gameId: job.gameId,
      kind: job.kind,
      storageKey,
      provider: job.provider,
      sourceUrl: job.sourceUrl,
      sortOrder: job.sortOrder,
      width: job.width ?? processed.width,
      height: job.height ?? processed.height,
      blurhash: processed.blurHash,
      variants: processed.variants,
    });

    if (job.promote) {
      await this.repository.promoteMediaKey(
        job.gameId,
        job.kind,
        storageKey,
        processed.blurHash,
        processed.variants,
      );
    }

    this.logger.event(
      'info',
      { gameId: job.gameId, kind: job.kind, storageKey, blurHash: processed.blurHash },
      'game.media.stored',
    );

    return { outcome: 'stored', storageKey };
  }

  private async download(
    sourceUrl: string,
  ): Promise<
    | { rejected: string; body?: undefined; contentType?: undefined; extension?: undefined }
    | { rejected?: undefined; body: Buffer; contentType: string; extension: string }
  > {
    if (!sourceUrl.startsWith('https://')) {
      return { rejected: 'non-https source' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.config.mediaTimeoutMs);

    try {
      const response = await this.fetchImpl(sourceUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'image/*' },
      });
      if (!response.ok) {
        // Transport failure — throw so BullMQ retries this one asset.
        throw new Error(`media HTTP ${String(response.status)}`);
      }

      const contentType = response.headers.get('content-type');
      const extension = extensionForContentType(contentType);
      if (extension === null || contentType === null) {
        return { rejected: `unsupported content-type: ${contentType ?? 'none'}` };
      }

      const declaredLength = Number(response.headers.get('content-length') ?? '0');
      if (Number.isFinite(declaredLength) && declaredLength > this.config.mediaMaxBytes) {
        return { rejected: `declared size ${String(declaredLength)} over ceiling` };
      }

      const body = Buffer.from(await response.arrayBuffer());
      // Content-Length is advisory; the real body is what counts.
      if (body.byteLength > this.config.mediaMaxBytes) {
        return { rejected: `body size ${String(body.byteLength)} over ceiling` };
      }
      if (body.byteLength === 0) {
        return { rejected: 'empty body' };
      }

      return { body, contentType, extension };
    } finally {
      clearTimeout(timeout);
    }
  }
}
