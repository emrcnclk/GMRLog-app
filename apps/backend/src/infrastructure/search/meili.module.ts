import { Module } from '@nestjs/common';

import { AppConfigModule } from '../config/config.module';
import { PrismaModule } from '../database/prisma.module';
import { LoggerModule } from '../logging/logger.module';

import { MEILI_CLIENT, MeiliClientService } from './meili.client';
import { SearchIndexService } from './search-index.service';

@Module({
  imports: [AppConfigModule, LoggerModule, PrismaModule],
  providers: [
    MeiliClientService,
    {
      provide: MEILI_CLIENT,
      useExisting: MeiliClientService,
    },
    SearchIndexService,
  ],
  exports: [MEILI_CLIENT, MeiliClientService, SearchIndexService],
})
export class MeiliModule {}
