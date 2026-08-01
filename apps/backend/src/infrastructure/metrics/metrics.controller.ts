import { Controller, Get, Header, Inject, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { ENV } from '../config/config.module';
import type { BackendEnv } from '../config/env.schema';

import { MetricsService } from './metrics.service';

/**
 * Operational metrics endpoint (D3.19). Protected when METRICS_TOKEN is set.
 */
@ApiTags('platform')
@Controller('metrics')
export class MetricsController {
  constructor(
    private readonly metrics: MetricsService,
    @Inject(ENV) private readonly env: BackendEnv,
  ) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Prometheus-style process metrics' })
  getMetrics(request: FastifyRequest): string {
    if (this.env.METRICS_TOKEN.length > 0) {
      const token = request.headers['x-metrics-token'];
      if (typeof token !== 'string' || token !== this.env.METRICS_TOKEN) {
        throw new UnauthorizedException('Invalid metrics token');
      }
    }
    return `${this.metrics.renderPrometheus()}\n`;
  }
}
