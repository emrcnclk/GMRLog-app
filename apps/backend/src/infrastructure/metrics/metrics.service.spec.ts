import { describe, expect, it } from 'vitest';

import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('renders zero-series HELP/TYPE lines with no requests recorded', () => {
    const metrics = new MetricsService();
    const body = metrics.renderPrometheus();
    expect(body).toContain('gmrlog_http_requests_total 0');
    expect(body).toContain('process_uptime_seconds');
    expect(body).toContain('process_resident_memory_bytes');
  });

  it('labels request counts by method, route, and status code', () => {
    const metrics = new MetricsService();
    metrics.recordHttpRequest({
      method: 'GET',
      route: '/api/v1/health/live',
      statusCode: 200,
      durationMs: 5,
    });
    metrics.recordHttpRequest({
      method: 'GET',
      route: '/api/v1/health/live',
      statusCode: 200,
      durationMs: 8,
    });
    metrics.recordHttpRequest({
      method: 'POST',
      route: '/api/v1/sessions',
      statusCode: 500,
      durationMs: 12,
    });

    const body = metrics.renderPrometheus();
    expect(body).toContain(
      'gmrlog_http_requests_total{method="GET",route="/api/v1/health/live",status_code="200"} 2',
    );
    expect(body).toContain(
      'gmrlog_http_requests_total{method="POST",route="/api/v1/sessions",status_code="500"} 1',
    );
  });

  it('exposes a cumulative duration histogram usable with histogram_quantile', () => {
    const metrics = new MetricsService();
    metrics.recordHttpRequest({
      method: 'GET',
      route: '/api/v1/health/ready',
      statusCode: 200,
      durationMs: 5,
    });
    metrics.recordHttpRequest({
      method: 'GET',
      route: '/api/v1/health/ready',
      statusCode: 200,
      durationMs: 3000,
    });

    const body = metrics.renderPrometheus();
    const labels = 'method="GET",route="/api/v1/health/ready"';
    // The 5ms observation falls in every bucket from 0.01s up; the 3s
    // observation only in +Inf, since it exceeds the largest declared bucket
    // (10s is the ceiling below +Inf, and 3s < 10s — so it lands in the 5s
    // and 10s buckets too). Assert the two ends of the cumulative curve
    // rather than every bucket, so this doesn't hardcode the bucket list.
    expect(body).toContain(`gmrlog_http_request_duration_seconds_bucket{${labels},le="0.01"} 1`);
    expect(body).toContain(`gmrlog_http_request_duration_seconds_bucket{${labels},le="+Inf"} 2`);
    expect(body).toContain(`gmrlog_http_request_duration_seconds_count{${labels}} 2`);
    expect(body).toContain(`gmrlog_http_request_duration_seconds_sum{${labels}} 3.005`);
  });
});
