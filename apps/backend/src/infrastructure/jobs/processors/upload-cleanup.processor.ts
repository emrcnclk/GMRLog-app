import type { UploadRepository } from '@gmrlog/database';
import { UPLOAD_GRANT_TTL_MS } from '@gmrlog/validators';
import { Inject, Injectable } from '@nestjs/common';
import type { Job } from 'bullmq';

import { AppLogger } from '../../logging/app-logger.service';
import type { ObjectStoragePort } from '../../storage/object-storage.port';
import { OBJECT_STORAGE } from '../../storage/storage.tokens';
import { JOB_MAINTENANCE_UPLOAD_CLEANUP, JOB_MEDIA_PURGE } from '../job-names';
import type { JobPayload } from '../job-payload';
import { WORKER_UPLOAD_REPOSITORY } from '../worker.tokens';

interface MediaPurgeData {
  keys: string[];
}

@Injectable()
export class UploadCleanupProcessor {
  constructor(
    @Inject(WORKER_UPLOAD_REPOSITORY) private readonly uploads: UploadRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStoragePort,
    private readonly logger: AppLogger,
  ) {}

  supports(jobName: string): boolean {
    return jobName === JOB_MAINTENANCE_UPLOAD_CLEANUP || jobName === JOB_MEDIA_PURGE;
  }

  async process(job: Job<JobPayload>): Promise<void> {
    if (job.name === JOB_MAINTENANCE_UPLOAD_CLEANUP) {
      await this.expireStaleGrants();
      return;
    }
    if (job.name === JOB_MEDIA_PURGE) {
      await this.purgeOrphanKeys(job.data.data as MediaPurgeData);
    }
  }

  private async expireStaleGrants(): Promise<void> {
    const cutoff = new Date(Date.now() - UPLOAD_GRANT_TTL_MS);
    const stale = await this.uploads.listGrantedOlderThan(cutoff);

    for (const upload of stale) {
      try {
        await this.storage.deleteObject(upload.storageKey);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.event(
          'warn',
          { uploadId: upload.id, storageKey: upload.storageKey, error: message },
          'maintenance.upload.storage_delete.failed',
        );
      }
    }

    const expiredCount = await this.uploads.expireGrantedOlderThan(cutoff);
    this.logger.event(
      'info',
      { expiredCount, storageKeysAttempted: stale.length },
      'maintenance.upload.cleanup.completed',
    );
  }

  private async purgeOrphanKeys(data: MediaPurgeData): Promise<void> {
    const keys = data.keys;
    if (keys.length === 0) {
      return;
    }
    const deleted = await this.storage.deleteMany(keys);
    this.logger.event('info', { deleted, requested: keys.length }, 'media.purge.completed');
  }
}
