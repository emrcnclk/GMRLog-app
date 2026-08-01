import { PrismaFollowRepository, PrismaUserRepository } from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';
import { FOLLOW_REPOSITORY, FOLLOW_USER_REPOSITORY } from './follows.tokens';
import { MeFollowsController } from './me-follows.controller';
import { UserFollowsController } from './user-follows.controller';

/**
 * Follow domain (D2.11). Controllers → FollowsService → `@gmrlog/database`
 * repositories (F6.3). No suggestions · feed · notifications.
 */
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [FollowsController, UserFollowsController, MeFollowsController],
  providers: [
    {
      provide: FOLLOW_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaFollowRepository(prisma),
    },
    {
      provide: FOLLOW_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    FollowsService,
  ],
  exports: [FOLLOW_REPOSITORY],
})
export class FollowsModule {}
