import {
  PrismaNotificationRepository,
  PrismaUserReputationRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { ReputationEngineService } from './reputation-engine.service';
import {
  REPUTATION_NOTIFICATION_REPOSITORY,
  REPUTATION_REPOSITORY,
  REPUTATION_USER_REPOSITORY,
} from './reputation.tokens';
import { UserReputationController } from './user-reputation.controller';

/**
 * Gaming Reputation domain (D3.24 / REPUTATION.md). Controllers →
 * ReputationEngineService → `@gmrlog/database` repositories.
 */
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [UserReputationController],
  providers: [
    {
      provide: REPUTATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserReputationRepository(prisma),
    },
    {
      provide: REPUTATION_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    {
      provide: REPUTATION_NOTIFICATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaNotificationRepository(prisma),
    },
    ReputationEngineService,
  ],
  exports: [ReputationEngineService],
})
export class ReputationModule {}
