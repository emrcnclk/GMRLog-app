import {
  Inject,
  Injectable,
  Module,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import { Redis } from 'ioredis';

import { ENV } from '../config/config.module';
import type { BackendEnv } from '../config/env.schema';
import { AppLogger } from '../logging/app-logger.service';
import { LoggerModule } from '../logging/logger.module';

import { FeedCacheService } from './feed-cache.service';
import { PLATFORM_REDIS } from './redis.constants';

@Injectable()
class PlatformRedisLifecycle implements OnModuleInit, OnApplicationShutdown {
  constructor(
    @Inject(PLATFORM_REDIS) private readonly redis: Redis,
    private readonly logger: AppLogger,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      if (this.redis.status === 'wait') {
        await this.redis.connect();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.event('warn', { error: message }, 'platform redis connect deferred');
    }
  }

  async onApplicationShutdown(): Promise<void> {
    try {
      await this.redis.quit();
    } catch {
      this.redis.disconnect();
    }
  }
}

/**
 * Shared Redis client for platform cross-cuts (D2.20):
 * rate limiting · idempotency · readiness probes.
 * Separate from BullMQ `JOBS_CONNECTION` (blocking command settings).
 */
@Module({
  imports: [LoggerModule],
  providers: [
    {
      provide: PLATFORM_REDIS,
      inject: [ENV, AppLogger],
      useFactory: (env: BackendEnv, logger: AppLogger): Redis => {
        const client = new Redis(env.REDIS_URL, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableReadyCheck: true,
          connectTimeout: 750,
          retryStrategy: () => null,
        });
        client.on('error', (error: Error) => {
          logger.event('warn', { error: error.message }, 'platform redis error');
        });
        return client;
      },
    },
    PlatformRedisLifecycle,
    FeedCacheService,
  ],
  exports: [PLATFORM_REDIS, FeedCacheService],
})
export class RedisModule {}
