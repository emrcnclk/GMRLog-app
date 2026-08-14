import {
  PrismaCommunityMemberRepository,
  PrismaCommunityRepository,
  PrismaDiscoverRepository,
  PrismaEventParticipationRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { ArchetypesModule } from '../archetypes/archetypes.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { BecauseYouPlayedService } from './because-you-played.service';
import { DiscoverController } from './discover.controller';
import { DiscoverService } from './discover.service';
import {
  DISCOVER_COMMUNITY_MEMBER_REPOSITORY,
  DISCOVER_COMMUNITY_REPOSITORY,
  DISCOVER_EVENT_PARTICIPATION_REPOSITORY,
  DISCOVER_REPOSITORY,
} from './discover.tokens';
import { DiscoveryScoreService } from './discovery-score.service';
import { DnaMatchController } from './dna-match.controller';
import { DnaMatchService } from './dna-match.service';
import { RecommendationService } from './recommendation.service';
import { SimilarityService } from './similarity.service';
import { TrendingService } from './trending.service';

/**
 * Discover domain (D2.14 + D3.22 + D3.24). Controllers → DiscoverService →
 * repositories + deterministic scoring services.
 */
@Module({
  imports: [AuthModule, PrismaModule, ArchetypesModule],
  controllers: [DiscoverController, DnaMatchController],
  providers: [
    {
      provide: DISCOVER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaDiscoverRepository(prisma),
    },
    {
      provide: DISCOVER_COMMUNITY_MEMBER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommunityMemberRepository(prisma),
    },
    {
      provide: DISCOVER_COMMUNITY_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaCommunityRepository(prisma),
    },
    {
      provide: DISCOVER_EVENT_PARTICIPATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaEventParticipationRepository(prisma),
    },
    DiscoveryScoreService,
    SimilarityService,
    RecommendationService,
    TrendingService,
    BecauseYouPlayedService,
    DiscoverService,
    DnaMatchService,
  ],
  exports: [
    DiscoveryScoreService,
    SimilarityService,
    RecommendationService,
    BecauseYouPlayedService,
  ],
})
export class DiscoverModule {}
