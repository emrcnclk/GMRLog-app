import { PrismaActivityRepository, PrismaCommunityActivityRepository } from '@gmrlog/database';
import { Module } from '@nestjs/common';
import { Redis } from 'ioredis';

import { FollowsModule } from '../../follows/follows.module';
import { ENV } from '../config/config.module';
import type { BackendEnv } from '../config/env.schema';
import { PrismaModule } from '../database/prisma.module';
import { PrismaService } from '../database/prisma.service';
import { RedisModule } from '../redis/redis.module';
import { MeiliModule } from '../search/meili.module';

import { EventReminderPublisher } from './event-reminder.publisher';
import { FeedFanoutPublisher } from './feed-fanout.publisher';
import { FeedFanoutService } from './feed-fanout.service';
import { JOBS_CONNECTION } from './jobs.constants';
import { JobsService } from './jobs.service';
import { MaintenanceService } from './maintenance.service';
import { SearchIndexPublisher } from './search-index.publisher';
import { WORKER_ACTIVITY_REPOSITORY, WORKER_COMMUNITY_ACTIVITY_REPOSITORY } from './worker.tokens';

@Module({
  imports: [PrismaModule, FollowsModule, MeiliModule, RedisModule],
  providers: [
    {
      provide: JOBS_CONNECTION,
      useFactory: (env: BackendEnv) =>
        new Redis(env.REDIS_URL, {
          lazyConnect: true,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        }),
      inject: [ENV],
    },
    JobsService,
    MaintenanceService,
    {
      provide: WORKER_ACTIVITY_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaActivityRepository(prisma),
    },
    {
      provide: WORKER_COMMUNITY_ACTIVITY_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommunityActivityRepository(prisma),
    },
    FeedFanoutService,
    FeedFanoutPublisher,
    SearchIndexPublisher,
    EventReminderPublisher,
  ],
  exports: [
    JOBS_CONNECTION,
    JobsService,
    MaintenanceService,
    FeedFanoutPublisher,
    FeedFanoutService,
    SearchIndexPublisher,
    EventReminderPublisher,
  ],
})
export class JobsModule {}
