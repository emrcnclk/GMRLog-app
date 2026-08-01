import { Injectable } from '@nestjs/common';

/**
 * Lightweight process metrics for local ops (D3.19).
 */
@Injectable()
export class MetricsService {
  private httpRequestsTotal = 0;

  recordHttpRequest(): void {
    this.httpRequestsTotal += 1;
  }

  renderPrometheus(): string {
    const memory = process.memoryUsage();
    return [
      '# HELP gmrlog_http_requests_total Total HTTP requests observed',
      '# TYPE gmrlog_http_requests_total counter',
      `gmrlog_http_requests_total ${String(this.httpRequestsTotal)}`,
      '# HELP process_uptime_seconds Process uptime in seconds',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${String(Math.round(process.uptime()))}`,
      '# HELP process_resident_memory_bytes Resident set size in bytes',
      '# TYPE process_resident_memory_bytes gauge',
      `process_resident_memory_bytes ${String(memory.rss)}`,
    ].join('\n');
  }
}
