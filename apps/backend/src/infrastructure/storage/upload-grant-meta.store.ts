import { UPLOAD_GRANT_TTL_MS } from '@gmrlog/validators';
import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { PLATFORM_REDIS } from '../redis/redis.constants';

export interface UploadGrantMeta {
  contentType: string;
  byteSize: number;
  storageKey: string;
  ownerId: string;
}

const KEY_PREFIX = 'gmrlog:upload-grant:';

@Injectable()
export class UploadGrantMetaStore {
  constructor(@Inject(PLATFORM_REDIS) private readonly redis: Redis) {}

  async put(grantId: string, meta: UploadGrantMeta): Promise<void> {
    const ttlSeconds = Math.ceil(UPLOAD_GRANT_TTL_MS / 1000);
    await this.redis.set(`${KEY_PREFIX}${grantId}`, JSON.stringify(meta), 'EX', ttlSeconds);
  }

  async get(grantId: string): Promise<UploadGrantMeta | null> {
    const raw = await this.redis.get(`${KEY_PREFIX}${grantId}`);
    if (raw == null) {
      return null;
    }
    return JSON.parse(raw) as UploadGrantMeta;
  }

  async delete(grantId: string): Promise<void> {
    await this.redis.del(`${KEY_PREFIX}${grantId}`);
  }
}

/** In-memory grant meta for unit tests. */
export class MemoryUploadGrantMetaStore {
  private readonly rows = new Map<string, UploadGrantMeta>();

  put(grantId: string, meta: UploadGrantMeta): Promise<void> {
    this.rows.set(grantId, meta);
    return Promise.resolve();
  }

  get(grantId: string): Promise<UploadGrantMeta | null> {
    return Promise.resolve(this.rows.get(grantId) ?? null);
  }

  delete(grantId: string): Promise<void> {
    this.rows.delete(grantId);
    return Promise.resolve();
  }
}
