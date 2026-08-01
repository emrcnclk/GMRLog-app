import { PrismaSearchRepository } from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { FollowsModule } from '../follows/follows.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { MeiliModule } from '../infrastructure/search/meili.module';

import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SEARCH_REPOSITORY } from './search.tokens';

/**
 * Search domain (D2.15 / D3.19). Controllers → SearchService →
 * Meilisearch or `@gmrlog/database` repositories (F6.3).
 */
@Module({
  imports: [AuthModule, PrismaModule, FollowsModule, MeiliModule],
  controllers: [SearchController],
  providers: [
    {
      provide: SEARCH_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaSearchRepository(prisma),
    },
    SearchService,
  ],
})
export class SearchModule {}
