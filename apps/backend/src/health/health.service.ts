import type { HealthReport } from '@gmrlog/types';
import { Inject, Injectable, Optional, ServiceUnavailableException } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { ENV } from '../infrastructure/config/config.module';
import type { BackendEnv } from '../infrastructure/config/env.schema';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { PLATFORM_REDIS } from '../infrastructure/redis/redis.constants';
import { MeiliClientService } from '../infrastructure/search/meili.client';
import type { ObjectStoragePort } from '../infrastructure/storage/object-storage.port';
import { OBJECT_STORAGE } from '../infrastructure/storage/storage.tokens';

import type { HealthCheckState, HealthLiveReport, HealthReadyReport } from './health.types';

@Injectable()
export class HealthService {
  constructor(
    @Inject(ENV) private readonly env: BackendEnv,
    private readonly prisma: PrismaService,
    @Inject(PLATFORM_REDIS) private readonly redis: Redis,
    @Optional() @Inject(OBJECT_STORAGE) private readonly storage: ObjectStoragePort | null,
    @Optional() @Inject(MeiliClientService) private readonly meili: MeiliClientService | null,
  ) {}

  getHealth(): HealthReport {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeMs: Math.round(process.uptime() * 1000),
      version: this.env.APP_VERSION,
      environment: this.env.APP_ENV,
    };
  }

  getLive(): HealthLiveReport {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getReady(): Promise<HealthReadyReport> {
    const [database, redis, storage, meili] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
      this.checkMeili(),
    ]);
    // Configured integrations (MinIO / Meilisearch) gate readiness (D3.20).
    const storageOk = storage === undefined || storage === 'up';
    const meiliOk = meili === undefined || meili === 'up';
    const ready = database === 'up' && redis === 'up' && storageOk && meiliOk;
    const report: HealthReadyReport = {
      status: ready ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database,
        redis,
        ...(storage !== undefined ? { storage } : {}),
        ...(meili !== undefined ? { meili } : {}),
      },
      version: this.env.APP_VERSION,
      environment: this.env.APP_ENV,
    };
    if (!ready) {
      throw new ServiceUnavailableException({
        message: 'Platform dependencies unavailable',
        code: 'INTEGRATION_UNAVAILABLE',
      });
    }
    return report;
  }

  private async checkDatabase(): Promise<HealthCheckState> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async checkRedis(): Promise<HealthCheckState> {
    try {
      if (this.redis.status !== 'ready') {
        if (this.redis.status === 'wait') {
          await this.redis.connect();
        }
      }
      await this.redis.ping();
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async checkMeili(): Promise<HealthCheckState | undefined> {
    // Production/local parity: configured host must gate readiness (D3.20).
    if (this.env.MEILI_HOST.trim().length === 0) {
      return undefined;
    }
    if (!this.meili?.isAvailable()) {
      return 'down';
    }
    try {
      return (await this.meili.health()) ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }

  private async checkStorage(): Promise<HealthCheckState | undefined> {
    if (this.storage == null) {
      if (this.env.S3_ENDPOINT.trim().length === 0) {
        return undefined;
      }
      return 'down';
    }
    try {
      return (await this.storage.ping()) ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }
}
