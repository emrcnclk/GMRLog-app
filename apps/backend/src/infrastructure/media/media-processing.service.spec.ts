import { describe, expect, it, vi } from 'vitest';

import { AppLogger } from '../logging/app-logger.service';
import { MemoryObjectStorage } from '../storage/memory-object-storage';

import { MediaProcessingService } from './media-processing.service';

function createSilentLogger(): AppLogger {
  return {
    event: vi.fn(),
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
  } as unknown as AppLogger;
}

/** Valid 8×8 red PNG — sharp/blurhash need real decodable pixels. */
const SMALL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAI0lEQVR42mP8z8BQz0AEYBxVSF+FhBQMOAv+M2AF' +
    'o2gwGgV4AACS8QQBOJ6XPQAAAABJRU5ErkJggg==',
  'base64',
);

describe('MediaProcessingService.processImage', () => {
  it('uploads thumb/standard/hero WebP variants and returns a BlurHash', async () => {
    const storage = new MemoryObjectStorage();
    const service = new MediaProcessingService(storage, createSilentLogger());

    const result = await service.processImage({
      sourceBuffer: SMALL_PNG,
      keyPrefix: 'games/game-1/cover/abc123',
    });

    expect(result.blurHash).toEqual(expect.any(String));
    expect(result.blurHash.length).toBeGreaterThan(0);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);

    expect(result.variants).toEqual({
      thumb: 'games/game-1/cover/abc123-thumb.webp',
      standard: 'games/game-1/cover/abc123-standard.webp',
      hero: 'games/game-1/cover/abc123-hero.webp',
    });

    for (const key of Object.values(result.variants)) {
      const head = await storage.headObject(key);
      expect(head).not.toBeNull();
      expect(head?.contentType).toBe('image/webp');
    }
  });

  it('never writes the original bytes to storage under the key prefix itself', async () => {
    const storage = new MemoryObjectStorage();
    const service = new MediaProcessingService(storage, createSilentLogger());

    await service.processImage({
      sourceBuffer: SMALL_PNG,
      keyPrefix: 'games/game-2/hero/def456',
    });

    expect(await storage.headObject('games/game-2/hero/def456')).toBeNull();
  });
});
