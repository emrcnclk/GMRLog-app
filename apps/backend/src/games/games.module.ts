import { PrismaGameRepository, PrismaLibraryEntryRepository } from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { GAME_LIBRARY_ENTRY_REPOSITORY, GAME_REPOSITORY } from './games.tokens';
import { MetadataModule } from './metadata/metadata.module';

/**
 * Game catalog domain (D3.18, extended D3.25). Controllers → GamesService →
 * repositories. Game Hub: see GameHubModule.
 */
@Module({
  imports: [AuthModule, PrismaModule, MetadataModule],
  controllers: [GamesController],
  providers: [
    {
      provide: GAME_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaGameRepository(prisma),
    },
    {
      provide: GAME_LIBRARY_ENTRY_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaLibraryEntryRepository(prisma),
    },
    GamesService,
  ],
  exports: [GamesService],
})
export class GamesModule {}
