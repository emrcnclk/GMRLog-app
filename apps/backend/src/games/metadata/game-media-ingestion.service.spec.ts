import { describe, expect, it, vi } from 'vitest';

import { AppLogger } from '../../infrastructure/logging/app-logger.service';
import { MediaProcessingService } from '../../infrastructure/media/media-processing.service';
import { MemoryObjectStorage } from '../../infrastructure/storage/memory-object-storage';

import {
  buildMediaKeyPrefix,
  extensionForContentType,
  GameMediaIngestionService,
} from './game-media-ingestion.service';
import { DEFAULT_METADATA_CONFIG } from './metadata.config';
import type { GameMediaIngestJobData } from './metadata.job-data';
import { FakeGameMetadataRepository, makeGameMedia } from './testing/fake-metadata-repository';

/** Valid 8×8 red PNG — sharp rejects arbitrary bytes. */
const VALID_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAI0lEQVR42mP8z8BQz0AEYBxVSF+FhBQMOAv+M2AF' +
    'o2gwGgV4AACS8QQBOJ6XPQAAAABJRU5ErkJggg==',
  'base64',
);

const JOB: GameMediaIngestJobData = {
  gameId: 'game-1',
  kind: 'cover',
  sourceUrl: 'https://images.igdb.com/cover.jpg',
  provider: 'igdb',
  sortOrder: 0,
  width: 264,
  height: 352,
  promote: true,
};

function createLogger(): AppLogger {
  return { event: vi.fn(), log: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as AppLogger;
}

function imageResponse(options: {
  contentType?: string | null;
  contentLength?: string | null;
  body?: Uint8Array;
  status?: number;
}): Response {
  const headers = new Headers();
  if (options.contentType != null) headers.set('content-type', options.contentType);
  if (options.contentLength != null) headers.set('content-length', options.contentLength);
  const body = options.body ?? new Uint8Array(VALID_PNG);
  const status = options.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    headers,
    arrayBuffer: async () => body.buffer,
  } as unknown as Response;
}

function createService(
  fetchImpl: typeof fetch,
  repository = new FakeGameMetadataRepository(),
): {
  service: GameMediaIngestionService;
  repository: FakeGameMetadataRepository;
  storage: MemoryObjectStorage;
} {
  const storage = new MemoryObjectStorage();
  const mediaProcessing = new MediaProcessingService(storage, createLogger());
  const service = new GameMediaIngestionService(
    repository,
    mediaProcessing,
    createLogger(),
    DEFAULT_METADATA_CONFIG,
    fetchImpl,
  );
  return { service, repository, storage };
}

describe('buildMediaKeyPrefix', () => {
  it('is deterministic for the same source URL', () => {
    const a = buildMediaKeyPrefix('game-1', 'cover', 'https://a/b.jpg');
    const b = buildMediaKeyPrefix('game-1', 'cover', 'https://a/b.jpg');
    expect(a).toBe(b);
  });

  it('namespaces by game and kind under the public games/ prefix', () => {
    const key = buildMediaKeyPrefix('game-1', 'screenshot', 'https://a/b.jpg');
    expect(key).toMatch(/^games\/game-1\/screenshot\/[0-9a-f]{16}$/);
  });

  it('differs across games, kinds and sources', () => {
    const base = buildMediaKeyPrefix('game-1', 'cover', 'https://a/b.jpg');
    expect(buildMediaKeyPrefix('game-2', 'cover', 'https://a/b.jpg')).not.toBe(base);
    expect(buildMediaKeyPrefix('game-1', 'hero', 'https://a/b.jpg')).not.toBe(base);
    expect(buildMediaKeyPrefix('game-1', 'cover', 'https://a/c.jpg')).not.toBe(base);
  });
});

describe('extensionForContentType', () => {
  it('maps the allowlisted image types', () => {
    expect(extensionForContentType('image/jpeg')).toBe('jpg');
    expect(extensionForContentType('image/png')).toBe('png');
    expect(extensionForContentType('image/webp')).toBe('webp');
    expect(extensionForContentType('image/avif')).toBe('avif');
  });

  it('ignores charset parameters and casing', () => {
    expect(extensionForContentType('IMAGE/JPEG; charset=binary')).toBe('jpg');
  });

  it('rejects anything outside the allowlist', () => {
    expect(extensionForContentType('image/svg+xml')).toBeNull();
    expect(extensionForContentType('text/html')).toBeNull();
    expect(extensionForContentType(null)).toBeNull();
  });
});

