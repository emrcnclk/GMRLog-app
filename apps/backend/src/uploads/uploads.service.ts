import { randomUUID } from 'node:crypto';

import type { UploadRepository, UserRepository } from '@gmrlog/database';
import type { UploadGrantResponse, UploadResponse } from '@gmrlog/types';
import type { UploadConfirmInput, UploadGrantInput } from '@gmrlog/validators';
import { UPLOAD_GRANT_TTL_MS, UPLOAD_MAX_BYTES_BY_PURPOSE } from '@gmrlog/validators';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { toBullJobId } from '../infrastructure/jobs/bull-job-id';
import { JobsService } from '../infrastructure/jobs/jobs.service';
import { QUEUE_MEDIA } from '../infrastructure/jobs/queue-names';
import type { ObjectStoragePort } from '../infrastructure/storage/object-storage.port';
import { OBJECT_STORAGE, UPLOAD_GRANT_META } from '../infrastructure/storage/storage.tokens';
import type { UploadGrantMetaStore } from '../infrastructure/storage/upload-grant-meta.store';

import { toUploadGrantResponse, toUploadResponse } from './mappers/upload.mapper';
import { UPLOAD_REPOSITORY, UPLOAD_USER_REPOSITORY } from './uploads.tokens';

/**
 * Uploads domain (D3.19). Grant → presigned PUT → HeadObject confirm.
 */
@Injectable()
export class UploadsService {
  constructor(
    @Inject(UPLOAD_REPOSITORY) private readonly uploads: UploadRepository,
    @Inject(UPLOAD_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStoragePort,
    @Inject(UPLOAD_GRANT_META) private readonly grantMeta: UploadGrantMetaStore,
    private readonly jobs: JobsService,
  ) {}

  async createGrant(ownerId: string, input: UploadGrantInput): Promise<UploadGrantResponse> {
    await this.requireActiveUser(ownerId);
    const storageKey = buildStorageKey(ownerId, input.purpose);
    const upload = await this.uploads.create({
      owner: { connect: { id: ownerId } },
      purpose: input.purpose,
      storageKey,
      status: 'granted',
    });

    const expiresInSeconds = Math.ceil(UPLOAD_GRANT_TTL_MS / 1000);
    const signed = await this.storage.createPresignedPut({
      storageKey,
      contentType: input.contentType,
      byteSize: input.byteSize,
      expiresInSeconds,
    });

    await this.grantMeta.put(upload.id, {
      contentType: input.contentType,
      byteSize: input.byteSize,
      storageKey,
      ownerId,
    });

    return toUploadGrantResponse(upload, signed.uploadUrl, signed.expiresAt, signed.headers);
  }

  async confirmUpload(ownerId: string, input: UploadConfirmInput): Promise<UploadResponse> {
    await this.requireActiveUser(ownerId);
    const upload = await this.uploads.findByOwnerAndId(ownerId, input.grantId);
    if (!upload) {
      throw new NotFoundException('Upload grant not found');
    }
    if (upload.storageKey !== input.storageKey) {
      throw new BadRequestException('storageKey does not match grant');
    }
    if (upload.status === 'confirmed') {
      throw new ConflictException('Upload already confirmed');
    }
    if (upload.status === 'expired') {
      throw new ConflictException('Upload grant has expired');
    }
    const expiresAt = upload.createdAt.getTime() + UPLOAD_GRANT_TTL_MS;
    if (Date.now() > expiresAt) {
      await this.uploads.updateStatus(upload.id, 'expired');
      throw new ConflictException('Upload grant has expired');
    }

    const meta = await this.grantMeta.get(upload.id);
    const head = await this.storage.headObject(upload.storageKey);
    if (head == null) {
      throw new BadRequestException('Uploaded object not found in storage');
    }

    const expectedType = meta?.contentType;
    const expectedSize = meta?.byteSize;
    const maxBytes = UPLOAD_MAX_BYTES_BY_PURPOSE[upload.purpose];

    if (head.contentLength <= 0 || head.contentLength > maxBytes) {
      throw new BadRequestException('Uploaded object size is invalid');
    }
    if (expectedSize != null && head.contentLength !== expectedSize) {
      throw new BadRequestException('Uploaded object size does not match grant');
    }
    if (
      expectedType != null &&
      head.contentType != null &&
      head.contentType.split(';')[0]?.trim() !== expectedType
    ) {
      throw new BadRequestException('Uploaded object MIME type does not match grant');
    }

    const confirmed = await this.uploads.updateStatus(upload.id, 'confirmed');
    await this.grantMeta.delete(upload.id);

    try {
      await this.jobs.getQueue(QUEUE_MEDIA).add(
        'media.image.process',
        {
          schemaVersion: 1,
          correlationId: upload.id,
          idempotencyKey: `media.image.process:${upload.id}`,
          enqueuedAt: new Date().toISOString(),
          data: {
            uploadId: upload.id,
            storageKey: upload.storageKey,
            purpose: upload.purpose,
          },
        },
        {
          jobId: toBullJobId(`media.image.process:${upload.id}`),
          attempts: 4,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 86_400, count: 1000 },
          removeOnFail: false,
        },
      );
    } catch {
      // Confirm already committed — media job can be recovered by re-drive/ops.
    }

    return toUploadResponse(confirmed);
  }

  async expireStaleGrants(): Promise<number> {
    const cutoff = new Date(Date.now() - UPLOAD_GRANT_TTL_MS);
    return this.uploads.expireGrantedOlderThan(cutoff);
  }

  private async requireActiveUser(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }
  }
}

function buildStorageKey(ownerId: string, purpose: string): string {
  return `uploads/${ownerId}/${purpose}/${randomUUID()}`;
}
