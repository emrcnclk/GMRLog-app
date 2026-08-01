import { Inject, Injectable } from '@nestjs/common';
import type { Job } from 'bullmq';
import sharp from 'sharp';

import { AppLogger } from '../../logging/app-logger.service';
import type { ObjectStoragePort } from '../../storage/object-storage.port';
import { OBJECT_STORAGE } from '../../storage/storage.tokens';
import { JOB_MEDIA_IMAGE_PROCESS } from '../job-names';
import type { JobPayload } from '../job-payload';

const MAX_IMAGE_EDGE_PX = 2048;

interface ImageProcessData {
  uploadId: string;
  storageKey: string;
  purpose: string;
}

@Injectable()
export class ImageProcessingProcessor {
  constructor(
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStoragePort,
    private readonly logger: AppLogger,
  ) {}

  supports(jobName: string): boolean {
    return jobName === JOB_MEDIA_IMAGE_PROCESS;
  }

  async process(job: Job<JobPayload<ImageProcessData>>): Promise<void> {
    const { uploadId, storageKey } = job.data.data;
    const source = await this.storage.getObjectBuffer(storageKey);
    if (source == null) {
      this.logger.event('warn', { uploadId, storageKey }, 'media.image.process.missing_source');
      return;
    }

    try {
      const variant = await sharp(source)
        .rotate()
        .resize(MAX_IMAGE_EDGE_PX, MAX_IMAGE_EDGE_PX, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();

      const variantKey = `${storageKey}.webp`;
      await this.storage.putObject(variantKey, variant, 'image/webp');
      this.logger.event(
        'info',
        { uploadId, storageKey, variantKey, bytes: variant.byteLength },
        'media.image.process.completed',
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.event(
        'warn',
        { uploadId, storageKey, error: message },
        'media.image.process.failed',
      );
    }
  }
}
