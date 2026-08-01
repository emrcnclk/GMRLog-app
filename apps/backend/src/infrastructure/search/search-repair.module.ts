import { Module } from '@nestjs/common';

import { AppConfigModule } from '../config/config.module';
import { PrismaModule } from '../database/prisma.module';
import { LoggerModule } from '../logging/logger.module';

import { MeiliModule } from './meili.module';
import { SearchRepairService } from './search-repair.service';

/**
 * D3.25.1 — standalone module for `pnpm repair:index`
 * (`src/repair-index.main.ts`). No HTTP, no BullMQ workers — a one-shot
 * application context that reconciles Postgres and Meilisearch, then exits.
 */
@Module({
  imports: [AppConfigModule, LoggerModule, PrismaModule, MeiliModule],
  providers: [SearchRepairService],
  exports: [SearchRepairService],
})
export class SearchRepairModule {}
