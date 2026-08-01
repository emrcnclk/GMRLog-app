import {
  PrismaGameRepository,
  PrismaTierListRepository,
  PrismaTierSlotRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { FollowsModule } from '../follows/follows.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { TierSlotService } from './tier-slot.service';
import { TierSlotsController } from './tier-slots.controller';
import { TierListsController } from './tierlists.controller';
import { TierListsService } from './tierlists.service';
import {
  TIER_LIST_GAME_REPOSITORY,
  TIER_LIST_REPOSITORY,
  TIER_LIST_USER_REPOSITORY,
  TIER_SLOT_REPOSITORY,
} from './tierlists.tokens';

/**
 * Tier list domain (D2.9). Controllers → services → `@gmrlog/database`
 * repositories (F6.3). Prisma is consumed only through repository bindings.
 */
@Module({
  imports: [AuthModule, PrismaModule, FollowsModule],
  controllers: [TierListsController, TierSlotsController],
  providers: [
    {
      provide: TIER_LIST_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaTierListRepository(prisma),
    },
    {
      provide: TIER_SLOT_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaTierSlotRepository(prisma),
    },
    {
      provide: TIER_LIST_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    {
      provide: TIER_LIST_GAME_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaGameRepository(prisma),
    },
    TierListsService,
    TierSlotService,
  ],
})
export class TierListsModule {}
