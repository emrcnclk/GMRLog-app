import type { AppEnvironment, HealthReport } from '@gmrlog/types';

/** Operational probe — process is alive (no dependency checks). */
export type HealthLiveReport = Pick<HealthReport, 'status' | 'timestamp'>;

/** Dependency probe status for readiness. */
export type HealthCheckState = 'up' | 'down';

/** Operational readiness — database + redis (+ configured storage/meili) for traffic. */
export interface HealthReadyReport {
  status: 'ok' | 'degraded';
  timestamp: string;
  checks: {
    database: HealthCheckState;
    redis: HealthCheckState;
    storage?: HealthCheckState;
    meili?: HealthCheckState;
  };
  version: string;
  environment: AppEnvironment;
}
