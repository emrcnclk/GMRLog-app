import { describe, expect, it } from 'vitest';

import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('records HTTP requests and renders prometheus text', () => {
    const metrics = new MetricsService();
    metrics.recordHttpRequest();
    metrics.recordHttpRequest();

    const body = metrics.renderPrometheus();
    expect(body).toContain('gmrlog_http_requests_total 2');
    expect(body).toContain('process_uptime_seconds');
    expect(body).toContain('process_resident_memory_bytes');
  });
});
