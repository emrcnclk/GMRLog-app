import { describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';

import { MemoryObjectStorage } from '../../storage/memory-object-storage';
import { AppLogger } from '../../logging/app-logger.service';
import { createJobPayload } from '../job-payload';
import { JOB_MEDIA_IMAGE_PROCESS } from '../job-names';
import { ImageProcessingProcessor } from './image-processing.processor';

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

/** Valid 1×1 PNG — sharp rejects arbitrary bytes. */
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

describe('ImageProcessingProcessor', () => {
  it('writes a webp variant alongside the original object', async () => {
    const storage = new MemoryObjectStorage();
    const storageKey = 'uploads/user-1/avatar/key-1';
    storage.simulateClientPut(storageKey, TINY_PNG, 'image/png');

    const processor = new ImageProcessingProcessor(storage, createSilentLogger());
    const job = {
      name: JOB_MEDIA_IMAGE_PROCESS,
      data: createJobPayload(
        { uploadId: 'upload-1', storageKey, purpose: 'avatar' },
        { idempotencyKey: 'media:upload-1' },
      ),
    } as Job;

    await processor.process(job);

    expect(await storage.headObject(storageKey)).not.toBeNull();
    const variant = await storage.headObject(`${storageKey}.webp`);
    expect(variant).not.toBeNull();
    expect(variant?.contentType).toBe('image/webp');
  });

  it('acks when source object is missing', async () => {
    const storage = new MemoryObjectStorage();
    const logger = createSilentLogger();
    const processor = new ImageProcessingProcessor(storage, logger);

    await processor.process({
      name: JOB_MEDIA_IMAGE_PROCESS,
      data: createJobPayload(
        { uploadId: 'missing', storageKey: 'missing/key', purpose: 'avatar' },
        { idempotencyKey: 'media:missing' },
      ),
    } as Job);

    expect(logger.event).toHaveBeenCalledWith(
      'warn',
      expect.objectContaining({ uploadId: 'missing' }),
      'media.image.process.missing_source',
    );
  });
});
