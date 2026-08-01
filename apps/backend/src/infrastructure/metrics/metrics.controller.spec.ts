import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { parseBackendEnv } from '../config/env.schema';

import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  const metrics = new MetricsService();

  it('returns prometheus output when token is unset', () => {
    const env = parseBackendEnv({ METRICS_TOKEN: '' });
    const controller = new MetricsController(metrics, env);
    const body = controller.getMetrics({ headers: {} } as never);
    expect(body).toContain('gmrlog_http_requests_total');
  });

  it('rejects requests without the configured token', () => {
    const env = parseBackendEnv({ METRICS_TOKEN: 'secret-token' });
    const controller = new MetricsController(metrics, env);
    expect(() => controller.getMetrics({ headers: {} } as never)).toThrow(UnauthorizedException);
    expect(() =>
      controller.getMetrics({ headers: { 'x-metrics-token': 'wrong' } } as never),
    ).toThrow(UnauthorizedException);
  });

  it('accepts the configured metrics token', () => {
    const env = parseBackendEnv({ METRICS_TOKEN: 'secret-token' });
    const controller = new MetricsController(metrics, env);
    const body = controller.getMetrics({
      headers: { 'x-metrics-token': 'secret-token' },
    } as never);
    expect(body.endsWith('\n')).toBe(true);
  });
});