describe('GameMediaIngestionService.ingest', () => {
  it('downloads, processes into WebP variants, and records the asset — never storing raw bytes', async () => {
    const fetchImpl = vi.fn(async () =>
      imageResponse({ contentType: 'image/jpeg' }),
    ) as unknown as typeof fetch;
    const { service, repository, storage } = createService(fetchImpl);

    const result = await service.ingest(JOB);

    expect(result.outcome).toBe('stored');
    expect(result.storageKey).toMatch(/-standard\.webp$/);

    const stored = await storage.headObject(result.storageKey as string);
    expect(stored?.contentType).toBe('image/webp');

    expect(repository.mediaWrites[0]).toMatchObject({
      gameId: 'game-1',
      kind: 'cover',
      provider: 'igdb',
      sourceUrl: JOB.sourceUrl,
      blurhash: expect.any(String),
      variants: {
        thumb: expect.stringMatching(/-thumb\.webp$/),
        standard: expect.stringMatching(/-standard\.webp$/),
        hero: expect.stringMatching(/-hero\.webp$/),
      },
    });
  });

  it('promotes the cover key with blurhash and variants when asked', async () => {
    const fetchImpl = vi.fn(async () =>
      imageResponse({ contentType: 'image/jpeg' }),
    ) as unknown as typeof fetch;
    const { service, repository } = createService(fetchImpl);

    await service.ingest(JOB);

    expect(repository.promotions).toHaveLength(1);
    expect(repository.promotions[0]).toMatchObject({
      gameId: 'game-1',
      kind: 'cover',
      blurhash: expect.any(String),
      variants: expect.objectContaining({ standard: expect.any(String) }),
    });
  });

  it('does not promote when the job says not to', async () => {
    const fetchImpl = vi.fn(async () =>
      imageResponse({ contentType: 'image/png' }),
    ) as unknown as typeof fetch;
    const { service, repository } = createService(fetchImpl);

    await service.ingest({ ...JOB, kind: 'screenshot', promote: false });

    expect(repository.promotions).toHaveLength(0);
  });

  it('skips an already-ingested asset without any network I/O', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const repository = new FakeGameMetadataRepository(
      [],
      [makeGameMedia({ gameId: 'game-1', kind: 'cover', sourceUrl: JOB.sourceUrl })],
    );
    const { service, storage } = createService(fetchImpl, repository);

    const result = await service.ingest(JOB);

    expect(result.outcome).toBe('skipped-existing');
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(storage.objects.size).toBe(0);
  });

  it('rejects a non-https source', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const { service } = createService(fetchImpl);

    const result = await service.ingest({ ...JOB, sourceUrl: 'http://images.igdb.com/a.jpg' });

    expect(result.outcome).toBe('rejected');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects a disallowed content type rather than failing the job', async () => {
    const fetchImpl = vi.fn(async () =>
      imageResponse({ contentType: 'text/html' }),
    ) as unknown as typeof fetch;
    const { service, storage } = createService(fetchImpl);

    const result = await service.ingest(JOB);

    expect(result.outcome).toBe('rejected');
    expect(result.reason).toContain('unsupported content-type');
    expect(storage.objects.size).toBe(0);
  });

  it('rejects an oversized asset by its declared length', async () => {
    const fetchImpl = vi.fn(async () =>
      imageResponse({ contentType: 'image/jpeg', contentLength: '999999999' }),
    ) as unknown as typeof fetch;
    const { service, storage } = createService(fetchImpl);

    const result = await service.ingest(JOB);

    expect(result.outcome).toBe('rejected');
    expect(storage.objects.size).toBe(0);
  });

  it('rejects an oversized body even when Content-Length lied', async () => {
    const oversized = new Uint8Array(DEFAULT_METADATA_CONFIG.mediaMaxBytes + 10);
    const fetchImpl = vi.fn(async () =>
      imageResponse({ contentType: 'image/jpeg', contentLength: '10', body: oversized }),
    ) as unknown as typeof fetch;
    const { service, storage } = createService(fetchImpl);

    const result = await service.ingest(JOB);

    expect(result.outcome).toBe('rejected');
    expect(result.reason).toContain('body size');
    expect(storage.objects.size).toBe(0);
  });

  it('rejects an empty body', async () => {
    const fetchImpl = vi.fn(async () =>
      imageResponse({ contentType: 'image/jpeg', body: new Uint8Array(0) }),
    ) as unknown as typeof fetch;
    const { service } = createService(fetchImpl);

    const result = await service.ingest(JOB);

    expect(result.outcome).toBe('rejected');
    expect(result.reason).toBe('empty body');
  });

  it('throws on an HTTP error so BullMQ retries this asset alone', async () => {
    const fetchImpl = vi.fn(async () =>
      imageResponse({ contentType: 'image/jpeg', status: 502 }),
    ) as unknown as typeof fetch;
    const { service } = createService(fetchImpl);

    await expect(service.ingest(JOB)).rejects.toThrow('media HTTP 502');
  });

  it('always produces .webp variants regardless of the source content type', async () => {
    const fetchImpl = vi.fn(async () =>
      imageResponse({ contentType: 'image/webp' }),
    ) as unknown as typeof fetch;
    const { service } = createService(fetchImpl);

    const result = await service.ingest({ ...JOB, sourceUrl: 'https://a/thing.jpg' });

    expect(result.storageKey).toMatch(/\.webp$/);
  });
});
