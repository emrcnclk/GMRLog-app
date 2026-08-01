import { Module } from '@nestjs/common';

import { AchievementsModule } from '../achievements/achievements.module';
import { AuthModule } from '../auth/auth.module';
import { DiscoverModule } from '../discover/discover.module';
import { MetadataModule } from '../games/metadata/metadata.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { JobsModule } from '../infrastructure/jobs/jobs.module';

import { CsvImportService } from './csv-import.service';
import { IntegrationJobProcessor } from './integration-job.processor';
import { IntegrationJobsPublisher } from './integration-jobs.publisher';
import { IntegrationsWorkerService } from './integrations-worker.service';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { LibrarySyncService } from './library-sync.service';
import { createSteamWebApiClient, STEAM_WEB_API_CLIENT } from './steam/steam-web-api.client';
import { SteamConnectService } from './steam-connect.service';

/**
 * Platform Integrations domain (D3.23 / docs/10_INTEGRATIONS).
 */
@Module({
  imports: [
    AuthModule,
    PrismaModule,
    JobsModule,
    AchievementsModule,
    DiscoverModule,
    // D3.25 — skeleton games created during sync are enqueued for enrichment.
    MetadataModule,
  ],
  controllers: [IntegrationsController],
  providers: [
    {
      provide: STEAM_WEB_API_CLIENT,
      useFactory: () => createSteamWebApiClient(),
    },
    IntegrationJobsPublisher,
    IntegrationJobProcessor,
    IntegrationsWorkerService,
    SteamConnectService,
    LibrarySyncService,
    CsvImportService,
    IntegrationsService,
  ],
  exports: [
    IntegrationsService,
    SteamConnectService,
    LibrarySyncService,
    CsvImportService,
    IntegrationJobsPublisher,
    STEAM_WEB_API_CLIENT,
  ],
})
export class IntegrationsModule {}
