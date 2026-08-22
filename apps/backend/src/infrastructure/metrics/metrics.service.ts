import { Injectable } from '@nestjs/common';

/**
 * Process + HTTP metrics for local ops (D3.19), extended with per-route/status
 * request counts and a request-duration histogram so `histogram_quantile` and
 * `rate(...{status_code=~"5.."}[5m])`-style alerts (error rate, p95 latency)
 * are computable from this endpoint instead of requiring Sentry for those two
 * signals. See MONITORING_SETUP.md's "Path B" — this is that path, done.
 *
 * Labels are the route *pattern* (e.g. `/api/v1/users/:id`), not the raw URL,
 * so cardinality stays bounded by the number of route definitions rather than
 * growing with every distinct ID a client requests.
 */
export interface HttpRequestMetric {
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
}

// Seconds. Deliberately includes 2 so "p95 > 2s" is a bucket boundary, not an
// interpolated estimate between two much coarser buckets.
const DURATION_BUCKETS_SECONDS = [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10];

interface RequestCountEntry {
  method: string;
  route: string;
  statusCode: number;
  count: number;
}

interface RouteAccumulator {
  method: string;
  route: string;
  /** Non-cumulative per-bucket counts; cumulated only at render time, the way Prometheus expects them read. */
  bucketCounts: number[];
  sumSeconds: number;
  count: number;
}

function escapeLabelValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

@Injectable()
export class MetricsService {
  // Keyed by "method route statusCode" / "method route" purely to dedupe —
  // the labels themselves live on the value, so rendering never re-parses
  // the key (and never needs to reason about a possibly-missing split part).
  private requestCounts = new Map<string, RequestCountEntry>();
  private routeAccumulators = new Map<string, RouteAccumulator>();

  recordHttpRequest(metric: HttpRequestMetric): void {
    const requestKey = `${metric.method} ${metric.route} ${String(metric.statusCode)}`;
    const existingCount = this.requestCounts.get(requestKey);
    if (existingCount) {
      existingCount.count += 1;
    } else {
      this.requestCounts.set(requestKey, {
        method: metric.method,
        route: metric.route,
        statusCode: metric.statusCode,
        count: 1,
      });
    }

    const routeKey = `${metric.method} ${metric.route}`;
    const accumulator = this.routeAccumulators.get(routeKey) ?? {
      method: metric.method,
      route: metric.route,
      bucketCounts: new Array<number>(DURATION_BUCKETS_SECONDS.length).fill(0),
      sumSeconds: 0,
      count: 0,
    };
    const seconds = metric.durationMs / 1000;
    const bucketIndex = DURATION_BUCKETS_SECONDS.findIndex((upperBound) => seconds <= upperBound);
    if (bucketIndex !== -1) {
      accumulator.bucketCounts[bucketIndex] = (accumulator.bucketCounts[bucketIndex] ?? 0) + 1;
    }
    accumulator.sumSeconds += seconds;
    accumulator.count += 1;
    this.routeAccumulators.set(routeKey, accumulator);
  }

  renderPrometheus(): string {
    const memory = process.memoryUsage();
    const lines: string[] = [
      '# HELP gmrlog_http_requests_total Total HTTP requests observed, by method/route/status',
      '# TYPE gmrlog_http_requests_total counter',
      ...this.renderRequestCounts(),
      '# HELP gmrlog_http_request_duration_seconds HTTP request duration in seconds, by method/route',
      '# TYPE gmrlog_http_request_duration_seconds histogram',
      ...this.renderDurationHistogram(),
      '# HELP process_uptime_seconds Process uptime in seconds',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${String(Math.round(process.uptime()))}`,
      '# HELP process_resident_memory_bytes Resident set size in bytes',
      '# TYPE process_resident_memory_bytes gauge',
      `process_resident_memory_bytes ${String(memory.rss)}`,
    ];
    return lines.join('\n');
  }

  private renderRequestCounts(): string[] {
    if (this.requestCounts.size === 0) {
      // A metric declared with HELP/TYPE but zero series is valid Prometheus
      // exposition; emitting a literal zero-labeled sample would invent a
      // request that never happened.
      return ['gmrlog_http_requests_total 0'];
    }
    return [...this.requestCounts.values()].map(
      (entry) =>
        `gmrlog_http_requests_total{method="${escapeLabelValue(entry.method)}",route="${escapeLabelValue(entry.route)}",status_code="${String(entry.statusCode)}"} ${String(entry.count)}`,
    );
  }

  private renderDurationHistogram(): string[] {
    if (this.routeAccumulators.size === 0) {
      return [];
    }
    const lines: string[] = [];
    for (const accumulator of this.routeAccumulators.values()) {
      const labels = `method="${escapeLabelValue(accumulator.method)}",route="${escapeLabelValue(accumulator.route)}"`;
      let cumulative = 0;
      for (const [index, upperBound] of DURATION_BUCKETS_SECONDS.entries()) {
        cumulative += accumulator.bucketCounts[index] ?? 0;
        lines.push(
          `gmrlog_http_request_duration_seconds_bucket{${labels},le="${String(upperBound)}"} ${String(cumulative)}`,
        );
      }
      lines.push(
        `gmrlog_http_request_duration_seconds_bucket{${labels},le="+Inf"} ${String(accumulator.count)}`,
      );
      lines.push(
        `gmrlog_http_request_duration_seconds_sum{${labels}} ${String(accumulator.sumSeconds)}`,
      );
      lines.push(
        `gmrlog_http_request_duration_seconds_count{${labels}} ${String(accumulator.count)}`,
      );
    }
    return lines;
  }
}
