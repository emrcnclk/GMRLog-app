import {
  PrismaCommunityMemberRepository,
  PrismaCommunityRepository,
  PrismaEventInviteRepository,
  PrismaEventParticipationRepository,
  PrismaEventRepository,
  PrismaGameRepository,
  PrismaNotificationRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { JobsModule } from '../infrastructure/jobs/jobs.module';

import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import {
  EVENT_COMMUNITY_MEMBER_REPOSITORY,
  EVENT_COMMUNITY_REPOSITORY,
  EVENT_GAME_REPOSITORY,
  EVENT_INVITE_REPOSITORY,
  EVENT_NOTIFICATION_REPOSITORY,
  EVENT_PARTICIPATION_REPOSITORY,
  EVENT_REPOSITORY,
  EVENT_USER_REPOSITORY,
} from './events.tokens';

/**
 * Event domain (D2.17 · D3.24). Controllers → EventsService → repositories.
 */
@Module({
  imports: [AuthModule, PrismaModule, JobsModule],
  controllers: [EventsController],
  providers: [
    {
      provide: EVENT_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaEventRepository(prisma),
    },
    {
      provide: EVENT_PARTICIPATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaEventParticipationRepository(prisma),
    },
    {
      provide: EVENT_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    {
      provide: EVENT_INVITE_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaEventInviteRepository(prisma),
    },
    {
      provide: EVENT_NOTIFICATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaNotificationRepository(prisma),
    },
    {
      provide: EVENT_GAME_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaGameRepository(prisma),
    },
    {
      provide: EVENT_COMMUNITY_MEMBER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommunityMemberRepository(prisma),
    },
    {
      provide: EVENT_COMMUNITY_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommunityRepository(prisma),
    },
    EventsService,
  ],
  exports: [EventsService],
})
export class EventsModule {}
