import {
  PrismaCollectionEntryRepository,
  PrismaCollectionRepository,
  PrismaGameRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { FollowsModule } from '../follows/follows.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { CollectionDiscoverService } from './collection-discover.service';
import { CollectionEntriesController } from './collection-entries.controller';
import { CollectionEntriesService } from './collection-entries.service';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import {
  COLLECTION_ENTRY_REPOSITORY,
  COLLECTION_GAME_REPOSITORY,
  COLLECTION_REPOSITORY,
  COLLECTION_USER_REPOSITORY,
} from './collections.tokens';
import { DynamicCollectionResolver } from './dynamic-collection.resolver';

/**
 * Collection domain (D2.8 / D3.22). Controllers → services → `@gmrlog/database`
 * repositories (F6.3). Follower + dynamic membership use PrismaService directly
 * (additive D3.22 tables without dedicated repository packages yet).
 */
@Module({
  imports: [AuthModule, PrismaModule, FollowsModule],
  controllers: [CollectionsController, CollectionEntriesController],
  providers: [
    {
      provide: COLLECTION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCollectionRepository(prisma),
    },
    {
      provide: COLLECTION_ENTRY_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCollectionEntryRepository(prisma),
    },
    {
      provide: COLLECTION_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    {
      provide: COLLECTION_GAME_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaGameRepository(prisma),
    },
    DynamicCollectionResolver,
    CollectionsService,
    CollectionEntriesService,
    CollectionDiscoverService,
  ],
})
export class CollectionsModule {}
