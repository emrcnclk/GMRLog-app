import { Module } from '@nestjs/common';

import { PrismaModule } from '../infrastructure/database/prisma.module';
import { RedisModule } from '../infrastructure/redis/redis.module';
import { MeiliModule } from '../infrastructure/search/meili.module';
import { StorageModule } from '../infrastructure/storage/storage.module';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [PrismaModule, RedisModule, StorageModule, MeiliModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
