import { Global, Module } from '@nestjs/common';

import { AppConfigModule } from '../config/config.module';

import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Global()
@Module({
  imports: [AppConfigModule],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
