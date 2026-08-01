import type { HealthReport } from '@gmrlog/types';
import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';

import { HealthService } from './health.service';
import type { HealthLiveReport, HealthReadyReport } from './health.types';

/**
 * Operational probes (DEPLOYMENT.md / Platform Infrastructure Freeze).
 * Not a product surface — S1 envelope dialect still applies.
 */
@ApiTags('platform')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Platform health report' })
  @ApiOkResponse({ description: 'Enveloped health report' })
  getHealth(): HealthReport {
    return this.healthService.getHealth();
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ description: 'Process is alive' })
  getLive(): HealthLiveReport {
    return this.healthService.getLive();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (database + redis)' })
  @ApiOkResponse({ description: 'Dependencies ready for traffic' })
  @ApiServiceUnavailableResponse({ description: 'One or more dependencies down' })
  getReady(): Promise<HealthReadyReport> {
    return this.healthService.getReady();
  }
}
