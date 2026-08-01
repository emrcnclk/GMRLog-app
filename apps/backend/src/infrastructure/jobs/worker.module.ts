import {
  PrismaEventParticipationRepository,
  PrismaEventRepository,
  PrismaNotificationRepository,
  PrismaUploadRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { FollowsModule } from '../../follows/follows.module';
import { GameCatalogWorkerService } from '../../games/metadata/game-catalog-worker.service';
import { MetadataModule } from '../../games/metadata/metadata.module';
import { IntegrationsModule } from '../../integrations/integrations.module';
import { AppConfigModule } from '../config/config.module';
import { PrismaModule } from '../database/prisma.module';
import { PrismaService } from '../database/prisma.service';
import { LoggerModule } from '../logging/logger.module';
import { MeiliModule } from '../search/meili.module';
import { StorageModule } from '../storage/storage.module';

import { JobsModule } from './jobs.module';
import { EventReminderProcessor } from './processors/event-reminder.processor';
import { FeedFanoutProcessor } from './processors/feed-fanout.processor';
import { ImageProcessingProcessor } from './processors/image-processing.processor';
import { NotificationCleanupProcessor } from './processors/notification-cleanup.processor';
import { SearchIndexProcessor } from './processors/search-index.processor';
import { SessionCleanupProcessor } from './processors/session-cleanup.processor';
import { UploadCleanupProcessor } from './processors/upload-cleanup.processor';
import { SchedulerService } from './scheduler.service';
import { WorkerRunnerService } from './worker-runner.service';
import {
  WORKER_EVENT_PARTICIPATION_REPOSITORY,
  WORKER_EVENT_REPOSITORY,
  WORKER_NOTIFICATION_REPOSITORY,
  WORKER_UPLOAD_REPOSITORY,
} from './worker.tokens';

/**
 * BullMQ worker process module (D3.19). No HTTP — consumers only.
 */
@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    PrismaModule,
    StorageModule,
    FollowsModule,
    JobsModule,
    MeiliModule,
    IntegrationsModule,
    MetadataModule,
  ],
  providers: [
    {
      provide: WORKER_UPLOAD_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUploadRepository(prisma),
    },
    {
      provide: WORKER_NOTIFICATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaNotificationRepository(prisma),
    },
    {
      provide: WORKER_EVENT_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaEventRepository(prisma),
    },
    {
      provide: WORKER_EVENT_PARTICIPATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaEventParticipationRepository(prisma),
    },
    UploadCleanupProcessor,
    NotificationCleanupProcessor,
    SessionCleanupProcessor,
    FeedFanoutProcessor,
    EventReminderProcessor,
    ImageProcessingProcessor,
    SearchIndexProcessor,
    WorkerRunnerService,
    SchedulerService,
    // D3.25 — catalog queues consume only in the worker process.
    GameCatalogWorkerService,
  ],
})
export class WorkerModule {}
