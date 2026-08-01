import { PrismaNotificationRepository } from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NOTIFICATION_REPOSITORY } from './notifications.tokens';

/**
 * Notification domain (D2.10). Controllers → NotificationsService →
 * `@gmrlog/database` repositories (F6.3). No realtime / push / email / jobs.
 */
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [NotificationsController],
  providers: [
    {
      provide: NOTIFICATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaNotificationRepository(prisma),
    },
    NotificationsService,
  ],
})
export class NotificationsModule {}
