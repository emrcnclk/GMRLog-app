import { PrismaGameMetadataRepository } from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AppConfigModule, ENV } from '../../infrastructure/config/config.module';
import type { BackendEnv } from '../../infrastructure/config/env.schema';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { JobsModule } from '../../infrastructure/jobs/jobs.module';
import { AppLogger } from '../../infrastructure/logging/app-logger.service';
import { LoggerModule } from '../../infrastructure/logging/logger.module';
import { MediaProcessingService } from '../../infrastructure/media/media-processing.service';
import { MediaModule } from '../../infrastructure/media/media.module';
import { GAME_METADATA_REPOSITORY } from '../games.tokens';

import { GameMediaIngestionService } from './game-media-ingestion.service';
import { GameMetadataBackfillService } from './game-metadata-backfill.service';
import { GameMetadataProcessor } from './game-metadata.processor';
import { GameMetadataPublisher } from './game-metadata.publisher';
import { GameMetadataService } from './game-metadata.service';
import { loadMetadataConfig, METADATA_CONFIG, type MetadataConfig } from './metadata.config';
import { IgdbMetadataProvider } from './providers/igdb.provider';
import {
  GAME_METADATA_PROVIDERS,
  type GameMetadataProvider,
} from './providers/metadata-provider.port';
import { MetadataProviderRegistry } from './providers/metadata-provider.registry';
import { RawgMetadataProvider } from './providers/rawg.provider';
import { SteamStoreMetadataProvider } from './providers/steam-store.provider';

/**
 * Catalog metadata domain (D3.25 — docs/18_CATALOG/).
 *
 * Exports the publisher and repository so other domains (library sync, games
 * read model) can enqueue and project without importing provider internals.
 * The worker service is NOT provided here — only `WorkerModule` starts consumers.
 */
@Module({
  imports: [AppConfigModule, LoggerModule, PrismaModule, MediaModule, JobsModule],
  providers: [
    {
      provide: METADATA_CONFIG,
      useFactory: (): MetadataConfig => loadMetadataConfig(),
    },
    {
      provide: GAME_METADATA_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaGameMetadataRepository(prisma),
    },
    {
      provide: GAME_METADATA_PROVIDERS,
      inject: [ENV],
      useFactory: (env: BackendEnv): GameMetadataProvider[] => [
        new IgdbMetadataProvider({
          clientId: env.IGDB_CLIENT_ID,
          clientSecret: env.IGDB_CLIENT_SECRET,
          ratePerSecond: env.IGDB_RATE_LIMIT_RPS,
        }),
        new SteamStoreMetadataProvider({
          enabled: env.STEAM_STORE_METADATA_ENABLED,
          ratePerSecond: env.STEAM_STORE_RATE_LIMIT_RPS,
        }),
        // Disabled by default — docs/18_CATALOG/METADATA_LICENSING.md §4.
        new RawgMetadataProvider({
          enabled: env.RAWG_ENABLED,
          apiKey: env.RAWG_API_KEY,
          ratePerSecond: env.RAWG_RATE_LIMIT_RPS,
        }),
      ],
    },
    MetadataProviderRegistry,
    GameMetadataPublisher,
    GameMetadataService,
    GameMetadataBackfillService,
    {
      provide: GameMediaIngestionService,
      inject: [GAME_METADATA_REPOSITORY, MediaProcessingService, AppLogger, METADATA_CONFIG],
      useFactory: (
        repository: ConstructorParameters<typeof GameMediaIngestionService>[0],
        mediaProcessing: MediaProcessingService,
        logger: AppLogger,
        config: MetadataConfig,
      ) => new GameMediaIngestionService(repository, mediaProcessing, logger, config),
    },
    GameMetadataProcessor,
  ],
  exports: [
    GAME_METADATA_REPOSITORY,
    METADATA_CONFIG,
    GameMetadataPublisher,
    GameMetadataService,
    GameMetadataBackfillService,
    GameMediaIngestionService,
    GameMetadataProcessor,
    MetadataProviderRegistry,
  ],
})
export class MetadataModule {}
